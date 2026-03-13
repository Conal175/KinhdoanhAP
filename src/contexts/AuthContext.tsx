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
  configured: boolean; // Supabase đã cấu hình chưa
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  // Admin functions (ĐÃ ĐƯỢC GIỮ NGUYÊN)
  getAllUsers: () => Promise<UserWithRole[]>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<{ error: string | null }>;
  // Permissions
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

function getRoleFromSession(session: Session | null): UserRole {
  // Bọc Try/Catch để phòng trường hợp Token bị hỏng gây sập web
  try {
    if (!session?.access_token) return 'viewer';
    const decoded = decodeJWT(session.access_token);
    if (!decoded) return 'member';
    const role = decoded.user_role as string;
    if (['admin', 'manager', 'member', 'viewer'].includes(role)) return role as UserRole;
    return 'member';
  } catch (error) {
    console.error("Lỗi giải mã JWT:", error);
    return 'viewer';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);
  const configured = !!getSupabaseConfig();

  const refreshRole = useCallback(() => {
    setRole(getRoleFromSession(session));
  }, [session]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. CHỐT CHẶN LỖI: Bắt buộc có .catch() và .finally() để không bị kẹt Loading
    supabase.auth.getSession()
      .then(({ data: { session: s }, error }) => {
        if (error) console.error("Lỗi getSession:", error);
        setSession(s);
        setUser(s?.user ?? null);
        setRole(getRoleFromSession(s));
      })
      .catch((err) => {
        console.error("Ngoại lệ khi lấy Session:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Lắng nghe auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setRole(getRoleFromSession(s));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  // 3. REALTIME AN TOÀN: Khi Admin đổi quyền, ép tự động lấy Token mới
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    const roleSubscription = supabase
      .channel(`role-update-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => {
          // Ép lấy token mới -> Kích hoạt onAuthStateChange -> Tự động giải mã quyền mới
          supabase.auth.refreshSession().catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roleSubscription);
    };
  }, [user?.id]);

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
