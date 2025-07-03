
import { SyncDashboard } from '@/components/SyncDashboard';

export const SyncPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sync Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage Google Sheets synchronization
        </p>
      </div>
      <SyncDashboard />
    </div>
  );
};
