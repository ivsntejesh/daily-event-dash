import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // For demo purposes, make the first user an admin
      if (user.id === '1') {
        setRole('admin');
      } else {
        setRole('user');
      }
    } else {
      setRole(null);
    }
    setLoading(false);
  }, [user]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator',
    isUser: role === 'user',
  };
};