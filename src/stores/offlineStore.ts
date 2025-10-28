import { create } from 'zustand';
import localforage from 'localforage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfflineReport {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  severity: string;
  hazard_type: string;
  location_description: string;
  reporter_name: string;
  reporter_contact?: string;
  urgency_level: string;
  media_files?: File[];
  created_at: string;
  synced: boolean;
}

interface OfflineState {
  isOnline: boolean;
  pendingReports: OfflineReport[];
  syncInProgress: boolean;
  addPendingReport: (report: Omit<OfflineReport, 'id' | 'created_at' | 'synced'>) => Promise<void>;
  syncPendingReports: () => Promise<void>;
  loadPendingReports: () => Promise<void>;
  clearSyncedReports: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
}

// Configure localforage
localforage.config({
  name: 'INCOIS_OfflineDB',
  storeName: 'reports',
});

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: navigator.onLine,
  pendingReports: [],
  syncInProgress: false,

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
    if (status) {
      // Auto-sync when coming back online
      setTimeout(() => get().syncPendingReports(), 1000);
    }
  },

  addPendingReport: async (reportData) => {
    const report: OfflineReport = {
      ...reportData,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      synced: false,
    };

    // Save to local storage
    await localforage.setItem(report.id, report);
    
    // Update state
    set(state => ({
      pendingReports: [...state.pendingReports, report]
    }));

    // Try to sync immediately if online
    if (get().isOnline) {
      setTimeout(() => get().syncPendingReports(), 500);
    }
  },

  loadPendingReports: async () => {
    try {
      const reports: OfflineReport[] = [];
      await localforage.iterate<OfflineReport, void>((value) => {
        if (value && !value.synced) {
          reports.push(value);
        }
      });
      
      set({ pendingReports: reports.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )});
    } catch (error) {
      console.error('Error loading pending reports:', error);
    }
  },

  syncPendingReports: async () => {
    const { pendingReports, isOnline, syncInProgress } = get();
    
    if (!isOnline || syncInProgress || pendingReports.length === 0) {
      return;
    }

    set({ syncInProgress: true });

    try {
      for (const report of pendingReports) {
        if (report.synced) continue;

        try {
          // Upload media files first
          const mediaUrls: string[] = [];
          if (report.media_files && report.media_files.length > 0) {
            for (const file of report.media_files) {
              const fileName = `${Date.now()}_${file.name}`;
              const { data, error } = await supabase.storage
                .from('reports-media')
                .upload(fileName, file);

              if (error) throw error;
              
              const { data: { publicUrl } } = supabase.storage
                .from('reports-media')
                .getPublicUrl(fileName);
              
              mediaUrls.push(publicUrl);
            }
          }

          // Create report in database
          const { data, error } = await supabase
            .from('reports')
            .insert({
              latitude: report.latitude,
              longitude: report.longitude,
              description: report.description,
              severity: report.severity,
              hazard_type: report.hazard_type,
              location_description: report.location_description,
              reporter_name: report.reporter_name,
              reporter_contact: report.reporter_contact,
              urgency_level: report.urgency_level,
              media_url: mediaUrls,
              user_id: (await supabase.auth.getUser()).data.user?.id,
            })
            .select()
            .single();

          if (error) throw error;

          // Mark as synced
          const syncedReport = { ...report, synced: true };
          await localforage.setItem(report.id, syncedReport);

        } catch (error) {
          console.error(`Failed to sync report ${report.id}:`, error);
          // Continue with other reports
        }
      }

      // Reload pending reports
      await get().loadPendingReports();
      
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      set({ syncInProgress: false });
    }
  },

  clearSyncedReports: async () => {
    try {
      const keysToRemove: string[] = [];
      await localforage.iterate<OfflineReport, void>((value, key) => {
        if (value?.synced) {
          keysToRemove.push(key);
        }
      });

      for (const key of keysToRemove) {
        await localforage.removeItem(key);
      }

      await get().loadPendingReports();
    } catch (error) {
      console.error('Error clearing synced reports:', error);
    }
  },
}));

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnlineStatus(false);
  });
}