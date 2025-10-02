
import { SyncDashboard } from '@/components/SyncDashboard';

export const SyncPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-gradient">Sync Management</h1>
        <p className="text-base text-muted-foreground">
          Monitor and manage Google Sheets synchronization
        </p>
      </div>
      <SyncDashboard />
    </div>
  );
};
