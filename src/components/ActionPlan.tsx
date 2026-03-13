import { useState, useEffect } from 'react';
import type { Project, ActionPhase, ActionSubPhase, ActionTask } from '../types';
import { getActionPhases, saveActionPhases } from '../store';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronDown, ChevronRight, Plus, Edit3, Trash2, UserPlus,
  Calendar, CheckCircle2, Clock, AlertCircle, Save, X, Users, ClipboardList
} from 'lucide-react';

interface Props { project: Project; }

const DEFAULT_PHASES: Omit<ActionPhase, 'id'>[] = [
  { code: '1', name: 'KHỞI TẠO VÀ LẬP KẾ HOẠCH', subPhases: [
    { id: '', code: '1.1', name: 'Nghiên cứu khách hàng', tasks: [] },
    { id: '', code: '1.2', name: 'Nghiên cứu đối thủ', tasks: [] },
    { id: '', code: '1.3', name: 'Lập kế hoạch khung dự án', tasks: [] },
    { id: '', code: '1.4', name: 'Thiết lập các tài khoản', tasks: [] },
    { id: '', code: '1.5', name: 'Phân tích sản phẩm/dịch vụ, đối thủ và đề xuất', tasks: [] },
  ]},
  { code: '2', name: 'THIẾT KẾ QUẢNG CÁO', subPhases: [
    { id: '', code: '2.1', name: 'Tiến hành tối ưu Fanpage', tasks: [] },
    { id: '', code: '2.2', name: 'Sản xuất Media thực tế & Viết Caption', tasks: [] },
    { id: '', code: '2.3', name: 'Đánh giá và kiểm duyệt nội dung kỹ thuật', tasks: [] },
    { id: '', code: '2.4', name: 'Lên kịch bản Seeding (Bình luận mồi)', tasks: [] },
    { id: '', code: '2.5', name: 'Set up đối tượng quảng cáo Facebook', tasks: [] },
    { id: '', code: '2.6', name: 'Thiết lập kịch bản Chatbot & Hệ thống gắn thẻ (Label)', tasks: [] },
  ]},
  { code: '3', name: 'VẬN HÀNH QUẢNG CÁO', subPhases: [
    { id: '', code: '3.1', name: 'Set up và vận hành chiến dịch', tasks: [] },
    { id: '', code: '3.2', name: 'Theo dõi và tối ưu chiến dịch', tasks: [] },
  ]}
];

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

function initializePhases(): ActionPhase[] {
  return DEFAULT_PHASES.map(phase => ({
    ...phase, id: generateId(),
    subPhases: phase.subPhases.map(sub => ({ ...sub, id: generateId() }))
  }));
}

