
import { useState } from 'react';
import { DailyDashboard } from '@/components/DailyDashboard';
import { EventForm } from '@/components/EventForm';
import { CalendarView } from '@/components/CalendarView';
import { AuthPage } from '@/components/AuthPage';
import { Navigation } from '@/components/Navigation';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { ViewMode } from '@/types/eventTypes';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const { user, signOut, loading: authLoading } = useAuth();
  const { events, saveEvent } = useEvents();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSaveEvent = (eventData: any, isPublic: boolean) => {
    saveEvent(eventData, isPublic);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DailyDashboard events={events} />;
      case 'calendar':
        return <CalendarView events={events} />;
      case 'create':
        return (
          <EventForm
            onSave={handleSaveEvent}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      default:
        return <DailyDashboard events={events} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentView={currentView}
        userEmail={user.email || ''}
        onViewChange={setCurrentView}
        onSignOut={signOut}
      />

      <main className="pb-16">
        {renderView()}
      </main>

      <FloatingActionButton onClick={() => setCurrentView('create')} />
    </div>
  );
};

export default Index;
