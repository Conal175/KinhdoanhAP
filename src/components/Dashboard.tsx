import { useState } from 'react';
import type { Project, DailyLog, ActionPhase } from '../types';
import { getDailyLogs, getActionPhases } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, BarChart3, MessageSquare, ShoppingCart, CheckCircle, 
  Clock, AlertTriangle, Rocket, Calendar, Eye, MousePointer, Receipt, DollarSign, Settings, Download
} from 'lucide-react';

interface Props { project: Project; }

export function Dashboard({ project }: Props) {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('dashboard', 'edit');

  const [logs] = useState<DailyLog[]>(() => getDailyLogs(project.id));
  const [actionPlan] = useState<ActionPhase[]>(() => getActionPhases(project.id));

  const allTasks = actionPlan.flatMap(phase => phase.subPhases.flatMap(sp => sp.tasks));
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalSpend = logs.reduce((s, l) => s + (l.spend || 0), 0);
  const totalRevenue = logs.reduce((s, l) => s + (l.revenue || 0), 0);
  const totalOrders = logs.reduce((s, l) => s + (l.orders || 0), 0);
  const avgCPO = totalOrders > 0 ? totalSpend / totalOrders : 0;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl font-bold">{project.name}</h1>
            </div>
            <p className="text-blue-100 text-lg mb-6 max-w-3xl">{project.description || 'Quản lý chiến dịch kinh doanh và vận hành quảng cáo'}</p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
               <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"><Settings className="w-5 h-5"/></button>
               <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"><Download className="w-5 h-5"/></button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-pink-300" />
            <div><p className="text-blue-200 text-sm">Ngày Tạo</p><p className="text-xl font-bold">{new Date(project.createdAt).toLocaleDateString('vi-VN')}</p></div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-300" />
            <div><p className="text-blue-200 text-sm">Trạng thái</p><p className="text-xl font-bold">Đang Hoạt Động</p></div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-yellow-300" />
            <div><p className="text-blue-200 text-sm">Báo cáo</p><p className="text-xl font-bold">{logs.length} bản ghi</p></div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <Receipt className="w-8 h-8 text-emerald-200 mb-2" />
          <p className="text-3xl font-extrabold">{totalRevenue.toLocaleString('vi-VN')}đ</p>
          <p className="text-emerald-100 text-sm">TỔNG DOANH THU</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <DollarSign className="w-8 h-8 text-blue-200 mb-2" />
          <p className="text-3xl font-extrabold">{totalSpend.toLocaleString('vi-VN')}đ</p>
          <p className="text-blue-100 text-sm">CHI PHÍ QUẢNG CÁO</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <ShoppingCart className="w-8 h-8 text-amber-200 mb-2" />
          <p className="text-3xl font-extrabold">{Math.round(avgCPO).toLocaleString('vi-VN')}đ</p>
          <p className="text-amber-100 text-sm">CPO TRUNG BÌNH</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-indigo-500" /> Tiến Độ Action Plan</h3>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-sm text-gray-500 text-right font-bold">{progress}% Hoàn thành ({doneTasks}/{totalTasks} công việc)</p>
      </div>
    </div>
  );
}
