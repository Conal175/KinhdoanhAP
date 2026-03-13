import { useState, useCallback } from 'react';
import type { ProductAdvantage } from '../types';
import { getAdvantages, saveAdvantages } from '../store';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../contexts/AuthContext'; // Thêm phân quyền
import { Plus, Trash2, Edit3, X, Check, Link2, Package, ExternalLink, ArrowLeft } from 'lucide-react';

export function ProductStrategy({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('strategy_product', 'edit');
  const canDelete = checkPermission('strategy_product', 'delete');

  const [products, setProducts] = useState<ProductAdvantage[]>(() => getAdvantages(projectId));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ productName: '', specs: '', competitiveAdvantage: '', promotions: '', mediaLinks: '' });

  const handleSave = () => {
    if (!canEdit || !form.productName.trim()) return;
    const newData = editingId 
      ? products.map(p => p.id === editingId ? { ...p, ...form } : p)
      : [...products, { id: uuid(), projectId, ...form }];
    setProducts(newData);
    saveAdvantages(projectId, newData);
    setShowForm(false); setEditingId(null);
    setForm({ productName: '', specs: '', competitiveAdvantage: '', promotions: '', mediaLinks: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center"><Package className="w-6 h-6 text-white" /></div>
             <div><h1 className="text-2xl font-bold text-gray-800">Chi Tiết Sản Phẩm</h1><p className="text-sm text-gray-500">Quản lý thông tin & lợi thế cạnh tranh</p></div>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md">
            <Plus className="w-5 h-5" /> Thêm sản phẩm
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-100">
               <tr>
                 <th className="p-4 text-left font-bold text-amber-800 uppercase">Tên sản phẩm</th>
                 <th className="p-4 text-left font-bold text-amber-800 uppercase">Thông số KT</th>
                 <th className="p-4 text-left font-bold text-amber-800 uppercase">Lợi thế cạnh tranh</th>
                 <th className="p-4 text-center font-bold text-amber-800 uppercase">#</th>
               </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-800">{p.productName}</td>
                  <td className="p-4"><ul className="list-disc list-inside text-xs text-gray-600">{p.specs.split('\n').map((line, i)=><li key={i}>{line}</li>)}</ul></td>
                  <td className="p-4 font-medium text-amber-700 bg-amber-50/30 whitespace-pre-line">{p.competitiveAdvantage}</td>
                  <td className="p-4 text-center">
                     <div className="flex justify-center gap-1">
                        {canEdit && <button onClick={() => { setForm(p); setEditingId(p.id); setShowForm(true); }} className="text-amber-600 p-1"><Edit3 className="w-4 h-4"/></button>}
                        {canDelete && <button onClick={() => confirm('Xóa?') && (saveAdvantages(projectId, products.filter(i=>i.id!==p.id)), setProducts(products.filter(i=>i.id!==p.id)))} className="text-gray-400"><Trash2 className="w-4 h-4"/></button>}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Form Modal khôi phục nguyên mẫu UI */}
    </div>
  );
}
