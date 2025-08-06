
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { handleAsyncError, retryAsync } from '@/utils/errorUtils';

interface SyncLog {
  id: string;
  sync_type: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  started_at: string;
  completed_at: string | null;
  items_processed: number | null;
  items_created: number | null;
  items_updated: number | null;
  error_message: string | null;
}

export const SyncDashboard = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  const fetchSyncLogs = async () => {
    if (!isAdmin()) {
      console.log('User is not admin, skipping sync logs fetch');
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching sync logs...');
      const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase error fetching sync logs:', error);
        throw error;
      }
      
      console.log('Successfully fetched sync logs:', data?.length || 0, 'records');
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sync logs. Please check your permissions and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    setSyncing(true);
    try {
      console.log('Triggering manual sync...');
      
      const syncOperation = async () => {
        const { data, error } = await supabase.functions.invoke('sheets-sync', {
          body: { manual: true }
        });

        if (error) {
          throw error;
        }

        return data;
      };

      const data = await retryAsync(syncOperation, 2, 2000);
      
      console.log('Manual sync response:', data);
      
      toast({
        title: "Success",
        description: "Manual sync completed successfully. Check the logs below for results.",
      });

      // Refresh logs after sync completes
      setTimeout(() => {
        fetchSyncLogs();
      }, 2000);
      
      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      const errorMessage = handleAsyncError(error, 'Failed to sync with Google Sheets');
      console.error('Error triggering manual sync:', error);
      toast({
        title: "Sync Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const setupAutomaticSync = async () => {
    try {
      console.log('Setting up automatic sync...');
      
      const { data, error } = await supabase.functions.invoke('setup-cron');

      if (error) {
        console.error('Setup cron error:', error);
        throw error;
      }

      console.log('Cron setup response:', data);
      
      toast({
        title: "Success",
        description: "Automatic sync has been configured to run every 6 hours.",
      });
    } catch (error) {
      console.error('Error setting up automatic sync:', error);
      toast({
        title: "Error",
        description: `Failed to setup automatic sync: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Only fetch logs when component mounts and user is admin
  useEffect(() => {
    if (isAdmin()) {
      fetchSyncLogs();
    }
  }, [isAdmin()]);

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Admin access required to view sync dashboard</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
      skipped: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Google Sheets Sync Dashboard</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={fetchSyncLogs}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={setupAutomaticSync}
                variant="outline"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Setup Auto Sync
              </Button>
              <Button
                onClick={triggerManualSync}
                disabled={syncing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Manual Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium mb-2">Current Configuration</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic sync: Every 6 hours</li>
                  <li>• Source: Google Sheets</li>
                  <li>• Sheet ID: 1-FuahakizPAMcPHsvcwVhs0OjBA1G8lAs3SurgZuXnY</li>
                  <li>• Targets: Public Events & Tasks</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Sync Status</h4>
                <div className="text-sm">
                  {syncLogs.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(syncLogs[0].status)}
                      <span>Last sync: {getStatusBadge(syncLogs[0].status)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No sync history</span>
                  )}
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading sync logs...</p>
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No sync logs found</p>
                <Button onClick={triggerManualSync} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Run First Sync
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium">Recent Sync History</h4>
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {log.sync_type} - {getStatusBadge(log.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Started: {format(new Date(log.started_at), 'MMM d, yyyy h:mm a')}
                          {log.completed_at && ` • Completed: ${format(new Date(log.completed_at), 'h:mm a')}`}
                        </div>
                        {log.error_message && (
                          <div className="text-sm text-red-600 mt-1 max-w-md truncate">
                            Error: {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {log.status === 'success' && (
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Processed: {log.items_processed || 0}</div>
                        <div>Created: {log.items_created || 0}</div>
                        <div>Updated: {log.items_updated || 0}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
