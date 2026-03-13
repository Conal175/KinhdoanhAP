import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncData } from '../store';
import { FileText, Plus, Trash2, X, Edit2, Calendar, User, Clock } from 'lucide-react';
import { v4 as uuid } from 'uuid';

export interface Report {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

interface ReportProps {
  projectId: string;
}

export default function DailyReport({ projectId }: ReportProps) {
  const { checkPermission, user } = useAuth();
  const canEdit = checkPermission('daily_report', 'edit');
  const canDelete = checkPermission('daily_report', 'delete');

  const { data: reports, syncData, loading } = useSyncData<Report>(projectId, 'daily_reports', []);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const handleOpenAdd = () => {
    if (!canEdit) return;
    setFormData({ title: '', content: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (report: Report) => {
    if (!canEdit) return;
    setFormData({ title: report.title, content: report.content });
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!canEdit || !formData.title.trim()) return;

    let newReports;
    if (editingId) {
      newReports = reports.map(r => r.id === editingId ? { ...r, ...formData } : r);
    } else {
      const newReport: Report = {
        id: uuid(),
        title: formData.title,
        content: formData.content,
        author: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Người dùng',
        createdAt: new Date().toISOString()
      };
      newReports = [newReport, ...reports];
    }
    
    await syncData(newReports);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (!confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return;
    await syncData(reports.filter(r => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-500" /> Báo cáo Hàng ngày
          </h2>
          <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ và nhật ký công việc của team</p>
        </div>
        
        {canEdit && (
          <button 
            onClick={handleOpenAdd} 
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all font-semibold text-sm transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Viết báo cáo mới
          </button>
        )}
      </div>

      {/* DANH SÁCH BÁO CÁO DẠNG FEED/CARD */}
      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Chưa có báo cáo nào</h3>
            <p className="text-gray-500">Hãy là người đầu tiên cập nhật tình hình dự án!</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-emerald-600 transition-colors">{report.title}</h4>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {report.content}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">
                      <User className="w-4 h-4" /> {report.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {new Date(report.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* NÚT THAO TÁC (Chỉ hiện khi có quyền) */}
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <button 
                      onClick={() => handleOpenEdit(report)} 
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(report.id)} 
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Xóa báo cáo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM VIẾT BÁO CÁO MƯỢT MÀ */}
      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-500" />
                {editingId ? 'Chỉnh sửa báo cáo' : 'Viết báo cáo mới'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 bg-gray-50/30">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề báo cáo <span className="text-red-500">*</span></label>
                <input 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm text-lg font-medium" 
                  placeholder="VD: Báo cáo kết quả chạy Ads ngày 15/10..." 
                  autoFocus 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung chi tiết</label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({ ...formData, content: e.target.value })} 
                  rows={8} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm leading-relaxed" 
                  placeholder="Mô tả chi tiết công việc đã hoàn thành, kết quả đạt được, vấn đề tồn đọng..." 
                />
              </div>
            </div>

            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowForm(false)} 
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave} 
                disabled={!formData.title.trim()} 
                className="px-8 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                {editingId ? 'Cập nhật' : 'Đăng báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
