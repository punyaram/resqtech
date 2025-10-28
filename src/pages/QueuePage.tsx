import React, { useEffect, useState } from 'react';
import { useOfflineStore } from '@/stores/offlineStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, Trash2, Clock, MapPin, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const QueuePage: React.FC = () => {
  const { 
    pendingReports, 
    isOnline, 
    syncInProgress, 
    syncPendingReports, 
    loadPendingReports,
    clearSyncedReports 
  } = useOfflineStore();
  const { toast } = useToast();

  useEffect(() => {
    loadPendingReports();
  }, [loadPendingReports]);

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: "No Connection",
        description: "Cannot sync while offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }

    await syncPendingReports();
    toast({
      title: "Sync Complete",
      description: "All pending reports have been synchronized.",
    });
  };

  const handleClearSynced = async () => {
    await clearSyncedReports();
    toast({
      title: "Queue Cleaned",
      description: "Successfully synced reports have been removed from the queue.",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Sync Queue</h1>
          <p className="text-muted-foreground">
            Manage pending reports and synchronization
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Connection Status */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {isOnline 
            ? "You're connected. Reports will sync automatically when submitted."
            : "You're offline. Reports are saved locally and will sync when connection is restored."
          }
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={handleSync} 
          disabled={!isOnline || syncInProgress || pendingReports.length === 0}
          className="flex-1"
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
          {syncInProgress ? 'Syncing...' : 'Sync All Reports'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleClearSynced}
          disabled={pendingReports.filter(r => r.synced).length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clean Queue
        </Button>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{pendingReports.length}</p>
              <p className="text-xs text-muted-foreground">Total Queued</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">
                {pendingReports.filter(r => !r.synced).length}
              </p>
              <p className="text-xs text-muted-foreground">Pending Sync</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {pendingReports.filter(r => r.synced).length}
              </p>
              <p className="text-xs text-muted-foreground">Synced</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reports List */}
      <div className="space-y-4">
        {pendingReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
              <p className="text-muted-foreground">
                All reports have been synchronized successfully.
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingReports.map((report) => (
            <Card key={report.id} className={report.synced ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {report.hazard_type}
                      <Badge variant={getSeverityColor(report.severity)} className="text-xs">
                        {report.severity}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3 h-3" />
                      {report.location_description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={report.synced ? "default" : "secondary"} className="text-xs">
                      {report.synced ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Synced
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(report.created_at)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {report.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="space-y-1">
                    <p><strong>Reporter:</strong> {report.reporter_name}</p>
                    <p><strong>Urgency:</strong> {report.urgency_level}</p>
                    {report.media_files && report.media_files.length > 0 && (
                      <p><strong>Media:</strong> {report.media_files.length} file(s)</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p><strong>Coordinates:</strong></p>
                    <p>{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};