import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, Circle, X, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncData } from '../store';
import { v4 as uuid } from 'uuid';
import type { Project } from '../types';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  status: 'todo' | 'in_progress' | 'done';
}

interface ActionPlanProps {
  project: Project;
}

export default function ActionPlan({ project }: ActionPlanProps) {
  // 1. GỌI QUYỀN TỪ MA TRẬN
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('action_plan', 'edit');
  const canDelete = checkPermission('action_plan', 'delete');

  // 2. KẾT NỐI DỮ LIỆU CLOUD TỪ STORE
  const { data: tasks, syncData, loading } = useSyncData<Task>(project.id, 'action_tasks', []);

  // 3. STATE CHO FORM VÀ GIAO DIỆN
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    assignee: '',
    deadline: '',
    status: 'todo'
  });

  // 4. CÁC HÀM XỬ LÝ (CRUD)
  const handleOpenAdd = () => {
    if (!canEdit) return;
    setFormData({ title: '', assignee: '', deadline: '', status: 'todo' });
    setEditingTask(null);
    setShowForm(true);
  };

  const handleOpenEdit = (task: Task) => {
    if (!canEdit) return;
    setFormData(task);
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!canEdit || !formData.title?.trim()) return;

    let newTasks;
    if (editingTask) {
      newTasks = tasks.map(t => t.id === editingTask.id ? { ...t, ...formData } as Task : t);
    } else {
      const newTask: Task = {
        id: uuid(),
        title: formData.title,
        assignee: formData.assignee || 'Chưa phân công',
        deadline: formData.deadline || new Date().toISOString().split('T')[0],
        status: formData.status as 'todo' | 'in_progress' | 'done'
      };
      newTasks = [newTask, ...tasks];
    }

    await syncData(newTasks);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    
    const newTasks = tasks.filter(t => t.id !== id);
    await syncData(newTasks);
  };

  const toggleStatus = async (task: Task) => {
    // Nếu không có quyền Edit thì không cho phép click đổi trạng thái
    if (!canEdit) return;

    const nextStatus = 
      task.status === 'todo' ? 'in_progress' : 
      task.status === 'in_progress' ? 'done' : 'todo';
      
    const newTasks = tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t);
    await syncData(newTasks);
  };

  // Màn hình Loading
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu Kế hoạch...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* HEADER BẢNG */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Kế hoạch Hành động (Action Plan)</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý các đầu việc chi tiết của dự án {project.name}</p>
        </div>
        
        {/* CHỈ HIỂN THỊ NÚT THÊM NẾU CÓ QUYỀN EDIT */}
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Thêm Công Việc
          </button>
        )}
      </div>

      {/* DANH SÁCH CÔNG VIỆC */}
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">Chưa có công việc nào trong kế hoạch.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`group flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border transition-all ${
                  task.status === 'done' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
                  {/* Nút check trạng thái: Bị disable (không có pointer-events) nếu !canEdit */}
                  <button 
                    onClick={() => toggleStatus(task)}
                    className={`mt-1 shrink-0 ${canEdit ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default opacity-80'}`}
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="w-6 h-6 text-amber-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </button>

                  <div>
                    <h3 className={`font-semibold text-base ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {task.assignee.charAt(0).toUpperCase()}
                        </span>
                        {task.assignee}
                      </span>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                        new Date(task.deadline) < new Date() && task.status !== 'done' 
                        ? 'bg-red-50 text-red-600' 
                        : 'bg-gray-50 text-gray-500'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KHU VỰC NÚT THAO TÁC (CHỈ HIỆN KHI CÓ QUYỀN) */}
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                    {canEdit && (
                      <button 
                        onClick={() => handleOpenEdit(task)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa công việc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA (CHỈ MỞ KHI CÓ QUYỀN EDIT) */}
      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                {editingTask ? 'Chỉnh sửa Công việc' : 'Thêm Công việc mới'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên công việc *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nhập tên công việc..."
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót (Deadline)</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="todo">Cần làm (To do)</option>
                  <option value="in_progress">Đang làm (In Progress)</option>
                  <option value="done">Hoàn thành (Done)</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowForm(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.title?.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTask ? 'Lưu thay đổi' : 'Tạo công việc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
