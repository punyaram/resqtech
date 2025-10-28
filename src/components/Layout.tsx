import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  History, 
  Settings, 
  Users, 
  LogOut,
  Wifi,
  WifiOff,
  RotateCcw
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { isOnline, pendingReports, syncInProgress, syncPendingReports, loadPendingReports } = useOfflineStore();

  useEffect(() => {
    loadPendingReports();
  }, [loadPendingReports]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSync = () => {
    syncPendingReports();
  };

  const navigationItems = [
    { path: '/', icon: MapPin, label: 'Map' },
    { path: '/report', icon: Plus, label: 'Report' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/queue', icon: RotateCcw, label: 'Queue', badge: pendingReports.length },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (location.pathname === '/auth') {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-primary">INCOIS</h1>
              <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              {pendingReports.length > 0 && (
                <Badge variant="secondary" onClick={handleSync} className="cursor-pointer">
                  <RotateCcw className={`w-3 h-3 mr-1 ${syncInProgress ? 'animate-spin' : ''}`} />
                  {pendingReports.length} pending
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {user && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center py-2">
          {navigationItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{label}</span>
                {badge && badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 text-xs px-1"
                  >
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for navigation */}
      <div className="h-16"></div>
    </div>
  );
};