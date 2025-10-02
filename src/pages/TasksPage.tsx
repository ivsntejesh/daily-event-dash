
import { TaskDashboard } from '@/components/TaskDashboard';
import { useTasks } from '@/hooks/useTasks';

export const TasksPage = () => {
  const { tasks, deleteTask, toggleTaskCompletion } = useTasks();

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && deleteTask) {
      await deleteTask(taskId, task.isPublic || false);
    }
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && toggleTaskCompletion) {
      await toggleTaskCompletion(taskId, isCompleted, task.isPublic || false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-gradient">Tasks</h1>
        <p className="text-base text-muted-foreground">
          Manage your personal and public tasks
        </p>
      </div>
      <TaskDashboard 
        tasks={tasks}
        onEditTask={() => {}}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        onNewTask={() => {}}
      />
    </div>
  );
};
