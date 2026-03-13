import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Edit2, Trash2, ChevronDown, ChevronRight, 
  BarChart3, X, Save, DollarSign, Eye, MousePointer, MessageCircle, ShoppingCart, Receipt
} from 'lucide-react';
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
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [isAdding, setIsAdding] = useState<number | null>(null);
  const [formData, setFormData] = useState({ adName:'', adLink:'', spend:0, impressions:0, clicks:0, messages:0, orders:0, revenue:0, issues:'', optimizations:'' });

  useEffect(() => { setLogs(getDailyLogs(projectId)); }, [projectId]);

  const saveLogs = (newLogs: DailyLog[]) => { saveDailyLogs(projectId, newLogs); setLogs(newLogs); };
  const monthLogs = logs.filter(l => l.month === selectedMonth && l.year === selectedYear);
  const summary = monthLogs.reduce((acc, l) => ({
    spend: acc.spend + l.spend, orders: acc.orders + l.orders, revenue: acc.revenue + l.revenue
  }), { spend: 0, orders: 0, revenue: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-7 h-7 text-indigo-600" /> Báo Cáo Nhật Ký</h2>
        <div className="flex gap-2">
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border p-2 rounded-lg">{Array.from({length:12}, (_,i)=><option key={i+1} value={i+1}>Tháng {i+1}</option>)}</select>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border p-2 rounded-lg"><option value={2025}>2025</option><option value={2026}>2026</option></select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-md font-bold">
           <p className="text-xs opacity-80">Doanh thu</p>
           <p className="text-xl">{summary.revenue.toLocaleString()}đ</p>
        </div>
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md font-bold">
           <p className="text-xs opacity-80">Chi phí QC</p>
           <p className="text-xl">{summary.spend.toLocaleString()}đ</p>
        </div>
        <div className="bg-amber-500 text-white p-4 rounded-xl shadow-md font-bold">
           <p className="text-xs opacity-80">CPO</p>
           <p className="text-xl">{summary.orders > 0 ? Math.round(summary.spend/summary.orders).toLocaleString() : 0}đ</p>
        </div>
        <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md font-bold">
           <p className="text-xs opacity-80">Đơn hàng</p>
           <p className="text-xl">{summary.orders}</p>
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map(day => {
          const dayLogs = monthLogs.filter(l => l.day === day);
          const isExpanded = expandedDays.includes(day);
          return (
            <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
               <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => setExpandedDays(isExpanded ? expandedDays.filter(d => d!==day) : [...expandedDays, day])}>
                  <span className="font-bold flex items-center gap-2">{isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>} Ngày {day} ({dayLogs.length} bài QC)</span>
                  {canEdit && <button onClick={(e) => { e.stopPropagation(); setIsAdding(day); setFormData({adName:'', adLink:'', spend:0, impressions:0, clicks:0, messages:0, orders:0, revenue:0, issues:'', optimizations:''}); }} className="p-1 bg-indigo-600 text-white rounded"><Plus className="w-4 h-4"/></button>}
               </div>
               {isExpanded && (
                 <div className="border-t overflow-x-auto">
                    {(isAdding === day || (editingLog && dayLogs.some(l=>l.id===editingLog.id))) && (
                      <div className="p-4 bg-indigo-50 grid grid-cols-2 md:grid-cols-4 gap-3">
                         <input placeholder="Tên bài QC *" value={formData.adName} onChange={e => setFormData({...formData, adName: e.target.value})} className="border p-2 rounded-lg col-span-2" />
                         <input type="number" placeholder="Chi phí" value={formData.spend || ''} onChange={e => setFormData({...formData, spend: Number(e.target.value)})} className="border p-2 rounded-lg" />
                         <input type="number" placeholder="Đơn hàng" value={formData.orders || ''} onChange={e => setFormData({...formData, orders: Number(e.target.value)})} className="border p-2 rounded-lg" />
                         <button onClick={() => { if(editingLog) saveLogs(logs.map(l => l.id === editingLog.id ? {...l, ...formData} : l)); else saveLogs([...logs, {id: Date.now().toString(), projectId, day, month: selectedMonth, year: selectedYear, ...formData}]); setIsAdding(null); setEditingLog(null); }} className="bg-indigo-600 text-white p-2 rounded-lg col-span-4 font-bold">Lưu báo cáo</button>
                      </div>
                    )}
                    <table className="w-full text-xs text-left border-collapse">
                       <thead className="bg-gray-50"><tr><th className="p-2 border">Bài QC</th><th className="p-2 border text-right">Chi phí</th><th className="p-2 border text-center">Đơn</th><th className="p-2 border text-right">Doanh thu</th><th className="p-2 border text-center">Thao tác</th></tr></thead>
                       <tbody>
                         {dayLogs.map(log => (
                           <tr key={log.id} className="border-t">
                              <td className="p-2 border font-medium">{log.adName}</td>
                              <td className="p-2 border text-right text-blue-600">{log.spend.toLocaleString()}đ</td>
                              <td className="p-2 border text-center font-bold">{log.orders}</td>
                              <td className="p-2 border text-right text-emerald-600 font-bold">{log.revenue.toLocaleString()}đ</td>
                              <td className="p-2 border text-center">
                                 <div className="flex gap-1 justify-center">
                                    {canEdit && <button onClick={() => { setEditingLog(log); setFormData({...log}); }} className="text-amber-600"><Edit2 className="w-4 h-4"/></button>}
                                    {canDelete && <button onClick={() => { if(confirm('Xóa?')) saveLogs(logs.filter(l => l.id !== log.id)); }} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
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
