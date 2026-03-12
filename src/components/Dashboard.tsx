import React from 'react';
import type { Project, DailyLog, ActionPhase } from '../types';
import { useSyncData } from '../store';
import { 
  TrendingUp, 
  BarChart3, 
  MessageSquare, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Rocket,
  Calendar,
  Eye,
  MousePointer,
  Receipt,
  DollarSign,
  Loader2
} from 'lucide-react';

interface Props {
  project: Project;
}

const calculateCTR = (clicks: number, impressions: number) => {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
};

const calculateCPA = (spend: number, messages: number) => {
  return messages > 0 ? spend / messages : 0;
};

const calculateCPO = (spend: number, orders: number) => {
  return orders > 0 ? spend / orders : 0;
};

const calculateCR = (orders: number, messages: number) => {
  return messages > 0 ? (orders / messages) * 100 : 0;
};

export function Dashboard({ project }: Props) {
  const { data: logs, loading: logsLoading } = useSyncData<DailyLog>(project.id, 'dailyLogs', []);
  const { data: actionPlan, loading: planLoading } = useSyncData<ActionPhase>(project.id, 'actionPhases', []);

  if (logsLoading || planLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Đang tải dữ liệu tổng quan dự án...</p>
      </div>
    );
  }

  const allTasks = actionPlan.flatMap(phase => phase.subPhases.flatMap(sp => sp.tasks));
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalSpend = logs.reduce((s, l) => s + (l.spend || 0), 0);
  const totalImpressions = logs.reduce((s, l) => s + (l.impressions || 0), 0);
  const totalClicks = logs.reduce((s, l) => s + (l.clicks || 0), 0);
  const totalMessages = logs.reduce((s, l) => s + (l.messages || 0), 0);
  const totalOrders = logs.reduce((s, l) => s + (l.orders || 0), 0);
  const totalRevenue = logs.reduce((s, l) => s + (l.revenue || 0), 0);

  const avgCTR = calculateCTR(totalClicks, totalImpressions);
  const avgCPA = calculateCPA(totalSpend, totalMessages);
  const avgCPO = calculateCPO(totalSpend, totalOrders);
  const avgCloseRate = calculateCR(totalOrders, totalMessages);
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const createdDate = new Date(project.createdAt);
  const now = new Date();
  const daysSinceCreated = Math.max(0, Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

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
            {project.description && (
              <p className="text-blue-100 text-lg mb-6 max-w-3xl">{project.description}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-pink-300" />
              <div>
                <p className="text-blue-200 text-sm">Ngày Tạo Dự Án</p>
                <p className="text-xl font-bold">{createdDate.toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-green-300" />
              <div>
                <p className="text-blue-200 text-sm">Đã Hoạt Động</p>
                <p className="text-xl font-bold">{daysSinceCreated} ngày</p>
              </div>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-yellow-300" />
              <div>
                <p className="text-blue-200 text-sm">Số Báo Cáo</p>
                <p className="text-xl font-bold">{logs.length} báo cáo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 3 KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-8 h-8 text-emerald-200" />
            <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">DOANH SỐ</span>
          </div>
          <p className="text-3xl font-extrabold mt-2">{totalRevenue.toLocaleString('vi-VN')}đ</p>
          <p className="text-emerald-100 text-sm mt-1">Doanh thu tạm tính tổng cộng</p>
          {roas > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 text-sm">
              <span className="text-emerald-200">ROAS: </span>
              <span className="font-bold text-lg">{roas.toFixed(2)}x</span>
            </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-200" />
            <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">CHI PHÍ QC</span>
          </div>
          <p className="text-3xl font-extrabold mt-2">{totalSpend.toLocaleString('vi-VN')}đ</p>
          <p className="text-blue-100 text-sm mt-1">Tổng chi phí quảng cáo</p>
          {totalMessages > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 text-sm">
              <span className="text-blue-200">CPA: </span>
              <span className="font-bold text-lg">{Math.round(avgCPA).toLocaleString('vi-VN')}đ</span>
              <span className="text-blue-200 ml-1">/tin nhắn</span>
            </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-8 h-8 text-amber-200" />
            <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">CPO</span>
          </div>
          <p className="text-3xl font-extrabold mt-2">{Math.round(avgCPO).toLocaleString('vi-VN')}đ</p>
          <p className="text-amber-100 text-sm mt-1">Chi phí trên 1 đơn thành công</p>
          <div className="mt-3 pt-3 border-t border-white/20 text-sm">
            <span className="text-amber-200">Tổng đơn: </span>
            <span className="font-bold text-lg">{totalOrders}</span>
            <span className="text-amber-200 ml-1">đơn hàng</span>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Eye className="w-6 h-6 text-purple-500" />
            <span className="text-xs font-medium text-purple-500 bg-purple-50 px-2 py-1 rounded-full">Hiển thị</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalImpressions.toLocaleString('vi-VN')}</p>
          <p className="text-sm text-gray-500 mt-1">Lượt hiển thị</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <MousePointer className="w-6 h-6 text-cyan-500" />
            <span className="text-xs font-medium text-cyan-500 bg-cyan-50 px-2 py-1 rounded-full">Clicks</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalClicks.toLocaleString('vi-VN')}</p>
          <p className="text-sm text-gray-500 mt-1">Lượt nhấp</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-full">Tin nhắn</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalMessages.toLocaleString('vi-VN')}</p>
          <p className="text-sm text-gray-500 mt-1">Tổng tin nhắn</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <span className="text-xs font-medium text-purple-500 bg-purple-50 px-2 py-1 rounded-full">CTR</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{avgCTR.toFixed(2)}%</p>
          <p className="text-sm text-gray-500 mt-1">Click-Through Rate</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">Tỷ lệ chốt</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{avgCloseRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">Đơn/Tin nhắn</p>
        </div>
      </div>

      {/* Task Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-indigo-500" />
          Tổng Quan Action Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-800">{totalTasks}</p>
            <p className="text-sm text-gray-500">Tổng công việc</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{doneTasks}</p>
            <p className="text-sm text-gray-500">Hoàn thành</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{inProgressTasks}</p>
            <p className="text-sm text-gray-500">Đang làm</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{pendingTasks}</p>
            <p className="text-sm text-gray-500">Chờ xử lý</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-2 text-right">{progress}% hoàn thành</p>
      </div>

      {/* Phase Progress */}
      {actionPlan.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Tiến Độ Theo Giai Đoạn</h3>
          <div className="space-y-4">
            {actionPlan.map((phase, index) => {
              const phaseTasks = phase.subPhases.flatMap(sp => sp.tasks);
              const phaseTotal = phaseTasks.length;
              const phaseDone = phaseTasks.filter(t => t.status === 'completed').length;
              const phaseProgress = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;
              const colors = ['blue', 'orange', 'green'][index] || 'gray';
              
              return (
                <div key={phase.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{phase.code}. {phase.name}</span>
                    <span className="text-sm text-gray-500">{phaseDone}/{phaseTotal} ({phaseProgress}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        colors === 'blue' ? 'bg-blue-500' : 
                        colors === 'orange' ? 'bg-orange-500' : 
                        'bg-green-500'
                      }`} 
                      style={{ width: `${phaseProgress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Issues */}
      {logs.filter(l => l.issues).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Vấn Đề Gần Đây
          </h3>
          <div className="space-y-3">
            {logs.filter(l => l.issues).slice(-5).reverse().map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded whitespace-nowrap">
                  Ngày {log.day}/{log.month}
                </span>
                <div className="flex-1">
                  {log.adName && (
                    <p className="text-xs text-gray-500 mb-1">📢 {log.adName}</p>
                  )}
                  <p className="text-sm text-gray-700"><strong>Vấn đề:</strong> {log.issues}</p>
                  {log.optimizations && (
                    <p className="text-sm text-green-700 mt-1"><strong>Hành động:</strong> {log.optimizations}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalTasks === 0 && logs.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Dự án mới được tạo!</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Bắt đầu bằng việc thêm công việc trong <strong>Action Plan</strong>, 
            cập nhật thông tin trong <strong>Chiến Lược</strong>, 
            và ghi nhận hoạt động hàng ngày trong <strong>Báo Cáo</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
