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
  refreshRole: () => void;
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

  // BƯỚC 1: HÀM LẤY QUYỀN TRỰC TIẾP TỪ DATABASE (BỎ QUA TOKEN)
  const syncRoleFromDB = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      // Dùng RPC để vượt qua mọi rào cản bảo mật RLS, lấy quyền chuẩn xác 100%
      const { data: users } = await supabase.rpc('get_all_users_with_roles');
      if (users) {
        const me = (users as UserWithRole[]).find(u => u.user_id === userId);
        if (me && me.role) {
          setRole(me.role);
        }
      }
    } catch (e) {
      console.error("Lỗi đồng bộ quyền:", e);
    }
  }, []);

  const refreshRole = useCallback(() => {
    if (user?.id) syncRoleFromDB(user.id);
  }, [user?.id, syncRoleFromDB]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Lấy Session lần đầu
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (mounted) {
          setSession(s);
          setUser(s?.user ?? null);
          if (s?.user) {
            syncRoleFromDB(s.user.id).finally(() => {
              if (mounted) setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy Session:", err);
        if (mounted) setLoading(false);
      });

    // Lắng nghe Đăng nhập / Đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          syncRoleFromDB(s.user.id);
        } else {
          setRole('viewer');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, syncRoleFromDB]);

  // BƯỚC 2: BẢO HIỂM 2 LỚP CHO TỰ ĐỘNG CẬP NHẬT GIAO DIỆN
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    // Lớp 1: Cập nhật tức thì bằng Realtime
    const roleSubscription = supabase
      .channel(`role-update-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => syncRoleFromDB(user.id)
      )
      .subscribe();

    // Lớp 2: Kiểm tra ngầm định kỳ mỗi 5 giây
    // (Khắc phục 100% lỗi nếu Realtime của Supabase bị miss hoặc chưa bật)
    const checkInterval = setInterval(() => {
      syncRoleFromDB(user.id);
    }, 5000);

    return () => {
      supabase.removeChannel(roleSubscription);
      clearInterval(checkInterval);
    };
  }, [user?.id, syncRoleFromDB]);

  // --- CÁC HÀM CỦA ADMIN VÀ AUTH GIỮ NGUYÊN ---
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
