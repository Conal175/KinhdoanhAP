import React, { useEffect, useState } from 'react';
import { useAuth, UserWithRole, UserRole, PermissionMatrix } from '../../contexts/AuthContext';

// Danh sách các Module/Trang trong hệ thống của bạn
const APP_MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'strategy_product', name: 'Chiến lược Sản phẩm' },
  { id: 'strategy_customer', name: 'Chiến lược Khách hàng' },
  { id: 'competitors', name: 'Phân tích Đối thủ' },
  { id: 'daily_report', name: 'Báo cáo Hàng ngày' },
];

export function AdminPanel() {
  const { getAllUsers, updateUserRole, updateUserPermissions, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States cho Ma trận quyền
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

  // Mở bảng ma trận
  const openMatrix = (user: UserWithRole) => {
    setMatrixUser(user);
    // Nếu chưa có matrix, khởi tạo mặc định là false hết
    const initialMatrix = { ...user.permissions };
    APP_MODULES.forEach(mod => {
      if (!initialMatrix[mod.id]) {
        initialMatrix[mod.id] = { view: false, edit: false, delete: false };
      }
    });
    setTempMatrix(initialMatrix);
  };

  // Bật/tắt 1 quyền trong ma trận
  const togglePermission = (moduleId: string, action: 'view' | 'edit' | 'delete') => {
    setTempMatrix(prev => {
      const currentModule = prev[moduleId] || { view: false, edit: false, delete: false };
      const newValue = !currentModule[action];
      
      // Logic thông minh: Nếu tắt 'view' thì tự động tắt luôn 'edit' và 'delete'
      if (action === 'view' && !newValue) {
        return { ...prev, [moduleId]: { view: false, edit: false, delete: false } };
      }
      // Nếu bật 'edit' hoặc 'delete' thì tự động bật 'view'
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
    loadUsers(); // Tải lại để lấy dữ liệu mới
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Đang tải danh sách người dùng...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Tài khoản & Phân quyền</h2>
        <p className="text-sm text-gray-500 mt-1">Cấp quyền truy cập hệ thống và tùy chỉnh ma trận module cho từng nhân sự.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200 font-semibold">Email</th>
              <th className="p-4 border-b border-gray-200 font-semibold">Chức vụ (Role)</th>
              <th className="p-4 border-b border-gray-200 font-semibold text-center">Ma trận Module</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100 last:border-0">
                <td className="p-4 text-gray-800 font-medium">
                  {u.email}
                  {u.user_id === currentUser?.id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Bạn</span>}
                </td>
                <td className="p-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.user_id, e.target.value as UserRole)}
                    disabled={u.user_id === currentUser?.id}
                    className="block w-40 text-sm border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="admin">Admin (Toàn quyền)</option>
                    <option value="manager">Manager (Quản lý)</option>
                    <option value="member">Member (Thành viên)</option>
                    <option value="viewer">Viewer (Chỉ xem)</option>
                  </select>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => openMatrix(u)}
                    disabled={u.role === 'admin'}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      u.role === 'admin' 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    {u.role === 'admin' ? 'Đã cấp toàn quyền' : 'Thiết lập Ma trận'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL MA TRẬN PHÂN QUYỀN */}
      {matrixUser && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ma trận phân quyền</h3>
                <p className="text-sm text-gray-500">Đang chỉnh sửa cho: <span className="font-semibold text-indigo-600">{matrixUser.email}</span></p>
              </div>
              <button onClick={() => setMatrixUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6">
              <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm">
                    <th className="p-3 border border-gray-200 font-semibold">Tên Module / Trang</th>
                    <th className="p-3 border border-gray-200 font-semibold text-center w-24">Xem</th>
                    <th className="p-3 border border-gray-200 font-semibold text-center w-24">Thêm/Sửa</th>
                    <th className="p-3 border border-gray-200 font-semibold text-center w-24 text-red-600">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {APP_MODULES.map(mod => {
                    const perms = tempMatrix[mod.id] || { view: false, edit: false, delete: false };
                    return (
                      <tr key={mod.id} className="hover:bg-gray-50 border-b border-gray-200 text-sm">
                        <td className="p-3 border-r border-gray-200 font-medium text-gray-800">{mod.name}</td>
                        <td className="p-3 border-r border-gray-200 text-center">
                          <input type="checkbox" checked={perms.view} onChange={() => togglePermission(mod.id, 'view')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
                        </td>
                        <td className="p-3 border-r border-gray-200 text-center">
                          <input type="checkbox" checked={perms.edit} onChange={() => togglePermission(mod.id, 'edit')} className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer" />
                        </td>
                        <td className="p-3 text-center">
                          <input type="checkbox" checked={perms.delete} onChange={() => togglePermission(mod.id, 'delete')} className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                💡 <b>Mẹo thông minh:</b> Khi bạn tích vào "Sửa" hoặc "Xóa", hệ thống sẽ tự động bật quyền "Xem" vì để sửa được thì bắt buộc phải nhìn thấy!
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setMatrixUser(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Hủy bỏ
              </button>
              <button 
                onClick={saveMatrix} 
                disabled={savingMatrix}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {savingMatrix ? 'Đang lưu...' : 'Lưu Ma trận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
