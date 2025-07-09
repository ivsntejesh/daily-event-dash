
import { useState } from 'react';
import { DailyDashboard } from '@/components/DailyDashboard';
import { EventForm } from '@/components/EventForm';
import { CalendarView } from '@/components/CalendarView';
import { TasksPage } from '@/pages/TasksPage';
import { AuthPage } from '@/components/AuthPage';
import { PublicEventsView } from '@/components/PublicEventsView';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { ViewMode, FormattedEvent } from '@/types/eventTypes';
import { useTasks } from '@/hooks/useTasks';

type ExtendedViewMode = ViewMode | 'tasks' | 'calendar';

const Index = () => {
  const [currentView, setCurrentView] = useState<ExtendedViewMode>('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [editingEvent, setEditingEvent] = useState<FormattedEvent | null>(null);
  const { user, signOut, loading: authLoading } = useAuth();
  const { events, saveEvent, updateEvent, deleteEvent } = useEvents();
  const { tasks } = useTasks();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Show public events for non-authenticated users
  if (!user && !showAuth) {
    return (
      <PublicEventsView 
        onSignIn={() => {
          setAuthMode('signin');
          setShowAuth(true);
        }}
        onSignUp={() => {
          setAuthMode('signup');
          setShowAuth(true);
        }}
      />
    );
  }

  // Show auth page when requested
  if (!user && showAuth) {
    return (
      <AuthPage 
        onBack={() => setShowAuth(false)}
      />
    );
  }

  const handleSaveEvent = async (eventData: any, isPublic: boolean) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData, editingEvent.isPublic || false);
    } else {
      saveEvent(eventData, isPublic);
    }
    setCurrentView('dashboard');
    setEditingEvent(null);
  };

  const handleEditEvent = (event: FormattedEvent) => {
    setEditingEvent(event);
    setCurrentView('create');
  };

  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      await deleteEvent(eventId, event.isPublic || false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DailyDashboard 
            events={events} 
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            showDates={true}
          />
        );
      case 'calendar':
        return <CalendarView events={events} />;
      case 'tasks':
        return <TasksPage />;
      case 'create':
        return (
          <EventForm
            onSave={handleSaveEvent}
            onCancel={() => {
              setCurrentView('dashboard');
              setEditingEvent(null);
            }}
            editingEvent={editingEvent}
          />
        );
      default:
        return (
          <DailyDashboard 
            events={events} 
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            showDates={true}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* View switcher for logged-in users */}
      {user && (
        <div className="flex justify-center gap-2 p-4 border-b">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
          >
            Calendar
          </Button>
          <Button
            variant={currentView === 'tasks' ? 'default' : 'outline'}
            onClick={() => setCurrentView('tasks')}
          >
            Tasks
          </Button>
        </div>
      )}

      <main className="pb-16">
        {renderView()}
      </main>

      {/* Only show FAB for non-task views, TasksPage has its own FAB */}
      {currentView !== 'tasks' && (
        <FloatingActionButton onClick={() => {
          setEditingEvent(null);
          setCurrentView('create');
        }} />
      )}
    </div>
  );
};

export default Index;
