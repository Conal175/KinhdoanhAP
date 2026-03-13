import { useState } from 'react';
import type { CustomerInfo, PainPoint, FAQ } from '../types';
import { getCustomerInfos, saveCustomerInfos, getPainPoints, savePainPoints, getFAQs, saveFAQs } from '../store';
import { v4 as uuid } from 'uuid';
import { Plus, Edit2, Trash2, Save, X, Users, MessageCircleQuestion, HeartCrack, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  projectId: string;
  onBack: () => void;
}

export function CustomerStrategy({ projectId, onBack }: Props) {
  // Data states
  const [customerInfos, setCustomerInfos] = useState<CustomerInfo[]>(() => getCustomerInfos(projectId));
  const [painPoints, setPainPoints] = useState<PainPoint[]>(() => getPainPoints(projectId));
  const [faqs, setFAQs] = useState<FAQ[]>(() => getFAQs(projectId));

  // UI states
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['info', 'pain', 'faq']));
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [showPainForm, setShowPainForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms
  const [infoForm, setInfoForm] = useState({ attribute: '', content: '', reason: '' });
  const [painForm, setPainForm] = useState({ painGroup: '', pain: '', solution: '' });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

  const toggleSection = (key: string) => {
    const next = new Set(expandedSections);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedSections(next);
  };

  // Customer Info handlers
  const persistInfo = (data: CustomerInfo[]) => {
    setCustomerInfos(data);
    saveCustomerInfos(projectId, data);
  };

  const resetInfoForm = () => {
    setInfoForm({ attribute: '', content: '', reason: '' });
    setShowInfoForm(false);
    setEditingId(null);
  };

  const handleSaveInfo = () => {
    if (!infoForm.attribute.trim()) return;
    if (editingId) {
      persistInfo(customerInfos.map(c => c.id === editingId ? { ...c, ...infoForm } : c));
    } else {
      persistInfo([...customerInfos, { id: uuid(), projectId, ...infoForm }]);
    }
    resetInfoForm();
  };

  const handleEditInfo = (c: CustomerInfo) => {
    setInfoForm({ attribute: c.attribute, content: c.content, reason: c.reason });
    setEditingId(c.id);
    setShowInfoForm(true);
  };

  const handleDeleteInfo = (id: string) => {
    if (confirm('Xóa thông tin này?')) persistInfo(customerInfos.filter(c => c.id !== id));
  };

  // Pain Point handlers
  const persistPain = (data: PainPoint[]) => {
    setPainPoints(data);
    savePainPoints(projectId, data);
  };

  const resetPainForm = () => {
    setPainForm({ painGroup: '', pain: '', solution: '' });
    setShowPainForm(false);
    setEditingId(null);
  };

  const handleSavePain = () => {
    if (!painForm.painGroup.trim() || !painForm.pain.trim()) return;
    if (editingId) {
      persistPain(painPoints.map(p => p.id === editingId ? { ...p, ...painForm } : p));
    } else {
      persistPain([...painPoints, { id: uuid(), projectId, ...painForm }]);
    }
    resetPainForm();
  };

  const handleEditPain = (p: PainPoint) => {
    setPainForm({ painGroup: p.painGroup, pain: p.pain, solution: p.solution });
    setEditingId(p.id);
    setShowPainForm(true);
  };

  const handleDeletePain = (id: string) => {
    if (confirm('Xóa nỗi đau này?')) persistPain(painPoints.filter(p => p.id !== id));
  };

  // FAQ handlers
  const persistFaq = (data: FAQ[]) => {
    setFAQs(data);
    saveFAQs(projectId, data);
  };

  const resetFaqForm = () => {
    setFaqForm({ question: '', answer: '' });
    setShowFaqForm(false);
    setEditingId(null);
  };

  const handleSaveFaq = () => {
    if (!faqForm.question.trim()) return;
    if (editingId) {
      persistFaq(faqs.map(f => f.id === editingId ? { ...f, ...faqForm } : f));
    } else {
      persistFaq([...faqs, { id: uuid(), projectId, ...faqForm }]);
    }
    resetFaqForm();
  };

  const handleEditFaq = (f: FAQ) => {
    setFaqForm({ question: f.question, answer: f.answer });
    setEditingId(f.id);
    setShowFaqForm(true);
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm('Xóa câu hỏi này?')) persistFaq(faqs.filter(f => f.id !== id));
  };

  // Group pain points by painGroup for rowspan display
  const groupedPains = painPoints.reduce((acc, p) => {
    if (!acc[p.painGroup]) acc[p.painGroup] = [];
    acc[p.painGroup].push(p);
    return acc;
  }, {} as Record<string, PainPoint[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Chân Dung Khách Hàng</h1>
            <p className="text-sm text-gray-500">Thông tin, nỗi đau và câu hỏi thường gặp</p>
          </div>
        </div>
      </div>

      {/* Section 1: Customer Info */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('info')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-purple-800">Bảng 1: Thông tin về đối tượng khách hàng</span>
            <span className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full">{customerInfos.length}</span>
          </div>
          {expandedSections.has('info') ? <ChevronDown className="w-5 h-5 text-purple-600" /> : <ChevronRight className="w-5 h-5 text-purple-600" />}
        </button>

        {expandedSections.has('info') && (
          <div className="p-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowInfoForm(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Thêm thông tin
              </button>
            </div>

            {customerInfos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Chưa có thông tin khách hàng</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-100">
                      <th className="px-4 py-3 text-left text-xs font-bold text-purple-800 uppercase w-10">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-purple-800 uppercase min-w-[180px]">Thông tin về đối tượng KH</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-purple-800 uppercase min-w-[200px]">Nội dung</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-purple-800 uppercase min-w-[200px]">Lý do</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-purple-800 uppercase w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerInfos.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-purple-50/30">
                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{c.attribute}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-pre-line">{c.content || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-pre-line">{c.reason || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEditInfo(c)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteInfo(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Pain Points */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('pain')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HeartCrack className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-800">Bảng 2: Nỗi đau của khách hàng (Pain Points)</span>
            <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full">{painPoints.length}</span>
          </div>
          {expandedSections.has('pain') ? <ChevronDown className="w-5 h-5 text-red-600" /> : <ChevronRight className="w-5 h-5 text-red-600" />}
        </button>

        {expandedSections.has('pain') && (
          <div className="p-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowPainForm(true)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Thêm nỗi đau
              </button>
            </div>

            {painPoints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HeartCrack className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Chưa có nỗi đau nào được ghi nhận</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-100">
                      <th className="px-4 py-3 text-left text-xs font-bold text-red-800 uppercase min-w-[150px]">Nhóm nỗi đau</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-red-800 uppercase min-w-[200px] bg-red-50">Nỗi đau của KH</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase min-w-[200px] bg-green-50">Giải pháp</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-red-800 uppercase w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(groupedPains).map(([group, items]) =>
                      items.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-red-50/30">
                          {idx === 0 && (
                            <td rowSpan={items.length} className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-100 align-top bg-gray-50">
                              <div className="flex items-center gap-2">
                                <span>{group}</span>
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{items.length}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-red-700 bg-red-50/50 whitespace-pre-line">{p.pain}</td>
                          <td className="px-4 py-3 text-sm text-green-700 bg-green-50/50 whitespace-pre-line">{p.solution || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEditPain(p)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeletePain(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: FAQs */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('faq')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageCircleQuestion className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-indigo-800">Bảng 3: Câu hỏi thường gặp (FAQ)</span>
            <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full">{faqs.length}</span>
          </div>
          {expandedSections.has('faq') ? <ChevronDown className="w-5 h-5 text-indigo-600" /> : <ChevronRight className="w-5 h-5 text-indigo-600" />}
        </button>

        {expandedSections.has('faq') && (
          <div className="p-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowFaqForm(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Thêm câu hỏi
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircleQuestion className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Chưa có câu hỏi FAQ nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-indigo-100">
                      <th className="px-4 py-3 text-left text-xs font-bold text-indigo-800 uppercase w-10">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-indigo-800 uppercase min-w-[250px]">Câu hỏi thường gặp</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-indigo-800 uppercase min-w-[300px]">Gợi ý trả lời</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-indigo-800 uppercase w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {faqs.map((f, idx) => (
                      <tr key={f.id} className="hover:bg-indigo-50/30">
                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{f.question}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-pre-line">{f.answer || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEditFaq(f)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteFaq(f.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-4 text-white">
          <p className="text-purple-100 text-xs">Thông tin KH</p>
          <p className="text-2xl font-bold">{customerInfos.length}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 text-white">
          <p className="text-red-100 text-xs">Nỗi đau</p>
          <p className="text-2xl font-bold">{painPoints.length}</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-4 text-white">
          <p className="text-indigo-100 text-xs">FAQ</p>
          <p className="text-2xl font-bold">{faqs.length}</p>
        </div>
      </div>

      {/* Forms Modals */}
      {showInfoForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetInfoForm}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              {editingId ? 'Sửa thông tin' : 'Thêm thông tin KH'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Thông tin về đối tượng KH *</label>
                <input
                  value={infoForm.attribute}
                  onChange={e => setInfoForm({ ...infoForm, attribute: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="VD: Độ tuổi, Giới tính, Khu vực..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nội dung</label>
                <textarea
                  value={infoForm.content}
                  onChange={e => setInfoForm({ ...infoForm, content: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="VD: 25-45 tuổi, Nữ chiếm 70%..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do</label>
                <textarea
                  value={infoForm.reason}
                  onChange={e => setInfoForm({ ...infoForm, reason: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="VD: Đây là nhóm có nhu cầu cao nhất..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveInfo} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-medium">
                <Save className="w-5 h-5" /> Lưu
              </button>
              <button onClick={resetInfoForm} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showPainForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetPainForm}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <HeartCrack className="w-6 h-6 text-red-500" />
              {editingId ? 'Sửa nỗi đau' : 'Thêm nỗi đau KH'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhóm nỗi đau *</label>
                <input
                  value={painForm.painGroup}
                  onChange={e => setPainForm({ ...painForm, painGroup: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: Về giá cả, Về chất lượng, Về dịch vụ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nỗi đau của KH *</label>
                <textarea
                  value={painForm.pain}
                  onChange={e => setPainForm({ ...painForm, pain: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="VD: Sợ mua hàng fake, lo lắng về bảo hành..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Giải pháp</label>
                <textarea
                  value={painForm.solution}
                  onChange={e => setPainForm({ ...painForm, solution: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="VD: Cam kết đổi trả 30 ngày, bảo hành 5 năm..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSavePain} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 font-medium">
                <Save className="w-5 h-5" /> Lưu
              </button>
              <button onClick={resetPainForm} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showFaqForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetFaqForm}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <MessageCircleQuestion className="w-6 h-6 text-indigo-500" />
              {editingId ? 'Sửa FAQ' : 'Thêm câu hỏi FAQ'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Câu hỏi thường gặp *</label>
                <textarea
                  value={faqForm.question}
                  onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="VD: Máy bơm có bảo hành không?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gợi ý trả lời</label>
                <textarea
                  value={faqForm.answer}
                  onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="VD: Dạ có ạ! Shop bảo hành 5 năm, đổi mới trong 30 ngày đầu..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveFaq} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium">
                <Save className="w-5 h-5" /> Lưu
              </button>
              <button onClick={resetFaqForm} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
