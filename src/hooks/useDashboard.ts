import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/* ── Books summary stats ── */
export interface BookStats {
  total: number;
  active: number;
  inactive: number;
  digital: number;
  paper: number;
  both: number;
}

export function useBookStats() {
  return useQuery({
    queryKey: ['dashboard', 'book-stats'],
    queryFn: async (): Promise<BookStats> => {
      const { data, error } = await supabase
        .from('products')
        .select('is_active, type');
      if (error) throw error;
      const rows = (data ?? []) as { is_active: boolean; type: string }[];
      return {
        total: rows.length,
        active: rows.filter(r => r.is_active).length,
        inactive: rows.filter(r => !r.is_active).length,
        digital: rows.filter(r => r.type === 'رقمي').length,
        paper: rows.filter(r => r.type === 'ورقي').length,
        both: rows.filter(r => r.type === 'ورقي ورقمي').length,
      };
    },
  });
}

/* ── Top selling books (last 30 days) ── */
export interface TopSellingBook {
  productId: string;
  title: string;
  author: string;
  cover_url?: string;
  totalSold: number;
  totalRevenue: number;
  type: string;
}

export function useTopSellingBooks(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'top-selling', limit],
    queryFn: async (): Promise<TopSellingBook[]> => {
      const from = new Date();
      from.setDate(from.getDate() - 30);

      // Step 1: Get valid order IDs in the last 30 days
      const { data: validOrders, error: ordErr } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', from.toISOString())
        .not('status', 'in', '("ملغي","مرتجع")');

      if (ordErr) throw ordErr;
      if (!validOrders || validOrders.length === 0) return [];

      const orderIds = validOrders.map((o: { id: string }) => o.id);

      // Step 2: Get items for those orders
      const { data, error } = await supabase
        .from('order_items')
        .select('quantity, price_per_item, products(id, title, author, cover_url, type)')
        .in('order_id', orderIds);

      if (error) throw error;

      const map: Record<string, TopSellingBook> = {};
      for (const item of (data ?? []) as {
        quantity: number;
        price_per_item: number;
        products: { id: string; title: string; author: string; cover_url?: string; type: string } | null;
        orders: unknown;
      }[]) {
        const p = item.products;
        if (!p) continue;
        if (!map[p.id]) {
          map[p.id] = { productId: p.id, title: p.title, author: p.author, cover_url: p.cover_url, totalSold: 0, totalRevenue: 0, type: p.type };
        }
        map[p.id].totalSold += item.quantity;
        map[p.id].totalRevenue += item.price_per_item * item.quantity;
      }

      return Object.values(map)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit);
    },
  });
}

/* ── Recent audit logs ── */
export interface AuditEntry {
  id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name?: string; avatar_url?: string };
}

export function useRecentAuditLogs(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'audit-logs', limit],
    queryFn: async (): Promise<AuditEntry[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id, action, table_name, record_id, old_data, new_data, created_at,
          profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as AuditEntry[];
    },
  });
}

/* ── Orders summary ── */
export interface OrderSummary {
  id: string;
  user_id?: string;
  total_price: number;
  status: string;
  created_at: string;
  shipping_address?: { city?: string };
  profiles?: { full_name?: string; avatar_url?: string };
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'recent-orders', limit],
    queryFn: async (): Promise<OrderSummary[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, user_id, total_price, status, created_at, shipping_address,
          profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as OrderSummary[];
    },
  });
}

/* ── Dashboard KPIs ── */
export interface DashboardKpi {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
}

export function useDashboardKpi() {
  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    staleTime: 2 * 60_000, // 2 min cache
    queryFn: async (): Promise<DashboardKpi> => {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [ordersRes, customersRes, pendingRes] = await Promise.all([
        // Use head+count for revenue to avoid fetching all rows
        supabase
          .from('orders')
          .select('total_price')
          .gte('created_at', thisMonth.toISOString())
          .not('status', 'in', '("ملغي","مرتجع")')
          .limit(500), // safety cap
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['جديد', 'قيد المراجعة', 'تم التأكيد']),
      ]);

      const orders = (ordersRes.data ?? []) as { total_price: number }[];
      return {
        totalRevenue: orders.reduce((s, o) => s + o.total_price, 0),
        totalOrders: orders.length,
        totalCustomers: customersRes.count ?? 0,
        pendingOrders: pendingRes.count ?? 0,
      };
    },
  });
}
