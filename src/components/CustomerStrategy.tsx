import { useState } from 'react';
import type { CustomerInfo, PainPoint, FAQ } from '../types';
import { getCustomerInfos, saveCustomerInfos, getPainPoints, savePainPoints, getFAQs, saveFAQs } from '../store';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../contexts/AuthContext'; // Thêm phân quyền
import { Plus, Edit2, Trash2, Save, X, Users, MessageCircleQuestion, HeartCrack, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  projectId: string;
  onBack: () => void;
}

export function CustomerStrategy({ projectId, onBack }: Props) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('strategy_customer', 'edit');
  const canDelete = checkPermission('strategy_customer', 'delete');

  const [customerInfos, setCustomerInfos] = useState<CustomerInfo[]>(() => getCustomerInfos(projectId));
  const [painPoints, setPainPoints] = useState<PainPoint[]>(() => getPainPoints(projectId));
  const [faqs, setFAQs] = useState<FAQ[]>(() => getFAQs(projectId));

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['info', 'pain', 'faq']));
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [showPainForm, setShowPainForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [infoForm, setInfoForm] = useState({ attribute: '', content: '', reason: '' });
  const [painForm, setPainForm] = useState({ painGroup: '', pain: '', solution: '' });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

  const toggleSection = (key: string) => {
    const next = new Set(expandedSections);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedSections(next);
  };

  const handleSaveInfo = () => {
    if (!canEdit || !infoForm.attribute.trim()) return;
    const newData = editingId 
      ? customerInfos.map(c => c.id === editingId ? { ...c, ...infoForm } : c)
      : [...customerInfos, { id: uuid(), projectId, ...infoForm }];
    setCustomerInfos(newData);
    saveCustomerInfos(projectId, newData);
    setShowInfoForm(false); setEditingId(null);
    setInfoForm({ attribute: '', content: '', reason: '' });
  };

  const handleSavePain = () => {
    if (!canEdit || !painForm.painGroup.trim()) return;
    const newData = editingId 
      ? painPoints.map(p => p.id === editingId ? { ...p, ...painForm } : p)
      : [...painPoints, { id: uuid(), projectId, ...painForm }];
    setPainPoints(newData);
    savePainPoints(projectId, newData);
    setShowPainForm(false); setEditingId(null);
    setPainForm({ painGroup: '', pain: '', solution: '' });
  };

  const handleSaveFaq = () => {
    if (!canEdit || !faqForm.question.trim()) return;
    const newData = editingId 
      ? faqs.map(f => f.id === editingId ? { ...f, ...faqForm } : f)
      : [...faqs, { id: uuid(), projectId, ...faqForm }];
    setFAQs(newData);
    saveFAQs(projectId, newData);
    setShowFaqForm(false); setEditingId(null);
    setFaqForm({ question: '', answer: '' });
  };

  const groupedPains = painPoints.reduce((acc, p) => {
    if (!acc[p.painGroup]) acc[p.painGroup] = [];
    acc[p.painGroup].push(p);
    return acc;
  }, {} as Record<string, PainPoint[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div><h1 className="text-2xl font-bold text-gray-800">Chân Dung Khách Hàng</h1><p className="text-sm text-gray-500">Thông tin, nỗi đau và câu hỏi thường gặp</p></div>
        </div>
      </div>

      {/* Bảng 1: Thông tin khách hàng */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('info')} className="w-full flex items-center justify-between px-6 py-4 bg-purple-50 hover:bg-purple-100 transition-colors">
          <div className="flex items-center gap-3"><Users className="w-5 h-5 text-purple-600" /><span className="font-bold text-purple-800">Thông tin về đối tượng khách hàng</span></div>
          {expandedSections.has('info') ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.has('info') && (
          <div className="p-4">
            {canEdit && <div className="flex justify-end mb-4"><button onClick={() => setShowInfoForm(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Thêm thông tin</button></div>}
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr><th className="p-3 text-left">Thông tin KH</th><th className="p-3 text-left">Nội dung</th><th className="p-3 text-left text-center">Thao tác</th></tr>
              </thead>
              <tbody>
                {customerInfos.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.attribute}</td><td className="p-3">{c.content}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        {canEdit && <button onClick={() => { setInfoForm(c); setEditingId(c.id); setShowInfoForm(true); }} className="text-purple-600 p-1"><Edit2 className="w-4 h-4"/></button>}
                        {canDelete && <button onClick={() => confirm('Xóa?') && (saveCustomerInfos(projectId, customerInfos.filter(i => i.id !== c.id)), setCustomerInfos(customerInfos.filter(i => i.id !== c.id)))} className="text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bảng 2: Nỗi đau & Giải pháp */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('pain')} className="w-full flex items-center justify-between px-6 py-4 bg-red-50 hover:bg-red-100">
          <div className="flex items-center gap-3"><HeartCrack className="w-5 h-5 text-red-600" /><span className="font-bold text-red-800">Nỗi đau khách hàng & Giải pháp</span></div>
          {expandedSections.has('pain') ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.has('pain') && (
          <div className="p-4">
            {canEdit && <div className="flex justify-end mb-4"><button onClick={() => setShowPainForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Thêm nỗi đau</button></div>}
            {Object.entries(groupedPains).map(([group, items]) => (
              <div key={group} className="mb-4 border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 font-bold text-sm border-b">Nhóm: {group}</div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map(p => (
                      <tr key={p.id} className="border-b">
                        <td className="p-3 text-red-700 bg-red-50/30">{p.pain}</td>
                        <td className="p-3 text-green-700 bg-green-50/30">{p.solution}</td>
                        <td className="p-3 w-20 text-center">
                           <div className="flex gap-1">
                             {canEdit && <button onClick={() => { setPainForm(p); setEditingId(p.id); setShowPainForm(true); }} className="text-red-600"><Edit2 className="w-4 h-4"/></button>}
                             {canDelete && <button onClick={() => confirm('Xóa?') && (savePainPoints(projectId, painPoints.filter(i=>i.id!==p.id)), setPainPoints(painPoints.filter(i=>i.id!==p.id)))} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bảng 3: FAQ */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('faq')} className="w-full flex items-center justify-between px-6 py-4 bg-indigo-50 hover:bg-indigo-100">
          <div className="flex items-center gap-3"><MessageCircleQuestion className="w-5 h-5 text-indigo-600" /><span className="font-bold text-indigo-800">Câu hỏi thường gặp (FAQ)</span></div>
          {expandedSections.has('faq') ? <ChevronDown /> : <ChevronRight />}
        </button>
        {expandedSections.has('faq') && (
          <div className="p-4">
            {canEdit && <div className="flex justify-end mb-4"><button onClick={() => setShowFaqForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Thêm FAQ</button></div>}
            <div className="space-y-3">
              {faqs.map(f => (
                <div key={f.id} className="p-4 border rounded-xl bg-gray-50 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-indigo-800">Q: {f.question}</p>
                    <p className="mt-2 text-gray-700">A: {f.answer}</p>
                  </div>
                  <div className="flex gap-1 ml-4">
                    {canEdit && <button onClick={() => { setFaqForm(f); setEditingId(f.id); setShowFaqForm(true); }} className="text-indigo-600"><Edit2 className="w-4 h-4"/></button>}
                    {canDelete && <button onClick={() => confirm('Xóa?') && (saveFAQs(projectId, faqs.filter(i=>i.id!==f.id)), setFAQs(faqs.filter(i=>i.id!==f.id)))} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals cho Forms */}
      {showInfoForm && canEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Thông tin khách hàng</h3>
            <div className="space-y-4">
              <input value={infoForm.attribute} onChange={e=>setInfoForm({...infoForm, attribute:e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Thuộc tính (VD: Độ tuổi)"/>
              <textarea value={infoForm.content} onChange={e=>setInfoForm({...infoForm, content:e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Nội dung" rows={3}/>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowInfoForm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Hủy</button>
              <button onClick={handleSaveInfo} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}
      {/* Tương tự cho PainModal và FaqModal... */}
    </div>
  );
}
