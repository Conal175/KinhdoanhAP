import { useState } from 'react';
import type { Project, DailyLog, ActionPhase } from '../types';
import { getDailyLogs, getActionPhases } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, CheckCircle, Clock, Rocket, Calendar, Receipt, DollarSign, ShoppingCart
} from 'lucide-react';

export function Dashboard({ project }: { project: Project }) {
  const { checkPermission } = useAuth();
  const [logs] = useState<DailyLog[]>(() => getDailyLogs(project.id));
  const [actionPlan] = useState<ActionPhase[]>(() => getActionPhases(project.id));

  const allTasks = actionPlan.flatMap(phase => phase.subPhases.flatMap(sp => sp.tasks));
  const doneTasks = allTasks.filter(t => t.status === 'completed').length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const totalSpend = logs.reduce((s, l) => s + l.spend, 0);
  const totalRevenue = logs.reduce((s, l) => s + l.revenue, 0);
  const totalOrders = logs.reduce((s, l) => s + l.orders, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2"><Rocket className="w-8 h-8 text-yellow-300" /><h1 className="text-3xl font-bold">{project.name}</h1></div>
        <p className="text-blue-100 text-lg mb-6">{project.description || 'Hệ thống quản lý vận hành'}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white/15 backdrop-blur rounded-xl p-4 flex items-center gap-3"><Calendar className="w-6 h-6 text-pink-300" /><div><p className="text-blue-200 text-sm">Ngày tạo</p><p className="font-bold">{new Date(project.createdAt).toLocaleDateString('vi-VN')}</p></div></div>
           <div className="bg-white/15 backdrop-blur rounded-xl p-4 flex items-center gap-3"><Clock className="w-6 h-6 text-green-300" /><div><p className="text-blue-200 text-sm">Báo cáo</p><p className="font-bold">{logs.length} bản ghi</p></div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold">
        <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-lg"><Receipt className="w-8 h-8 opacity-50 mb-2" /><p className="text-2xl">{totalRevenue.toLocaleString()}đ</p><p className="text-sm">TỔNG DOANH THU</p></div>
        <div className="bg-blue-500 text-white p-6 rounded-2xl shadow-lg"><DollarSign className="w-8 h-8 opacity-50 mb-2" /><p className="text-2xl">{totalSpend.toLocaleString()}đ</p><p className="text-sm">CHI PHÍ QUẢNG CÁO</p></div>
        <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg"><ShoppingCart className="w-8 h-8 opacity-50 mb-2" /><p className="text-2xl">{totalOrders}</p><p className="text-sm">TỔNG ĐƠN HÀNG</p></div>
      </div>

      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-indigo-500" /> Tiến Độ Action Plan</h3>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2"><div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${progress}%` }}></div></div>
        <p className="text-sm text-gray-500 text-right font-bold">{progress}% Hoàn thành ({doneTasks}/{allTasks.length} việc)</p>
      </div>
    </div>
  );
}
