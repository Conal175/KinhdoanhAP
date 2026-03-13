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

// Lấy quyền từ Token
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
  const [role, setRoleState] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);
  const configured = !!getSupabaseConfig();

  // Dùng useRef để giữ giá trị quyền hiện tại (Tránh lỗi lặp vô hạn khi dùng setInterval)
  const roleRef = useRef<UserRole>('viewer');
  const isRoleSynced = useRef(false);

  // Hàm cập nhật quyền đồng bộ cả State lẫn Ref
  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    roleRef.current = newRole;
  }, []);

  // HÀM ÉP ĐĂNG XUẤT CHUẨN KHI BỊ ĐỔI QUYỀN
  const handleRoleChangedForceLogout = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Bật thông báo
    alert('⚠️ THÔNG BÁO HỆ THỐNG ⚠️\n\nQuyền truy cập của bạn vừa được thay đổi bởi Quản trị viên. Hệ thống sẽ tiến hành đăng xuất để cập nhật dữ liệu.\n\nVui lòng đăng nhập lại để tiếp tục!');
    
    // 2. Xóa sạch phiên đăng nhập
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole('viewer');
    isRoleSynced.current = false;
    
    // 3. Reset toàn bộ trang web
    window.location.reload();
  }, [setRole]);

  // HÀM LẤY QUYỀN LÚC MỚI ĐĂNG NHẬP
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
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();

        if (!error && data?.role) {
          currentRole = data.role as UserRole;
        }
      } catch (err) {
        console.error("Lỗi khi fetch live role:", err);
      }
    }

    setRole(currentRole);
    isRoleSynced.current = true; // Đánh dấu đã đồng bộ xong
  }, [setRole]);

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

  // ==========================================
  // BẢO HIỂM 2 LỚP: REALTIME + POLLING DỰ PHÒNG
  // ==========================================
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;

    // Lớp 1: Cố gắng bắt tín hiệu Realtime (Nếu Supabase có bật)
    const roleSubscription = supabase
      .channel(`role-update-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        () => {
           handleRoleChangedForceLogout();
        }
      )
      .subscribe();

    // Lớp 2: Quét ngầm 3 giây/lần (ĐẢM BẢO 100% HOẠT ĐỘNG NGAY CẢ KHI REALTIME BỊ LỖI)
    const intervalId = setInterval(async () => {
      // Nếu app đang tải thì chưa quét để tránh lỗi
      if (!isRoleSynced.current) return;

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.role) {
          // PHÁT HIỆN SỰ THAY ĐỔI! Quyền trên DB khác với quyền đang có ở trình duyệt
          if (data.role !== roleRef.current) {
            handleRoleChangedForceLogout();
          }
        }
      } catch (e) {
        // Bỏ qua lỗi vặt
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

  const canEdit = ['admin', 'manager', 'member'].includes(roleState);
  const canManage = ['admin', 'manager'].includes(roleState);
  const isAdmin = roleState === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user, session, role: roleState, loading, configured,
        signIn, signUp, signOut, resetPassword,
        getAllUsers, updateUserRole,
        canEdit, canManage, isAdmin, refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
