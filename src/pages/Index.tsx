
import { useState } from 'react';
import { Plus, Calendar, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyDashboard } from '@/components/DailyDashboard';
import { EventForm } from '@/components/EventForm';
import { CalendarView } from '@/components/CalendarView';
import { useEvents } from '@/hooks/useEvents';
import { ViewMode } from '@/types/event';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const { events, addEvent } = useEvents();

  const handleSaveEvent = (eventData: any) => {
    addEvent(eventData);
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
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">EventHub</h1>
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
