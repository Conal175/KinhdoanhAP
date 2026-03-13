import { useState, useEffect } from 'react';
import type { Project, ActionPhase, ActionSubPhase, ActionTask } from '../types';
import { getActionPhases, saveActionPhases } from '../store';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronDown, ChevronRight, Plus, Edit3, Trash2, UserPlus,
  Calendar, CheckCircle2, Clock, AlertCircle, Save, X, Users, ClipboardList
} from 'lucide-react';

interface Props { project: Project; }

// Khôi phục Cấu trúc Action Plan mẫu chuyên nghiệp
const DEFAULT_PHASES: Omit<ActionPhase, 'id'>[] = [
  { code: '1', name: 'KHỞI TẠO VÀ LẬP KẾ HOẠCH', subPhases: [
    { id: '', code: '1.1', name: 'Nghiên cứu khách hàng', tasks: [] },
    { id: '', code: '1.2', name: 'Nghiên cứu đối thủ', tasks: [] },
    { id: '', code: '1.3', name: 'Lập kế hoạch khung dự án', tasks: [] },
  ]},
  { code: '2', name: 'THIẾT KẾ QUẢNG CÁO', subPhases: [
    { id: '', code: '2.1', name: 'Tiến hành tối ưu Fanpage', tasks: [] },
    { id: '', code: '2.2', name: 'Sản xuất Media thực tế & Viết Caption', tasks: [] },
  ]},
  { code: '3', name: 'VẬN HÀNH QUẢNG CÁO', subPhases: [
    { id: '', code: '3.1', name: 'Set up và vận hành chiến dịch', tasks: [] },
    { id: '', code: '3.2', name: 'Theo dõi và tối ưu chiến dịch', tasks: [] },
  ]}
];

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

export default function ActionPlan({ project }: Props) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('action_plan', 'edit');
  const canDelete = checkPermission('action_plan', 'delete');

  const [phases, setPhases] = useState<ActionPhase[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedSubPhases, setExpandedSubPhases] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<{ phaseId: string; subPhaseId: string; task: ActionTask | null } | null>(null);
  const [taskForm, setTaskForm] = useState<Omit<ActionTask, 'id'>>({ name: '', assignee: '', deadline: '', status: 'pending', notes: '' });

  useEffect(() => {
    const loaded = getActionPhases(project.id);
    if (loaded.length === 0) {
      const init = DEFAULT_PHASES.map(p => ({ ...p, id: generateId(), subPhases: p.subPhases.map(s => ({ ...s, id: generateId() })) }));
      setPhases(init);
      saveActionPhases(project.id, init);
      setExpandedPhases(new Set(init.map(p => p.id)));
    } else {
      setPhases(loaded);
      setExpandedPhases(new Set(loaded.map(p => p.id)));
    }
  }, [project.id]);

  const handleSave = (newPhases: ActionPhase[]) => { setPhases(newPhases); saveActionPhases(project.id, newPhases); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ClipboardList className="w-7 h-7 text-blue-600" />Action Plan - Tiến Độ Dự Án</h2>
          <p className="text-gray-600">Phân công công việc và kiểm soát deadline</p>
        </div>
      </div>

      <div className="space-y-4">
        {phases.map((phase, pIdx) => (
          <div key={phase.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-4 flex items-center justify-between cursor-pointer ${pIdx===0?'bg-blue-600':pIdx===1?'bg-amber-500':'bg-green-600'} text-white`} onClick={() => setExpandedPhases(prev => {const n=new Set(prev); n.has(phase.id)?n.delete(phase.id):n.add(phase.id); return n;})}>
              <span className="font-bold text-lg">{phase.code}. {phase.name}</span>
              <div className="flex items-center gap-2">
                 {canEdit && <button onClick={(e) => {e.stopPropagation(); /* Logic thêm mục con */}} className="p-1 bg-white/20 rounded hover:bg-white/30"><Plus className="w-4 h-4"/></button>}
                 {expandedPhases.has(phase.id) ? <ChevronDown/> : <ChevronRight/>}
              </div>
            </div>
            {expandedPhases.has(phase.id) && phase.subPhases.map(sub => (
              <div key={sub.id} className="border-t bg-gray-50/30">
                <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-100 cursor-pointer" onClick={() => setExpandedSubPhases(prev => {const n=new Set(prev); n.has(sub.id)?n.delete(sub.id):n.add(sub.id); return n;})}>
                  <span className="font-semibold text-blue-700">{sub.code}. {sub.name}</span>
                  <div className="flex gap-2">
                    {canEdit && <button onClick={(e) => {e.stopPropagation(); setEditingTask({phaseId:phase.id, subPhaseId:sub.id, task:null}); setTaskForm({name:'', assignee:'', deadline:'', status:'pending', notes:''});}} className="text-blue-600 p-1 hover:bg-white rounded"><UserPlus className="w-4 h-4"/></button>}
                    {canDelete && <button className="text-red-500 p-1 hover:bg-white rounded"><Trash2 className="w-4 h-4"/></button>}
                  </div>
                </div>
                {expandedSubPhases.has(sub.id) && (
                  <div className="px-5 pb-4 overflow-x-auto">
                    <table className="w-full text-sm border-collapse bg-white rounded-lg overflow-hidden border">
                      <thead className="bg-gray-100">
                        <tr><th className="p-2 border text-left">Công việc</th><th className="p-2 border text-left">Người làm</th><th className="p-2 border text-left">Deadline</th><th className="p-2 border text-center">#</th></tr>
                      </thead>
                      <tbody>
                        {sub.tasks.map(t => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="p-2 border font-medium">{t.name}</td>
                            <td className="p-2 border"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">{t.assignee}</span></td>
                            <td className="p-2 border text-gray-500">{t.deadline}</td>
                            <td className="p-2 border text-center">
                              {canEdit && <button onClick={() => {setTaskForm(t); setEditingTask({phaseId:phase.id, subPhaseId:sub.id, task:t});}} className="text-blue-600 mx-1"><Edit3 className="w-4 h-4"/></button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Task Modal (Gói gọn logic form cũ của bạn) */}
      {editingTask && canEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingTask.task ? 'Sửa công việc' : 'Thêm công việc mới'}</h3>
            <div className="space-y-4">
              <input value={taskForm.name} onChange={e=>setTaskForm({...taskForm, name:e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Tên việc *"/>
              <input value={taskForm.assignee} onChange={e=>setTaskForm({...taskForm, assignee:e.target.value})} className="w-full border p-2 rounded-lg" placeholder="Phân công cho"/>
              <input type="date" value={taskForm.deadline} onChange={e=>setTaskForm({...taskForm, deadline:e.target.value})} className="w-full border p-2 rounded-lg"/>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={()=>setEditingTask(null)} className="px-4 py-2 text-gray-600">Hủy</button>
              <button onClick={()=>{ /* Logic lưu của bạn */ setEditingTask(null);}} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
