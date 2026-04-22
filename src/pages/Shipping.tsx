import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { MOCK_ORDERS } from '@/constants/mockData';
import {
  Truck, MapPin, Package, CheckCircle, Clock, Search,
  Download, Printer, Plus, Edit, Eye, X, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/types';

const SHIPPING_COMPANIES = [
  { name: 'بوسطة', logo: '📮', color: 'text-green-600', bg: 'bg-green-50', api: true },
  { name: 'Mylerz', logo: '🛵', color: 'text-purple-600', bg: 'bg-purple-50', api: true },
  { name: 'J&T Express', logo: '🏎️', color: 'text-red-600', bg: 'bg-red-50', api: false },
  { name: 'Aramex', logo: '📦', color: 'text-orange-600', bg: 'bg-orange-50', api: false },
  { name: 'DHL', logo: '✈️', color: 'text-yellow-600', bg: 'bg-yellow-50', api: false },
  { name: 'R2S', logo: '🚚', color: 'text-blue-600', bg: 'bg-blue-50', api: false },
];

const STATUS_STEPS = [
  { key: 'جديد', label: 'تم استلام الطلب' },
  { key: 'تم التأكيد', label: 'تم التأكيد والتجهيز' },
  { key: 'جاري الشحن', label: 'تم تسليم الشحنة' },
  { key: 'تم الشحن', label: 'في مركز الفرز' },
  { key: 'تم التوصيل', label: 'تم التوصيل' },
];

const STATUS_FLOW: Order['status'][] = ['جديد', 'قيد المراجعة', 'تم التأكيد', 'جاري الشحن', 'تم التوصيل'];

const statusCfg: Record<string, string> = {
  'جديد': 'bg-cyan-100 text-cyan-700',
  'قيد المراجعة': 'bg-yellow-100 text-yellow-700',
  'تم التأكيد': 'bg-blue-100 text-blue-700',
  'جاري الشحن': 'bg-indigo-100 text-indigo-700',
  'تم التوصيل': 'bg-green-100 text-green-700',
  'ملغي': 'bg-red-100 text-red-500',
  'مرتجع': 'bg-orange-100 text-orange-600',
};

interface ShipmentFormData {
  orderId: string;
  company: string;
  trackingNumber: string;
  weight: string;
  dimensions: string;
  shippingCost: string;
  notes: string;
}

const emptyShipForm: ShipmentFormData = {
  orderId: '', company: 'Aramex', trackingNumber: '', weight: '', dimensions: '', shippingCost: '', notes: ''
};

export default function Shipping() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [filterCompany, setFilterCompany] = useState('الكل');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shipForm, setShipForm] = useState<ShipmentFormData>(emptyShipForm);

  const filtered = orders.filter(o => {
    const ms = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.includes(search) || o.city.includes(search);
    const mst = filterStatus === 'الكل' || o.status === filterStatus;
    const mc = filterCompany === 'الكل' || o.shippingCompany === filterCompany;
    return ms && mst && mc;
  });

  const stats = {
    pending: orders.filter(o => o.status === 'تم التأكيد').length,
    inTransit: orders.filter(o => o.status === 'جاري الشحن').length,
    delivered: orders.filter(o => o.status === 'تم التوصيل').length,
    returned: orders.filter(o => o.status === 'مرتجع').length,
  };

  const getStepDone = (order: Order, stepKey: string): boolean => {
    const statusIndex = STATUS_FLOW.indexOf(order.status);
    const stepIndex = STATUS_FLOW.indexOf(stepKey as Order['status']);
    return stepIndex <= statusIndex;
  };

  const handleCreateShipment = () => {
    if (!shipForm.orderId || !shipForm.trackingNumber) {
      toast.error('يرجى ملء رقم الطلب ورقم التتبع');
      return;
    }
    setOrders(prev => prev.map(o =>
      o.id === shipForm.orderId
        ? { ...o, shippingCompany: shipForm.company, trackingNumber: shipForm.trackingNumber, status: 'جاري الشحن' }
        : o
    ));
    toast.success(`تم إنشاء شحنة بنجاح — رقم التتبع: ${shipForm.trackingNumber}`);
    setShowCreateModal(false);
    setShipForm(emptyShipForm);
  };

  return (
    <Layout>
      <div className="fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="section-title">إدارة الشحن</h1>
            <p className="section-subtitle">إدارة شركات الشحن، إنشاء الشحنات، تتبع التوصيل</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => toast.success('تم طباعة ملصقات الشحن')} className="btn-secondary flex items-center gap-2 text-sm">
              <Printer size={14} />
              طباعة الملصقات
            </button>
            <button onClick={() => toast.success('تم تصدير قائمة الشحن')} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} />
              تصدير
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={15} />
              إنشاء شحنة
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'جاهزة للشحن', value: stats.pending, icon: <Package size={18} className="text-blue-600" />, bg: 'bg-blue-50', color: 'text-blue-700' },
            { label: 'في الطريق', value: stats.inTransit, icon: <Truck size={18} className="text-indigo-600" />, bg: 'bg-indigo-50', color: 'text-indigo-700' },
            { label: 'تم التوصيل', value: stats.delivered, icon: <CheckCircle size={18} className="text-green-600" />, bg: 'bg-green-50', color: 'text-green-700' },
            { label: 'مرتجعة', value: stats.returned, icon: <RefreshCw size={18} className="text-orange-600" />, bg: 'bg-orange-50', color: 'text-orange-700' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shipping Companies */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">شركات الشحن المتاحة</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {SHIPPING_COMPANIES.map((c, i) => (
              <button
                key={i}
                onClick={() => toast.info(`ربط API مع ${c.name} — قريباً`)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  c.api ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl">{c.logo}</span>
                <span className="text-xs font-semibold text-gray-700">{c.name}</span>
                {c.api && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">API</span>}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            الشركات المحددة بـ "API" تدعم إنشاء الشحنة وتتبعها تلقائياً بعد ربط Supabase
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text" placeholder="ابحث برقم الطلب، العميل، المدينة..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pr-10"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field md:w-44">
            <option>الكل</option>
            {['جديد', 'تم التأكيد', 'جاري الشحن', 'تم التوصيل', 'ملغي', 'مرتجع'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="input-field md:w-40">
            <option>الكل</option>
            {SHIPPING_COMPANIES.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm text-gray-400">لا توجد شحنات</div>
            )}
            {filtered.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-2xl p-5 shadow-sm card-hover cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={order.customerAvatar} alt={order.customer} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{order.id}</p>
                      <p className="text-xs text-gray-500">{order.customer}</p>
                    </div>
                  </div>
                  <span className={`status-badge text-xs ${statusCfg[order.status] || 'bg-gray-100 text-gray-500'}`}>{order.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={12} />{order.city}</span>
                  <span className="flex items-center gap-1"><Truck size={12} />{order.shippingCompany || 'لم يُحدد'}</span>
                  {order.trackingNumber && (
                    <span className="font-mono text-indigo-600">{order.trackingNumber}</span>
                  )}
                  <span className="font-bold text-gray-800 mr-auto">{order.total} ر.س</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={e => { e.stopPropagation(); toast.success('تم إرسال طلب الطباعة'); }} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    <Printer size={11} />طباعة بوليصة
                  </button>
                  <button onClick={e => { e.stopPropagation(); toast.info(`تتبع الشحنة: ${order.trackingNumber || 'غير متاح'}`); }} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                    <Eye size={11} />تتبع
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tracking Panel */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-fit sticky top-4">
            {selectedOrder ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">تتبع الشحنة</h3>
                  <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={14} /></button>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-500">الطلب</p>
                  <p className="font-bold text-blue-700">{selectedOrder.id}</p>
                  <p className="text-sm text-gray-700 mt-0.5">{selectedOrder.customer}</p>
                  {selectedOrder.trackingNumber && (
                    <p className="text-xs font-mono text-indigo-600 mt-1">{selectedOrder.trackingNumber}</p>
                  )}
                </div>

                {/* Stepper */}
                <div className="relative">
                  <div className="absolute right-3.5 top-3.5 bottom-3.5 w-0.5 bg-gray-100" />
                  <div className="space-y-5">
                    {STATUS_STEPS.map((step, i) => {
                      const done = getStepDone(selectedOrder, step.key);
                      const isActive = selectedOrder.status === step.key;
                      return (
                        <div key={i} className="flex items-center gap-4 relative">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0 transition-all ${
                            done ? 'bg-blue-600 border-blue-600' : isActive ? 'bg-amber-400 border-amber-400' : 'bg-white border-gray-200'
                          }`}>
                            {done
                              ? <CheckCircle size={14} className="text-white" />
                              : <Clock size={14} className={isActive ? 'text-white' : 'text-gray-300'} />
                            }
                          </div>
                          <p className={`text-sm ${done ? 'font-semibold text-gray-800' : isActive ? 'font-semibold text-amber-600' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Update Status */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">تحديث الحالة</label>
                  <select
                    defaultValue={selectedOrder.status}
                    onChange={e => {
                      setOrders(prev => prev.map(o =>
                        o.id === selectedOrder.id ? { ...o, status: e.target.value as Order['status'] } : o
                      ));
                      setSelectedOrder(prev => prev ? { ...prev, status: e.target.value as Order['status'] } : null);
                      toast.success('تم تحديث الحالة');
                    }}
                    className="input-field text-sm py-2 h-auto mb-3"
                  >
                    {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <label className="block text-xs font-semibold text-gray-600 mb-2">شركة الشحن</label>
                  <select
                    defaultValue={selectedOrder.shippingCompany || ''}
                    onChange={e => {
                      setOrders(prev => prev.map(o =>
                        o.id === selectedOrder.id ? { ...o, shippingCompany: e.target.value } : o
                      ));
                      toast.success('تم تحديث شركة الشحن');
                    }}
                    className="input-field text-sm py-2 h-auto mb-3"
                  >
                    <option value="">اختر الشركة</option>
                    {SHIPPING_COMPANIES.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>

                  <button onClick={() => toast.info('حساب سعر الشحن...')} className="btn-secondary w-full text-sm flex items-center justify-center gap-2 mb-2">
                    <Truck size={13} />
                    حساب سعر الشحن
                  </button>
                  <button onClick={() => toast.success('تم إنشاء بوليصة الشحن')} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    <Printer size={13} />
                    طباعة بوليصة الشحن
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Truck size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-semibold">اختر طلباً</p>
                <p className="text-xs text-gray-400 mt-1">لعرض تفاصيل التتبع وتحديث الحالة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Truck size={18} className="text-blue-700" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">إنشاء شحنة جديدة</h2>
                  <p className="text-xs text-gray-400">أدخل بيانات الشحنة</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الطلب <span className="text-red-500">*</span></label>
                  <select value={shipForm.orderId} onChange={e => setShipForm(f => ({ ...f, orderId: e.target.value }))} className="input-field">
                    <option value="">اختر الطلب</option>
                    {orders.filter(o => o.status === 'تم التأكيد').map(o => (
                      <option key={o.id} value={o.id}>{o.id} — {o.customer}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">شركة الشحن</label>
                  <select value={shipForm.company} onChange={e => setShipForm(f => ({ ...f, company: e.target.value }))} className="input-field">
                    {SHIPPING_COMPANIES.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم التتبع <span className="text-red-500">*</span></label>
                <input value={shipForm.trackingNumber} onChange={e => setShipForm(f => ({ ...f, trackingNumber: e.target.value }))} className="input-field font-mono" placeholder="SA123456789" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">الوزن (كجم)</label>
                  <input type="number" value={shipForm.weight} onChange={e => setShipForm(f => ({ ...f, weight: e.target.value }))} className="input-field text-sm py-2 h-auto" placeholder="1.5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">الأبعاد</label>
                  <input value={shipForm.dimensions} onChange={e => setShipForm(f => ({ ...f, dimensions: e.target.value }))} className="input-field text-sm py-2 h-auto" placeholder="30×20×5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">تكلفة الشحن</label>
                  <input type="number" value={shipForm.shippingCost} onChange={e => setShipForm(f => ({ ...f, shippingCost: e.target.value }))} className="input-field text-sm py-2 h-auto" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ملاحظات</label>
                <textarea value={shipForm.notes} onChange={e => setShipForm(f => ({ ...f, notes: e.target.value }))} className="input-field resize-none" rows={2} placeholder="تعليمات خاصة للشحن..." />
              </div>
            </div>
            <div className="flex justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">إلغاء</button>
              <button onClick={handleCreateShipment} className="btn-primary flex items-center gap-2">
                <Plus size={15} />
                إنشاء الشحنة
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
