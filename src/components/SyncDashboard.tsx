
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sync logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('sheets-sync', {
        body: { manual: true }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Manual sync triggered successfully",
      });

      // Refresh logs after a short delay
      setTimeout(fetchSyncLogs, 2000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast({
        title: "Error",
        description: "Failed to trigger manual sync",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSyncLogs();
    }
  }, [isAdmin]);

  if (!isAdmin) {
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
            <div className="text-sm text-muted-foreground">
              Automatic sync runs every 6 hours (12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM)
            </div>
            
            {syncLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No sync logs found
              </p>
            ) : (
              <div className="space-y-3">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="font-medium">
                          {log.sync_type} - {getStatusBadge(log.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Started: {format(new Date(log.started_at), 'MMM d, yyyy h:mm a')}
                          {log.completed_at && ` • Completed: ${format(new Date(log.completed_at), 'h:mm a')}`}
                        </div>
                        {log.error_message && (
                          <div className="text-sm text-red-600 mt-1">
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
