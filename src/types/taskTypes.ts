
export interface BaseTask {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_completed: boolean;
  priority?: string;
  notes?: string;
  created_at: string;
}

export interface PrivateTask extends BaseTask {
  user_id: string;
}

export interface PublicTask extends BaseTask {
  user_id?: string;
}

export interface FormattedTask {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isCompleted: boolean;
  priority?: string;
  notes?: string;
  createdAt: string;
  isPublic?: boolean;
  userId?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
