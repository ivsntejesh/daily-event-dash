// Legacy file - keeping for backward compatibility
// New code should use @/types/eventTypes instead

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isOnline: boolean;
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export type ViewMode = 'dashboard' | 'calendar' | 'create';
