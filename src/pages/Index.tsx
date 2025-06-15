
import { useState } from 'react';
import { DailyDashboard } from '@/components/DailyDashboard';
import { EventForm } from '@/components/EventForm';
import { CalendarView } from '@/components/CalendarView';
import { AuthPage } from '@/components/AuthPage';
import { PublicEventsView } from '@/components/PublicEventsView';
import { Navigation } from '@/components/Navigation';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { ViewMode, FormattedEvent } from '@/types/eventTypes';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [editingEvent, setEditingEvent] = useState<FormattedEvent | null>(null);
  const { user, signOut, loading: authLoading } = useAuth();
  const { events, saveEvent } = useEvents();

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

  const handleSaveEvent = (eventData: any, isPublic: boolean) => {
    saveEvent(eventData, isPublic);
    setCurrentView('dashboard');
    setEditingEvent(null);
  };

  const handleEditEvent = (event: FormattedEvent) => {
    setEditingEvent(event);
    setCurrentView('create');
  };

  const handleSignOut = async () => {
    await signOut();
    setShowAuth(false);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DailyDashboard events={events} onEditEvent={handleEditEvent} />;
      case 'calendar':
        return <CalendarView events={events} />;
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
        return <DailyDashboard events={events} onEditEvent={handleEditEvent} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentView={currentView}
        userEmail={user.email || ''}
        onViewChange={setCurrentView}
        onSignOut={handleSignOut}
      />

      <main className="pb-16">
        {renderView()}
      </main>

      <FloatingActionButton onClick={() => {
        setEditingEvent(null);
        setCurrentView('create');
      }} />
    </div>
  );
};

export default Index;
