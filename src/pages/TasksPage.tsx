
import { useState } from 'react';
import { TaskDashboard } from '@/components/TaskDashboard';
import { TaskForm } from '@/components/TaskForm';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useTasks } from '@/hooks/useTasks';
import { FormattedTask } from '@/types/taskTypes';

export const TasksPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<FormattedTask | null>(null);
  const { tasks, saveTask, updateTask, deleteTask, toggleTaskCompletion } = useTasks();

  const handleSaveTask = async (taskData: any, isPublic: boolean) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData, editingTask.isPublic || false);
    } else {
      saveTask(taskData, isPublic);
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: FormattedTask) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await deleteTask(taskId, task.isPublic || false);
    }
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await toggleTaskCompletion(taskId, isCompleted, task.isPublic || false);
    }
  };

  if (showForm) {
    return (
      <TaskForm
        onSave={handleSaveTask}
        onCancel={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
      />
    );
  }

  return (
    <>
      <TaskDashboard
        tasks={tasks}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
      />
      <FloatingActionButton onClick={() => {
        setEditingTask(null);
        setShowForm(true);
      }} />
    </>
  );
};
