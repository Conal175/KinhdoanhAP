import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Download, Upload, Loader2, Plus, Edit2, Trash2, X, Save, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Order, fetchOrders, insertOrder, updateOrder, deleteOrder } from '../store';
import { useAuth } from '../contexts/AuthContext';

interface Props { projectId: string; }

export function OrderManagement({ projectId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { checkPermission } = useAuth(); 
  const canEdit = checkPermission('orders', 'edit');
  const canDelete = checkPermission('orders', 'delete');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Order, 'id' | 'projectId'>>({
    orderDate: new Date().toISOString().split('T')[0], source: '', customerInfo: '', address: '',
    productName: '', quantity: 1, price: 0, total: 0, notes: '', shippingDate: '', trackingCode: '', status: '', shippingFee: 0
  });

  useEffect(() => { loadOrders(); }, [projectId]);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchOrders(projectId);
    setOrders(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      orderDate: new Date().toISOString().split('T')[0], source: '', customerInfo: '', address: '',
      productName: '', quantity: 1, price: 0, total: 0, notes: '', shippingDate: '', trackingCode: '', status: '', shippingFee: 0
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (order: Order) => {
    if (!canEdit) return;
    setEditingId(order.id);
    setFormData({ ...order });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.customerInfo.trim() || !canEdit || isSaving) return;
    setIsSaving(true);

    if (editingId) {
      const success = await updateOrder(editingId, formData);
      if (success) setOrders(orders.map(o => o.id === editingId ? { ...o, ...formData } : o));
    } else {
      const newOrder = await insertOrder({ projectId, ...formData });
      if (newOrder) setOrders([newOrder, ...orders]);
    }
    
    setIsSaving(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
      const success = await deleteOrder(id);
      if (success) setOrders(orders.filter(o => o.id !== id));
    }
  };

  // Tự động tính tổng tiền
  useEffect(() => {
    if (showForm && !editingId) {
      setFormData(prev => ({ ...prev, total: prev.quantity * prev.price }));
    }
  }, [formData.quantity, formData.price]);

  // XUẤT EXCEL CHUẨN FORMAT
  const handleExportExcel = () => {
    const exportData = orders.map(o => ({
      'Ngày': o.orderDate,
      'Nguồn': o.source,
      'Tên khách hàng': o.customerInfo,
      'Địa Chỉ': o.address,
      'Tên sp': o.productName,
      'Số Lượng': o.quantity,
      'Giá Bán': o.price,
      'TỔNG ĐƠN': o.total,
      'ghi chú': o.notes,
      'Ngày Lên Đơn': o.shippingDate,
      'Mã Vận Đơn': o.trackingCode,
      'Trạng thái đơn hàng': o.status,
      'phí vc': o.shippingFee
    }));

    if (exportData.length === 0) {
      exportData.push({ 'Ngày': '', 'Nguồn': '', 'Tên khách hàng': 'File Mẫu', 'Địa Chỉ': '', 'Tên sp': '', 'Số Lượng': 1, 'Giá Bán': 0, 'TỔNG ĐƠN': 0, 'ghi chú': '', 'Ngày Lên Đơn': '', 'Mã Vận Đơn': '', 'Trạng thái đơn hàng': '', 'phí vc': 0 });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Quan_Ly_Don_Hang`);
    XLSX.writeFile(workbook, `Danh_Sach_Don_Hang.xlsx`);
  };

  // NHẬP EXCEL VỚI CƠ CHẾ CHỐNG LỖI KÝ TỰ (Xóa dấu Enter trong tiêu đề cột Excel)
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
        const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        let successCount = 0;

        for (const rawRow of rawData) {
          // Chuẩn hóa key: Xóa ký tự \n, khoảng trắng dư thừa
          const row: any = {};
          for (const key in rawRow) {
            const cleanKey = key.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
            row[cleanKey] = rawRow[key];
          }

          if (row['tên khách hàng']) {
            // Xử lý ngày tháng từ Excel (có thể là Date object hoặc chuỗi)
            const parseDate = (val: any) => {
              if (!val) return '';
              if (val instanceof Date) return val.toISOString().split('T')[0];
              return String(val).trim();
            };

            const newOrder = {
              projectId,
              orderDate: parseDate(row['ngày']),
              source: row['nguồn'] ? String(row['nguồn']) : '',
              customerInfo: String(row['tên khách hàng']),
              address: row['địa chỉ'] ? String(row['địa chỉ']) : '',
              productName: row['tên sp'] ? String(row['tên sp']) : '',
              quantity: Number(row['số lượng']) || 1,
              price: Number(row['giá bán']) || 0,
              total: Number(row['tổng đơn']) || 0,
              notes: row['ghi chú'] ? String(row['ghi chú']) : '',
              shippingDate: parseDate(row['ngày lên đơn']),
              trackingCode: row['mã vận đơn'] ? String(row['mã vận đơn']) : '',
              status: row['trạng thái đơn hàng'] || row['trạng thái'] ? String(row['trạng thái đơn hàng'] || row['trạng thái']) : '',
              shippingFee: Number(row['phí vc'] || row['phí vận chuyển']) || 0
            };
            
            await insertOrder(newOrder);
            successCount++;
          }
        }
        alert(`✅ Đã nhập thành công ${successCount} đơn hàng!`);
        loadOrders();
      } catch (error) {
        alert('❌ Lỗi đọc file Excel. Định dạng không hợp lệ!');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredOrders = orders.filter(o => 
    o.customerInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.trackingCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMoney = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShoppingBag className="w-7 h-7 text-indigo-600" /> Quản Lý Đơn Hàng</h2>
          <p className="text-gray-500 mt-1">Theo dõi, cập nhật trạng thái & vận đơn</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Tìm tên khách, mã vận đơn..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm">
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 rounded-lg">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            {canEdit && (
              <>
                <div className="w-px h-5 bg-gray-200 mx-1"></div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg disabled:opacity-50">
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Nhập Excel
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls, .csv" className="hidden" />
              </>
            )}
          </div>
          
          {canEdit && (
            <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 font-medium shadow-sm">
              <Plus className="w-4 h-4" /> Thêm Đơn
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-indigo-900">{editingId ? 'Sửa Đơn Hàng' : 'Thêm Đơn Hàng Mới'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div><label className="block mb-1 text-gray-600">Ngày</label><input type="date" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block mb-1 text-gray-600">Nguồn</label><input type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div className="lg:col-span-2"><label className="block mb-1 text-gray-600 font-medium">Khách hàng (Tên - SĐT) *</label><input type="text" value={formData.customerInfo} onChange={e => setFormData({...formData, customerInfo: e.target.value})} placeholder="VD: Nguyễn Văn A - 0987654321" className="w-full border rounded-lg px-3 py-2" /></div>
            <div className="lg:col-span-3"><label className="block mb-1 text-gray-600">Địa chỉ</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            
            <div className="lg:col-span-2"><label className="block mb-1 text-gray-600">Sản phẩm</label><input type="text" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block mb-1 text-gray-600">Số lượng</label><input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block mb-1 text-gray-600">Đơn giá</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block mb-1 text-gray-600 font-medium">Tổng tiền</label><input type="number" value={formData.total} onChange={e => setFormData({...formData, total: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2 bg-gray-50" /></div>

            <div><label className="block mb-1 text-gray-600">Ngày lên đơn</label><input type="date" value={formData.shippingDate} onChange={e => setFormData({...formData, shippingDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block mb-1 text-gray-600">Mã vận đơn</label><input type="text" value={formData.trackingCode} onChange={e => setFormData({...formData, trackingCode: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block mb-1 text-gray-600">Trạng thái</label><input type="text" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} placeholder="VD: Phát thành công" className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block mb-1 text-gray-600">Phí VC</label><input type="number" value={formData.shippingFee} onChange={e => setFormData({...formData, shippingFee: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" /></div>
            <div className="lg:col-span-4"><label className="block mb-1 text-gray-600">Ghi chú</label><input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSave} disabled={isSaving || !formData.customerInfo} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu Đơn Hàng
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Ngày/Nguồn</th>
                <th className="px-4 py-3 min-w-[200px]">Khách hàng</th>
                <th className="px-4 py-3 min-w-[200px]">Sản phẩm</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 whitespace-nowrap">Vận chuyển</th>
                <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                {(canEdit || canDelete) && <th className="px-4 py-3 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Không có đơn hàng nào.</td></tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-indigo-50/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.orderDate}</div>
                    <div className="text-xs text-gray-500 mt-1 max-w-[120px] truncate" title={order.source}>{order.source}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-indigo-700">{order.customerInfo}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2" title={order.address}>{order.address}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.productName} <span className="text-gray-500 font-normal">x{order.quantity}</span></div>
                    {order.notes && <div className="text-xs text-amber-600 bg-amber-50 inline-block px-1.5 py-0.5 rounded mt-1">{order.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{formatMoney(order.total)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500">Gửi: {order.shippingDate}</div>
                    <div className="font-medium text-blue-600 mt-0.5">{order.trackingCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      order.status.toLowerCase().includes('thành công') || order.status.toLowerCase().includes('đã nhận') ? 'bg-green-100 text-green-700' :
                      order.status.toLowerCase().includes('hủy') || order.status.toLowerCase().includes('hoàn') ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status || 'Đang xử lý'}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && <button onClick={() => handleEdit(order)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>}
                        {canDelete && <button onClick={() => handleDelete(order.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
