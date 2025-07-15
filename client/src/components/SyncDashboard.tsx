import { useState, useEffect } from 'react';
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
    if (!isAdmin) {
      console.log('User is not admin, skipping sync logs fetch');
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching sync logs...');
      const response = await fetch('/api/sync-logs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sync logs');
      }
      
      const data = await response.json();
      console.log('Successfully fetched sync logs:', data.length, 'records');
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
      const response = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger sync');
      }
      
      const data = await response.json();
      
      toast({
        title: "Sync Started",
        description: "Google Sheets synchronization has been triggered.",
      });
      
      // Refresh logs after a short delay
      setTimeout(() => {
        fetchSyncLogs();
      }, 2000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast({
        title: "Error",
        description: "Failed to trigger sync. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const setupCron = async () => {
    try {
      const response = await fetch('/api/setup-cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to setup cron');
      }
      
      toast({
        title: "Success",
        description: "Automated sync has been configured.",
      });
    } catch (error) {
      console.error('Error setting up cron:', error);
      toast({
        title: "Error",
        description: "Failed to setup automated sync. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const parseErrorMessages = (metadata: any): SyncError[] => {
    if (!metadata || !metadata.errors) return [];
    
    try {
      return metadata.errors.map((error: any) => ({
        sheet: error.sheet || 'Unknown',
        row: error.row || 0,
        error: error.message || error.error || 'Unknown error'
      }));
    } catch (error) {
      console.error('Error parsing error messages:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchSyncLogs();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-gray-500">
              You need admin privileges to access the sync dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Google Sheets Sync Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={triggerManualSync}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {syncing ? 'Syncing...' : 'Trigger Manual Sync'}
            </Button>
            <Button
              onClick={setupCron}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Setup Automated Sync
            </Button>
            <Button
              onClick={fetchSyncLogs}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Logs
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sync History</h3>
            
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading sync logs...</span>
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="text-center text-gray-500 p-8">
                No sync logs found. Try triggering a sync to see the history.
              </div>
            ) : (
              <div className="space-y-3">
                {syncLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-gray-200">
                    <CardContent className="p-4">
                      <Collapsible>
                        <CollapsibleTrigger 
                          onClick={() => toggleLogExpansion(log.id)}
                          className="w-full"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(log.status)}
                              <div className="text-left">
                                <div className="font-medium">{log.sync_type}</div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(log.started_at)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                              {expandedLogs.has(log.id) ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium">Items Processed:</span>
                                <span className="ml-2">{log.items_processed || 0}</span>
                              </div>
                              <div>
                                <span className="font-medium">Items Created:</span>
                                <span className="ml-2">{log.items_created || 0}</span>
                              </div>
                              <div>
                                <span className="font-medium">Items Updated:</span>
                                <span className="ml-2">{log.items_updated || 0}</span>
                              </div>
                              <div>
                                <span className="font-medium">Completed:</span>
                                <span className="ml-2">
                                  {log.completed_at ? formatDate(log.completed_at) : 'In Progress'}
                                </span>
                              </div>
                            </div>
                            
                            {log.error_message && (
                              <div className="bg-red-50 p-3 rounded-md">
                                <span className="font-medium text-red-800">Error:</span>
                                <p className="text-red-700 mt-1">{log.error_message}</p>
                              </div>
                            )}
                            
                            {log.metadata && parseErrorMessages(log.metadata).length > 0 && (
                              <div className="bg-yellow-50 p-3 rounded-md">
                                <span className="font-medium text-yellow-800">Detailed Errors:</span>
                                <div className="mt-2 space-y-1">
                                  {parseErrorMessages(log.metadata).map((error, index) => (
                                    <div key={index} className="text-yellow-700 text-xs">
                                      <span className="font-medium">{error.sheet}</span>
                                      {error.row > 0 && <span> (Row {error.row})</span>}
                                      : {error.error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};