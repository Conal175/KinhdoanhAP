import { useState, useCallback } from 'react';
import type { Fanpage, ContentAd } from '../types';
import { getFanpages, saveFanpages, getContentAds, saveContentAds } from '../store';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Image, Globe, Check, Edit3, X, Info, ExternalLink } from 'lucide-react';

const DEFAULT_CHECKLIST_ITEMS = [
  { label: 'Tên Fanpage - URL Page', icon: '🌐', description: 'Ngắn gọn, gợi nhớ thương hiệu' },
  { label: 'Ảnh bìa (Cover)', icon: '🎨', description: 'Nội dung ảnh: 828x315 px. Nên thể hiện rõ sản phẩm...' },
  { label: 'Avatar', icon: '🖼️', description: 'Logo doanh nghiệp. 2048x2048px.' },
  { label: 'Mô tả ngắn', icon: '📝', description: 'Ngắn gọn, không quá 255 ký tự.' },
  { label: 'Nút hành động (CTA)', icon: '📲', description: 'Kêu gọi khách hàng mua hàng.' },
  { label: 'Hộp thư tự động', icon: '💬', description: 'Kịch bản tin nhắn chào mừng, trả lời nhanh.' },
  // ... bạn hãy copy toàn bộ 13 mục từ DEFAULT_CHECKLIST_ITEMS trong file gốc vào đây ...
];

export function MediaResources({ projectId }: { projectId: string }) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('media', 'edit');
  const canDelete = checkPermission('media', 'delete');

  const [tab, setTab] = useState<'checklist' | 'content'>('checklist');
  const [fanpages, setFanpages] = useState<Fanpage[]>(() => getFanpages(projectId));
  const [ads, setAds] = useState<ContentAd[]>(() => getContentAds(projectId));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Quản Lý Tài Nguyên Media</h2>
      <div className="flex gap-2">
        <button onClick={() => setTab('checklist')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab==='checklist' ? 'bg-teal-600 text-white shadow-md' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}><Globe className="w-4 h-4 inline mr-2"/> Checklist Fanpage</button>
        <button onClick={() => setTab('content')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab==='content' ? 'bg-teal-600 text-white shadow-md' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}><Image className="w-4 h-4 inline mr-2"/> Thư Viện Content Ads</button>
      </div>

      {tab === 'checklist' ? (
        <div className="space-y-4">
          {canEdit && <button onClick={() => { if(canEdit) { const n = {id: uuid(), projectId, name: 'Fanpage Mới', url: '', createdAt: new Date().toISOString(), items: []}; setFanpages([...fanpages, n]); saveFanpages(projectId, [...fanpages, n]); } }} className="bg-teal-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-md font-bold hover:bg-teal-700 transition-all"><Plus className="w-5 h-5" /> Thêm Fanpage</button>}
          {fanpages.map(fp => (
            <div key={fp.id} className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center font-bold transition-colors"><Globe className="w-5 h-5"/></div><div><p className="font-bold text-gray-800">{fp.name}</p><p className="text-xs text-gray-400 font-medium">{fp.items.length} mục kiểm tra</p></div></div>
              <div className="flex items-center gap-1">
                 {canEdit && <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors"><Edit3 className="w-4 h-4"/></button>}
                 {canDelete && <button onClick={() => { if(confirm('Xóa Fanpage?')) { const n = fanpages.filter(f => f.id !== fp.id); setFanpages(n); saveFanpages(projectId, n); } }} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ads.map(ad => (
            <div key={ad.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                 <span className="text-[10px] font-extrabold bg-teal-50 text-teal-700 px-2 py-1 rounded-full uppercase tracking-tighter">{ad.angle}</span>
                 {canDelete && <button onClick={() => { const n = ads.filter(a => a.id !== ad.id); setAds(n); saveContentAds(projectId, n); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">{ad.caption}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
