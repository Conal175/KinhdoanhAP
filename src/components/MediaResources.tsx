import { useState, useCallback } from 'react';
import type { Fanpage, FanpageCheckItem, MediaFolder, MediaItem } from '../types';
import { getFanpages, saveFanpages, getMediaFolders, saveMediaFolders } from '../store';
import { v4 as uuid } from 'uuid';
import {
  Plus, Trash2, Image, FileText, ExternalLink, Square, Check,
  ChevronDown, ChevronRight, Globe, Edit3, X, Info, FolderPlus,
  FolderOpen as FolderOpenIcon, Link2, Video, ImageIcon, MoreHorizontal
} from 'lucide-react';

interface Props {
  projectId: string;
}

interface ChecklistTemplate {
  label: string;
  icon: string;
  description: string;
  subItems?: string[];
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistTemplate[] = [
  {
    label: 'Tên Fanpage - URL Page',
    icon: '🌐',
    description: 'Ngắn gọn, gợi nhớ thương hiệu',
  },
  {
    label: 'Ảnh bìa (Cover)',
    icon: '🎨',
    description: 'Nội dung ảnh: 828x315 px. Nên thể hiện rõ sản phẩm/dịch vụ mà doanh nghiệp kinh doanh hoặc chương trình ưu đãi/event đang diễn ra. Với Fanpage bán hàng nên có thông tin liên hệ.',
  },
  {
    label: 'Avatar',
    icon: '🖼️',
    description: 'Kích thước lớn nhất: 2048px x 2048px. Kích thước nhỏ nhất: 168px x 168px. Sử dụng logo của doanh nghiệp.',
  },
  {
    label: 'Mô tả ngắn (Thông tin thêm - Giới thiệu)',
    icon: '📝',
    description: 'Thêm mô tả ngắn vào Trang để khách truy cập biết doanh nghiệp bạn cung cấp những loại hình dịch vụ nào. Phần mô tả cần ngắn gọn, không quá 255 ký tự.',
  },
  {
    label: 'Giới thiệu',
    icon: '📖',
    description: 'Trong phần Giới thiệu, bạn có thể thêm câu chuyện vào Trang. Câu chuyện có thể bao gồm những chi tiết như thời điểm thành lập doanh nghiệp, lĩnh vực hoạt động, sứ mệnh của doanh nghiệp và hơn thế nữa.',
  },
  {
    label: 'Nút hành động (CTA)',
    icon: '📲',
    description: 'Kêu gọi khách hàng mua hàng.',
  },
  {
    label: 'Thiết lập về lĩnh vực',
    icon: '🏷️',
    description: 'Tuỳ vào lĩnh vực kinh doanh của doanh nghiệp mà chọn Hạng mục có sẵn của Facebook.',
  },
  {
    label: 'Thông tin liên hệ',
    icon: '📞',
    description: 'Cập nhật đầy đủ các thông tin liên hệ của doanh nghiệp.',
    subItems: ['Vị trí', 'Số điện thoại', 'Email', 'Thời gian mở cửa', 'Nút hành động', 'Hạng mục'],
  },
  {
    label: 'Huy hiệu fan cứng',
    icon: '🏅',
    description: 'Tăng uy tín, tương tác cho trang.',
  },
  {
    label: 'Những ứng dụng và dịch vụ cần kết nối với Trang',
    icon: '🔗',
    description: 'Kết nối các nền tảng mạng xã hội khác với Fanpage.',
    subItems: ['Instagram', 'Youtube', 'Mạng xã hội khác'],
  },
  {
    label: 'Sắp xếp thứ tự Tab và cập nhật thông tin ở từng Tab',
    icon: '📋',
    description: 'Thiết lập các Tab hiển thị trên Fanpage theo thứ tự phù hợp.',
    subItems: ['Menu', 'Ảnh', 'Video', 'Đánh giá', 'Sự kiện', 'Giới thiệu', 'Cộng đồng'],
  },
  {
    label: 'Thiết lập hộp thư',
    icon: '💬',
    description: 'Cài đặt hệ thống tin nhắn tự động trên Fanpage.',
    subItems: ['Tin nhắn chào mừng', 'Tin trả lời nhanh (Phản hồi tin nhắn đầu tiên mà ai đó gửi cho Fanpage)', 'Tin nhắn vắng mặt'],
  },
  {
    label: 'Chữ ký trong các bài post',
    icon: '✍️',
    description: 'Tiêu chuẩn: mô tả công ty, trụ sở, website, email, hotline.',
  },
];

const FOLDER_COLORS = [
  { name: 'Xanh dương', value: 'blue' },
  { name: 'Xanh lá', value: 'green' },
  { name: 'Tím', value: 'purple' },
  { name: 'Cam', value: 'orange' },
  { name: 'Đỏ', value: 'red' },
  { name: 'Hồng', value: 'pink' },
  { name: 'Vàng', value: 'yellow' },
  { name: 'Teal', value: 'teal' },
];

const FOLDER_ICONS = ['📁', '📂', '🎬', '📸', '🎨', '📝', '🎥', '🖼️', '📋', '💡', '🔗', '⭐'];

const MEDIA_TYPES: { value: MediaItem['type']; label: string; icon: string }[] = [
  { value: 'image', label: 'Hình ảnh', icon: '🖼️' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'caption', label: 'Caption/Bài viết', icon: '📝' },
  { value: 'link', label: 'Link tham khảo', icon: '🔗' },
  { value: 'other', label: 'Khác', icon: '📎' },
];

function getColorClasses(color: string) {
  const map: Record<string, { bg: string; bgLight: string; text: string; border: string; badge: string }> = {
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
    green: { bg: 'bg-green-600', bgLight: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
    purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
    orange: { bg: 'bg-orange-600', bgLight: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
    red: { bg: 'bg-red-600', bgLight: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
    pink: { bg: 'bg-pink-600', bgLight: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700' },
    yellow: { bg: 'bg-yellow-600', bgLight: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
    teal: { bg: 'bg-teal-600', bgLight: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700' },
  };
  return map[color] || map.blue;
}

function createDefaultChecklistItems(): FanpageCheckItem[] {
  return DEFAULT_CHECKLIST_ITEMS.map(item => ({
    id: uuid(),
    label: item.label,
    description: item.description,
    checked: false,
    notes: '',
    subItems: item.subItems
      ? item.subItems.map(sub => ({ id: uuid(), label: sub, checked: false }))
      : undefined,
  }));
}

function createDefaultFolders(projectId: string): MediaFolder[] {
  return [
    {
      id: uuid(),
      projectId,
      name: 'Tổng hợp Media',
      icon: '📂',
      color: 'blue',
      isDefault: true,
      items: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      projectId,
      name: 'Media chạy Ads',
      icon: '🎬',
      color: 'orange',
      isDefault: true,
      items: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

export function MediaResources({ projectId }: Props) {
  const [tab, setTab] = useState<'checklist' | 'library'>('checklist');

  // ===== FANPAGE STATE =====
  const [fanpages, setFanpages] = useState<Fanpage[]>(() => getFanpages(projectId));
  const [showAddFanpage, setShowAddFanpage] = useState(false);
  const [fanpageForm, setFanpageForm] = useState({ name: '', url: '' });
  const [expandedFanpages, setExpandedFanpages] = useState<Set<string>>(new Set());
  const [editingFanpage, setEditingFanpage] = useState<string | null>(null);
  const [editFanpageForm, setEditFanpageForm] = useState({ name: '', url: '' });
  const [newItemLabels, setNewItemLabels] = useState<Record<string, string>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  // ===== MEDIA FOLDERS STATE =====
  const [folders, setFolders] = useState<MediaFolder[]>(() => {
    const stored = getMediaFolders(projectId);
    if (stored.length === 0) {
      const defaults = createDefaultFolders(projectId);
      saveMediaFolders(projectId, defaults);
      return defaults;
    }
    return stored;
  });
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: '', icon: '📁', color: 'blue' });
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderForm, setEditFolderForm] = useState({ name: '', icon: '📁', color: 'blue' });
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<Omit<MediaItem, 'id' | 'createdAt'>>({
    name: '', type: 'image', link: '', description: '',
  });

  // ===== FANPAGE FUNCTIONS =====
  const persistFanpages = useCallback((items: Fanpage[]) => {
    setFanpages(items);
    saveFanpages(projectId, items);
  }, [projectId]);

  const addFanpage = () => {
    if (!fanpageForm.name.trim()) return;
    const newFanpage: Fanpage = {
      id: uuid(), projectId, name: fanpageForm.name.trim(), url: fanpageForm.url.trim(),
      createdAt: new Date().toISOString(), items: createDefaultChecklistItems(),
    };
    const updated = [...fanpages, newFanpage];
    persistFanpages(updated);
    setFanpageForm({ name: '', url: '' });
    setShowAddFanpage(false);
    setExpandedFanpages(prev => new Set([...prev, newFanpage.id]));
  };

  const deleteFanpage = (id: string) => {
    if (!confirm('Xóa Fanpage này và toàn bộ checklist?')) return;
    persistFanpages(fanpages.filter(f => f.id !== id));
  };

  const startEditFanpage = (fp: Fanpage) => {
    setEditingFanpage(fp.id);
    setEditFanpageForm({ name: fp.name, url: fp.url });
  };

  const saveEditFanpage = (id: string) => {
    if (!editFanpageForm.name.trim()) return;
    persistFanpages(fanpages.map(f =>
      f.id === id ? { ...f, name: editFanpageForm.name.trim(), url: editFanpageForm.url.trim() } : f
    ));
    setEditingFanpage(null);
  };

  const toggleExpandFanpage = (id: string) => {
    setExpandedFanpages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCheckItem = (fanpageId: string, itemId: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId ? {
        ...f, items: f.items.map(i => {
          if (i.id !== itemId) return i;
          const newChecked = !i.checked;
          return { ...i, checked: newChecked, subItems: i.subItems ? i.subItems.map(sub => ({ ...sub, checked: newChecked })) : undefined };
        }),
      } : f
    ));
  };

  const toggleSubItem = (fanpageId: string, itemId: string, subItemId: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId ? {
        ...f, items: f.items.map(i => {
          if (i.id !== itemId || !i.subItems) return i;
          const newSubItems = i.subItems.map(sub => sub.id === subItemId ? { ...sub, checked: !sub.checked } : sub);
          const allChecked = newSubItems.every(sub => sub.checked);
          return { ...i, subItems: newSubItems, checked: allChecked };
        }),
      } : f
    ));
  };

  const updateItemNotes = (fanpageId: string, itemId: string, notes: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId ? { ...f, items: f.items.map(i => i.id === itemId ? { ...i, notes } : i) } : f
    ));
  };

  const deleteCheckItem = (fanpageId: string, itemId: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId ? { ...f, items: f.items.filter(i => i.id !== itemId) } : f
    ));
  };

