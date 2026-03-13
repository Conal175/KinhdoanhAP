import { useState, useEffect } from 'react';
import type { Fanpage, FanpageCheckItem, MediaFolder, MediaItem } from '../types';
import { useSyncData } from '../store';
import { v4 as uuid } from 'uuid';
import {
  Plus, Trash2, Image, FileText, ExternalLink, Square, Check,
  ChevronDown, ChevronRight, Globe, Edit3, X, Info, FolderPlus,
  FolderOpen as FolderOpenIcon, Link2, Video, ImageIcon, MoreHorizontal, Loader2
} from 'lucide-react';

interface Props { projectId: string; }

interface ChecklistTemplate { label: string; icon: string; description: string; subItems?: string[]; }

const DEFAULT_CHECKLIST_ITEMS: ChecklistTemplate[] = [
  { label: 'Tên Fanpage - URL Page', icon: '🌐', description: 'Ngắn gọn, gợi nhớ thương hiệu' },
  { label: 'Ảnh bìa (Cover)', icon: '🎨', description: 'Nội dung ảnh: 828x315 px. Nên thể hiện rõ sản phẩm/dịch vụ.' },
  { label: 'Avatar', icon: '🖼️', description: 'Kích thước lớn nhất: 2048px x 2048px.' },
  { label: 'Mô tả ngắn', icon: '📝', description: 'Cần ngắn gọn, không quá 255 ký tự.' },
  { label: 'Giới thiệu', icon: '📖', description: 'Thêm câu chuyện vào Trang.' },
  { label: 'Nút hành động (CTA)', icon: '📲', description: 'Kêu gọi khách hàng mua hàng.' },
  { label: 'Thiết lập về lĩnh vực', icon: '🏷️', description: 'Chọn Hạng mục có sẵn của Facebook.' },
  { label: 'Thông tin liên hệ', icon: '📞', description: 'Cập nhật đầy đủ các thông tin.', subItems: ['Vị trí', 'Số điện thoại', 'Email'] },
  { label: 'Huy hiệu fan cứng', icon: '🏅', description: 'Tăng uy tín, tương tác cho trang.' },
  { label: 'Ứng dụng cần kết nối', icon: '🔗', description: 'Kết nối nền tảng khác.', subItems: ['Instagram', 'Youtube'] },
  { label: 'Sắp xếp Tab', icon: '📋', description: 'Thiết lập các Tab.', subItems: ['Menu', 'Ảnh', 'Video', 'Đánh giá'] },
  { label: 'Thiết lập hộp thư', icon: '💬', description: 'Cài đặt hệ thống tin nhắn tự động.', subItems: ['Chào mừng', 'Trả lời nhanh'] },
  { label: 'Chữ ký trong post', icon: '✍️', description: 'Mô tả công ty, trụ sở, website, hotline.' },
];

const FOLDER_ICONS = ['📁', '📂', '🎬', '📸', '🎨', '📝', '🎥', '🖼️', '📋', '💡', '🔗', '⭐'];

const MEDIA_TYPES: { value: MediaItem['type']; label: string; icon: string }[] = [
  { value: 'image', label: 'Hình ảnh', icon: '🖼️' }, { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'caption', label: 'Caption', icon: '📝' }, { value: 'link', label: 'Link', icon: '🔗' }
];

function createDefaultChecklistItems(): FanpageCheckItem[] {
  return DEFAULT_CHECKLIST_ITEMS.map(item => ({
    id: uuid(), label: item.label, description: item.description, checked: false, notes: '',
    subItems: item.subItems ? item.subItems.map(sub => ({ id: uuid(), label: sub, checked: false })) : undefined,
  }));
}

function createDefaultFolders(projectId: string): MediaFolder[] {
  return [
    { id: uuid(), projectId, name: 'Tổng hợp Media', icon: '📂', color: 'blue', isDefault: true, items: [], createdAt: new Date().toISOString() },
    { id: uuid(), projectId, name: 'Media chạy Ads', icon: '🎬', color: 'orange', isDefault: true, items: [], createdAt: new Date().toISOString() },
  ];
}

