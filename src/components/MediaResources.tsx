import { useState, useCallback } from 'react';
import type { Fanpage, FanpageCheckItem, ContentAd } from '../types';
import { getFanpages, saveFanpages, getContentAds, saveContentAds } from '../store';
import { v4 as uuid } from 'uuid';
import {
  Plus, Trash2, Image, Film, FileText, ExternalLink, Square, Check,
  ChevronDown, ChevronRight, Globe, Edit3, X, Info
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
    subItems: [
      'Vị trí',
      'Số điện thoại',
      'Email',
      'Thời gian mở cửa',
      'Nút hành động',
      'Hạng mục',
    ],
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
    subItems: [
      'Instagram',
      'Youtube',
      'Mạng xã hội khác',
    ],
  },
  {
    label: 'Sắp xếp thứ tự Tab và cập nhật thông tin ở từng Tab',
    icon: '📋',
    description: 'Thiết lập các Tab hiển thị trên Fanpage theo thứ tự phù hợp.',
    subItems: [
      'Menu',
      'Ảnh',
      'Video',
      'Đánh giá',
      'Sự kiện',
      'Giới thiệu',
      'Cộng đồng',
    ],
  },
  {
    label: 'Thiết lập hộp thư',
    icon: '💬',
    description: 'Cài đặt hệ thống tin nhắn tự động trên Fanpage.',
    subItems: [
      'Tin nhắn chào mừng',
      'Tin trả lời nhanh (Phản hồi tin nhắn đầu tiên mà ai đó gửi cho Fanpage)',
      'Tin nhắn vắng mặt',
    ],
  },
  {
    label: 'Chữ ký trong các bài post',
    icon: '✍️',
    description: 'Tiêu chuẩn: mô tả công ty, trụ sở, website, email, hotline.',
  },
];

const AD_ANGLES = [
  'Angle Tiện Lợi',
  'Angle Tiết Kiệm',
  'Angle Chất Lượng',
  'Angle Khuyến Mãi',
  'Angle Đánh Giá / Review',
  'Angle So Sánh',
  'Angle Câu Chuyện',
  'Angle Khác',
];

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

