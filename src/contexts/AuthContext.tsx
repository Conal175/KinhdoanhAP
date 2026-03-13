import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig } from '../lib/supabase';

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

export interface UserWithRole {
  user_id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  getAllUsers: () => Promise<UserWithRole[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<{ error: string | null }>;
  canEdit: boolean;
  canManage: boolean;
  isAdmin: boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);
  const configured = !!getSupabaseConfig();

  // HÀM LẤY QUYỀN TRỰC TIẾP TỪ DATABASE (Độ chính xác 100%, không phụ thuộc Token)
  const fetchLiveRole = useCallback(async (userId: string) => {
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
        setRole('viewer'); // An toàn: Lỗi thì cho về viewer
      }
    } catch (e) {
      console.error("Lỗi fetchLiveRole:", e);
      setRole('viewer');
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (user?.id) {
      await fetchLiveRole(user.id);
    }
  }, [user?.id, fetchLiveRole]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Lấy Session lần đầu
    supabase.auth.getSession()
      .then(({ data: { session: s }, error }) => {
        if (error) console.error("Lỗi getSession:", error);
        if (mounted) {
          setSession(s);
          setUser(s?.user ?? null);
          if (s?.user) {
            // Có user -> Gọi thẳng DB lấy quyền
            fetchLiveRole(s.user.id).finally(() => {
              if (mounted) setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("Ngoại lệ lấy Session:", err);
        if (mounted) setLoading(false);
      });

    // Lắng nghe Đăng nhập / Đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchLiveRole(s.user.id);
      } else {
        setRole('viewer');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchLiveRole]);

  // LẮNG NGHE REALTIME: Khi Admin đổi quyền trong DB
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    const roleSubscription = supabase
      .channel(`role-update-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => {
          // 1. Cập nhật giao diện NGAY LẬP TỨC bằng cách chọc thẳng vào DB
          fetchLiveRole(user.id);
          // 2. Ép làm mới token ngầm bên dưới để backend nhận diện quyền mới
          supabase.auth.refreshSession().catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roleSubscription);
    };
  }, [user?.id, fetchLiveRole]);

  // CÁC HÀM CỦA ADMIN VÀ AUTH
  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase chưa được cấu hình' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase chưa được cấu hình' };
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole('viewer');
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase chưa được cấu hình' };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: error.message };
    return { error: null };
  };

  const getAllUsers = async (): Promise<UserWithRole[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('get_all_users_with_roles');
    if (error) {
      console.error('getAllUsers error:', error);
      return [];
    }
    return (data || []) as UserWithRole[];
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase chưa được cấu hình' };
    const { error } = await supabase.rpc('update_user_role', { target_user_id: userId, new_role: newRole });
    if (error) return { error: error.message };
    return { error: null };
  };

  const canEdit = ['admin', 'manager', 'member'].includes(role);
  const canManage = ['admin', 'manager'].includes(role);
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user, session, role, loading, configured,
        signIn, signUp, signOut, resetPassword,
        getAllUsers, updateUserRole,
        canEdit, canManage, isAdmin, refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
