import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SecurityEvent {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  metadata: any; // Using any to handle the Json type from Supabase
}

export const SecurityAuditLog = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (!isAdmin()) return;

    const fetchSecurityEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sync_log')
          .select('*')
          .eq('sync_type', 'security_event')
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching security events:', error);
        } else {
          setEvents(data || []);
        }
      } catch (error) {
        console.error('Error fetching security events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityEvents();
  }, [isAdmin]);

  if (!isAdmin()) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading security events...</p>
        ) : events.length === 0 ? (
          <p>No security events recorded.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">
                    {event.metadata?.event_type || 'Unknown Event'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(event.started_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <div className="text-sm">
                  <p>User ID: {event.metadata?.user_id || 'Unknown'}</p>
                  {event.metadata?.details && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded">
                      {JSON.stringify(event.metadata.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};