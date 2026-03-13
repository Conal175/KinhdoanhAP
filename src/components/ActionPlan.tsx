import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncData } from '../store';
import { Plus, Edit2, Trash2, CheckCircle2, Circle, X } from 'lucide-react';
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
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('action_plan', 'edit');
  const canDelete = checkPermission('action_plan', 'delete');

  const { data: tasks, syncData, loading } = useSyncData<Task>(project.id, 'action_tasks', []);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({ title: '', assignee: '', deadline: '', status: 'todo' });

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
    await syncData(tasks.filter(t => t.id !== id));
  };

  const toggleStatus = async (task: Task) => {
    if (!canEdit) return;
    const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    await syncData(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
  };

  if (loading) return <div className="p-6 text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Kế hoạch Hành động (Action Plan)</h2>
        {canEdit && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Thêm công việc
          </button>
        )}
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có công việc nào.</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleStatus(task)} className={!canEdit ? 'cursor-default' : ''}>
                  {task.status === 'done' ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-gray-400" />}
                </button>
                <div>
                  <h3 className={`font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    <span>Phụ trách: {task.assignee}</span> • <span>Hạn chót: {new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <button onClick={() => handleOpenEdit(task)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(task.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editingTask ? 'Sửa công việc' : 'Thêm công việc'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên công việc</label>
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Người phụ trách</label>
                <input value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hạn chót</label>
                <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Hủy</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
