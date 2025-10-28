import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  severity: string;
  hazard_type: string;
  location_description: string;
  reporter_name: string;
  created_at: string;
  verification_status: string;
  trust_score: number;
  urgency_level: string;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  showReports?: boolean;
}

// Component to handle map view updates
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  
  return null;
};

export const Map: React.FC<MapProps> = ({ 
  center = [20.0, 77.0], // Default to India
  zoom = 6,
  height = '400px',
  showReports = true 
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Load reports if enabled
    if (showReports) {
      loadReports();
    } else {
      setLoading(false);
    }
  }, [showReports]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getVerificationBadge = (status: string, trustScore: number) => {
    const variant = status === 'verified' ? 'default' : 
                   status === 'rejected' ? 'destructive' : 'secondary';
    
    return (
      <Badge variant={variant} className="text-xs">
        {status === 'verified' && '✓ Verified'}
        {status === 'rejected' && '✗ Rejected'}
        {status === 'pending' && '⏳ Pending'}
        {status === 'investigating' && '🔍 Investigating'}
        <span className="ml-1">({trustScore}%)</span>
      </Badge>
    );
  };

  const createCustomIcon = (severity: string, urgency: string) => {
    const color = getSeverityColor(severity);
    const size = urgency === 'critical' ? 35 : urgency === 'high' ? 30 : 25;
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size > 25 ? '14px' : '12px'};
        ">
          !
        </div>
      `,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  };

  const mapCenter = userLocation || center;

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg border border-border"
      >
        <MapController center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              html: `
                <div style="
                  background-color: #3b82f6; 
                  width: 20px; 
                  height: 20px; 
                  border-radius: 50%; 
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="text-center">
                <MapPin className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Report markers */}
        {showReports && reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(report.severity, report.urgency_level)}
          >
            <Popup maxWidth={300}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{report.hazard_type}</h3>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                
                <div className="space-y-1">
                  {getVerificationBadge(report.verification_status, report.trust_score)}
                  <Badge variant="outline" className="text-xs">
                    {report.severity} severity
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {report.urgency_level} urgency
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Location:</strong> {report.location_description}</p>
                  <p><strong>Reporter:</strong> {report.reporter_name}</p>
                  <p><strong>Reported:</strong> {new Date(report.created_at).toLocaleDateString()}</p>
                </div>

                <Button size="sm" className="w-full" variant="outline">
                  <Info className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {loading && showReports && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      )}
    </div>
  );
};