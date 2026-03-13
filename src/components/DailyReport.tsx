import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncData } from '../store';
import { FileText, Plus, Trash2, X, Edit2 } from 'lucide-react';
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

  // Lấy dữ liệu THẬT từ Database
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
        author: user?.user_metadata?.full_name || user?.email || 'Người dùng',
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

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải báo cáo...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Báo cáo Hàng ngày</h2>
        {canEdit && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-medium text-sm">
            <Plus className="w-4 h-4" /> Viết báo cáo
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {reports.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có báo cáo nào.</p>
        ) : (
          <div className="space-y-6">
            {reports.map(report => (
              <div key={report.id} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{report.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{report.content}</p>
                    <p className="text-xs text-gray-400 mt-2">Đăng bởi: {report.author} • {new Date(report.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button onClick={() => handleOpenEdit(report)} className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(report.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Sửa báo cáo' : 'Viết báo cáo mới'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="VD: Báo cáo ngày..." autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={5} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nhập nội dung báo cáo..." />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl">Hủy</button>
              <button onClick={handleSave} disabled={!formData.title.trim()} className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">Lưu báo cáo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
