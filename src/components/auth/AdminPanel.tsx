import React, { useEffect, useState } from 'react';
import { useAuth, UserWithRole, UserRole, PermissionMatrix } from '../../contexts/AuthContext';
import { Eye, Edit, Trash2, Shield, X, Save, UserCog, LayoutGrid } from 'lucide-react';

const APP_MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'action_plan', name: 'Action Plan' },
  { id: 'strategy_product', name: 'Chiến lược Sản phẩm' },
  { id: 'strategy_customer', name: 'Chiến lược Khách hàng' },
  { id: 'competitors', name: 'Phân tích Đối thủ' },
  { id: 'daily_report', name: 'Báo cáo Hàng ngày' },
  { id: 'media', name: 'Kho Media' },
];

// Component Công tắc (Toggle Switch) hiện đại
const Toggle = ({ checked, onChange, activeColor }: { checked: boolean, onChange: () => void, activeColor: string }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? activeColor : 'bg-gray-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-2.5' : '-translate-x-2.5'
      }`}
    />
  </button>
);

export function AdminPanel() {
  const { getAllUsers, updateUserRole, updateUserPermissions, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [matrixUser, setMatrixUser] = useState<UserWithRole | null>(null);
  const [tempMatrix, setTempMatrix] = useState<PermissionMatrix>({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRole(userId, newRole);
    loadUsers();
  };

  const openMatrix = (user: UserWithRole) => {
    setMatrixUser(user);
    const initialMatrix = { ...user.permissions };
    APP_MODULES.forEach(mod => {
      if (!initialMatrix[mod.id]) {
        initialMatrix[mod.id] = { view: false, edit: false, delete: false };
      }
    });
    setTempMatrix(initialMatrix);
  };

  const togglePermission = (moduleId: string, action: 'view' | 'edit' | 'delete') => {
    setTempMatrix(prev => {
      const currentModule = prev[moduleId] || { view: false, edit: false, delete: false };
      const newValue = !currentModule[action];
      
      if (action === 'view' && !newValue) {
        return { ...prev, [moduleId]: { view: false, edit: false, delete: false } };
      }
      if ((action === 'edit' || action === 'delete') && newValue) {
        return { ...prev, [moduleId]: { ...currentModule, [action]: true, view: true } };
      }

      return { ...prev, [moduleId]: { ...currentModule, [action]: newValue } };
    });
  };

  const saveMatrix = async () => {
    if (!matrixUser) return;
    setSavingMatrix(true);
    await updateUserPermissions(matrixUser.user_id, tempMatrix);
    setSavingMatrix(false);
    setMatrixUser(null);
    loadUsers(); 
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Đang tải danh sách người dùng...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-white flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý Tài khoản & Phân quyền</h2>
          <p className="text-sm text-gray-500 mt-1">Cấp quyền truy cập hệ thống và tùy chỉnh ma trận module cho từng nhân sự.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 border-b border-gray-100 font-semibold">Tài khoản (Email)</th>
              <th className="p-5 border-b border-gray-100 font-semibold">Nhóm Quyền</th>
              <th className="p-5 border-b border-gray-100 font-semibold text-center">Tùy chỉnh Chi tiết</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                <td className="p-5 text-gray-800 font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">
                    {u.email.charAt(0)}
                  </div>
                  {u.email}
                  {u.user_id === currentUser?.id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">BẠN</span>}
                </td>
                <td className="p-5">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.user_id, e.target.value as UserRole)}
                    disabled={u.user_id === currentUser?.id}
                    className="block w-48 text-sm border-gray-200 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 py-2"
                  >
                    <option value="admin">Admin (Toàn quyền)</option>
                    <option value="manager">Manager (Quản lý)</option>
                    <option value="member">Member (Thành viên)</option>
                    <option value="viewer">Viewer (Chỉ xem)</option>
                  </select>
                </td>
                <td className="p-5 text-center">
                  <button
                    onClick={() => openMatrix(u)}
                    disabled={u.role === 'admin'}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      u.role === 'admin' 
                      ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed' 
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-sm border border-indigo-100'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    {u.role === 'admin' ? 'Full Quyền' : 'Cấu hình Ma trận'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL MA TRẬN PHÂN QUYỀN VỚI UI HIỆN ĐẠI */}
      {matrixUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Ma trận quyền hạn</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Đang thiết lập cho: <span className="font-semibold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md ml-1">{matrixUser.email}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setMatrixUser(null)} className="relative z-10 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Body Modal */}
            <div className="p-8 bg-gray-50/50">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200">
                      <th className="p-4 font-semibold text-gray-700 text-sm">Tên Module / Chức năng</th>
                      <th className="p-4 font-semibold text-gray-700 text-sm text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span>Cho phép Xem</span>
                        </div>
                      </th>
                      <th className="p-4 font-semibold text-gray-700 text-sm text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Edit className="w-4 h-4 text-emerald-500" />
                          <span>Thêm / Sửa</span>
                        </div>
                      </th>
                      <th className="p-4 font-semibold text-gray-700 text-sm text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Trash2 className="w-4 h-4 text-rose-500" />
                          <span>Được phép Xóa</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {APP_MODULES.map((mod, index) => {
                      const perms = tempMatrix[mod.id] || { view: false, edit: false, delete: false };
                      return (
                        <tr key={mod.id} className={`hover:bg-slate-50 transition-colors ${index !== APP_MODULES.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <td className="p-4 font-medium text-gray-800">{mod.name}</td>
                          <td className="p-4 text-center">
                            <Toggle checked={perms.view} onChange={() => togglePermission(mod.id, 'view')} activeColor="bg-blue-500" />
                          </td>
                          <td className="p-4 text-center">
                            <Toggle checked={perms.edit} onChange={() => togglePermission(mod.id, 'edit')} activeColor="bg-emerald-500" />
                          </td>
                          <td className="p-4 text-center">
                            <Toggle checked={perms.delete} onChange={() => togglePermission(mod.id, 'delete')} activeColor="bg-rose-500" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 text-sm text-indigo-800 bg-indigo-50/80 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                <div className="text-xl">💡</div>
                <p className="leading-relaxed">
                  <b>Mẹo thông minh:</b> Khi bạn bật công tắc <b className="text-emerald-600">Sửa</b> hoặc <b className="text-rose-600">Xóa</b>, hệ thống sẽ tự động bật quyền <b className="text-blue-600">Xem</b> (vì để thao tác được thì người dùng bắt buộc phải nhìn thấy dữ liệu).
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setMatrixUser(null)} 
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={saveMatrix} 
                disabled={savingMatrix}
                className="flex items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {savingMatrix ? (
                  <>Đang lưu...</>
                ) : (
                  <><Save className="w-4 h-4" /> Lưu Thiết Lập</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
