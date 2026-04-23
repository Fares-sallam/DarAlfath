import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCountry } from '@/contexts/CountryContext';

/* ── Types ── */
type SelectedCountryLite = {
  id: string;
  name: string;
  code: string;
  currency: string;
  currency_symbol: string;
};

type OrderLite = {
  id: string;
  user_id?: string | null;
  total_price: number;
  status: string;
  created_at: string;
  country?: string | null;
  shipping_address?: {
    city?: string;
    country?: string;
  } | null;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
};

function normalizeText(value?: string | null) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function orderMatchesCountry(
  order: OrderLite,
  selectedCountry: SelectedCountryLite | null
) {
  if (!selectedCountry) return true;

  const selectedName = normalizeText(selectedCountry.name);
  const selectedCode = normalizeText(selectedCountry.code);

  const orderCountry = normalizeText(order.country);
  const shippingCountry = normalizeText(order.shipping_address?.country);

  const candidates = [orderCountry, shippingCountry].filter(Boolean);

  if (candidates.length === 0) {
    return true;
  }

  return candidates.some(
    (candidate) => candidate === selectedName || candidate === selectedCode
  );
}

async function fetchOrdersForDashboard(
  limit?: number,
  fromIso?: string
): Promise<OrderLite[]> {
  let query = supabase
    .from('orders')
    .select(`
      id,
      user_id,
      total_price,
      status,
      created_at,
      country,
      shipping_address,
      profiles(full_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (fromIso) query = query.gte('created_at', fromIso);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as OrderLite[];
}

/* ── Books summary stats ── */
export interface BookStats {
  total: number;
  active: number;
  inactive: number;
  digital: number;
  paper: number;
  both: number;
}

async function fetchScopedProductIds(selectedCountry: SelectedCountryLite | null): Promise<string[] | null> {
  if (!selectedCountry) return null;

  const tryWithCountry = await supabase
    .from('product_inventory')
    .select('product_id, stock, country_id');

  if (!tryWithCountry.error) {
    const rows = (tryWithCountry.data ?? []) as {
      product_id: string;
      stock: number;
      country_id?: string | null;
    }[];

    return Array.from(
      new Set(
        rows
          .filter((r) => r.country_id === selectedCountry.id && (r.stock ?? 0) > 0)
          .map((r) => r.product_id)
      )
    );
  }

  const tryWithoutCountry = await supabase
    .from('product_inventory')
    .select('product_id, stock');

  if (!tryWithoutCountry.error) {
    return null;
  }

  return null;
}

export function useBookStats() {
  const { selectedCountry } = useCountry();

  return useQuery({
    queryKey: ['dashboard', 'book-stats', selectedCountry?.id ?? 'all'],
    queryFn: async (): Promise<BookStats> => {
      const productIds = await fetchScopedProductIds(
        selectedCountry
          ? {
              id: selectedCountry.id,
              name: selectedCountry.name,
              code: selectedCountry.code,
              currency: selectedCountry.currency,
              currency_symbol: selectedCountry.currency_symbol,
            }
          : null
      );

      if (Array.isArray(productIds) && productIds.length === 0) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          digital: 0,
          paper: 0,
          both: 0,
        };
      }

      let query = supabase.from('products').select('id, is_active, type');

      if (Array.isArray(productIds) && productIds.length > 0) {
        query = query.in('id', productIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as { id: string; is_active: boolean; type: string }[];

      return {
        total: rows.length,
        active: rows.filter((r) => r.is_active).length,
        inactive: rows.filter((r) => !r.is_active).length,
        digital: rows.filter((r) => r.type === 'رقمي').length,
        paper: rows.filter((r) => r.type === 'ورقي').length,
        both: rows.filter((r) => r.type === 'ورقي ورقمي').length,
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
  const { selectedCountry } = useCountry();

  return useQuery({
    queryKey: ['dashboard', 'top-selling', limit, selectedCountry?.id ?? 'all'],
    queryFn: async (): Promise<TopSellingBook[]> => {
      const from = new Date();
      from.setDate(from.getDate() - 30);

      const allOrders = await fetchOrdersForDashboard(undefined, from.toISOString());
      const validOrders = allOrders.filter(
        (o) =>
          o.status !== 'ملغي' &&
          o.status !== 'مرتجع' &&
          orderMatchesCountry(
            o,
            selectedCountry
              ? {
                  id: selectedCountry.id,
                  name: selectedCountry.name,
                  code: selectedCountry.code,
                  currency: selectedCountry.currency,
                  currency_symbol: selectedCountry.currency_symbol,
                }
              : null
          )
      );

      if (validOrders.length === 0) return [];

      const orderIds = validOrders.map((o) => o.id);

      const { data, error } = await supabase
        .from('order_items')
        .select('quantity, price_per_item, products(id, title, author, cover_url, type), order_id')
        .in('order_id', orderIds);

      if (error) throw error;

      const map: Record<string, TopSellingBook> = {};

      for (const item of (data ?? []) as {
        quantity: number;
        price_per_item: number;
        order_id: string;
        products: {
          id: string;
          title: string;
          author: string;
          cover_url?: string;
          type: string;
        } | null;
      }[]) {
        const p = item.products;
        if (!p) continue;

        if (!map[p.id]) {
          map[p.id] = {
            productId: p.id,
            title: p.title,
            author: p.author,
            cover_url: p.cover_url,
            totalSold: 0,
            totalRevenue: 0,
            type: p.type,
          };
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
  user_id?: string | null;
  total_price: number;
  status: string;
  created_at: string;
  country?: string | null;
  shipping_address?: { city?: string; country?: string };
  profiles?: { full_name?: string; avatar_url?: string };
  currencySymbol?: string;
}

export function useRecentOrders(limit = 5) {
  const { selectedCountry, currencySymbol } = useCountry();

  return useQuery({
    queryKey: ['dashboard', 'recent-orders', limit, selectedCountry?.id ?? 'all'],
    queryFn: async (): Promise<OrderSummary[]> => {
      const rows = await fetchOrdersForDashboard(100);

      const filtered = rows
        .filter((row) =>
          orderMatchesCountry(
            row,
            selectedCountry
              ? {
                  id: selectedCountry.id,
                  name: selectedCountry.name,
                  code: selectedCountry.code,
                  currency: selectedCountry.currency,
                  currency_symbol: selectedCountry.currency_symbol,
                }
              : null
          )
        )
        .slice(0, limit);

      return filtered.map((row) => ({
        ...row,
        currencySymbol,
      }));
    },
  });
}

/* ── Dashboard KPIs ── */
export interface DashboardKpi {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  currencyCode: string;
  currencySymbol: string;
  countryName: string | null;
}

export function useDashboardKpi() {
  const { selectedCountry } = useCountry();

  return useQuery({
    queryKey: ['dashboard', 'kpi', selectedCountry?.id ?? 'all'],
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<DashboardKpi> => {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const orders = await fetchOrdersForDashboard(undefined, thisMonth.toISOString());

      const filteredOrders = orders.filter((o) =>
        orderMatchesCountry(
          o,
          selectedCountry
            ? {
                id: selectedCountry.id,
                name: selectedCountry.name,
                code: selectedCountry.code,
                currency: selectedCountry.currency,
                currency_symbol: selectedCountry.currency_symbol,
              }
            : null
        )
      );

      const validOrders = filteredOrders.filter(
        (o) => o.status !== 'ملغي' && o.status !== 'مرتجع'
      );

      const pendingOrders = filteredOrders.filter((o) =>
        ['جديد', 'قيد المراجعة', 'تم التأكيد'].includes(o.status)
      ).length;

      const uniqueCustomers = new Set(
        validOrders.map((o) => o.user_id).filter(Boolean)
      ).size;

      return {
        totalRevenue: validOrders.reduce((s, o) => s + o.total_price, 0),
        totalOrders: validOrders.length,
        totalCustomers: uniqueCustomers,
        pendingOrders,
        currencyCode: selectedCountry?.currency ?? 'EGP',
        currencySymbol: selectedCountry?.currency_symbol ?? 'ج.م',
        countryName: selectedCountry?.name ?? null,
      };
    },
  });
}