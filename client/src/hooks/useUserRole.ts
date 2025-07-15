
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        setUserRole('user'); // Default to user role
      } else {
        setUserRole(data?.role || 'user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const isAdmin = () => userRole === 'admin';
  const isModerator = () => userRole === 'moderator';
  const isAdminOrModerator = () => userRole === 'admin' || userRole === 'moderator';

  return {
    userRole,
    loading,
    isAdmin,
    isModerator,
    isAdminOrModerator,
    refetch: fetchUserRole,
  };
};
