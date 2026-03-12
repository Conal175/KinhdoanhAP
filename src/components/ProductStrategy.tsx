import { useState } from 'react';
import type { ProductAdvantage } from '../types';
import { getAdvantages, saveAdvantages } from '../store';
import { v4 as uuid } from 'uuid';
import { Plus, Edit2, Trash2, Save, X, Package, Link as LinkIcon, ArrowLeft } from 'lucide-react';

interface Props {
  projectId: string;
  onBack: () => void;
}

export function ProductStrategy({ projectId, onBack }: Props) {
  const [products, setProducts] = useState<ProductAdvantage[]>(() => getAdvantages(projectId));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    productName: '',
    specs: '',
    competitiveAdvantage: '',
    promotions: '',
    mediaLinks: '',
  });

  const persist = (data: ProductAdvantage[]) => {
    setProducts(data);
    saveAdvantages(projectId, data);
  };

  const resetForm = () => {
    setForm({ productName: '', specs: '', competitiveAdvantage: '', promotions: '', mediaLinks: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.productName.trim()) return;
    if (editingId) {
      persist(products.map(p => p.id === editingId ? { ...p, ...form } : p));
    } else {
      persist([...products, { id: uuid(), projectId, ...form }]);
    }
    resetForm();
  };

  const handleEdit = (p: ProductAdvantage) => {
    setForm({
      productName: p.productName,
      specs: p.specs,
      competitiveAdvantage: p.competitiveAdvantage,
      promotions: p.promotions,
      mediaLinks: p.mediaLinks,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xóa sản phẩm này?')) {
      persist(products.filter(p => p.id !== id));
    }
  };

  const renderSpecs = (specs: string) => {
    const lines = specs.split('\n').filter(l => l.trim());
    if (lines.length === 0) return <span className="text-gray-400 italic">Chưa có</span>;
    return (
      <ul className="space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderLinks = (links: string) => {
    const lines = links.split('\n').filter(l => l.trim());
    if (lines.length === 0) return <span className="text-gray-400 italic">Chưa có</span>;
    return (
      <div className="space-y-1">
        {lines.map((link, i) => (
          <a
            key={i}
            href={link.startsWith('http') ? link : `https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <LinkIcon className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{link}</span>
          </a>
        ))}
      </div>
    );
  };

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
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Sản Phẩm</h1>
              <p className="text-sm text-gray-500">Quản lý thông tin sản phẩm & lợi thế cạnh tranh</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-md"
        >
          <Plus className="w-5 h-5" /> Thêm sản phẩm
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-500" />
              {editingId ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên sản phẩm *</label>
                <input
                  value={form.productName}
                  onChange={e => setForm({ ...form, productName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="VD: Máy bơm nước XYZ-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bộ thông số kỹ thuật <span className="text-gray-400 font-normal">(mỗi dòng = 1 thông số)</span>
                </label>
                <textarea
                  value={form.specs}
                  onChange={e => setForm({ ...form, specs: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="Công suất: 500W&#10;Lưu lượng: 30L/phút&#10;Độ cao đẩy: 25m"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Điểm khác biệt / Lợi thế cạnh tranh</label>
                <textarea
                  value={form.competitiveAdvantage}
                  onChange={e => setForm({ ...form, competitiveAdvantage: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="VD: Tiết kiệm điện hơn 30%, bảo hành 5 năm..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chương trình ưu đãi</label>
                <textarea
                  value={form.promotions}
                  onChange={e => setForm({ ...form, promotions: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="VD: Giảm 20% khi mua combo, tặng phụ kiện..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tài nguyên Media <span className="text-gray-400 font-normal">(mỗi dòng = 1 link)</span>
                </label>
                <textarea
                  value={form.mediaLinks}
                  onChange={e => setForm({ ...form, mediaLinks: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="https://drive.google.com/video1&#10;https://drive.google.com/image1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all font-medium"
              >
                <Save className="w-5 h-5" /> {editingId ? 'Cập nhật' : 'Lưu sản phẩm'}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-amber-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có sản phẩm nào</h3>
          <p className="text-gray-500 mb-6">Thêm sản phẩm đầu tiên để bắt đầu</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-5 h-5" /> Thêm sản phẩm
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider w-10">#</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider min-w-[150px]">Tên sản phẩm</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider min-w-[200px]">Bộ thông số KT</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider min-w-[180px]">Điểm khác biệt/LTCT</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider min-w-[150px]">Chương trình ưu đãi</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider min-w-[150px]">Tài nguyên Media</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-amber-800 uppercase tracking-wider w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{p.productName}</div>
                    </td>
                    <td className="px-4 py-4">{renderSpecs(p.specs)}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{p.competitiveAdvantage || <span className="text-gray-400 italic">Chưa có</span>}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{p.promotions || <span className="text-gray-400 italic">Chưa có</span>}</p>
                    </td>
                    <td className="px-4 py-4">{renderLinks(p.mediaLinks)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm">Tổng số sản phẩm</p>
            <p className="text-3xl font-bold">{products.length}</p>
          </div>
          <Package className="w-12 h-12 text-amber-200" />
        </div>
      </div>
    </div>
  );
}