export function MediaResources({ projectId }: Props) {
  const { data: fanpages, syncData: persistFanpages, loading: load1 } = useSyncData<Fanpage>(projectId, 'fanpages', []);
  const { data: folders, syncData: persistFolders, loading: load2 } = useSyncData<MediaFolder>(projectId, 'mediaFolders', []);
  
  const [tab, setTab] = useState<'checklist' | 'library'>('checklist');
  const [showAddFanpage, setShowAddFanpage] = useState(false);
  const [fanpageForm, setFanpageForm] = useState({ name: '', url: '' });
  const [expandedFanpages, setExpandedFanpages] = useState<Set<string>>(new Set());

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: '', icon: '📁', color: 'blue' });
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<Omit<MediaItem, 'id' | 'createdAt'>>({ name: '', type: 'image', link: '', description: '' });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!load2 && folders.length === 0 && !isInitialized) {
      persistFolders(createDefaultFolders(projectId));
      setIsInitialized(true);
    }
  }, [load2, folders.length, isInitialized, persistFolders, projectId]);

  if (load1 || load2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-teal-500" />
        <p>Đang tải tài nguyên Media...</p>
      </div>
    );
  }

  const addFanpage = async () => {
    if (!fanpageForm.name.trim()) return;
    const newFanpage: Fanpage = { id: uuid(), projectId, name: fanpageForm.name.trim(), url: fanpageForm.url.trim(), createdAt: new Date().toISOString(), items: createDefaultChecklistItems() };
    await persistFanpages([...fanpages, newFanpage]);
    setFanpageForm({ name: '', url: '' }); setShowAddFanpage(false); setExpandedFanpages(prev => new Set([...prev, newFanpage.id]));
  };

  const deleteFanpage = async (id: string) => {
    if(confirm('Xóa Fanpage này và toàn bộ checklist?')) await persistFanpages(fanpages.filter(f => f.id !== id));
  };

  const toggleExpandFanpage = (id: string) => setExpandedFanpages(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleCheckItem = async (fanpageId: string, itemId: string) => {
    await persistFanpages(fanpages.map(f => f.id === fanpageId ? { ...f, items: f.items.map(i => { if (i.id !== itemId) return i; const newChecked = !i.checked; return { ...i, checked: newChecked, subItems: i.subItems?.map(sub => ({ ...sub, checked: newChecked })) }; }) } : f));
  };

  const addFolder = async () => { 
    if (!folderForm.name.trim()) return; 
    await persistFolders([...folders, { id: uuid(), projectId, name: folderForm.name.trim(), icon: folderForm.icon, color: folderForm.color, isDefault: false, items: [], createdAt: new Date().toISOString() }]); 
    setFolderForm({ name: '', icon: '📁', color: 'blue' }); setShowAddFolder(false); 
  };

  const deleteFolder = async (id: string) => { 
    const folder = folders.find(f => f.id === id); 
    if (folder?.isDefault) { if (!confirm('Xóa nội dung bên trong?')) return; await persistFolders(folders.map(f => f.id === id ? { ...f, items: [] } : f)); } 
    else { if (!confirm('Xóa thư mục?')) return; await persistFolders(folders.filter(f => f.id !== id)); setActiveFolderId(null); } 
  };

  const addMediaItem = async () => {
    if (!activeFolderId || (!itemForm.name.trim() && !itemForm.link.trim())) return;
    const newItem: MediaItem = { id: editingItem || uuid(), ...itemForm, name: itemForm.name.trim(), link: itemForm.link.trim(), description: itemForm.description.trim(), createdAt: new Date().toISOString() };
    if (editingItem) await persistFolders(folders.map(f => f.id === activeFolderId ? { ...f, items: f.items.map(i => i.id === editingItem ? newItem : i) } : f));
    else await persistFolders(folders.map(f => f.id === activeFolderId ? { ...f, items: [...f.items, newItem] } : f));
    setItemForm({ name: '', type: 'image', link: '', description: '' }); setShowAddItem(false); setEditingItem(null);
  };

  const deleteMediaItem = async (folderId: string, itemId: string) => await persistFolders(folders.map(f => f.id === folderId ? { ...f, items: f.items.filter(i => i.id !== itemId) } : f));
  const activeFolder = folders.find(f => f.id === activeFolderId);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-800">Quản Lý Tài Nguyên Media</h2></div>
      <div className="flex gap-2">
        <button onClick={() => setTab('checklist')} className={`px-5 py-2.5 rounded-lg text-sm ${tab === 'checklist' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border'}`}>Checklist Fanpage</button>
        <button onClick={() => { setTab('library'); setActiveFolderId(null); }} className={`px-5 py-2.5 rounded-lg text-sm ${tab === 'library' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border'}`}>Thư Viện Media</button>
      </div>

      {tab === 'checklist' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddFanpage(true)} className="bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-700 flex items-center gap-2"><Plus className="w-5 h-5"/> Thêm Fanpage Mới</button>
          
          {showAddFanpage && (
            <div className="bg-white rounded-xl p-6 border-2 border-teal-200 shadow-sm">
              <input value={fanpageForm.name} onChange={e => setFanpageForm({ ...fanpageForm, name: e.target.value })} placeholder="Tên Fanpage *" className="w-full border p-3 rounded-xl mb-3 focus:ring-2 focus:ring-teal-500 outline-none" />
              <input value={fanpageForm.url} onChange={e => setFanpageForm({ ...fanpageForm, url: e.target.value })} placeholder="Link URL" className="w-full border p-3 rounded-xl mb-3 focus:ring-2 focus:ring-teal-500 outline-none" />
              <div className="flex gap-2"><button onClick={addFanpage} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl">Lưu Fanpage</button><button onClick={() => setShowAddFanpage(false)} className="bg-gray-100 px-6 py-2.5 rounded-xl">Hủy</button></div>
            </div>
          )}

          {fanpages.map(fp => (
            <div key={fp.id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg" onClick={() => toggleExpandFanpage(fp.id)}>
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-teal-600" />
                  <div>
                    <h3 className="font-bold text-gray-800">{fp.name}</h3>
                    {fp.url && <a href={fp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">{fp.url}</a>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteFanpage(fp.id); }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
              </div>
              {expandedFanpages.has(fp.id) && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  {fp.items.map((item) => (
                    <div key={item.id} className={`flex gap-3 items-center border p-3 rounded-lg transition-colors ${item.checked ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}>
                      <button onClick={() => toggleCheckItem(fp.id, item.id)}>
                        {item.checked ? <Check className="w-6 h-6 text-green-500" /> : <Square className="w-6 h-6 text-gray-300" />}
                      </button>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.label}</span>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'library' && !activeFolderId && (
        <div className="space-y-4">
          <button onClick={() => setShowAddFolder(true)} className="bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-700 flex items-center gap-2"><FolderPlus className="w-5 h-5"/> Thêm Thư Mục</button>
          
          {showAddFolder && (
            <div className="bg-white rounded-xl p-6 border-2 border-teal-200">
              <input value={folderForm.name} onChange={e => setFolderForm({ ...folderForm, name: e.target.value })} placeholder="Tên thư mục *" className="w-full border p-3 rounded-xl mb-3 focus:ring-2 focus:ring-teal-500 outline-none" />
              <div className="flex gap-2"><button onClick={addFolder} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl">Lưu thư mục</button><button onClick={() => setShowAddFolder(false)} className="bg-gray-100 px-6 py-2.5 rounded-xl">Hủy</button></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {folders.map(folder => (
              <div key={folder.id} className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-teal-300 transition-all relative group" onClick={() => setActiveFolderId(folder.id)}>
                <div className="text-3xl mb-3">{folder.icon}</div>
                <h3 className="font-bold text-gray-800">{folder.name}</h3>
                <p className="text-sm text-gray-500">{folder.items.length} tài nguyên</p>
                <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'library' && activeFolderId && activeFolder && (
        <div className="space-y-4">
          <button onClick={() => setActiveFolderId(null)} className="text-gray-500 mb-2 inline-flex items-center gap-2 hover:text-teal-600"><ChevronRight className="w-4 h-4 rotate-180"/> Quay lại danh sách thư mục</button>
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">{activeFolder.icon} {activeFolder.name}</h3>
            <button onClick={() => { setShowAddItem(true); setEditingItem(null); setItemForm({ name: '', type: 'image', link: '', description: '' }); }} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl hover:bg-teal-700 flex items-center gap-2"><Plus className="w-5 h-5"/> Thêm File</button>
          </div>

          {showAddItem && (
            <div className="bg-white rounded-xl p-6 border-2 border-teal-200">
              <h3 className="font-bold mb-4">{editingItem ? 'Sửa File' : 'Thêm File Mới'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Tên file *" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />
                <select value={itemForm.type} onChange={e => setItemForm({ ...itemForm, type: e.target.value as MediaItem['type'] })} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                  {MEDIA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input value={itemForm.link} onChange={e => setItemForm({ ...itemForm, link: e.target.value })} placeholder="Link tải (Google Drive, Youtube...)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none md:col-span-2" />
                <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Ghi chú" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none md:col-span-2" rows={2} />
              </div>
              <div className="flex gap-2"><button onClick={addMediaItem} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl">{editingItem ? 'Lưu thay đổi' : 'Thêm'}</button><button onClick={() => setShowAddItem(false)} className="bg-gray-100 px-6 py-2.5 rounded-xl">Hủy</button></div>
            </div>
          )}

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr><th className="p-4 text-xs font-bold text-gray-600 uppercase">Tên tài nguyên</th><th className="p-4 text-xs font-bold text-gray-600 uppercase">Loại</th><th className="p-4 text-xs font-bold text-gray-600 uppercase">Link</th><th className="p-4 text-center text-xs font-bold text-gray-600 uppercase">Thao tác</th></tr>
              </thead>
              <tbody>
                {activeFolder.items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="p-4 text-sm text-gray-600">{MEDIA_TYPES.find(m => m.value === item.type)?.label}</td>
                    <td className="p-4 text-sm">
                      {item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><LinkIcon className="w-4 h-4"/> Xem link</a> : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => { setEditingItem(item.id); setItemForm({ name: item.name, type: item.type, link: item.link, description: item.description }); setShowAddItem(true); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><Edit3 className="w-4 h-4"/></button>
                      <button onClick={() => confirm('Xóa file này?') && deleteMediaItem(activeFolder.id, item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeFolder.items.length === 0 && <div className="p-8 text-center text-gray-400">Thư mục chưa có tài nguyên nào.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
