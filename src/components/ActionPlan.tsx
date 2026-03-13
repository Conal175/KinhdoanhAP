import { useState, useEffect } from 'react';
import type { Project, ActionPhase, ActionSubPhase, ActionTask } from '../types';
import { getActionPhases, saveActionPhases } from '../store';
import { useAuth } from '../contexts/AuthContext'; // Thêm phân quyền
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  X,
  Users,
  ClipboardList
} from 'lucide-react';

interface Props {
  project: Project;
}

// Cấu trúc mặc định khôi phục theo yêu cầu
const DEFAULT_PHASES: Omit<ActionPhase, 'id'>[] = [
  {
    code: '1',
    name: 'KHỞI TẠO VÀ LẬP KẾ HOẠCH',
    subPhases: [
      { id: '', code: '1.1', name: 'Nghiên cứu khách hàng', tasks: [] },
      { id: '', code: '1.2', name: 'Nghiên cứu đối thủ', tasks: [] },
      { id: '', code: '1.3', name: 'Lập kế hoạch khung dự án', tasks: [] },
      { id: '', code: '1.4', name: 'Thiết lập các tài khoản', tasks: [] },
      { id: '', code: '1.5', name: 'Phân tích sản phẩm/dịch vụ, đối thủ và đề xuất', tasks: [] },
    ]
  },
  {
    code: '2',
    name: 'THIẾT KẾ QUẢNG CÁO',
    subPhases: [
      { id: '', code: '2.1', name: 'Tiến hành tối ưu Fanpage', tasks: [] },
      { id: '', code: '2.2', name: 'Sản xuất Media thực tế & Viết Caption', tasks: [] },
      { id: '', code: '2.3', name: 'Đánh giá và kiểm duyệt nội dung kỹ thuật', tasks: [] },
      { id: '', code: '2.4', name: 'Lên kịch bản Seeding (Bình luận mồi)', tasks: [] },
      { id: '', code: '2.5', name: 'Set up đối tượng quảng cáo Facebook', tasks: [] },
      { id: '', code: '2.6', name: 'Thiết lập kịch bản Chatbot & Hệ thống gắn thẻ (Label)', tasks: [] },
    ]
  },
  {
    code: '3',
    name: 'VẬN HÀNH QUẢNG CÁO',
    subPhases: [
      { id: '', code: '3.1', name: 'Set up và vận hành chiến dịch', tasks: [] },
      { id: '', code: '3.2', name: 'Theo dõi và tối ưu chiến dịch', tasks: [] },
    ]
  }
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function initializePhases(): ActionPhase[] {
  return DEFAULT_PHASES.map(phase => ({
    ...phase,
    id: generateId(),
    subPhases: phase.subPhases.map(sub => ({
      ...sub,
      id: generateId()
    }))
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
  const [taskForm, setTaskForm] = useState<Omit<ActionTask, 'id'>>({
    name: '', assignee: '', deadline: '', status: 'pending', notes: ''
  });

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

  const handleSave = (newPhases: ActionPhase[]) => {
    setPhases(newPhases);
    saveActionPhases(project.id, newPhases);
  };

  const togglePhase = (phaseId: string) => {
    const newSet = new Set(expandedPhases);
    newSet.has(phaseId) ? newSet.delete(phaseId) : newSet.add(phaseId);
    setExpandedPhases(newSet);
  };

  const toggleSubPhase = (subPhaseId: string) => {
    const newSet = new Set(expandedSubPhases);
    newSet.has(subPhaseId) ? newSet.delete(subPhaseId) : newSet.add(subPhaseId);
    setExpandedSubPhases(newSet);
  };

  const saveSubPhase = () => {
    if (!canEdit || !editingSubPhase || !subPhaseForm.name.trim()) return;
    const newPhases = phases.map(phase => {
      if (phase.id !== editingSubPhase.phaseId) return phase;
      if (editingSubPhase.subPhase) {
        return {
          ...phase,
          subPhases: phase.subPhases.map(sub =>
            sub.id === editingSubPhase.subPhase!.id ? { ...sub, code: subPhaseForm.code, name: subPhaseForm.name } : sub
          )
        };
      } else {
        return {
          ...phase,
          subPhases: [...phase.subPhases, { id: generateId(), code: subPhaseForm.code, name: subPhaseForm.name, tasks: [] }]
        };
      }
    });
    handleSave(newPhases);
    setEditingSubPhase(null);
  };

  const saveTask = () => {
    if (!canEdit || !editingTask || !taskForm.name.trim()) return;
    const newPhases = phases.map(phase => {
      if (phase.id !== editingTask.phaseId) return phase;
      return {
        ...phase,
        subPhases: phase.subPhases.map(sub => {
          if (sub.id !== editingTask.subPhaseId) return sub;
          if (editingTask.task) {
            return { ...sub, tasks: sub.tasks.map(t => t.id === editingTask.task!.id ? { ...t, ...taskForm } : t) };
          } else {
            return { ...sub, tasks: [...sub.tasks, { id: generateId(), ...taskForm }] };
          }
        })
      };
    });
    handleSave(newPhases);
    setEditingTask(null);
  };

  const stats = phases.reduce((acc, phase) => {
    phase.subPhases.forEach(sub => {
      sub.tasks.forEach(task => {
        acc.total++;
        if (task.status === 'completed') acc.completed++;
        else if (task.status === 'in_progress') acc.inProgress++;
        else acc.pending++;
      });
    });
    return acc;
  }, { total: 0, completed: 0, inProgress: 0, pending: 0 });

  const phaseColors = [
    { bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    { bg: 'bg-green-600', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Action Plan - Tiến Độ Dự Án
          </h2>
          <p className="text-gray-600 mt-1">Phân công công việc và kiểm soát deadline</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Tổng công việc</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-500">Hoàn thành</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">Đang thực hiện</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Chờ xử lý</p>
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {phases.map((phase, phaseIdx) => {
          const colors = phaseColors[phaseIdx] || phaseColors[0];
          const isExpanded = expandedPhases.has(phase.id);
          const phaseStats = phase.subPhases.reduce((acc, sub) => {
            sub.tasks.forEach(t => {
              acc.total++;
              if (t.status === 'completed') acc.completed++;
            });
            return acc;
          }, { total: 0, completed: 0 });

          return (
            <div key={phase.id} className={`bg-white rounded-xl border ${colors.border} shadow-sm overflow-hidden`}>
              <div className={`${colors.bg} text-white px-5 py-4 cursor-pointer flex items-center justify-between`} onClick={() => togglePhase(phase.id)}>
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  <span className="font-bold text-lg">{phase.code}. {phase.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{phaseStats.completed}/{phaseStats.total} hoàn thành</span>
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setSubPhaseForm({ code: `${phase.code}.${phase.subPhases.length + 1}`, name: '' }); setEditingSubPhase({ phaseId: phase.id, subPhase: null }); }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {phase.subPhases.map(subPhase => {
                    const isSubExpanded = expandedSubPhases.has(subPhase.id);
                    const subStats = { total: subPhase.tasks.length, completed: subPhase.tasks.filter(t => t.status === 'completed').length };
                    return (
                      <div key={subPhase.id} className={`${colors.light}`}>
                        <div className="px-5 py-3 cursor-pointer flex items-center justify-between hover:bg-white/50" onClick={() => toggleSubPhase(subPhase.id)}>
                          <div className="flex items-center gap-3">
                            {isSubExpanded ? <ChevronDown className={`w-4 h-4 ${colors.text}`} /> : <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
                            <span className={`font-semibold ${colors.text}`}>{subPhase.code}. {subPhase.name}</span>
                            {subStats.total > 0 && <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-600">{subStats.completed}/{subStats.total}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <button onClick={(e) => { e.stopPropagation(); setTaskForm({ name: '', assignee: '', deadline: '', status: 'pending', notes: '' }); setEditingTask({ phaseId: phase.id, subPhaseId: subPhase.id, task: null }); }} className={`p-1.5 ${colors.text} hover:bg-white rounded-lg`}>
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                            {canEdit && (
                              <button onClick={(e) => { e.stopPropagation(); setSubPhaseForm({ code: subPhase.code, name: subPhase.name }); setEditingSubPhase({ phaseId: phase.id, subPhase }); }} className="p-1.5 text-gray-500 hover:bg-white rounded-lg">
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={(e) => { e.stopPropagation(); if(confirm('Xóa mục này?')) handleSave(phases.map(p => p.id === phase.id ? {...p, subPhases: p.subPhases.filter(s => s.id !== subPhase.id)} : p)); }} className="p-1.5 text-red-500 hover:bg-white rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {isSubExpanded && (
                          <div className="px-5 pb-4">
                            {subPhase.tasks.length === 0 ? (
                              <div className="bg-white rounded-lg p-4 text-center text-gray-500 border border-dashed border-gray-300">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Chưa có công việc nào</p>
                                {canEdit && <button onClick={() => setEditingTask({ phaseId: phase.id, subPhaseId: subPhase.id, task: null })} className={`mt-2 text-sm ${colors.text} hover:underline`}>+ Thêm công việc</button>}
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-600">Công việc</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-600">Phân công</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-600">Deadline</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-600">Trạng thái</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-600">Ghi chú</th>
                                      <th className="px-4 py-2 text-center font-medium text-gray-600">Thao tác</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {subPhase.tasks.map((task, idx) => {
                                      const StatusIcon = statusConfig[task.status].icon;
                                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
                                      return (
                                        <tr key={task.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                                          <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                                          <td className="px-4 py-2 font-medium text-gray-900">{task.name}</td>
                                          <td className="px-4 py-2">
                                            {task.assignee ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"><Users className="w-3 h-3" />{task.assignee}</span> : <span className="text-gray-400 italic">Chưa phân công</span>}
                                          </td>
                                          <td className="px-4 py-2">
                                            {task.deadline ? <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}><Calendar className="w-3 h-3" />{new Date(task.deadline).toLocaleDateString('vi-VN')}{isOverdue && <span className="ml-1">(Quá hạn)</span>}</span> : <span className="text-gray-400">-</span>}
                                          </td>
                                          <td className="px-4 py-2">
                                            <button onClick={() => { if(canEdit) { const statusOrder: ActionTask['status'][] = ['pending', 'in_progress', 'completed']; handleSave(phases.map(p => p.id === phase.id ? {...p, subPhases: p.subPhases.map(s => s.id === subPhase.id ? {...s, tasks: s.tasks.map(t => t.id === task.id ? {...t, status: statusOrder[(statusOrder.indexOf(t.status)+1)%3]} : t)} : s)} : p)); } }} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[task.status].color}`}>
                                              <StatusIcon className="w-3 h-3" />{statusConfig[task.status].label}
                                            </button>
                                          </td>
                                          <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate" title={task.notes}>{task.notes || '-'}</td>
                                          <td className="px-4 py-2">
                                            <div className="flex items-center justify-center gap-1">
                                              {canEdit && <button onClick={() => { setTaskForm(task); setEditingTask({ phaseId: phase.id, subPhaseId: subPhase.id, task }); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>}
                                              {canDelete && <button onClick={() => { if(confirm('Xóa việc này?')) handleSave(phases.map(p => p.id === phase.id ? {...p, subPhases: p.subPhases.map(s => s.id === subPhase.id ? {...s, tasks: s.tasks.filter(t => t.id !== task.id)} : s)} : p)); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
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

      {/* Modal SubPhase */}
      {editingSubPhase && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingSubPhase.subPhase ? 'Sửa mục' : 'Thêm mục mới'}</h3>
            <div className="space-y-4">
              <input type="text" value={subPhaseForm.code} onChange={(e) => setSubPhaseForm({...subPhaseForm, code: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Mã số (VD: 1.6)" />
              <input type="text" value={subPhaseForm.name} onChange={(e) => setSubPhaseForm({...subPhaseForm, name: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Tên mục *" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingSubPhase(null)} className="px-4 py-2 text-gray-600">Hủy</button>
              <button onClick={saveSubPhase} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Task */}
      {editingTask && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingTask.task ? 'Sửa công việc' : 'Thêm việc mới'}</h3>
            <div className="space-y-4">
              <input type="text" value={taskForm.name} onChange={(e) => setTaskForm({...taskForm, name: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Tên công việc *" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={taskForm.assignee} onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Người thực hiện" />
                <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <select value={taskForm.status} onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})} className="w-full border p-2 rounded-lg">
                <option value="pending">Chờ xử lý</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
              </select>
              <textarea value={taskForm.notes} onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})} rows={2} className="w-full border p-2 rounded-lg" placeholder="Ghi chú thêm" />
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
