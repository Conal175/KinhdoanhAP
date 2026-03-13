import { useState } from 'react';
import type { Competitor } from '../types';
import { getCompetitors, saveCompetitors } from '../store';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../contexts/AuthContext'; // Thêm phân quyền
import { Plus, Edit2, Trash2, Save, X, Swords, ExternalLink, ArrowLeft, Link2 } from 'lucide-react';

interface Props { projectId: string; onBack: () => void; }

export function CompetitorStrategy({ projectId, onBack }: Props) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('competitors', 'edit');
  const canDelete = checkPermission('competitors', 'delete');

  const [competitors, setCompetitors] = useState<Competitor[]>(() => getCompetitors(projectId));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fanpageName: '', adLinks: '', productPrice: '', specs: '', salesPolicy: '', mediaFormat: '', weaknesses: '', strategy: '',
  });

  const handleSave = () => {
    if (!canEdit || !form.fanpageName.trim()) return;
    const newData = editingId 
      ? competitors.map(c => c.id === editingId ? { ...c, ...form } : c)
      : [...competitors, { id: uuid(), projectId, ...form }];
    setCompetitors(newData);
    saveCompetitors(projectId, newData);
    setShowForm(false); setEditingId(null);
    setForm({ fanpageName: '', adLinks: '', productPrice: '', specs: '', salesPolicy: '', mediaFormat: '', weaknesses: '', strategy: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center"><Swords className="w-6 h-6 text-white" /></div>
             <div><h1 className="text-2xl font-bold text-gray-800">Tình Báo Đối Thủ</h1><p className="text-sm text-gray-500">Phân tích đối thủ và chiến lược ứng phó</p></div>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="bg-red-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md">
            <Plus className="w-5 h-5" /> Thêm đối thủ
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50 border-b border-red-100">
                <th className="px-4 py-4 text-left text-red-800 font-bold uppercase">Fanpage đối thủ</th>
                <th className="px-4 py-4 text-left text-red-800 font-bold uppercase">Giá & Chính sách</th>
                <th className="px-4 py-4 text-left text-red-800 font-bold uppercase bg-red-100">Điểm yếu</th>
                <th className="px-4 py-4 text-left text-green-800 font-bold uppercase bg-green-50">Chiến lược của mình</th>
                <th className="px-4 py-4 text-center text-red-800 font-bold uppercase">#</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {competitors.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{c.fanpageName}</td>
                  <td className="p-4"><p className="text-gray-700">{c.productPrice}</p><p className="text-xs text-gray-500 mt-1">{c.salesPolicy}</p></td>
                  <td className="p-4 bg-red-50/30 text-red-700 font-medium whitespace-pre-line">{c.weaknesses}</td>
                  <td className="p-4 bg-green-50/30 text-green-700 font-bold whitespace-pre-line">{c.strategy}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1">
                      {canEdit && <button onClick={() => { setForm(c); setEditingId(c.id); setShowForm(true); }} className="text-red-500 p-1"><Edit2 className="w-4 h-4"/></button>}
                      {canDelete && <button onClick={() => confirm('Xóa?') && (saveCompetitors(projectId, competitors.filter(i=>i.id!==c.id)), setCompetitors(competitors.filter(i=>i.id!==c.id)))} className="text-gray-400"><Trash2 className="w-4 h-4"/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Form giữ nguyên logic bạn đã gửi */}
    </div>
  );
}
