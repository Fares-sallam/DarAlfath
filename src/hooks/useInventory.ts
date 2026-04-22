import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/* ── Types ── */
export interface InventoryRow {
  id: string;
  product_id: string;
  variant_id?: string | null;
  country_id: string;
  stock: number;
  reserved_stock: number;
  min_stock: number;
  updated_at: string;
  // joined
  products: {
    id: string;
    title: string;
    author: string;
    cover_url?: string | null;
    type: string;
    base_price: number;
    sale_price?: number | null;
    is_active: boolean;
  } | null;
  product_variants?: {
    id: string;
    variant_name: string;
    variant_type: string;
    sku?: string | null;
  } | null;
  countries: {
    id: string;
    name: string;
    currency_symbol: string;
  } | null;
}

export type AlertLevel = 'حرج' | 'منخفض' | 'جيد' | 'رقمي';

export interface EnrichedInventoryRow extends InventoryRow {
  availableStock: number; // stock - reserved_stock
  alertLevel: AlertLevel;
  stockPct: number; // capped at 100
}

/* ── Derive alert level ── */
function getAlertLevel(row: InventoryRow): AlertLevel {
  if (row.products?.type === 'رقمي') return 'رقمي';
  const avail = row.stock - row.reserved_stock;
  if (avail <= 0) return 'حرج';
  if (avail <= row.min_stock * 0.5) return 'حرج';
  if (avail <= row.min_stock) return 'منخفض';
  return 'جيد';
}

function enrich(row: InventoryRow): EnrichedInventoryRow {
  const availableStock = Math.max(0, row.stock - row.reserved_stock);
  const alertLevel = getAlertLevel(row);
  const maxForBar = Math.max(row.min_stock * 3, row.stock, 1);
  const stockPct = row.products?.type === 'رقمي'
    ? 100
    : Math.round(Math.min((availableStock / maxForBar) * 100, 100));
  return { ...row, availableStock, alertLevel, stockPct };
}

/* ── Fetch inventory ── */
export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async (): Promise<EnrichedInventoryRow[]> => {
      const { data, error } = await supabase
        .from('product_inventory')
        .select(`
          id, product_id, variant_id, country_id, stock, reserved_stock, min_stock, updated_at,
          products(id, title, author, cover_url, type, base_price, sale_price, is_active),
          product_variants(id, variant_name, variant_type, sku),
          countries(id, name, currency_symbol)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return ((data ?? []) as InventoryRow[]).map(enrich);
    },
  });
}

/* ── Update stock quantity ── */
export interface UpdateStockInput {
  id: string;
  stock: number;
  min_stock?: number;
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateStockInput) => {
      const patch: Record<string, number> = { stock: input.stock };
      if (input.min_stock !== undefined) patch.min_stock = input.min_stock;
      const { error } = await supabase
        .from('product_inventory')
        .update(patch)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم تحديث الكمية بنجاح');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Fetch countries for filter ── */
export function useInventoryCountries() {
  return useQuery({
    queryKey: ['inventory-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, currency_symbol')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; currency_symbol: string }[];
    },
  });
}

/* ── Export CSV helper ── */
export function exportInventoryCsv(rows: EnrichedInventoryRow[]) {
  const headers = [
    'الكتاب', 'المؤلف', 'النسخة', 'الدولة', 'النوع',
    'المخزون الفعلي', 'المحجوز', 'المتاح', 'الحد الأدنى', 'الحالة', 'آخر تحديث'
  ];

  const csvRows = rows.map(r => [
    r.products?.title ?? '',
    r.products?.author ?? '',
    r.product_variants?.variant_name ?? 'أساسي',
    r.countries?.name ?? '',
    r.products?.type ?? '',
    r.stock,
    r.reserved_stock,
    r.availableStock,
    r.min_stock,
    r.alertLevel,
    new Date(r.updated_at).toLocaleDateString('ar-EG'),
  ]);

  const bom = '\uFEFF';
  const csv = bom + [headers, ...csvRows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
