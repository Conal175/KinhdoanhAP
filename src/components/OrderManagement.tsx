import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Download, Upload, Loader2, Plus, Edit2, Trash2, X, 
  Save, Search, Filter, RefreshCcw, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Order, fetchOrders, insertOrder, updateOrder, deleteOrder } from '../store';
import { useAuth } from '../contexts/AuthContext';

interface Props { projectId: string; }

export function OrderManagement({ projectId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { checkPermission } = useAuth(); 
  const canEdit = checkPermission('orders', 'edit');
  const canDelete = checkPermission('orders', 'delete');

  // ================= BỘ LỌC TÌM KIẾM =================
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', source: '', customer: '', 
    product: '', tracking: '', status: ''
  });

  // ================= STATE QUẢN LÝ THÊM/SỬA =================
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thêm đơn mới (Modal)
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [addFormData, setAddFormData] = useState<Omit<Order, 'id' | 'projectId'>>({
    orderDate: new Date().toISOString().split('T')[0], source: '', customerInfo: '', address: '',
    productName: '', quantity: 1, price: 0, total: 0, notes: '', shippingDate: '', trackingCode: '', status: '', shippingFee: 0
  });

  // Chỉnh sửa trực tiếp trên dòng (Inline Edit)
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => { loadOrders(); }, [projectId]);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchOrders(projectId);
    setOrders(data);
    setLoading(false);
  };

  // ================= XỬ LÝ LỌC =================
  const filteredOrders = orders.filter(o => {
    const matchDateFrom = !filters.dateFrom || o.orderDate >= filters.dateFrom;
    const matchDateTo = !filters.dateTo || o.orderDate <= filters.dateTo;
    const matchSource = !filters.source || o.source.toLowerCase().includes(filters.source.toLowerCase());
    const matchCustomer = !filters.customer || o.customerInfo.toLowerCase().includes(filters.customer.toLowerCase());
    const matchProduct = !filters.product || o.productName.toLowerCase().includes(filters.product.toLowerCase());
    const matchTracking = !filters.tracking || o.trackingCode.toLowerCase().includes(filters.tracking.toLowerCase());
    const matchStatus = !filters.status || o.status.toLowerCase().includes(filters.status.toLowerCase());
    return matchDateFrom && matchDateTo && matchSource && matchCustomer && matchProduct && matchTracking && matchStatus;
  });

  const clearFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', source: '', customer: '', product: '', tracking: '', status: '' });
  };

  // ================= XỬ LÝ THÊM MỚI (MODAL) =================
  useEffect(() => {
    // Tự động tính tổng tiền khi nhập form thêm mới
    setAddFormData(prev => ({ ...prev, total: prev.quantity * prev.price }));
  }, [addFormData.quantity, addFormData.price]);

  const handleSaveAdd = async () => {
    if (!addFormData.customerInfo.trim() || !canEdit) return;
    setIsSavingAdd(true);
    const newOrder = await insertOrder({ projectId, ...addFormData });
    if (newOrder) {
      setOrders([newOrder, ...orders]);
      setShowAddModal(false);
      setAddFormData({
        orderDate: new Date().toISOString().split('T')[0], source: '', customerInfo: '', address: '',
        productName: '', quantity: 1, price: 0, total: 0, notes: '', shippingDate: '', trackingCode: '', status: '', shippingFee: 0
      });
    }
    setIsSavingAdd(false);
  };

  // ================= XỬ LÝ SỬA TRỰC TIẾP (INLINE EDIT) =================
  useEffect(() => {
    // Tự động tính tổng tiền khi sửa trực tiếp
    if (editingRowId && editFormData.quantity !== undefined && editFormData.price !== undefined) {
      setEditFormData(prev => ({ ...prev, total: (prev.quantity || 0) * (prev.price || 0) }));
    }
  }, [editFormData.quantity, editFormData.price, editingRowId]);

  const startInlineEdit = (order: Order) => {
    if (!canEdit) return;
    setEditingRowId(order.id);
    setEditFormData({ ...order });
  };

  const cancelInlineEdit = () => {
    setEditingRowId(null);
    setEditFormData({});
  };

  const saveInlineEdit = async () => {
    if (!editingRowId || !canEdit) return;
    setIsSavingEdit(true);
    const success = await updateOrder(editingRowId, editFormData);
    if (success) {
      setOrders(orders.map(o => o.id === editingRowId ? { ...o, ...editFormData } : o));
      setEditingRowId(null);
    }
    setIsSavingEdit(false);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
      const success = await deleteOrder(id);
      if (success) setOrders(orders.filter(o => o.id !== id));
    }
  };

  // ================= XUẤT / NHẬP EXCEL =================
  const handleExportExcel = () => {
    const exportData = filteredOrders.map(o => ({
      'Ngày': o.orderDate, 'Nguồn': o.source, 'Tên khách hàng': o.customerInfo, 'Địa Chỉ': o.address,
      'Tên sp': o.productName, 'Số Lượng': o.quantity, 'Giá Bán': o.price, 'TỔNG ĐƠN': o.total,
      'ghi chú': o.notes, 'Ngày Lên Đơn': o.shippingDate, 'Mã Vận Đơn': o.trackingCode,
      'Trạng thái đơn hàng': o.status, 'phí vc': o.shippingFee
    }));

    if (exportData.length === 0) {
      exportData.push({ 'Ngày': '', 'Nguồn': '', 'Tên khách hàng': 'File Mẫu', 'Địa Chỉ': '', 'Tên sp': '', 'Số Lượng': 1, 'Giá Bán': 0, 'TỔNG ĐƠN': 0, 'ghi chú': '', 'Ngày Lên Đơn': '', 'Mã Vận Đơn': '', 'Trạng thái đơn hàng': '', 'phí vc': 0 });
    }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Quan_Ly_Don_Hang`);
    XLSX.writeFile(workbook, `Danh_Sach_Don_Hang.xlsx`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const binaryStr = evt.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary', cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          if (rawData[i] && rawData[i].some(cell => typeof cell === 'string' && cell.toLowerCase().includes('tên khách hàng'))) {
            headerRowIndex = i; break;
          }
        }
        if (headerRowIndex === -1) { alert('❌ Không tìm thấy cột "Tên khách hàng"!'); setIsImporting(false); return; }

        const headers = rawData[headerRowIndex].map(h => h ? String(h).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase() : '');
        const parseNumber = (val: any) => { if (!val) return 0; if (typeof val === 'number') return val; return Number(String(val).replace(/[^0-9]/g, '')) || 0; };
        const parseDate = (val: any) => {
          if (!val) return '';
          if (val instanceof Date) return new Date(val.getTime() - val.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          const str = String(val).trim(); const parts = str.split('/');
          if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          return str.split(' ')[0]; 
        };

        let successCount = 0;
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const rowArray = rawData[i];
          if (!rowArray || rowArray.length === 0) continue;
          const row: any = {};
          headers.forEach((h, index) => { if (h) row[h] = rowArray[index]; });

          if (row['tên khách hàng']) {
            await insertOrder({
              projectId, orderDate: parseDate(row['ngày']), source: row['nguồn'] ? String(row['nguồn']) : '',
              customerInfo: String(row['tên khách hàng']), address: row['địa chỉ'] ? String(row['địa chỉ']) : '',
              productName: row['tên sp'] || row['tên sản phẩm'] ? String(row['tên sp'] || row['tên sản phẩm']) : '',
              quantity: parseNumber(row['số lượng']) || 1, price: parseNumber(row['giá bán']) || 0, total: parseNumber(row['tổng đơn']) || 0,
              notes: row['ghi chú'] ? String(row['ghi chú']) : '', shippingDate: parseDate(row['ngày lên đơn']),
              trackingCode: row['mã vận đơn'] ? String(row['mã vận đơn']) : '',
              status: row['trạng thái đơn hàng'] || row['trạng thái'] ? String(row['trạng thái đơn hàng'] || row['trạng thái']) : '',
              shippingFee: parseNumber(row['phí vc'] || row['phí vận chuyển']) || 0
            });
            successCount++;
          }
        }
        alert(`✅ Đã nhập thành công ${successCount} đơn hàng!`);
        loadOrders();
      } catch (error) { alert('❌ Lỗi định dạng file!'); } 
      finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-4">
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-indigo-600" /> Quản Lý Đơn Hàng
          </h2>
          <p className="text-sm text-gray-500 mt-1">Quản trị trạng thái, vận đơn và tài chính ({filteredOrders.length} đơn)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <Filter className="w-4 h-4" /> Bộ lọc {Object.values(filters).some(x => x !== '') && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
          </button>
          
          <div className="w-px h-8 bg-gray-200 mx-1"></div>

          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 rounded-xl border border-transparent hover:border-green-200">
            <Download className="w-4 h-4" /> Xuất
          </button>

          {canEdit && (
            <>
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200 disabled:opacity-50">
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Nhập
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls, .csv" className="hidden" />
              
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-xl hover:from-indigo-700 hover:to-blue-700 font-medium shadow-md transition-all">
                <Plus className="w-4 h-4" /> Thêm Mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Filter className="w-4 h-4" /> Lọc tìm kiếm chi tiết</h3>
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> Xóa lọc</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-sm">
            <div><label className="block text-xs text-gray-500 mb-1">Từ ngày</label><input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Đến ngày</label><input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Tên khách / SĐT</label><input type="text" placeholder="Tìm..." value={filters.customer} onChange={e => setFilters({...filters, customer: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Mã vận đơn</label><input type="text" placeholder="Tìm..." value={filters.tracking} onChange={e => setFilters({...filters, tracking: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Nguồn (Page...)</label><input type="text" placeholder="Tìm..." value={filters.source} onChange={e => setFilters({...filters, source: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Sản phẩm</label><input type="text" placeholder="Tìm..." value={filters.product} onChange={e => setFilters({...filters, product: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Trạng thái</label><input type="text" placeholder="Hoàn, Thành công..." value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
          </div>
        </div>
      )}

      {/* FULL DATA TABLE WITH INLINE EDIT */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3">Ngày HĐ</th>
                <th className="px-3 py-3">Nguồn Page</th>
                <th className="px-3 py-3">Khách hàng (Tên-SĐT)</th>
                <th className="px-3 py-3">Địa chỉ giao</th>
                <th className="px-3 py-3">Sản phẩm</th>
                <th className="px-3 py-3 w-16 text-center">SL</th>
                <th className="px-3 py-3 text-right">Đơn giá</th>
                <th className="px-3 py-3 text-right">Tổng thu</th>
                <th className="px-3 py-3">Mã VĐ</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3 text-right">Phí Ship</th>
                <th className="px-3 py-3">Ghi chú</th>
                {(canEdit || canDelete) && <th className="px-3 py-3 text-center sticky right-0 bg-gray-50 shadow-[-5px_0_10px_rgba(0,0,0,0.02)]">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={14} className="px-4 py-8 text-center text-gray-500">Không tìm thấy đơn hàng nào phù hợp.</td></tr>
              ) : filteredOrders.map((order, index) => {
                const isEditing = editingRowId === order.id;

                return (
                  <tr key={order.id} className={`hover:bg-blue-50/30 transition-colors ${isEditing ? 'bg-yellow-50/50' : ''}`} onDoubleClick={() => startInlineEdit(order)}>
                    <td className="px-3 py-2 text-center text-gray-400">{index + 1}</td>
                    
                    {/* EDIT MODE: Hiển thị Input */}
                    {isEditing ? (
                      <>
                        <td className="px-1 py-1"><input type="date" value={editFormData.orderDate || ''} onChange={e => setEditFormData({...editFormData, orderDate: e.target.value})} className="w-full border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                        <td className="px-1 py-1"><input type="text" value={editFormData.source || ''} onChange={e => setEditFormData({...editFormData, source: e.target.value})} className="w-full border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Nguồn" /></td>
                        <td className="px-1 py-1"><input type="text" value={editFormData.customerInfo || ''} onChange={e => setEditFormData({...editFormData, customerInfo: e.target.value})} className="w-full border border-blue-500 rounded p-1 text-xs outline-none" placeholder="Tên - SĐT *" autoFocus/></td>
                        <td className="px-1 py-1"><input type="text" value={editFormData.address || ''} onChange={e => setEditFormData({...editFormData, address: e.target.value})} className="w-full border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Địa chỉ"/></td>
                        <td className="px-1 py-1"><input type="text" value={editFormData.productName || ''} onChange={e => setEditFormData({...editFormData, productName: e.target.value})} className="w-full border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Tên SP"/></td>
                        <td className="px-1 py-1"><input type="number" value={editFormData.quantity || 0} onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})} className="w-16 border border-gray-300 rounded p-1 text-xs text-center focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                        <td className="px-1 py-1"><input type="number" value={editFormData.price || 0} onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})} className="w-24 border border-gray-300 rounded p-1 text-xs text-right focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                        <td className="px-1 py-1"><input type="number" value={editFormData.total || 0} onChange={e => setEditFormData({...editFormData, total: Number(e.target.value)})} className="w-24 border border-gray-300 bg-gray-100 rounded p-1 text-xs text-right font-bold" readOnly title="Tự động tính"/></td>
                        <td className="px-1 py-1"><input type="text" value={editFormData.trackingCode || ''} onChange={e => setEditFormData({...editFormData, trackingCode: e.target.value})} className="w-24 border border-gray-300 rounded p-1 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Mã VĐ"/></td>
                        <td className="px-1 py-1"><input type="text" value={editFormData.status || ''} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-24 border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Trạng thái"/></td>
                        <td className="px-1 py-1"><input type="number" value={editFormData.shippingFee || 0} onChange={e => setEditFormData({...editFormData, shippingFee: Number(e.target.value)})} className="w-20 border border-gray-300 rounded p-1 text-xs text-right focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                        <td className="px-1 py-1"><input type="text" value={editFormData.notes || ''} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} className="w-32 border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Ghi chú"/></td>
                      </>
                    ) : (
                      /* VIEW MODE: Hiển thị Text bình thường */
                      <>
                        <td className="px-3 py-2 text-gray-700">{order.orderDate}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[120px]" title={order.source}>{order.source}</td>
                        <td className="px-3 py-2 font-semibold text-indigo-700 truncate max-w-[200px]" title={order.customerInfo}>{order.customerInfo}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[200px]" title={order.address}>{order.address}</td>
                        <td className="px-3 py-2 text-gray-800 truncate max-w-[180px]" title={order.productName}>{order.productName}</td>
                        <td className="px-3 py-2 text-center font-medium">{order.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{formatMoney(order.price)}</td>
                        <td className="px-3 py-2 text-right font-bold text-green-600 bg-green-50/30">{formatMoney(order.total)}</td>
                        <td className="px-3 py-2 font-mono text-xs text-blue-600">{order.trackingCode}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                            order.status.toLowerCase().includes('thành công') || order.status.toLowerCase().includes('đã nhận') ? 'bg-green-50 text-green-700 border-green-200' :
                            order.status.toLowerCase().includes('hủy') || order.status.toLowerCase().includes('hoàn') ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {order.status || 'Chưa XL'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500 text-xs">{formatMoney(order.shippingFee)}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[150px]" title={order.notes}>{order.notes}</td>
                      </>
                    )}

                    {/* ACTIONS CỘT CUỐI */}
                    {(canEdit || canDelete) && (
                      <td className="px-3 py-2 text-center sticky right-0 bg-white/90 backdrop-blur shadow-[-5px_0_10px_rgba(0,0,0,0.02)] group-hover:bg-blue-50/90">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={saveInlineEdit} disabled={isSavingEdit} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm"><Check className="w-4 h-4" /></button>
                            <button onClick={cancelInlineEdit} className="p-1.5 text-gray-500 bg-gray-200 hover:bg-gray-300 rounded-md"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {canEdit && <button onClick={() => startInlineEdit(order)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Chỉnh sửa"><Edit2 className="w-4 h-4" /></button>}
                            {canDelete && <button onClick={() => handleDelete(order.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM ĐƠN HÀNG MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Thêm Đơn Hàng Mới
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng (Tên & SĐT) *</label>
                  <input type="text" autoFocus value={addFormData.customerInfo} onChange={e => setAddFormData({...addFormData, customerInfo: e.target.value})} placeholder="VD: Anh Nam - 0987654321" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                  <input type="text" value={addFormData.address} onChange={e => setAddFormData({...addFormData, address: e.target.value})} placeholder="Số nhà, đường, xã, huyện, tỉnh..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
                  <input type="text" value={addFormData.productName} onChange={e => setAddFormData({...addFormData, productName: e.target.value})} placeholder="Tên SP..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá (VNĐ)</label>
                  <input type="number" value={addFormData.price || ''} onChange={e => setAddFormData({...addFormData, price: Number(e.target.value)})} placeholder="0" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                  <input type="number" value={addFormData.quantity || ''} onChange={e => setAddFormData({...addFormData, quantity: Number(e.target.value)})} min="1" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Tổng tiền (Tự tính)</label>
                  <input type="number" value={addFormData.total} readOnly className="w-full border border-green-200 bg-green-50 text-green-700 font-bold rounded-xl px-4 py-2.5 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày lên đơn</label>
                  <input type="date" value={addFormData.orderDate} onChange={e => setAddFormData({...addFormData, orderDate: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn Đơn</label>
                  <input type="text" value={addFormData.source} onChange={e => setAddFormData({...addFormData, source: e.target.value})} placeholder="Page, Web..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã Vận Đơn</label>
                  <input type="text" value={addFormData.trackingCode} onChange={e => setAddFormData({...addFormData, trackingCode: e.target.value})} placeholder="VD: VN123456" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select value={addFormData.status} onChange={e => setAddFormData({...addFormData, status: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-white">
                    <option value="">Chưa xử lý</option>
                    <option value="Đang giao hàng">Đang giao hàng</option>
                    <option value="Phát thành công">Phát thành công / Đã nhận</option>
                    <option value="Đang hoàn">Đang hoàn</option>
                    <option value="Hủy">Đã Hủy</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm</label>
                  <input type="text" value={addFormData.notes} onChange={e => setAddFormData({...addFormData, notes: e.target.value})} placeholder="Nhắc shipper giao giờ hành chính..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleSaveAdd} disabled={isSavingAdd || !addFormData.customerInfo.trim()} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {isSavingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
