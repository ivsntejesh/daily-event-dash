
import { TaskDashboard } from '@/components/TaskDashboard';

export const TasksPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">
          Manage your personal and public tasks
        </p>
      </div>
      <TaskDashboard />
    </div>
  );
};
