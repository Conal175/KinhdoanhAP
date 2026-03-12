import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

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

// Khởi tạo context với giá trị mặc định AN TOÀN TUYỆT ĐỐI
const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  role: 'viewer',
  loading: true,
  configured: false,
  isAdmin: false,
  canManage: false,
  canEdit: false,
  signOut: async () => {}, // Hàm rỗng an toàn, chống lỗi "not a function"
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  // Tách hàm lấy Role ra riêng và bọc bằng useCallback để tái sử dụng an toàn
  const fetchAndSetRole = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
        
      if (!error && data?.role) {
        setRole(data.role as UserRole);
      } else {
        setRole('viewer'); // Nếu lỗi, ép về viewer cho an toàn
      }
    } catch (e) {
      console.error('Lỗi khi lấy quyền:', e);
      setRole('viewer');
    }
  }, []);

  // Effect 1: Khởi tạo phiên đăng nhập ban đầu
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();
    
    if (!supabase) {
      if (mounted) {
        setConfigured(false);
        setLoading(false);
      }
      return;
    }

    setConfigured(true);

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await fetchAndSetRole(initialSession.user.id);
          } else {
            setRole('viewer');
          }
        }
      } catch (error) {
        console.error('Lỗi khởi tạo Auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Lắng nghe sự kiện đăng nhập/đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        await fetchAndSetRole(newSession.user.id);
      } else {
        setRole('viewer');
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetRole]);

  // Effect 2: Lắng nghe thay đổi quyền Realtime (Chống lỗi undefined 100%)
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();
    
    if (!supabase || !user?.id) return;

    const channelName = `role-update-${user.id}`;
    
    const roleSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          if (!mounted) return;
          
          try {
            // Cách an toàn nhất: Bỏ qua payload, chủ động gọi lại Database
            await fetchAndSetRole(user.id);
            await supabase.auth.refreshSession();
          } catch (error) {
            console.error('Lỗi khi xử lý Realtime:', error);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(roleSubscription);
    };
  }, [user?.id, fetchAndSetRole]);

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      setLoading(true);
      try {
        await supabase.auth.signOut();
      } finally {
        setSession(null);
        setUser(null);
        setRole('viewer');
        setLoading(false);
      }
    }
  };

  // Giá trị truyền xuống Provider
  const contextValue: AuthContextType = {
    session,
    user,
    role,
    loading,
    configured,
    isAdmin: role === 'admin',
    canManage: role === 'admin' || role === 'manager',
    canEdit: role === 'admin' || role === 'manager' || role === 'member',
    signOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Không bao giờ văng lỗi Error rỗng nữa vì đã có defaultContextValue
    return defaultContextValue;
  }
  return context;
};
