import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, ChevronDown, ChevronRight, BarChart3, Receipt, DollarSign, ShoppingCart } from 'lucide-react';
import { DailyLog } from '../types';
import { getDailyLogs, saveDailyLogs } from '../store';
import { useAuth } from '../contexts/AuthContext';

const DailyReport: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { checkPermission } = useAuth();
  const canEdit = checkPermission('daily_report', 'edit');
  const canDelete = checkPermission('daily_report', 'delete');

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedDays, setExpandedDays] = useState<number[]>([new Date().getDate()]);

  useEffect(() => { setLogs(getDailyLogs(projectId)); }, [projectId]);

  const monthSummary = logs.filter(l => l.month === selectedMonth && l.year === selectedYear).reduce((acc, l) => ({
    spend: acc.spend + l.spend, orders: acc.orders + l.orders, revenue: acc.revenue + l.revenue
  }), { spend: 0, orders: 0, revenue: 0 });

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg">
          <p className="text-xs opacity-80">Doanh thu</p>
          <p className="text-xl font-bold">{new Intl.NumberFormat('vi-VN').format(monthSummary.revenue)}đ</p>
        </div>
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
          <p className="text-xs opacity-80">Chi phí QC</p>
          <p className="text-xl font-bold">{new Intl.NumberFormat('vi-VN').format(monthSummary.spend)}đ</p>
        </div>
        {/* ... các thẻ KPI khác */}
      </div>

      {/* Danh sách báo cáo hàng ngày */}
      <div className="space-y-2">
        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
          const dayLogs = logs.filter(l => l.day === day && l.month === selectedMonth && l.year === selectedYear);
          if (dayLogs.length === 0 && day !== new Date().getDate()) return null;

          return (
            <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => {
                setExpandedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
              }}>
                <span className="font-bold flex items-center gap-2">Ngày {day} ({dayLogs.length} QC)</span>
                {canEdit && <button className="p-1 bg-indigo-600 text-white rounded"><Plus className="w-4 h-4"/></button>}
              </div>
              {expandedDays.includes(day) && dayLogs.length > 0 && (
                <div className="border-t overflow-x-auto">
                   <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-gray-50">
                        <tr><th className="p-2 border">Bài QC</th><th className="p-2 border">Spend</th><th className="p-2 border">Orders</th><th className="p-2 border">CPO</th><th className="p-2 border">Thao tác</th></tr>
                      </thead>
                      <tbody>
                        {dayLogs.map(log => (
                          <tr key={log.id}>
                            <td className="p-2 border font-medium">{log.adName}</td>
                            <td className="p-2 border text-blue-600">{log.spend.toLocaleString()}đ</td>
                            <td className="p-2 border text-center font-bold">{log.orders}</td>
                            <td className="p-2 border text-red-500 font-bold">{log.orders > 0 ? Math.round(log.spend/log.orders).toLocaleString() : 0}đ</td>
                            <td className="p-2 border text-center">
                              <div className="flex gap-2 justify-center">
                                {canEdit && <button className="text-amber-600"><Edit2 className="w-4 h-4"/></button>}
                                {canDelete && <button className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
                              </div>
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
    </div>
  );
};
export default DailyReport;
