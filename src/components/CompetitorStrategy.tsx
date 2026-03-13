import { useState } from 'react';
import type { Competitor } from '../types';
import { getCompetitors, saveCompetitors } from '../store';
import { v4 as uuid } from 'uuid';
import { Plus, Edit2, Trash2, Save, X, Swords, ExternalLink, ArrowLeft, Link2 } from 'lucide-react';

interface Props {
  projectId: string;
  onBack: () => void;
}

export function CompetitorStrategy({ projectId, onBack }: Props) {
  const [competitors, setCompetitors] = useState<Competitor[]>(() => getCompetitors(projectId));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fanpageName: '',
    adLinks: '', // Multiple links, each on new line
    productPrice: '',
    specs: '',
    salesPolicy: '',
    mediaFormat: '',
    weaknesses: '',
    strategy: '',
  });

  const persist = (data: Competitor[]) => {
    setCompetitors(data);
    saveCompetitors(projectId, data);
  };

  const resetForm = () => {
    setForm({
      fanpageName: '',
      adLinks: '',
      productPrice: '',
      specs: '',
      salesPolicy: '',
      mediaFormat: '',
      weaknesses: '',
      strategy: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.fanpageName.trim()) return;
    if (editingId) {
      persist(competitors.map(c => c.id === editingId ? { ...c, ...form } : c));
    } else {
      persist([...competitors, { id: uuid(), projectId, ...form }]);
    }
    resetForm();
  };

  const handleEdit = (c: Competitor) => {
    setForm({
      fanpageName: c.fanpageName,
      adLinks: c.adLinks,
      productPrice: c.productPrice,
      specs: c.specs,
      salesPolicy: c.salesPolicy,
      mediaFormat: c.mediaFormat,
      weaknesses: c.weaknesses,
      strategy: c.strategy,
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xóa đối thủ này?')) {
      persist(competitors.filter(c => c.id !== id));
    }
  };

  // Parse multiple links from string (each link on new line)
  const parseLinks = (linksString: string): string[] => {
    return linksString
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
  };

  // Count total links across all competitors
  const totalLinks = competitors.reduce((sum, c) => sum + parseLinks(c.adLinks).length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tình Báo Đối Thủ</h1>
              <p className="text-sm text-gray-500">Phân tích đối thủ cạnh tranh và chiến lược ứng phó</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2.5 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-md"
        >
          <Plus className="w-5 h-5" /> Thêm đối thủ
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Swords className="w-6 h-6 text-red-500" />
              {editingId ? 'Sửa thông tin đối thủ' : 'Thêm đối thủ mới'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên Fanpage đối thủ *</label>
                <input
                  value={form.fanpageName}
                  onChange={e => setForm({ ...form, fanpageName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: Shop ABC Official"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-blue-500" />
                    Link bài quảng cáo (mỗi link 1 dòng)
                  </span>
                </label>
                <textarea
                  value={form.adLinks}
                  onChange={e => setForm({ ...form, adLinks: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm"
                  placeholder={"https://facebook.com/ads/1\nhttps://facebook.com/ads/2\nhttps://facebook.com/ads/3"}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Nhập mỗi link trên 1 dòng riêng biệt
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sản phẩm & Mức giá</label>
                <textarea
                  value={form.productPrice}
                  onChange={e => setForm({ ...form, productPrice: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: Máy bơm XYZ - 2.500.000đ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Thông số kỹ thuật cam kết</label>
                <textarea
                  value={form.specs}
                  onChange={e => setForm({ ...form, specs: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: 500W, 30L/phút..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chính sách bán hàng & Ưu đãi</label>
                <textarea
                  value={form.salesPolicy}
                  onChange={e => setForm({ ...form, salesPolicy: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: Bảo hành 2 năm, freeship..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Định dạng Media sử dụng</label>
                <input
                  value={form.mediaFormat}
                  onChange={e => setForm({ ...form, mediaFormat: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: Video, Carousel, Reel..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-red-700 mb-1.5">⚠️ Điểm yếu của đối thủ</label>
                <textarea
                  value={form.weaknesses}
                  onChange={e => setForm({ ...form, weaknesses: e.target.value })}
                  rows={2}
                  className="w-full border border-red-200 bg-red-50/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: Bảo hành ngắn, giá cao, review xấu..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-green-700 mb-1.5">✅ Chiến lược ứng phó của mình</label>
                <textarea
                  value={form.strategy}
                  onChange={e => setForm({ ...form, strategy: e.target.value })}
                  rows={2}
                  className="w-full border border-green-200 bg-green-50/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="VD: Đẩy mạnh bảo hành 5 năm, tặng kèm phụ kiện..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-rose-700 font-medium"
              >
                <Save className="w-5 h-5" /> {editingId ? 'Cập nhật' : 'Lưu đối thủ'}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competitors Table */}
      {competitors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Swords className="w-10 h-10 text-red-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có đối thủ nào</h3>
          <p className="text-gray-500 mb-6">Thêm đối thủ để phân tích và xây dựng chiến lược</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            <Plus className="w-5 h-5" /> Thêm đối thủ
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider w-10">#</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider min-w-[150px]">Fanpage đối thủ</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider min-w-[180px]">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Link QC thực tế
                    </span>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider min-w-[150px]">SP & Mức giá</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider min-w-[130px]">Thông số KT</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider min-w-[140px]">CS bán hàng & Ưu đãi</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider min-w-[100px]">Media</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-red-800 uppercase tracking-wider min-w-[150px] bg-red-100">Điểm yếu</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-800 uppercase tracking-wider min-w-[150px] bg-green-50">Chiến lược ứng phó</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-red-800 uppercase tracking-wider w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {competitors.map((c, idx) => {
                  const links = parseLinks(c.adLinks);
                  return (
                    <tr key={c.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">{c.fanpageName}</div>
                      </td>
                      <td className="px-4 py-4">
                        {links.length > 0 ? (
                          <div className="space-y-1.5">
                            {links.map((link, linkIdx) => {
                              const href = link.startsWith('http') ? link : `https://${link}`;
                              // Shorten display text
                              let displayText = link;
                              try {
                                const url = new URL(href);
                                displayText = url.hostname + (url.pathname !== '/' ? url.pathname.slice(0, 20) + '...' : '');
                              } catch {
                                displayText = link.slice(0, 30) + (link.length > 30 ? '...' : '');
                              }
                              return (
                                <a
                                  key={linkIdx}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline text-sm group"
                                >
                                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                                  <span className="truncate max-w-[140px]" title={link}>
                                    {displayText}
                                  </span>
                                </a>
                              );
                            })}
                            {links.length > 1 && (
                              <span className="inline-flex items-center text-xs text-gray-400 mt-1">
                                ({links.length} links)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-pre-line">{c.productPrice || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-pre-line">{c.specs || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-pre-line">{c.salesPolicy || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{c.mediaFormat || '-'}</td>
                      <td className="px-4 py-4 bg-red-50/50">
                        <p className="text-sm text-red-700 whitespace-pre-line">{c.weaknesses || '-'}</p>
                      </td>
                      <td className="px-4 py-4 bg-green-50/50">
                        <p className="text-sm text-green-700 whitespace-pre-line">{c.strategy || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-red-100 text-sm">Tổng số đối thủ đang theo dõi</p>
            <p className="text-3xl font-bold">{competitors.length}</p>
          </div>
          <div>
            <p className="text-red-100 text-sm">Tổng số link quảng cáo</p>
            <p className="text-3xl font-bold flex items-center gap-2">
              {totalLinks}
              <Link2 className="w-6 h-6 text-red-200" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
