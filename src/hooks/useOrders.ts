import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/* ── Types ── */
export interface OrderItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  price_per_item: number;
  discount_per_item: number;
  is_digital: boolean;
  products: {
    id: string;
    title: string;
    author: string;
    cover_url?: string | null;
    type: string;
  } | null;
  product_variants?: {
    id: string;
    variant_name: string;
  } | null;
}

export interface ShippingAddress {
  name?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  country_id?: string | null;
  status: string;
  total_price: number;
  shipping_cost: number;
  discount_amount: number;
  coupon_id?: string | null;
  payment_method_id?: string | null;
  payment_status: string;
  shipping_company_id?: string | null;
  tracking_number?: string | null;
  shipping_address?: ShippingAddress | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: { id: string; full_name?: string | null; phone?: string | null; avatar_url?: string | null } | null;
  countries?: { name: string; currency_symbol: string } | null;
  coupons?: { code: string } | null;
  payment_methods?: { method_name: string; provider?: string | null } | null;
  shipping_companies?: { company_name: string; logo_url?: string | null } | null;
  order_items?: OrderItem[];
}

/* ── Fetch orders ── */
export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from('orders')
        .select(`
          id, user_id, country_id, status, total_price, shipping_cost,
          discount_amount, coupon_id, payment_method_id, payment_status,
          shipping_company_id, tracking_number, shipping_address, notes,
          created_at, updated_at,
          profiles(id, full_name, phone, avatar_url),
          countries(name, currency_symbol),
          coupons(code),
          payment_methods(method_name, provider),
          shipping_companies(company_name, logo_url)
        `)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'الكل') {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentStatus && filters.paymentStatus !== 'الكل') {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        query = query.lte('created_at', to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
}

/* ── Fetch single order with items ── */
export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: ['order-detail', orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, user_id, country_id, status, total_price, shipping_cost,
          discount_amount, coupon_id, payment_method_id, payment_status,
          shipping_company_id, tracking_number, shipping_address, notes,
          created_at, updated_at,
          profiles(id, full_name, phone, avatar_url),
          countries(name, currency_symbol),
          coupons(code),
          payment_methods(method_name, provider),
          shipping_companies(company_name, logo_url),
          order_items(
            id, product_id, variant_id, quantity, price_per_item,
            discount_per_item, is_digital,
            products(id, title, author, cover_url, type),
            product_variants(id, variant_name)
          )
        `)
        .eq('id', orderId!)
        .single();

      if (error) throw error;
      return data as Order;
    },
  });
}

/* ── Update order status ── */
export interface UpdateOrderInput {
  id: string;
  status?: string;
  payment_status?: string;
  tracking_number?: string;
  shipping_company_id?: string | null;
  notes?: string;
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateOrderInput) => {
      const { id, ...patch } = input;
      const { error } = await supabase
        .from('orders')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order-detail', input.id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم تحديث الطلب بنجاح');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Shipping companies dropdown ── */
export function useShippingCompanies() {
  return useQuery({
    queryKey: ['shipping-companies-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_companies')
        .select('id, company_name, logo_url')
        .eq('is_active', true)
        .order('company_name');
      if (error) throw error;
      return (data ?? []) as { id: string; company_name: string; logo_url?: string | null }[];
    },
  });
}

/* ── Export orders CSV ── */
export function exportOrdersCsv(orders: Order[]) {
  const headers = [
    'رقم الطلب', 'العميل', 'الهاتف', 'المحافظة', 'المدينة',
    'الإجمالي', 'الشحن', 'الخصم', 'الدفع', 'حالة الدفع',
    'الحالة', 'شركة الشحن', 'رقم التتبع', 'التاريخ'
  ];

  const rows = orders.map(o => [
    o.id,
    o.profiles?.full_name ?? 'زائر',
    o.profiles?.phone ?? o.shipping_address?.phone ?? '',
    o.shipping_address?.governorate ?? '',
    o.shipping_address?.city ?? '',
    o.total_price,
    o.shipping_cost,
    o.discount_amount,
    o.payment_methods?.method_name ?? '',
    o.payment_status,
    o.status,
    o.shipping_companies?.company_name ?? '',
    o.tracking_number ?? '',
    new Date(o.created_at).toLocaleDateString('ar-EG'),
  ]);

  const bom = '\uFEFF';
  const csv = bom + [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
