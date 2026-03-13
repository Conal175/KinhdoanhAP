import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
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

// Hàm dự phòng đọc quyền từ Token
function getRoleFromSession(session: Session | null): UserRole {
  try {
    if (!session?.access_token) return 'viewer';
    const decoded = decodeJWT(session.access_token);
    if (!decoded) return 'viewer'; 
    const role = decoded.user_role as string;
    if (['admin', 'manager', 'member', 'viewer'].includes(role)) return role as UserRole;
    return 'viewer';
  } catch (error) {
    return 'viewer';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  // Tách riêng state và set state để quản lý đồng bộ với Ref
  const [role, _setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);
  const configured = !!getSupabaseConfig();

  const roleRef = useRef<UserRole>('viewer');
  const isRoleSynced = useRef(false);

  // Hàm cập nhật quyền cho cả Giao diện (State) và Bộ đếm (Ref)
  const setRole = useCallback((newRole: UserRole) => {
    _setRole(newRole);
    roleRef.current = newRole;
  }, []);

  // HÀM ÉP ĐĂNG XUẤT (Chạy khi phát hiện đổi quyền)
  const handleRoleChangedForceLogout = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    alert('⚠️ THÔNG BÁO HỆ THỐNG ⚠️\n\nQuyền truy cập của bạn vừa được thay đổi bởi Quản trị viên. Hệ thống sẽ tiến hành đăng xuất để cập nhật bảo mật.\n\nVui lòng đăng nhập lại!');
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole('viewer');
    isRoleSynced.current = false;
    
    window.location.reload();
  }, [setRole]);

  // HÀM ĐỒNG BỘ QUYỀN (Sử dụng đường hầm RPC để vượt RLS)
  const syncLiveRole = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setRole('viewer');
      isRoleSynced.current = true;
      return;
    }

    let currentRole = getRoleFromSession(currentSession);
    const supabase = getSupabase();
    
    if (supabase) {
      try {
        // Gọi Hàm Đặc Quyền vừa tạo ở Bước 1
        const { data, error } = await supabase.rpc('get_my_role');
        if (!error && data) {
          currentRole = data as UserRole;
        }
      } catch (err) {
        console.error("Lỗi khi fetch live role:", err);
      }
    }

    setRole(currentRole);
    isRoleSynced.current = true;
  }, [setRole]);

  const refreshRole = useCallback(() => {
    syncLiveRole(session);
  }, [session, syncLiveRole]);

  // Lấy dữ liệu lúc mới vào web
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
      .catch(() => {
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

  // BỘ ĐẾM QUÉT NGẦM KIỂM TRA QUYỀN (Hoạt động hoàn hảo 100%)
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;

    // Lắng nghe Realtime nếu có
    const roleSubscription = supabase
      .channel(`role-update-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => handleRoleChangedForceLogout()
      )
      .subscribe();

    // Quét dự phòng 3 giây/lần bằng đường hầm RPC
    const intervalId = setInterval(async () => {
      if (!isRoleSynced.current) return;

      try {
        const { data, error } = await supabase.rpc('get_my_role');

        if (!error && data) {
          // Nếu quyền trả về khác với quyền hiện tại đang dùng -> KÍCH HOẠT ĐĂNG XUẤT!
          if (data !== roleRef.current) {
            handleRoleChangedForceLogout();
          }
        }
      } catch (e) {
        // Bỏ qua lỗi mạng chập chờn
      }
    }, 3000);

    return () => {
      supabase.removeChannel(roleSubscription);
      clearInterval(intervalId);
    };
  }, [user?.id, handleRoleChangedForceLogout]);

  // --- CÁC HÀM CỦA ADMIN VÀ AUTH ---
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
    isRoleSynced.current = false;
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
