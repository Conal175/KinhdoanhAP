import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncData } from '../store';
import { Package, Save, ArrowLeft, Info, FileEdit } from 'lucide-react';

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

  const { data, syncData, loading } = useSyncData<StrategyData>(projectId, 'strategy_product', [{ id: '1', content: '' }]);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      setContent(data[0].content || '');
    }
  }, [data]);

  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    await syncData([{ id: '1', content }]);
    setTimeout(() => setIsSaving(false), 500); // Hiệu ứng lưu mượt mà
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải tài liệu chiến lược...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER ĐIỀU HƯỚNG */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack} 
          className="p-2.5 bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 rounded-xl text-gray-600 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" /> Chiến lược Sản phẩm (USP)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Xác định điểm mạnh và lợi thế cạnh tranh cốt lõi</p>
        </div>
      </div>

      {/* CẢNH BÁO QUYỀN VIEW (Nếu bị khóa) */}
      {!canEdit && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800">Chế độ Chỉ Xem (Read-Only)</h4>
            <p className="text-sm text-amber-700 mt-1">
              Bạn không có quyền chỉnh sửa tài liệu này theo ma trận phân quyền. Liên hệ Admin nếu bạn cần cập nhật nội dung.
            </p>
          </div>
        </div>
      )}

      {/* KHU VỰC SOẠN THẢO (DOCUMENT STYLE) */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <FileEdit className="w-5 h-5 text-gray-400" />
            Bản nháp Chiến lược
          </div>
          
          {canEdit && (
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-xl hover:bg-amber-600 transition-all font-bold text-sm shadow-md disabled:opacity-70"
            >
              <Save className="w-4 h-4" /> 
              {isSaving ? 'Đang lưu...' : 'Lưu Chiến Lược'}
            </button>
          )}
        </div>

        <div className="p-8 bg-[#fdfcfb]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!canEdit}
            rows={18}
            className={`w-full bg-transparent border-0 outline-none resize-y text-gray-800 leading-relaxed text-lg ${
              !canEdit ? 'cursor-not-allowed text-gray-600' : 'placeholder-gray-300'
            }`}
            placeholder="Viết chiến lược của bạn tại đây... (Ví dụ: Sản phẩm của chúng ta có độ bền gấp đôi đối thủ, nhắm vào phân khúc trung cấp...)"
          />
        </div>
      </div>
    </div>
  );
}
