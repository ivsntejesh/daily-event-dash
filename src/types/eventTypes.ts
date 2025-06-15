
export interface BaseEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  is_online: boolean;
  meeting_link?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface PrivateEvent extends BaseEvent {
  user_id: string;
}

export interface PublicEvent extends BaseEvent {}

export interface FormattedEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  isOnline: boolean;
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  isPublic?: boolean;
}

export type ViewMode = 'dashboard' | 'calendar' | 'create';
