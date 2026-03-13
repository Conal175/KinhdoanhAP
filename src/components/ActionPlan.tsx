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

  const saveSubPhase = () => {
    if (!canEdit || !editingSubPhase || !subPhaseForm.name.trim()) return;
    const newPhases = phases.map(phase => {
      if (phase.id !== editingSubPhase.phaseId) return phase;
      if (editingSubPhase.subPhase) {
        return { ...phase, subPhases: phase.subPhases.map(sub => sub.id === editingSubPhase.subPhase!.id ? { ...sub, code: subPhaseForm.code, name: subPhaseForm.name } : sub) };
      }
      return { ...phase, subPhases: [...phase.subPhases, { id: generateId(), code: subPhaseForm.code, name: subPhaseForm.name, tasks: [] }] };
    });
    handleSave(newPhases);
    setEditingSubPhase(null);
  };

  const saveTask = () => {
    if (!canEdit || !editingTask || !taskForm.name.trim()) return;
    const newPhases = phases.map(phase => {
      if (phase.id !== editingTask.phaseId) return phase;
      return { ...phase, subPhases: phase.subPhases.map(sub => {
        if (sub.id !== editingTask.subPhaseId) return sub;
        if (editingTask.task) return { ...sub, tasks: sub.tasks.map(t => t.id === editingTask.task!.id ? { ...t, ...taskForm } : t) };
        return { ...sub, tasks: [...sub.tasks, { id: generateId(), ...taskForm }] };
      })};
    });
    handleSave(newPhases);
    setEditingTask(null);
  };

  const stats = phases.reduce((acc, p) => {
    p.subPhases.forEach(s => s.tasks.forEach(t => {
      acc.total++;
      if (t.status === 'completed') acc.completed++;
      else if (t.status === 'in_progress') acc.inProgress++;
      else acc.pending++;
    }));
    return acc;
  }, { total: 0, completed: 0, inProgress: 0, pending: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-7 h-7 text-blue-600" /> Action Plan</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-gray-500">Tổng việc</p></div>
        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm"><p className="text-2xl font-bold text-green-600">{stats.completed}</p><p className="text-sm text-gray-500">Hoàn thành</p></div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm"><p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p><p className="text-sm text-gray-500">Đang làm</p></div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><p className="text-2xl font-bold text-gray-600">{stats.pending}</p><p className="text-sm text-gray-500">Chờ xử lý</p></div>
      </div>

      <div className="space-y-4">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedPhases(prev => { const n = new Set(prev); n.has(phase.id) ? n.delete(phase.id) : n.add(phase.id); return n; })}>
              <span className="font-bold">{phase.code}. {phase.name}</span>
              <div className="flex items-center gap-2">
                {canEdit && <button onClick={(e) => { e.stopPropagation(); setSubPhaseForm({ code: `${phase.code}.${phase.subPhases.length+1}`, name: '' }); setEditingSubPhase({ phaseId: phase.id, subPhase: null }); }} className="p-1 bg-white/20 rounded"><Plus className="w-4 h-4" /></button>}
                {expandedPhases.has(phase.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </div>
            {expandedPhases.has(phase.id) && phase.subPhases.map(sub => (
              <div key={sub.id} className="border-t">
                <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedSubPhases(prev => { const n = new Set(prev); n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id); return n; })}>
                  <span className="font-semibold text-blue-700">{sub.code}. {sub.name}</span>
                  <div className="flex items-center gap-2">
                    {canEdit && <button onClick={(e) => { e.stopPropagation(); setTaskForm({name:'', assignee:'', deadline:'', status:'pending', notes:''}); setEditingTask({phaseId: phase.id, subPhaseId: sub.id, task: null}); }} className="text-blue-600"><UserPlus className="w-4 h-4" /></button>}
                    {canEdit && <button onClick={(e) => { e.stopPropagation(); setSubPhaseForm({code: sub.code, name: sub.name}); setEditingSubPhase({phaseId: phase.id, subPhase: sub}); }} className="text-gray-500"><Edit3 className="w-4 h-4" /></button>}
                    {canDelete && <button onClick={(e) => { e.stopPropagation(); if(confirm('Xóa?')) handleSave(phases.map(p => p.id === phase.id ? {...p, subPhases: p.subPhases.filter(s => s.id !== sub.id)} : p)); }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
                {expandedSubPhases.has(sub.id) && (
                  <div className="px-5 pb-4 overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr><th className="px-4 py-2 border">Việc</th><th className="px-4 py-2 border">Làm</th><th className="px-4 py-2 border">Hạn</th><th className="px-4 py-2 border">Tình trạng</th><th className="px-4 py-2 border">#</th></tr>
                      </thead>
                      <tbody>
                        {sub.tasks.map(t => {
                          const StatusIcon = statusConfig[t.status].icon;
                          return (
                            <tr key={t.id}>
                              <td className="px-4 py-2 border font-medium">{t.name}</td>
                              <td className="px-4 py-2 border text-center"><span className="bg-purple-100 px-2 py-1 rounded-full text-xs">{t.assignee}</span></td>
                              <td className="px-4 py-2 border text-center">{t.deadline}</td>
                              <td className="px-4 py-2 border text-center">
                                <button disabled={!canEdit} onClick={() => { const statusOrder: any[] = ['pending', 'in_progress', 'completed']; handleSave(phases.map(p => p.id === phase.id ? {...p, subPhases: p.subPhases.map(s => s.id === sub.id ? {...s, tasks: s.tasks.map(task => task.id === t.id ? {...task, status: statusOrder[(statusOrder.indexOf(task.status)+1)%3]} : task)} : s)} : p)); }} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[t.status].color}`}><StatusIcon className="w-3 h-3" />{statusConfig[t.status].label}</button>
                              </td>
                              <td className="px-4 py-2 border text-center">
                                <div className="flex gap-1 justify-center">
                                  {canEdit && <button onClick={() => { setTaskForm(t); setEditingTask({phaseId: phase.id, subPhaseId: sub.id, task: t}); }} className="text-blue-600"><Edit3 className="w-4 h-4" /></button>}
                                  {canDelete && <button onClick={() => { if(confirm('Xóa?')) handleSave(phases.map(p => p.id === phase.id ? {...p, subPhases: p.subPhases.map(s => s.id === sub.id ? {...s, tasks: s.tasks.filter(task => task.id !== t.id)} : s)} : p)); }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Modals for Editing (giữ nguyên logic form bạn đã gửi) */}
      {editingSubPhase && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingSubPhase.subPhase ? 'Sửa mục' : 'Thêm mục mới'}</h3>
            <div className="space-y-4">
              <input value={subPhaseForm.code} onChange={(e) => setSubPhaseForm({...subPhaseForm, code: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Mã số (VD: 1.6)" />
              <input value={subPhaseForm.name} onChange={(e) => setSubPhaseForm({...subPhaseForm, name: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Tên mục *" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingSubPhase(null)} className="px-4 py-2 text-gray-600">Hủy</button>
              <button onClick={saveSubPhase} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {editingTask && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingTask.task ? 'Sửa công việc' : 'Thêm công việc mới'}</h3>
            <div className="space-y-4">
              <input value={taskForm.name} onChange={(e) => setTaskForm({...taskForm, name: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Tên công việc *" />
              <div className="grid grid-cols-2 gap-4">
                <input value={taskForm.assignee} onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Phân công cho" />
                <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <select value={taskForm.status} onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})} className="w-full border p-2 rounded-lg">
                <option value="pending">Chờ xử lý</option><option value="in_progress">Đang thực hiện</option><option value="completed">Hoàn thành</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingTask(null)} className="px-4 py-2 text-gray-600">Hủy</button>
              <button onClick={saveTask} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
