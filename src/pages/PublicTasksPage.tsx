
import { usePublicTasksAnonymous } from '@/hooks/usePublicTasksAnonymous';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const PublicTasksPage = () => {
  const { publicTasks, loading } = usePublicTasksAnonymous();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Public Tasks</h1>
        <p className="text-muted-foreground">
          View all public tasks and assignments
        </p>
      </div>
      
      <div className="space-y-4">
        {publicTasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <Badge variant={task.is_completed ? 'default' : 'secondary'}>
                  {task.is_completed ? 'Completed' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {task.description && (
                <p className="text-muted-foreground mb-2">{task.description}</p>
              )}
              <div className="text-sm text-gray-500">
                Due: {format(new Date(task.date), 'MMM d, yyyy')}
                {task.start_time && ` at ${task.start_time}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