  const addCheckItem = (fanpageId: string) => {
    const label = (newItemLabels[fanpageId] || '').trim();
    if (!label) return;
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId ? { ...f, items: [...f.items, { id: uuid(), label, description: '', checked: false, notes: '' }] } : f
    ));
    setNewItemLabels(prev => ({ ...prev, [fanpageId]: '' }));
  };

  // ===== MEDIA FOLDER FUNCTIONS =====
  const persistFolders = useCallback((items: MediaFolder[]) => {
    setFolders(items);
    saveMediaFolders(projectId, items);
  }, [projectId]);

  const addFolder = () => {
    if (!folderForm.name.trim()) return;
    const newFolder: MediaFolder = {
      id: uuid(), projectId, name: folderForm.name.trim(),
      icon: folderForm.icon, color: folderForm.color, isDefault: false,
      items: [], createdAt: new Date().toISOString(),
    };
    persistFolders([...folders, newFolder]);
    setFolderForm({ name: '', icon: '📁', color: 'blue' });
    setShowAddFolder(false);
  };

  const deleteFolder = (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder?.isDefault) {
      if (!confirm(`"${folder.name}" là thư mục mặc định. Bạn chỉ có thể xóa nội dung bên trong. Tiếp tục xóa toàn bộ nội dung?`)) return;
      persistFolders(folders.map(f => f.id === id ? { ...f, items: [] } : f));
    } else {
      if (!confirm(`Xóa thư mục "${folder?.name}" và toàn bộ ${folder?.items.length || 0} file bên trong?`)) return;
      persistFolders(folders.filter(f => f.id !== id));
      if (activeFolderId === id) setActiveFolderId(null);
    }
  };

  const startEditFolder = (folder: MediaFolder) => {
    setEditingFolder(folder.id);
    setEditFolderForm({ name: folder.name, icon: folder.icon, color: folder.color });
  };

  const saveEditFolder = (id: string) => {
    if (!editFolderForm.name.trim()) return;
    persistFolders(folders.map(f =>
      f.id === id ? { ...f, name: editFolderForm.name.trim(), icon: editFolderForm.icon, color: editFolderForm.color } : f
    ));
    setEditingFolder(null);
  };

  const addMediaItem = () => {
    if (!activeFolderId || (!itemForm.name.trim() && !itemForm.link.trim())) return;
    const newItem: MediaItem = {
      id: uuid(), ...itemForm, name: itemForm.name.trim(), link: itemForm.link.trim(),
      description: itemForm.description.trim(), createdAt: new Date().toISOString(),
    };
    if (editingItem) {
      persistFolders(folders.map(f =>
        f.id === activeFolderId ? { ...f, items: f.items.map(i => i.id === editingItem ? { ...newItem, id: editingItem, createdAt: i.createdAt } : i) } : f
      ));
      setEditingItem(null);
    } else {
      persistFolders(folders.map(f =>
        f.id === activeFolderId ? { ...f, items: [...f.items, newItem] } : f
      ));
    }
    setItemForm({ name: '', type: 'image', link: '', description: '' });
    setShowAddItem(false);
  };

  const startEditItem = (item: MediaItem) => {
    setEditingItem(item.id);
    setItemForm({ name: item.name, type: item.type, link: item.link, description: item.description });
    setShowAddItem(true);
  };

  const deleteMediaItem = (folderId: string, itemId: string) => {
    persistFolders(folders.map(f =>
      f.id === folderId ? { ...f, items: f.items.filter(i => i.id !== itemId) } : f
    ));
  };

  // Stats
  const totalFanpages = fanpages.length;
  const totalItems = fanpages.reduce((s, f) => s + f.items.length, 0);
  const totalChecked = fanpages.reduce((s, f) => s + f.items.filter(i => i.checked).length, 0);
  const overallProgress = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const activeFolder = folders.find(f => f.id === activeFolderId);
  const totalMediaItems = folders.reduce((s, f) => s + f.items.length, 0);

  const getItemIcon = (label: string) => {
    const item = DEFAULT_CHECKLIST_ITEMS.find(d => d.label === label);
    return item ? item.icon : '📋';
  };

  const getMediaTypeIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-green-500" />;
      case 'video': return <Video className="w-4 h-4 text-purple-500" />;
      case 'caption': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'link': return <Link2 className="w-4 h-4 text-orange-500" />;
      default: return <MoreHorizontal className="w-4 h-4 text-gray-500" />;
    }
  };



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Tài Nguyên Media</h2>
        <p className="text-gray-500 text-sm mt-1">Tối ưu Fanpage & Quản lý thư viện Media</p>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('checklist')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'checklist'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-4 h-4" /> Checklist Fanpage
          {totalFanpages > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              tab === 'checklist' ? 'bg-white/20' : 'bg-teal-50 text-teal-700'
            }`}>{totalFanpages}</span>
          )}
        </button>
        <button
          onClick={() => { setTab('library'); setActiveFolderId(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'library'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Image className="w-4 h-4" /> Thư Viện Media
          {totalMediaItems > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              tab === 'library' ? 'bg-white/20' : 'bg-teal-50 text-teal-700'
            }`}>{totalMediaItems}</span>
          )}
        </button>
      </div>

      {/* ===== CHECKLIST FANPAGE TAB ===== */}
      {tab === 'checklist' && (
        <div className="space-y-4">
          {/* Overall Progress */}
          {totalFanpages > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-700">Tổng quan hoàn thiện</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{totalFanpages} Fanpage · {totalItems} mục cần kiểm tra</p>
                </div>
                <span className={`text-lg font-bold ${overallProgress === 100 ? 'text-green-600' : 'text-teal-600'}`}>
                  {totalChecked}/{totalItems} ({overallProgress}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all duration-500 ${overallProgress === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-teal-400 to-teal-600'}`} style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          )}

          {/* Add Fanpage */}
          {!showAddFanpage ? (
            <button onClick={() => setShowAddFanpage(true)} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
              <Plus className="w-5 h-5" /> Thêm Fanpage Mới
            </button>
          ) : (
            <div className="bg-white rounded-xl p-6 border-2 border-teal-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" /> Thêm Fanpage Mới
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Tên Fanpage <span className="text-red-500">*</span></label>
                  <input value={fanpageForm.name} onChange={e => setFanpageForm({ ...fanpageForm, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addFanpage()} placeholder="VD: Fanpage Máy Bơm ABC" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Link Fanpage</label>
                  <input value={fanpageForm.url} onChange={e => setFanpageForm({ ...fanpageForm, url: e.target.value })} onKeyDown={e => e.key === 'Enter' && addFanpage()} placeholder="https://facebook.com/fanpage..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">💡 Khi thêm Fanpage, hệ thống sẽ tự động tạo {DEFAULT_CHECKLIST_ITEMS.length} mục checklist tối ưu Fanpage</p>
              <div className="flex gap-3 mt-4">
                <button onClick={addFanpage} className="bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 font-medium transition-colors">Thêm Fanpage</button>
                <button onClick={() => { setShowAddFanpage(false); setFanpageForm({ name: '', url: '' }); }} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
              </div>
            </div>
          )}

          {/* Fanpage List */}
          {fanpages.length === 0 && !showAddFanpage && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Globe className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <p className="text-lg text-gray-500 font-medium">Chưa có Fanpage nào</p>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">Thêm Fanpage để hệ thống tự động tạo checklist các đầu mục cần tối ưu</p>
              <button onClick={() => setShowAddFanpage(true)} className="mt-6 flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-all mx-auto">
                <Plus className="w-5 h-5" /> Thêm Fanpage Đầu Tiên
              </button>
            </div>
          )}

          {fanpages.map(fp => {
            const isExpanded = expandedFanpages.has(fp.id);
            const checkedCount = fp.items.filter(i => i.checked).length;
            const totalCount = fp.items.length;
            const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
            const isComplete = progress === 100 && totalCount > 0;

            return (
              <div key={fp.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${isComplete ? 'border-green-200' : 'border-gray-100'}`}>
                {/* Fanpage Header */}
                <div className={`px-5 py-4 cursor-pointer select-none transition-colors ${isComplete ? 'bg-gradient-to-r from-green-50 to-emerald-50' : isExpanded ? 'bg-gradient-to-r from-teal-50 to-cyan-50' : 'hover:bg-gray-50'}`} onClick={() => toggleExpandFanpage(fp.id)}>
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isComplete ? 'bg-green-100' : 'bg-teal-100'}`}>
                      <Globe className={`w-5 h-5 ${isComplete ? 'text-green-600' : 'text-teal-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingFanpage === fp.id ? (
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <input value={editFanpageForm.name} onChange={e => setEditFanpageForm({ ...editFanpageForm, name: e.target.value })} className="flex-1 border border-teal-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-teal-500" autoFocus />
                          <input value={editFanpageForm.url} onChange={e => setEditFanpageForm({ ...editFanpageForm, url: e.target.value })} placeholder="URL" className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none" />
                          <button onClick={() => saveEditFanpage(fp.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingFanpage(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800 truncate">{fp.name}</h3>
                            {isComplete && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Hoàn thành</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {fp.url && <a href={fp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[200px]" onClick={e => e.stopPropagation()}>{fp.url}</a>}
                            <span className="text-xs text-gray-400">{checkedCount}/{totalCount} mục</span>
                            <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-teal-600'}`}>{progress}%</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => startEditFanpage(fp)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Sửa"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteFanpage(fp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="mt-3 ml-14">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-teal-500'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Expanded Checklist */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="p-4 space-y-2">
                      {fp.items.map((item, idx) => {
                        const descKey = `${fp.id}-${item.id}`;
                        const isDescExpanded = expandedDescriptions.has(descKey);
                        const subCheckedCount = item.subItems?.filter(s => s.checked).length ?? 0;
                        const subTotalCount = item.subItems?.length ?? 0;
                        const hasSubItems = subTotalCount > 0;

                        return (
                          <div key={item.id} className={`rounded-xl transition-all border ${item.checked ? 'bg-green-50/70 border-green-200' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-white'}`}>
                            <div className="flex items-start gap-3 px-4 py-3.5">
                              <span className="text-xs text-gray-400 font-mono mt-1.5 w-5 text-right shrink-0 font-bold">{idx + 1}</span>
                              <button onClick={() => toggleCheckItem(fp.id, item.id)} className="mt-1 shrink-0">
                                {item.checked ? (
                                  <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center shadow-sm"><Check className="w-4 h-4 text-white" /></div>
                                ) : (
                                  <Square className="w-6 h-6 text-gray-300 hover:text-teal-500 transition-colors" />
                                )}
                              </button>
                              <span className="text-lg mt-0.5 shrink-0">{getItemIcon(item.label)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-sm font-semibold ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.label}</p>
                                  {hasSubItems && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${subCheckedCount === subTotalCount ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{subCheckedCount}/{subTotalCount}</span>
                                  )}
                                </div>
                                {item.description && (
                                  <button onClick={() => toggleDescription(descKey)} className="flex items-center gap-1 mt-1 text-xs text-teal-600 hover:text-teal-800 transition-colors">
                                    <Info className="w-3 h-3" /> {isDescExpanded ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn'}
                                    {isDescExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                )}
                                {isDescExpanded && item.description && (
                                  <div className="mt-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                                    <p className="text-xs text-blue-700 leading-relaxed">💡 {item.description}</p>
                                  </div>
                                )}
                                {hasSubItems && (
                                  <div className="mt-2.5 space-y-1.5 ml-1">
                                    {item.subItems!.map(sub => (
                                      <div key={sub.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${sub.checked ? 'bg-green-100/60 border border-green-200' : 'bg-white border border-gray-100 hover:border-teal-200'}`} onClick={() => toggleSubItem(fp.id, item.id, sub.id)}>
                                        {sub.checked ? (
                                          <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" /></div>
                                        ) : (
                                          <Square className="w-4 h-4 text-gray-300 shrink-0" />
                                        )}
                                        <span className={`text-xs ${sub.checked ? 'line-through text-gray-400' : 'text-gray-600'}`}>{sub.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <input value={item.notes} onChange={e => updateItemNotes(fp.id, item.id, e.target.value)} placeholder="Ghi chú, trạng thái, link tham khảo..." className="w-full text-xs text-gray-500 mt-2 bg-transparent border-none outline-none placeholder-gray-300" />
                              </div>
                              <button onClick={() => deleteCheckItem(fp.id, item.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-1"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 mt-3 px-4">
                        <input value={newItemLabels[fp.id] || ''} onChange={e => setNewItemLabels(prev => ({ ...prev, [fp.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addCheckItem(fp.id)} placeholder="Thêm mục kiểm tra mới..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                        <button onClick={() => addCheckItem(fp.id)} className="bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== THƯ VIỆN MEDIA TAB ===== */}
      {tab === 'library' && !activeFolderId && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Tổng thư mục</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{folders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Tổng tài nguyên</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{totalMediaItems}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-400 font-medium">Thư mục tùy chỉnh</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{folders.filter(f => !f.isDefault).length}</p>
            </div>
          </div>

          {/* Add Folder Button */}
          {!showAddFolder ? (
            <button onClick={() => setShowAddFolder(true)} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
              <FolderPlus className="w-5 h-5" /> Thêm Thư Mục Mới
            </button>
          ) : (
            <div className="bg-white rounded-xl p-6 border-2 border-teal-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-teal-600" /> Tạo Thư Mục Mới
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Tên thư mục <span className="text-red-500">*</span></label>
                  <input value={folderForm.name} onChange={e => setFolderForm({ ...folderForm, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addFolder()} placeholder="VD: Video quay thực tế, Ảnh sản phẩm..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" autoFocus />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Icon thư mục</label>
                    <div className="flex flex-wrap gap-2">
                      {FOLDER_ICONS.map(icon => (
                        <button key={icon} onClick={() => setFolderForm({ ...folderForm, icon })} className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${folderForm.icon === icon ? 'bg-teal-100 ring-2 ring-teal-500 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>{icon}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Màu thư mục</label>
                    <div className="flex flex-wrap gap-2">
                      {FOLDER_COLORS.map(c => (
                        <button key={c.value} onClick={() => setFolderForm({ ...folderForm, color: c.value })} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${folderForm.color === c.value ? `${getColorClasses(c.value).bg} text-white ring-2 ring-offset-1 ring-${c.value}-400 scale-105` : `${getColorClasses(c.value).bgLight} ${getColorClasses(c.value).text} hover:opacity-80`}`}>{c.name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={addFolder} className="bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 font-medium transition-colors">Tạo Thư Mục</button>
                <button onClick={() => { setShowAddFolder(false); setFolderForm({ name: '', icon: '📁', color: 'blue' }); }} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
              </div>
            </div>
          )}

          {/* Folder Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map(folder => {
              const colors = getColorClasses(folder.color);
              return (
                <div key={folder.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all group cursor-pointer ${colors.border}`}>
                  {/* Color strip */}
                  <div className={`h-1.5 ${colors.bg}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setActiveFolderId(folder.id)}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.bgLight}`}>
                          {folder.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingFolder === folder.id ? (
                            <div className="space-y-2" onClick={e => e.stopPropagation()}>
                              <input value={editFolderForm.name} onChange={e => setEditFolderForm({ ...editFolderForm, name: e.target.value })} className="w-full border border-teal-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-teal-500" autoFocus />
                              <div className="flex gap-2">
                                <div className="flex gap-1">
                                  {FOLDER_ICONS.slice(0, 6).map(icon => (
                                    <button key={icon} onClick={() => setEditFolderForm({ ...editFolderForm, icon })} className={`w-7 h-7 rounded text-sm flex items-center justify-center ${editFolderForm.icon === icon ? 'bg-teal-100 ring-1 ring-teal-400' : 'bg-gray-50 hover:bg-gray-100'}`}>{icon}</button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => saveEditFolder(folder.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingFolder(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-bold text-gray-800 truncate group-hover:text-teal-700 transition-colors">{folder.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{folder.items.length} tài nguyên</span>
                                {folder.isDefault && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Mặc định</span>}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {editingFolder !== folder.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => startEditFolder(folder)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteFolder(folder.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>

                    {/* Preview of items */}
                    {folder.items.length > 0 ? (
                      <div className="space-y-1.5" onClick={() => setActiveFolderId(folder.id)}>
                        {folder.items.slice(0, 3).map(item => (
                          <div key={item.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg">
                            {getMediaTypeIcon(item.type)}
                            <span className="text-xs text-gray-600 truncate flex-1">{item.name}</span>
                          </div>
                        ))}
                        {folder.items.length > 3 && (
                          <p className="text-xs text-gray-400 text-center py-1">+{folder.items.length - 3} tài nguyên khác</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-lg" onClick={() => setActiveFolderId(folder.id)}>
                        <FolderOpenIcon className="w-8 h-8 mx-auto text-gray-200 mb-1" />
                        <p className="text-xs text-gray-400">Chưa có tài nguyên</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Folder Card */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
              onClick={() => setShowAddFolder(true)}
            >
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-teal-100 rounded-xl flex items-center justify-center mb-3 transition-colors">
                <FolderPlus className="w-6 h-6 text-gray-400 group-hover:text-teal-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 group-hover:text-teal-600 font-medium transition-colors">Thêm Thư Mục</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== INSIDE A FOLDER ===== */}
      {tab === 'library' && activeFolderId && activeFolder && (() => {
        const colors = getColorClasses(activeFolder.color);
        return (
          <div className="space-y-5">
            {/* Breadcrumb + Back */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => { setActiveFolderId(null); setShowAddItem(false); setEditingItem(null); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-teal-300">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Tất cả thư mục
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeFolder.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{activeFolder.name}</h3>
                    <p className="text-xs text-gray-400">{activeFolder.items.length} tài nguyên</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setShowAddItem(true); setEditingItem(null); setItemForm({ name: '', type: 'image', link: '', description: '' }); }}
                className={`flex items-center gap-2 ${colors.bg} text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm`}
              >
                <Plus className="w-5 h-5" /> Thêm Tài Nguyên
              </button>
            </div>

            {/* Add/Edit Item Form */}
            {showAddItem && (
              <div className={`bg-white rounded-xl p-6 border-2 shadow-sm ${colors.border}`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {editingItem ? '✏️ Sửa Tài Nguyên' : '➕ Thêm Tài Nguyên Mới'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Tên tài nguyên <span className="text-red-500">*</span></label>
                    <input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="VD: Video review sản phẩm, Ảnh bìa mẫu 1..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Loại tài nguyên</label>
                    <select value={itemForm.type} onChange={e => setItemForm({ ...itemForm, type: e.target.value as MediaItem['type'] })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none">
                      {MEDIA_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Link tài nguyên (Drive, YouTube, Canva...)</label>
                    <input value={itemForm.link} onChange={e => setItemForm({ ...itemForm, link: e.target.value })} placeholder="https://drive.google.com/..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Mô tả / Ghi chú</label>
                    <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} rows={3} placeholder="Mô tả nội dung, ghi chú sử dụng..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={addMediaItem} className={`${colors.bg} text-white px-6 py-2.5 rounded-lg hover:opacity-90 font-medium transition-all`}>{editingItem ? 'Lưu Thay Đổi' : 'Thêm Tài Nguyên'}</button>
                  <button onClick={() => { setShowAddItem(false); setEditingItem(null); setItemForm({ name: '', type: 'image', link: '', description: '' }); }} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
                </div>
              </div>
            )}

            {/* Items List */}
            {activeFolder.items.length === 0 && !showAddItem ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <FolderOpenIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <p className="text-lg text-gray-500 font-medium">Thư mục trống</p>
                <p className="text-sm text-gray-400 mt-2">Thêm tài nguyên media vào thư mục này</p>
                <button
                  onClick={() => { setShowAddItem(true); setEditingItem(null); setItemForm({ name: '', type: 'image', link: '', description: '' }); }}
                  className={`mt-6 flex items-center gap-2 ${colors.bg} text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all mx-auto`}
                >
                  <Plus className="w-5 h-5" /> Thêm Tài Nguyên Đầu Tiên
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Filter by type */}
                {activeFolder.items.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 self-center mr-1">Loại:</span>
                    {Array.from(new Set(activeFolder.items.map(i => i.type))).map(type => {
                      const mt = MEDIA_TYPES.find(m => m.value === type);
                      const count = activeFolder.items.filter(i => i.type === type).length;
                      return (
                        <span key={type} className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                          {mt?.icon} {mt?.label} ({count})
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Items Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`${colors.bgLight}`}>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 w-10">#</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Loại</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Tên tài nguyên</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Mô tả</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Link</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Ngày thêm</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 w-20">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {activeFolder.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                                {getMediaTypeIcon(item.type)}
                                <span className="hidden sm:inline">{MEDIA_TYPES.find(m => m.value === item.type)?.label}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {item.link ? (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className={`text-sm font-medium ${colors.text} hover:underline flex items-center gap-1`}>
                                  {item.name}
                                  <ExternalLink className="w-3 h-3 opacity-50" />
                                </a>
                              ) : (
                                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-500 max-w-xs truncate">{item.description || '-'}</p>
                            </td>
                            <td className="px-4 py-3">
                              {item.link ? (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{(() => { try { return new URL(item.link).hostname; } catch { return 'Link'; } })()}</span>
                                </a>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => startEditItem(item)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteMediaItem(activeFolder.id, item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
