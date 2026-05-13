import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCountry } from '@/contexts/CountryContext';

/* ── Types ── */
export interface CustomerOrder {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  country_id?: string | null;
  shipping_address?: { city?: string; governorate?: string };
  order_items?: {
    quantity: number;
    products: { title: string } | null;
  }[];
}

export interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  country_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  lastOrderCity?: string;
  countries?: { name: string; currency_symbol: string } | null;
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  country_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  countries: { name: string; currency_symbol: string } | null;
};

type OrderAggRow = {
  user_id: string;
  total_price: number;
  created_at: string;
  shipping_address: { city?: string; governorate?: string } | null;
  country_id?: string | null;
};

/* ── Fetch customers with aggregated order data (country-aware) ── */
export function useCustomers() {
  const { selectedCountry } = useCountry();

  return useQuery({
    queryKey: ['customers', selectedCountry?.id ?? 'all'],
    queryFn: async (): Promise<Customer[]> => {

      // ── 1. جلب الملفات الشخصية (role=user أو customer أو null) ──
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, country_id, avatar_url, is_active, created_at, updated_at')
        .or('role.eq.user,role.eq.customer,role.is.null')
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      // ── 2. جلب الطلبات لحساب الإحصاءات ──────────────────────
      let ordersQuery = supabase
        .from('orders')
        .select('user_id, total_price, created_at, shipping_address, country_id')
        .not('status', 'in', '("ملغي","مرتجع")')
        .not('user_id', 'is', null);

      if (selectedCountry?.id) {
        ordersQuery = ordersQuery.eq('country_id', selectedCountry.id);
      }

      const { data: orderData, error: oErr } = await ordersQuery;
      if (oErr) throw oErr;

      // ── 3. جلب الدول (بشكل منفصل لتجنب فشل الـ JOIN) ─────────
      const { data: countriesData } = await supabase
        .from('countries')
        .select('id, name, currency_symbol');

      const countriesMap = new Map(
        (countriesData ?? []).map((c) => [c.id, { name: c.name, currency_symbol: c.currency_symbol }])
      );

      // ── 4. بناء خريطة الطلبات ──────────────────────────────────
      const profileRows = (profiles ?? []) as (ProfileRow & { email?: string })[];
      const orders = (orderData ?? []) as OrderAggRow[];

      const orderMap: Record<string, { count: number; total: number; lastAt: string; lastCity: string }> = {};

      for (const o of orders) {
        if (!o.user_id) continue;
        if (!orderMap[o.user_id]) {
          orderMap[o.user_id] = { count: 0, total: 0, lastAt: '', lastCity: '' };
        }
        orderMap[o.user_id].count += 1;
        orderMap[o.user_id].total += o.total_price;
        if (!orderMap[o.user_id].lastAt || o.created_at > orderMap[o.user_id].lastAt) {
          orderMap[o.user_id].lastAt  = o.created_at;
          orderMap[o.user_id].lastCity = o.shipping_address?.city ?? o.shipping_address?.governorate ?? '';
        }
      }

      // ── 5. تصفية حسب الدولة المختارة ──────────────────────────
      let visibleProfiles = profileRows;

      if (selectedCountry?.id) {
        visibleProfiles = profileRows.filter((p) =>
          p.country_id === selectedCountry.id || !!orderMap[p.id]
        );
      }

      // إذا لا توجد نتائج بعد التصفية، أرجع الكل (بدون تصفية دولة)
      if (visibleProfiles.length === 0 && profileRows.length > 0) {
        visibleProfiles = profileRows;
      }

      // ── 6. بناء النتيجة النهائية ───────────────────────────────
      return visibleProfiles.map((p) => {
        const countryData = selectedCountry
          ? { name: selectedCountry.name, currency_symbol: selectedCountry.currency_symbol }
          : p.country_id ? (countriesMap.get(p.country_id) ?? null) : null;

        return {
          ...p,
          email: p.email ?? undefined,
          countries: countryData,
          totalOrders: orderMap[p.id]?.count ?? 0,
          totalSpent:  orderMap[p.id]?.total ?? 0,
          lastOrderAt: orderMap[p.id]?.lastAt,
          lastOrderCity: orderMap[p.id]?.lastCity,
        };
      });
    },
  });
}

/* ── Fetch single customer's orders (country-aware) ── */
export function useCustomerOrders(userId: string | null) {
  const { selectedCountry } = useCountry();

  return useQuery({
    queryKey: ['customer-orders', userId, selectedCountry?.id ?? 'all'],
    enabled: !!userId,
    queryFn: async (): Promise<CustomerOrder[]> => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          status,
          total_price,
          created_at,
          country_id,
          shipping_address,
          order_items(quantity, products(title))
        `)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (selectedCountry?.id) {
        query = query.eq('country_id', selectedCountry.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []) as CustomerOrder[];
    },
  });
}

/* ── Toggle customer active status ── */
export function useToggleCustomerStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(vars.is_active ? 'تم تفعيل العميل' : 'تم حظر العميل');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Update customer profile ── */
export interface UpdateCustomerInput {
  id: string;
  full_name?: string;
  phone?: string;
}

export function useUpdateCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCustomerInput) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: input.full_name, phone: input.phone })
        .eq('id', input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم تحديث بيانات العميل');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}