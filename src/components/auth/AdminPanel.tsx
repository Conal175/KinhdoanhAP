import { useEffect, useState, useCallback } from 'react';
import { useAuth, type UserRole, type UserWithRole } from '../../contexts/AuthContext';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Crown,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCog,
} from 'lucide-react';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: typeof Crown; desc: string }> = {
  admin: { label: 'Admin', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: Crown, desc: 'Toàn quyền: quản lý users, projects, mọi tính năng' },
  manager: { label: 'Manager', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: ShieldCheck, desc: 'Quản lý: tạo/sửa/xóa projects, phân công, báo cáo' },
  member: { label: 'Member', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Shield, desc: 'Thành viên: xem & cập nhật tasks, viết báo cáo' },
  viewer: { label: 'Viewer', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: Eye, desc: 'Chỉ xem: không thể chỉnh sửa bất kỳ dữ liệu nào' },
};

export function AdminPanel() {
  const { getAllUsers, updateUserRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }, [getAllUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      setMessage({ type: 'error', text: 'Không thể thay đổi quyền của chính mình!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setUpdating(userId);
    const { error } = await updateUserRole(userId, newRole);
    if (error) {
      setMessage({ type: 'error', text: error });
    } else {
      setMessage({ type: 'success', text: `Đã cập nhật quyền thành công!` });
      await loadUsers();
    }
    setUpdating(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role as UserRole] = (acc[u.role as UserRole] || 0) + 1;
    return acc;
  }, {} as Record<UserRole, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            Quản Lý Người Dùng
          </h1>
          <p className="text-gray-500 text-sm mt-1">Phân quyền truy cập hệ thống (Custom JWT Claims)</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['admin', 'manager', 'member', 'viewer'] as UserRole[]).map(r => {
          const cfg = ROLE_CONFIG[r];
          const Icon = cfg.icon;
          return (
            <div key={r} className={`border rounded-xl p-4 ${cfg.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${cfg.color}`} />
                <span className={`text-2xl font-bold ${cfg.color}`}>{roleCounts[r] || 0}</span>
              </div>
              <p className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cfg.desc.split(':')[0]}</p>
            </div>
          );
        })}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo email..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Đang tải danh sách users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{search ? 'Không tìm thấy user nào' : 'Chưa có user nào'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">#</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Quyền hiện tại</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Ngày tham gia</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-600">Thay đổi quyền</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const cfg = ROLE_CONFIG[(u.role as UserRole) || 'member'];
                  const Icon = cfg.icon;
                  const isCurrentUser = u.user_id === currentUser?.id;
                  return (
                    <tr key={u.user_id} className={`border-b border-gray-100 ${isCurrentUser ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            u.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                            u.role === 'manager' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                            u.role === 'member' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                            'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{u.email}</p>
                            {isCurrentUser && (
                              <span className="text-xs text-blue-500 font-medium">← Bạn</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        {isCurrentUser ? (
                          <p className="text-xs text-gray-400 text-center">Không thể tự đổi</p>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {(['admin', 'manager', 'member', 'viewer'] as UserRole[]).map(r => {
                              const rc = ROLE_CONFIG[r];
                              const isActive = u.role === r;
                              return (
                                <button
                                  key={r}
                                  onClick={() => !isActive && handleRoleChange(u.user_id, r)}
                                  disabled={isActive || updating === u.user_id}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    isActive
                                      ? `${rc.bg} ${rc.color} border cursor-default`
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 border border-transparent'
                                  } ${updating === u.user_id ? 'opacity-50' : ''}`}
                                  title={rc.desc}
                                >
                                  {updating === u.user_id ? '...' : rc.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-500" /> Ma Trận Phân Quyền
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Chức năng</th>
                <th className="text-center px-4 py-3 font-semibold text-red-600">Admin</th>
                <th className="text-center px-4 py-3 font-semibold text-amber-600">Manager</th>
                <th className="text-center px-4 py-3 font-semibold text-blue-600">Member</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Xem Dashboard & Báo cáo', perms: [true, true, true, true] },
                { name: 'Xem Chiến Lược & Media', perms: [true, true, true, true] },
                { name: 'Tạo & Sửa dự án', perms: [true, true, false, false] },
                { name: 'Xóa dự án', perms: [true, true, false, false] },
                { name: 'Tạo/Sửa Action Plan', perms: [true, true, true, false] },
                { name: 'Viết Báo cáo hàng ngày', perms: [true, true, true, false] },
                { name: 'Quản lý Chiến Lược & Media', perms: [true, true, true, false] },
                { name: 'Quản lý người dùng', perms: [true, false, false, false] },
                { name: 'Phân quyền', perms: [true, false, false, false] },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{row.name}</td>
                  {row.perms.map((p, j) => (
                    <td key={j} className="text-center px-4 py-3">
                      {p ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-300 text-lg">✗</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
