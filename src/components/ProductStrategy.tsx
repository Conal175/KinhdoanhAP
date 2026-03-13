import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncData } from '../store';
import { Package, Save, ArrowLeft } from 'lucide-react';

interface StrategyProps {
  projectId: string;
  onBack: () => void;
}

interface StrategyData {
  id: string;
  content: string;
}

export function ProductStrategy({ projectId, onBack }: StrategyProps) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('strategy_product', 'edit');

  // Lấy dữ liệu thật từ Database
  const { data, syncData, loading } = useSyncData<StrategyData>(projectId, 'strategy_product', [{ id: '1', content: '' }]);
  
  const [content, setContent] = useState('');

  // Khi tải xong dữ liệu, gán vào ô nhập
  useEffect(() => {
    if (data && data.length > 0) {
      setContent(data[0].content || '');
    }
  }, [data]);

  const handleSave = async () => {
    if (!canEdit) return;
    await syncData([{ id: '1', content }]);
    alert('Đã lưu Chiến lược Sản phẩm thành công!');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu chiến lược...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-800">Chi tiết Sản phẩm (USP)</h2>
          </div>
        </div>

        {canEdit && (
          <button onClick={handleSave} className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-xl hover:bg-amber-600 transition-all font-medium text-sm shadow-sm">
            <Save className="w-4 h-4" /> Lưu Chiến Lược
          </button>
        )}
      </div>

      <div className="p-6">
        {!canEdit && (
          <div className="mb-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
            <span className="font-bold">Chế độ Chỉ xem:</span> Bạn không có quyền chỉnh sửa nội dung này.
          </div>
        )}

        <label className="block text-sm font-semibold text-gray-700 mb-2">Đặc điểm nổi bật (USP) của sản phẩm</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!canEdit} // Khóa ô gõ nếu không có quyền
          rows={12}
          className={`w-full border border-gray-300 rounded-xl px-4 py-3 outline-none transition-colors ${
            canEdit ? 'focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white' : 'bg-gray-50 text-gray-600 cursor-not-allowed'
          }`}
          placeholder="Nhập chi tiết USP của sản phẩm tại đây..."
        />
      </div>
    </div>
  );
}
