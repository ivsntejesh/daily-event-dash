
import { useState } from 'react';
import { Plus, Calendar, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyDashboard } from '@/components/DailyDashboard';
import { EventForm } from '@/components/EventForm';
import { CalendarView } from '@/components/CalendarView';
import { AuthPage } from '@/components/AuthPage';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseEvents } from '@/hooks/useSupabaseEvents';
import { usePublicEvents } from '@/hooks/usePublicEvents';
import { ViewMode } from '@/types/event';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const { user, signOut, loading } = useAuth();
  const { events, addEvent } = useSupabaseEvents();
  const { publicEvents, addPublicEvent } = usePublicEvents();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSaveEvent = (eventData: any, isPublic: boolean) => {
    if (isPublic) {
      // Create public event
      const publicEventData = {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        is_online: eventData.isOnline,
        meeting_link: eventData.meetingLink,
        location: eventData.location,
        notes: eventData.notes,
      };
      
      addPublicEvent(publicEventData);
    } else {
      // Create private event
      const supabaseEventData = {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        is_online: eventData.isOnline,
        meeting_link: eventData.meetingLink,
        location: eventData.location,
        notes: eventData.notes,
      };
      
      addEvent(supabaseEventData);
    }
    
    setCurrentView('dashboard');
  };

  const renderView = () => {
    // Convert Supabase events to the format expected by components
    const formattedUserEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.start_time,
      endTime: event.end_time,
      isOnline: event.is_online,
      meetingLink: event.meeting_link,
      location: event.location,
      notes: event.notes,
      createdAt: event.created_at,
    }));

    // Convert public events to the same format
    const formattedPublicEvents = publicEvents.map(event => ({
      id: `public-${event.id}`,
      title: `🌐 ${event.title}`,
      description: event.description,
      date: event.date,
      startTime: event.start_time,
      endTime: event.end_time,
      isOnline: event.is_online,
      meetingLink: event.meeting_link,
      location: event.location,
      notes: event.notes,
      createdAt: event.created_at,
    }));

    // Combine and sort all events
    const allEvents = [...formattedUserEvents, ...formattedPublicEvents]
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.startTime.localeCompare(b.startTime);
        }
        return a.date.localeCompare(b.date);
      });

    switch (currentView) {
      case 'dashboard':
        return <DailyDashboard events={allEvents} />;
      case 'calendar':
        return <CalendarView events={allEvents} />;
      case 'create':
        return (
          <EventForm
            onSave={handleSaveEvent}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      default:
        return <DailyDashboard events={allEvents} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">EventHub</h1>
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('calendar')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={currentView === 'create' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-16">
        {renderView()}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setCurrentView('create')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
