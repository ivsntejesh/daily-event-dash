import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Home,
  Calendar,
  ListChecks,
  Users,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  RefreshCw
} from 'lucide-react';

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();

  return (
    <nav className="bg-secondary border-r border-r-muted w-60 flex flex-col h-full">
      <div className="p-4 flex-grow">
        <h1 className="font-bold text-2xl mb-4">TaskMaster</h1>
        <ul className="space-y-1">
          <li>
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/calendar"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/calendar'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </Link>
          </li>
          <li>
            <Link
              to="/tasks"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/tasks'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <ListChecks className="h-4 w-4" />
              <span>Tasks</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link
                to="/users"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/users'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </Link>
            </li>
          )}
          {isAdmin && (
            <Link
              to="/sync"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/sync'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sync</span>
            </Link>
          )}
        </ul>
      </div>

      <div className="p-4 pt-8 border-t border-t-muted">
        <ul className="space-y-1">
          {user ? (
            <>
              <li>
                <Link
                  to="/settings"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/settings'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/login'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/register'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};
