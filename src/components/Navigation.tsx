
import { Plus, Calendar, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/eventTypes';

interface NavigationProps {
  currentView: ViewMode;
  userEmail: string;
  onViewChange: (view: ViewMode) => void;
  onSignOut: () => void;
}

export const Navigation = ({ 
  currentView, 
  userEmail, 
  onViewChange, 
  onSignOut 
}: NavigationProps) => {
  return (
    <nav className="border-b bg-card">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">EventHub</h1>
            <span className="text-sm text-muted-foreground">
              Welcome, {userEmail}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={currentView === 'create' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
