import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  canManage: boolean;
  canEdit: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setConfigured(true);

    const fetchLiveRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        if (!error && data && data.role) {
           setRole(data.role as UserRole);
        }
      } catch (e) {
        console.error('Lỗi khi lấy quyền:', e);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchLiveRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchLiveRole(session.user.id);
      } else {
        setRole('viewer');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lắng nghe Realtime (Đã Fix an toàn 100%)
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    const roleSubscription = supabase
      .channel(`role-update-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => {
          // Bỏ qua payload, tự động gọi lại DB để lấy quyền mới nhất
          // Cách này tránh hoàn toàn lỗi undefined
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data && data.role) {
                setRole(data.role as UserRole);
              }
            })
            .catch(console.error);
            
          // Ép làm mới Token
          supabase.auth.refreshSession().catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roleSubscription);
    };
  }, [user?.id]);

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      setRole('viewer');
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      role,
      loading,
      configured,
      isAdmin: role === 'admin',
      canManage: ['admin', 'manager'].includes(role),
      canEdit: ['admin', 'manager', 'member'].includes(role),
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
