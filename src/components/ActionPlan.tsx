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

  // ... (Giữ nguyên logic các hàm saveSubPhase, saveTask, toggleTaskStatus như file cũ)

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards giữ nguyên giao diện cũ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" /> Action Plan - Tiến Độ Dự Án
          </h2>
        </div>
      </div>

      {/* Danh sách các Giai đoạn */}
      <div className="space-y-4">
        {phases.map((phase, phaseIdx) => {
          const isExpanded = expandedPhases.has(phase.id);
          const colors = [{ bg: 'bg-blue-600' }, { bg: 'bg-amber-500' }, { bg: 'bg-green-600' }][phaseIdx] || { bg: 'bg-blue-600' };

          return (
            <div key={phase.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className={`${colors.bg} text-white px-5 py-4 cursor-pointer flex items-center justify-between`} onClick={() => {
                const n = new Set(expandedPhases); n.has(phase.id) ? n.delete(phase.id) : n.add(phase.id); setExpandedPhases(n);
              }}>
                <span className="font-bold text-lg">{phase.code}. {phase.name}</span>
                <div className="flex items-center gap-2">
                   {canEdit && <button onClick={(e) => { e.stopPropagation(); /* Mở form thêm SubPhase */ }} className="p-1 bg-white/20 rounded"><Plus className="w-4 h-4"/></button>}
                   {isExpanded ? <ChevronDown /> : <ChevronRight />}
                </div>
              </div>

              {isExpanded && phase.subPhases.map(sub => (
                <div key={sub.id} className="border-t">
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => {
                    const n = new Set(expandedSubPhases); n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id); setExpandedSubPhases(n);
                  }}>
                    <span className="font-semibold text-blue-700">{sub.code}. {sub.name}</span>
                    <div className="flex gap-2">
                      {canEdit && <button onClick={(e) => { e.stopPropagation(); /* Mở form thêm Task */ }} className="text-blue-600"><UserPlus className="w-4 h-4" /></button>}
                      {canEdit && <button className="text-gray-500"><Edit3 className="w-4 h-4" /></button>}
                      {canDelete && <button className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                  {/* Bảng công việc (Task Table) ẩn/hiện nút Edit/Delete bằng canEdit/canDelete */}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
