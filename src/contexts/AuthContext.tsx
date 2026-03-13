import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig, decodeJWT } from '../lib/supabase';

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

// Hàm đọc quyền dự phòng từ Token
function getRoleFromSession(session: Session | null): UserRole {
  try {
    if (!session?.access_token) return 'viewer';
    const decoded = decodeJWT(session.access_token);
    if (!decoded) return 'member'; // Mặc định của hệ thống
    const role = decoded.user_role as string;
    if (['admin', 'manager', 'member', 'viewer'].includes(role)) return role as UserRole;
    return 'member';
  } catch (error) {
    return 'member';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);
  const configured = !!getSupabaseConfig();

  // HÀM ĐỒNG BỘ QUYỀN CHUẨN XÁC: Ai lấy quyền người nấy (Không dùng hàm Admin)
  const syncLiveRole = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setRole('viewer');
      return;
    }

    // 1. Gắn quyền từ Token làm mặc định dự phòng
    let finalRole = getRoleFromSession(currentSession);

    const supabase = getSupabase();
    if (supabase) {
      try {
        // 2. Tự đọc quyền của chính mình từ Database
        // Dùng maybeSingle() để không văng lỗi nếu user chưa có tên trong bảng
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();

        if (!error && data?.role) {
          finalRole = data.role as UserRole;
        }
      } catch (err) {
        console.error("Lỗi khi fetch live role:", err);
      }
    }

    setRole(finalRole);
  }, []);

  const refreshRole = useCallback(() => {
    syncLiveRole(session);
  }, [session, syncLiveRole]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (mounted) {
          setSession(s);
          setUser(s?.user ?? null);
          syncLiveRole(s).finally(() => {
            if (mounted) setLoading(false);
          });
        }
      })
      .catch((err) => {
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) {
        setSession(s);
        setUser(s?.user ?? null);
        syncLiveRole(s);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, syncLiveRole]);

  // LẮNG NGHE REALTIME & QUÉT NGẦM TỰ ĐỘNG
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;

    const updateRole = () => syncLiveRole(session);

    // Bắt sự kiện Realtime
    const roleSubscription = supabase
      .channel(`role-update-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => {
           updateRole();
           supabase.auth.refreshSession().catch(() => {});
        }
      )
      .subscribe();

    // BẢO HIỂM KÉP: Kiểm tra lại quyền mỗi 3 giây 
    // (Đảm bảo giao diện 100% tự biến đổi khi bị hạ/nâng cấp mà không cần F5)
    const intervalId = setInterval(updateRole, 3000);

    return () => {
      supabase.removeChannel(roleSubscription);
      clearInterval(intervalId);
    };
  }, [user?.id, session, syncLiveRole]);

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
