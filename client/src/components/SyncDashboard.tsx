import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Play, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  metadata: any;
}

interface SyncError {
  sheet: string;
  row: number;
  error: string;
}

export const SyncDashboard = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
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
        .limit(20); // Increased limit to show more history

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
      
      const { data, error } = await supabase.functions.invoke('sheets-sync', {
        body: { manual: true }
      });

      if (error) {
        console.error('Manual sync error:', error);
        throw error;
      }

      console.log('Manual sync response:', data);
      
      if (data?.skipped) {
        toast({
          title: "Sync Skipped",
          description: "Another sync operation is already in progress. Please wait for it to complete.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: `Manual sync completed. Processed: ${data?.items_processed || 0}, Created: ${data?.items_created || 0}, Updated: ${data?.items_updated || 0}${data?.errors_count ? `, Errors: ${data.errors_count}` : ''}`,
        });
      }

      // Refresh logs after sync completes
      setTimeout(() => {
        fetchSyncLogs();
      }, 2000);
    } catch (error) {
      console.error('Error triggering manual sync:', error);
      toast({
        title: "Error",
        description: `Failed to trigger manual sync: ${error.message || 'Unknown error'}`,
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

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
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

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'Running...';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.round(durationMs / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderSyncErrors = (errors: SyncError[]) => {
    if (!errors || errors.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <h5 className="font-medium text-red-800 mb-2">Sync Errors ({errors.length})</h5>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-700">
              <span className="font-medium">{error.sheet}</span> - Row {error.row}: {error.error}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enhanced Google Sheets Sync Dashboard</CardTitle>
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
                <h4 className="font-medium mb-2">Enhanced Configuration</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic sync: Every 6 hours</li>
                  <li>• Batch processing: 50 rows per batch</li>
                  <li>• Retry mechanism: Up to 3 attempts</li>
                  <li>• Data validation: Built-in validation</li>
                  <li>• Concurrency protection: Prevents overlapping syncs</li>
                  <li>• Source: Google Sheets (Sheet1: Events, Sheet2: Tasks)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Current Status</h4>
                <div className="text-sm">
                  {syncLogs.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(syncLogs[0].status)}
                        <span>Last sync: {getStatusBadge(syncLogs[0].status)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Duration: {formatDuration(syncLogs[0].started_at, syncLogs[0].completed_at)}
                      </div>
                      {syncLogs[0].status === 'success' && (
                        <div className="text-green-600 text-xs">
                          Processed: {syncLogs[0].items_processed || 0} | 
                          Created: {syncLogs[0].items_created || 0} | 
                          Updated: {syncLogs[0].items_updated || 0}
                          {syncLogs[0].metadata?.errors?.length > 0 && (
                            <span className="text-orange-600"> | Errors: {syncLogs[0].metadata.errors.length}</span>
                          )}
                        </div>
                      )}
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
                  <Collapsible key={log.id}>
                    <div className="rounded-lg border bg-card">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(log.status)}
                            <div>
                              <div className="flex items-center gap-2 font-medium">
                                {log.sync_type.replace('_', ' ')} - {getStatusBadge(log.status)}
                                {log.metadata?.errors?.length > 0 && (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                    {log.metadata.errors.length} errors
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Started: {format(new Date(log.started_at), 'MMM d, yyyy h:mm a')}
                                {log.completed_at && ` • Duration: ${formatDuration(log.started_at, log.completed_at)}`}
                              </div>
                              {log.error_message && (
                                <div className="text-sm text-red-600 mt-1 max-w-md truncate">
                                  Error: {log.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {log.status === 'success' && (
                              <div className="text-right text-sm text-muted-foreground">
                                <div>Processed: {log.items_processed || 0}</div>
                                <div>Created: {log.items_created || 0}</div>
                                <div>Updated: {log.items_updated || 0}</div>
                              </div>
                            )}
                            {expandedLogs.has(log.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t">
                          <div className="mt-3 space-y-3">
                            {log.metadata && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h5 className="font-medium mb-1">Configuration</h5>
                                  <div className="text-muted-foreground space-y-1">
                                    <div>Batch Size: {log.metadata.batch_size || 'N/A'}</div>
                                    <div>Max Retries: {log.metadata.max_retries || 'N/A'}</div>
                                    <div>Spreadsheet ID: {log.metadata.spreadsheet_id || 'N/A'}</div>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium mb-1">Results</h5>
                                  <div className="text-muted-foreground space-y-1">
                                    <div>Items Processed: {log.items_processed || 0}</div>
                                    <div>Items Created: {log.items_created || 0}</div>
                                    <div>Items Updated: {log.items_updated || 0}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {log.metadata?.errors && renderSyncErrors(log.metadata.errors)}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};