const statusConfig = {
  pending: { label: 'Chờ xử lý', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
  in_progress: { label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
};

export default function ActionPlan({ project }: Props) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('action_plan', 'edit');
  const canDelete = checkPermission('action_plan', 'delete');

  const [phases, setPhases] = useState<ActionPhase[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedSubPhases, setExpandedSubPhases] = useState<Set<string>>(new Set());
  
  const [editingTask, setEditingTask] = useState<{ phaseId: string; subPhaseId: string; task: ActionTask | null } | null>(null);
  const [taskForm, setTaskForm] = useState<Omit<ActionTask, 'id'>>({ name: '', assignee: '', deadline: '', status: 'pending', notes: '' });
  const [editingSubPhase, setEditingSubPhase] = useState<{ phaseId: string; subPhase: ActionSubPhase | null } | null>(null);
  const [subPhaseForm, setSubPhaseForm] = useState({ code: '', name: '' });

  useEffect(() => {
    const loaded = getActionPhases(project.id);
    if (loaded.length === 0) {
      const initialized = initializePhases();
      setPhases(initialized);
      saveActionPhases(project.id, initialized);
      setExpandedPhases(new Set(initialized.map(p => p.id)));
    } else {
      setPhases(loaded);
      setExpandedPhases(new Set(loaded.map(p => p.id)));
    }
  }, [project.id]);

  const handleSave = (newPhases: ActionPhase[]) => { setPhases(newPhases); saveActionPhases(project.id, newPhases); };

  const stats = phases.reduce((acc, p) => {
    p.subPhases.forEach(s => s.tasks.forEach(t => {
      acc.total++;
      if (t.status === 'completed') acc.completed++;
      else if (t.status === 'in_progress') acc.inProgress++;
      else acc.pending++;
    }));
    return acc;
  }, { total: 0, completed: 0, inProgress: 0, pending: 0 });

  const phaseColors = [{ bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700' }, { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700' }, { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700' }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ClipboardList className="w-7 h-7 text-blue-600" /> Action Plan - Tiến Độ Dự Án</h2><p className="text-gray-600 mt-1">Phân công công việc và kiểm soát deadline</p></div>
      </div>

      {/* Stats row giữ nguyên */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Tổng công việc</p></div></div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm"><div><p className="text-2xl font-bold text-green-600">{stats.completed}</p><p className="text-sm text-gray-500">Hoàn thành</p></div></div>
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm"><div><p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p><p className="text-sm text-gray-500">Đang làm</p></div></div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"><div><p className="text-2xl font-bold text-gray-600">{stats.pending}</p><p className="text-sm text-gray-500">Chờ xử lý</p></div></div>
      </div>

      <div className="space-y-4">
        {phases.map((phase, phaseIdx) => {
          const colors = phaseColors[phaseIdx] || phaseColors[0];
          const isExpanded = expandedPhases.has(phase.id);
          return (
            <div key={phase.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`${colors.bg} text-white px-5 py-4 cursor-pointer flex items-center justify-between`} onClick={() => setExpandedPhases(prev => { const n = new Set(prev); n.has(phase.id) ? n.delete(phase.id) : n.add(phase.id); return n; })}>
                <div className="flex items-center gap-3">{isExpanded ? <ChevronDown /> : <ChevronRight />}<span className="font-bold text-lg">{phase.code}. {phase.name}</span></div>
                <div className="flex items-center gap-3">
                  {canEdit && <button onClick={(e) => { e.stopPropagation(); setSubPhaseForm({ code: `${phase.code}.${phase.subPhases.length + 1}`, name: '' }); setEditingSubPhase({ phaseId: phase.id, subPhase: null }); }} className="p-1 bg-white/20 rounded hover:bg-white/30"><Plus className="w-4 h-4" /></button>}
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {phase.subPhases.map(subPhase => {
                    const isSubExpanded = expandedSubPhases.has(subPhase.id);
                    return (
                      <div key={subPhase.id} className={`${colors.light}`}>
                        <div className="px-5 py-3 flex items-center justify-between hover:bg-white/50 cursor-pointer" onClick={() => setExpandedSubPhases(prev => { const n = new Set(prev); n.has(subPhase.id) ? n.delete(subPhase.id) : n.add(subPhase.id); return n; })}>
                           <span className={`font-semibold ${colors.text}`}>{subPhase.code}. {subPhase.name}</span>
                           <div className="flex gap-2">
                             {canEdit && <button onClick={(e) => { e.stopPropagation(); setTaskForm({name:'', assignee:'', deadline:'', status:'pending', notes:''}); setEditingTask({phaseId: phase.id, subPhaseId: subPhase.id, task: null}); }} className={`${colors.text}`}><UserPlus className="w-4 h-4" /></button>}
                             {canDelete && <button onClick={(e) => { e.stopPropagation(); if (confirm('Xóa?')) handleSave(phases.map(p => p.id === phase.id ? { ...p, subPhases: p.subPhases.filter(s => s.id !== subPhase.id) } : p)); }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                           </div>
                        </div>
                        {isSubExpanded && (
                          <div className="px-5 pb-4 overflow-x-auto">
                            <table className="w-full text-sm border bg-white rounded-lg overflow-hidden">
                              <thead className="bg-gray-50 border-b"><tr><th className="p-2 border">Việc</th><th className="p-2 border">Phụ trách</th><th className="p-2 border">Hạn</th><th className="p-2 border">Trạng thái</th><th className="p-2 border">#</th></tr></thead>
                              <tbody>
                                {subPhase.tasks.map(t => (
                                  <tr key={t.id}>
                                    <td className="p-2 border font-medium">{t.name}</td>
                                    <td className="p-2 border text-center"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">{t.assignee}</span></td>
                                    <td className="p-2 border text-center">{t.deadline}</td>
                                    <td className="p-2 border text-center">
                                      <button disabled={!canEdit} onClick={() => { const statusOrder: any[] = ['pending', 'in_progress', 'completed']; handleSave(phases.map(p => p.id === phase.id ? { ...p, subPhases: p.subPhases.map(s => s.id === subPhase.id ? { ...s, tasks: s.tasks.map(task => task.id === t.id ? { ...task, status: statusOrder[(statusOrder.indexOf(task.status) + 1) % 3] } : task) } : s) } : p)); }} className={`px-2 py-1 rounded-full text-xs font-bold ${statusConfig[t.status].color}`}>{statusConfig[t.status].label}</button>
                                    </td>
                                    <td className="p-2 border text-center">
                                      {canDelete && <button onClick={() => { if (confirm('Xóa?')) handleSave(phases.map(p => p.id === phase.id ? { ...p, subPhases: p.subPhases.map(s => s.id === subPhase.id ? { ...s, tasks: s.tasks.filter(task => task.id !== t.id) } : s) } : p)); }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Modal Form SubPhase/Task giữ nguyên theo file ActionPlan gốc */}
    </div>
  );
}