export function MediaResources({ projectId }: Props) {
  const [tab, setTab] = useState<'checklist' | 'content'>('checklist');

  // ===== FANPAGE STATE =====
  const [fanpages, setFanpages] = useState<Fanpage[]>(() => getFanpages(projectId));
  const [showAddFanpage, setShowAddFanpage] = useState(false);
  const [fanpageForm, setFanpageForm] = useState({ name: '', url: '' });
  const [expandedFanpages, setExpandedFanpages] = useState<Set<string>>(new Set());
  const [editingFanpage, setEditingFanpage] = useState<string | null>(null);
  const [editFanpageForm, setEditFanpageForm] = useState({ name: '', url: '' });
  const [newItemLabels, setNewItemLabels] = useState<Record<string, string>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const persistFanpages = useCallback((items: Fanpage[]) => {
    setFanpages(items);
    saveFanpages(projectId, items);
  }, [projectId]);

  const addFanpage = () => {
    if (!fanpageForm.name.trim()) return;
    const newFanpage: Fanpage = {
      id: uuid(),
      projectId,
      name: fanpageForm.name.trim(),
      url: fanpageForm.url.trim(),
      createdAt: new Date().toISOString(),
      items: createDefaultChecklistItems(),
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCheckItem = (fanpageId: string, itemId: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId
        ? {
            ...f,
            items: f.items.map(i => {
              if (i.id !== itemId) return i;
              const newChecked = !i.checked;
              return {
                ...i,
                checked: newChecked,
                subItems: i.subItems
                  ? i.subItems.map(sub => ({ ...sub, checked: newChecked }))
                  : undefined,
              };
            }),
          }
        : f
    ));
  };

  const toggleSubItem = (fanpageId: string, itemId: string, subItemId: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId
        ? {
            ...f,
            items: f.items.map(i => {
              if (i.id !== itemId || !i.subItems) return i;
              const newSubItems = i.subItems.map(sub =>
                sub.id === subItemId ? { ...sub, checked: !sub.checked } : sub
              );
              const allChecked = newSubItems.every(sub => sub.checked);
              return { ...i, subItems: newSubItems, checked: allChecked };
            }),
          }
        : f
    ));
  };

  const updateItemNotes = (fanpageId: string, itemId: string, notes: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId
        ? { ...f, items: f.items.map(i => i.id === itemId ? { ...i, notes } : i) }
        : f
    ));
  };

  const deleteCheckItem = (fanpageId: string, itemId: string) => {
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId
        ? { ...f, items: f.items.filter(i => i.id !== itemId) }
        : f
    ));
  };

  const addCheckItem = (fanpageId: string) => {
    const label = (newItemLabels[fanpageId] || '').trim();
    if (!label) return;
    persistFanpages(fanpages.map(f =>
      f.id === fanpageId
        ? {
            ...f,
            items: [
              ...f.items,
              { id: uuid(), label, description: '', checked: false, notes: '' },
            ],
          }
        : f
    ));
    setNewItemLabels(prev => ({ ...prev, [fanpageId]: '' }));
  };

  // ===== CONTENT ADS STATE =====
  const [ads, setAds] = useState<ContentAd[]>(() => getContentAds(projectId));
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<Omit<ContentAd, 'id' | 'projectId'>>({
    angle: AD_ANGLES[0],
    caption: '',
    mediaLink: '',
    type: 'caption',
    notes: '',
  });
  const [filterAngle, setFilterAngle] = useState<string>('all');

  const persistAds = useCallback((items: ContentAd[]) => {
    setAds(items);
    saveContentAds(projectId, items);
  }, [projectId]);

  const addAd = () => {
    if (!adForm.caption.trim() && !adForm.mediaLink.trim()) return;
    if (editingAd) {
      persistAds(ads.map(a => a.id === editingAd ? { ...a, ...adForm } : a));
      setEditingAd(null);
    } else {
      persistAds([...ads, { id: uuid(), projectId, ...adForm }]);
    }
    setAdForm({ angle: AD_ANGLES[0], caption: '', mediaLink: '', type: 'caption', notes: '' });
    setShowAdForm(false);
  };

  const startEditAd = (ad: ContentAd) => {
    setEditingAd(ad.id);
    setAdForm({ angle: ad.angle, caption: ad.caption, mediaLink: ad.mediaLink, type: ad.type, notes: ad.notes });
    setShowAdForm(true);
  };

  // Stats
  const totalFanpages = fanpages.length;
  const totalItems = fanpages.reduce((s, f) => s + f.items.length, 0);
  const totalChecked = fanpages.reduce((s, f) => s + f.items.filter(i => i.checked).length, 0);
  const overallProgress = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const filteredAds = filterAngle === 'all' ? ads : ads.filter(a => a.angle === filterAngle);

  const getItemIcon = (label: string) => {
    const item = DEFAULT_CHECKLIST_ITEMS.find(d => d.label === label);
    return item ? item.icon : '📋';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Tài Nguyên Media</h2>
        <p className="text-gray-500 text-sm mt-1">Quản lý Fanpage & Thư viện Content Ads</p>
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
          onClick={() => setTab('content')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'content'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Image className="w-4 h-4" /> Thư Viện Content Ads
          {ads.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              tab === 'content' ? 'bg-white/20' : 'bg-teal-50 text-teal-700'
            }`}>{ads.length}</span>
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
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    overallProgress === 100
                      ? 'bg-gradient-to-r from-green-400 to-green-600'
                      : 'bg-gradient-to-r from-teal-400 to-teal-600'
                  }`}
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Add Fanpage Button */}
          {!showAddFanpage ? (
            <button
              onClick={() => setShowAddFanpage(true)}
              className="flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" /> Thêm Fanpage Mới
            </button>
          ) : (
            <div className="bg-white rounded-xl p-6 border-2 border-teal-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" /> Thêm Fanpage Mới
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Tên Fanpage <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={fanpageForm.name}
                    onChange={e => setFanpageForm({ ...fanpageForm, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && addFanpage()}
                    placeholder="VD: Fanpage Máy Bơm ABC"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Link Fanpage
                  </label>
                  <input
                    value={fanpageForm.url}
                    onChange={e => setFanpageForm({ ...fanpageForm, url: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && addFanpage()}
                    placeholder="https://facebook.com/fanpage..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                💡 Khi thêm Fanpage, hệ thống sẽ tự động tạo {DEFAULT_CHECKLIST_ITEMS.length} mục checklist tối ưu Fanpage
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={addFanpage} className="bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 font-medium transition-colors">
                  Thêm Fanpage
                </button>
                <button onClick={() => { setShowAddFanpage(false); setFanpageForm({ name: '', url: '' }); }} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Fanpage List */}
          {fanpages.length === 0 && !showAddFanpage && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Globe className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <p className="text-lg text-gray-500 font-medium">Chưa có Fanpage nào</p>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                Thêm Fanpage để hệ thống tự động tạo checklist các đầu mục cần tối ưu
                (Ảnh bìa, Avatar, Mô tả, Nút hành động, Hộp thư...)
              </p>
              <button
                onClick={() => setShowAddFanpage(true)}
                className="mt-6 flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-all mx-auto"
              >
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
              <div key={fp.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                isComplete ? 'border-green-200' : 'border-gray-100'
              }`}>
                {/* Fanpage Header */}
                <div
                  className={`px-5 py-4 cursor-pointer select-none transition-colors ${
                    isComplete
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                      : isExpanded
                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50'
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleExpandFanpage(fp.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                    )}

                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isComplete ? 'bg-green-100' : 'bg-teal-100'
                    }`}>
                      {isComplete ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Globe className="w-5 h-5 text-teal-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingFanpage === fp.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            value={editFanpageForm.name}
                            onChange={e => setEditFanpageForm({ ...editFanpageForm, name: e.target.value })}
                            className="border border-teal-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            autoFocus
                          />
                          <input
                            value={editFanpageForm.url}
                            onChange={e => setEditFanpageForm({ ...editFanpageForm, url: e.target.value })}
                            placeholder="Link..."
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none flex-1"
                          />
                          <button onClick={() => saveEditFanpage(fp.id)} className="text-teal-600 hover:text-teal-800">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={() => setEditingFanpage(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800 truncate">{fp.name}</h3>
                            {fp.url && (
                              <a
                                href={fp.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-blue-500 hover:text-blue-700 shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {isComplete && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Hoàn thành</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Tạo {new Date(fp.createdAt).toLocaleDateString('vi-VN')} · {totalCount} mục kiểm tra
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-teal-600'}`}>
                          {checkedCount}/{totalCount}
                        </p>
                        <p className="text-xs text-gray-400">{progress}%</p>
                      </div>
                      <div className="w-12 h-12 hidden sm:block">
                        <svg viewBox="0 0 36 36" className="w-full h-full">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={isComplete ? '#22c55e' : '#0d9488'}
                            strokeWidth="3"
                            strokeDasharray={`${progress}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => startEditFanpage(fp)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFanpage(fp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mini progress bar on header */}
                  <div className="mt-3 ml-14">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-green-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded: Checklist Items */}
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
                          <div
                            key={item.id}
                            className={`rounded-xl transition-all border ${
                              item.checked
                                ? 'bg-green-50/70 border-green-200'
                                : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-white'
                            }`}
                          >
                            {/* Main item row */}
                            <div className="flex items-start gap-3 px-4 py-3.5">
                              {/* Number */}
                              <span className="text-xs text-gray-400 font-mono mt-1.5 w-5 text-right shrink-0 font-bold">
                                {idx + 1}
                              </span>

                              {/* Checkbox */}
                              <button onClick={() => toggleCheckItem(fp.id, item.id)} className="mt-1 shrink-0">
                                {item.checked ? (
                                  <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center shadow-sm">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <Square className="w-6 h-6 text-gray-300 hover:text-teal-500 transition-colors" />
                                )}
                              </button>

                              {/* Icon */}
                              <span className="text-lg mt-0.5 shrink-0">{getItemIcon(item.label)}</span>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-sm font-semibold ${
                                    item.checked ? 'line-through text-gray-400' : 'text-gray-800'
                                  }`}>
                                    {item.label}
                                  </p>
                                  {hasSubItems && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                      subCheckedCount === subTotalCount
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {subCheckedCount}/{subTotalCount}
                                    </span>
                                  )}
                                </div>

                                {/* Description toggle */}
                                {item.description && (
                                  <button
                                    onClick={() => toggleDescription(descKey)}
                                    className="flex items-center gap-1 mt-1 text-xs text-teal-600 hover:text-teal-800 transition-colors"
                                  >
                                    <Info className="w-3 h-3" />
                                    {isDescExpanded ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn'}
                                    {isDescExpanded ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </button>
                                )}

                                {/* Description content */}
                                {isDescExpanded && item.description && (
                                  <div className="mt-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                      💡 {item.description}
                                    </p>
                                  </div>
                                )}

                                {/* Sub-items */}
                                {hasSubItems && (
                                  <div className="mt-2.5 space-y-1.5 ml-1">
                                    {item.subItems!.map(sub => (
                                      <div
                                        key={sub.id}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                                          sub.checked
                                            ? 'bg-green-100/60 border border-green-200'
                                            : 'bg-white border border-gray-100 hover:border-teal-200'
                                        }`}
                                        onClick={() => toggleSubItem(fp.id, item.id, sub.id)}
                                      >
                                        {sub.checked ? (
                                          <div className="w-4.5 h-4.5 bg-green-500 rounded flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <Square className="w-4 h-4 text-gray-300 shrink-0" />
                                        )}
                                        <span className={`text-xs ${
                                          sub.checked ? 'line-through text-gray-400' : 'text-gray-600'
                                        }`}>
                                          {sub.label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Notes input */}
                                <input
                                  value={item.notes}
                                  onChange={e => updateItemNotes(fp.id, item.id, e.target.value)}
                                  placeholder="Ghi chú, trạng thái, link tham khảo..."
                                  className="w-full text-xs text-gray-500 mt-2 bg-transparent border-none outline-none placeholder-gray-300"
                                />
                              </div>

                              {/* Delete */}
                              <button
                                onClick={() => deleteCheckItem(fp.id, item.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add custom item */}
                      <div className="flex gap-2 mt-3 px-4">
                        <input
                          value={newItemLabels[fp.id] || ''}
                          onChange={e => setNewItemLabels(prev => ({ ...prev, [fp.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addCheckItem(fp.id)}
                          placeholder="Thêm mục kiểm tra mới..."
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                        <button
                          onClick={() => addCheckItem(fp.id)}
                          className="bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== CONTENT ADS TAB ===== */}
      {tab === 'content' && (
        <div className="space-y-4">
          <button
            onClick={() => { setShowAdForm(!showAdForm); setEditingAd(null); setAdForm({ angle: AD_ANGLES[0], caption: '', mediaLink: '', type: 'caption', notes: '' }); }}
            className="flex items-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" /> Thêm Nội Dung
          </button>

          {showAdForm && (
            <div className="bg-white rounded-xl p-6 border-2 border-teal-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingAd ? '✏️ Sửa Nội Dung' : '➕ Thêm Nội Dung Mới'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Loại</label>
                  <select
                    value={adForm.type}
                    onChange={e => setAdForm({ ...adForm, type: e.target.value as 'caption' | 'video' })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option value="caption">📝 Caption / Mẫu bài viết</option>
                    <option value="video">🎥 Video / Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Angle quảng cáo</label>
                  <select
                    value={adForm.angle}
                    onChange={e => setAdForm({ ...adForm, angle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    {AD_ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {adForm.type === 'caption' ? 'Nội dung Caption' : 'Mô tả Video'}
                  </label>
                  <textarea
                    value={adForm.caption}
                    onChange={e => setAdForm({ ...adForm, caption: e.target.value })}
                    rows={4}
                    placeholder={adForm.type === 'caption' ? 'Nhập mẫu caption quảng cáo...' : 'Mô tả nội dung video...'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Link Media (Drive, YouTube,...)</label>
                  <input
                    value={adForm.mediaLink}
                    onChange={e => setAdForm({ ...adForm, mediaLink: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ghi chú</label>
                  <input
                    value={adForm.notes}
                    onChange={e => setAdForm({ ...adForm, notes: e.target.value })}
                    placeholder="Ghi chú thêm..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={addAd} className="bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 font-medium">
                  {editingAd ? 'Lưu Thay Đổi' : 'Thêm Nội Dung'}
                </button>
                <button
                  onClick={() => { setShowAdForm(false); setEditingAd(null); }}
                  className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Filter by angle */}
          {ads.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterAngle('all')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filterAngle === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả ({ads.length})
              </button>
              {Array.from(new Set(ads.map(a => a.angle))).map(angle => (
                <button
                  key={angle}
                  onClick={() => setFilterAngle(angle)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    filterAngle === angle ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  {angle} ({ads.filter(a => a.angle === angle).length})
                </button>
              ))}
            </div>
          )}

          {/* Content Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAds.map(ad => (
              <div key={ad.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {ad.type === 'caption' ? (
                        <FileText className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Film className="w-5 h-5 text-purple-500" />
                      )}
                      <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-1 rounded-full">{ad.angle}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditAd(ad)}
                        className="text-gray-300 hover:text-teal-600 transition-colors p-1"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => persistAds(ads.filter(a => a.id !== ad.id))}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3 line-clamp-6">{ad.caption}</p>
                  {ad.mediaLink && (
                    <a
                      href={ad.mediaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở link media
                    </a>
                  )}
                  {ad.notes && (
                    <p className="text-xs text-gray-400 mt-2">📝 {ad.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {ads.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Image className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <p className="text-lg text-gray-500 font-medium">Chưa có nội dung quảng cáo nào</p>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                Lưu trữ các mẫu Caption và link Video để sẵn sàng chạy ads
              </p>
            </div>
          )}

          {filteredAds.length === 0 && ads.length > 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">Không có nội dung nào cho angle này</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
