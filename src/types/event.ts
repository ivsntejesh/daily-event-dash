
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  isOnline: boolean;
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export type ViewMode = 'dashboard' | 'calendar' | 'create';
