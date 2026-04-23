import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCountry } from '@/contexts/CountryContext';

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
  products: {
    id: string;
    title: string;
    author: string;
    cover_url?: string | null;
    type: string;
    cost_price?: number;
    base_price: number;
    sale_price?: number | null;
    is_active: boolean;
  } | null;
  product_variants?: {
    id: string;
    variant_name: string;
    variant_type: string;
    sku?: string | null;
    price?: number;
  } | null;
  countries: {
    id: string;
    name: string;
    currency_symbol: string;
  } | null;
}

export type AlertLevel = 'حرج' | 'منخفض' | 'جيد' | 'رقمي';

export interface EnrichedInventoryRow extends InventoryRow {
  availableStock: number;
  alertLevel: AlertLevel;
  stockPct: number;
}

type CountryPriceRow = {
  product_id: string;
  country_id: string;
  cost_price: number;
  base_price: number;
  sale_price?: number | null;
};

type VariantCountryPriceRow = {
  variant_id: string;
  country_id: string;
  price: number;
};

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

  const stockPct =
    row.products?.type === 'رقمي'
      ? 100
      : Math.round(Math.min((availableStock / maxForBar) * 100, 100));

  return { ...row, availableStock, alertLevel, stockPct };
}

async function fetchCountryPriceMap(
  productIds: string[],
  selectedCountryId?: string | null
): Promise<Record<string, CountryPriceRow>> {
  if (!selectedCountryId || productIds.length === 0) return {};

  const { data, error } = await supabase
    .from('product_country_prices')
    .select('product_id, country_id, cost_price, base_price, sale_price')
    .eq('country_id', selectedCountryId)
    .in('product_id', productIds);

  if (error) {
    console.warn('[useInventory] product_country_prices fallback:', error.message);
    return {};
  }

  const map: Record<string, CountryPriceRow> = {};
  for (const row of (data ?? []) as CountryPriceRow[]) {
    map[row.product_id] = row;
  }
  return map;
}

async function fetchVariantCountryPriceMap(
  variantIds: string[],
  selectedCountryId?: string | null
): Promise<Record<string, VariantCountryPriceRow>> {
  if (!selectedCountryId || variantIds.length === 0) return {};

  const { data, error } = await supabase
    .from('product_variant_country_prices')
    .select('variant_id, country_id, price')
    .eq('country_id', selectedCountryId)
    .in('variant_id', variantIds);

  if (error) {
    console.warn('[useInventory] product_variant_country_prices fallback:', error.message);
    return {};
  }

  const map: Record<string, VariantCountryPriceRow> = {};
  for (const row of (data ?? []) as VariantCountryPriceRow[]) {
    map[row.variant_id] = row;
  }
  return map;
}

/* ── Fetch inventory (country-aware) ── */
export function useInventory() {
  const { selectedCountry } = useCountry();

  return useQuery({
    queryKey: ['inventory', selectedCountry?.id ?? 'all'],
    queryFn: async (): Promise<EnrichedInventoryRow[]> => {
      let query = supabase
        .from('product_inventory')
        .select(`
          id,
          product_id,
          variant_id,
          country_id,
          stock,
          reserved_stock,
          min_stock,
          updated_at,
          products(id, title, author, cover_url, type, cost_price, base_price, sale_price, is_active),
          product_variants(id, variant_name, variant_type, sku, price),
          countries(id, name, currency_symbol)
        `)
        .order('updated_at', { ascending: false });

      if (selectedCountry?.id) {
        query = query.eq('country_id', selectedCountry.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as InventoryRow[];
      if (rows.length === 0) return [];

      const productIds = Array.from(new Set(rows.map((r) => r.product_id).filter(Boolean)));
      const variantIds = Array.from(
        new Set(rows.map((r) => r.variant_id).filter(Boolean) as string[])
      );

      const [countryPriceMap, variantPriceMap] = await Promise.all([
        fetchCountryPriceMap(productIds, selectedCountry?.id),
        fetchVariantCountryPriceMap(variantIds, selectedCountry?.id),
      ]);

      const withScopedPrices = rows.map((row) => {
        const productOverride = countryPriceMap[row.product_id];
        const variantOverride = row.variant_id ? variantPriceMap[row.variant_id] : undefined;

        return {
          ...row,
          products: row.products
            ? {
                ...row.products,
                cost_price: productOverride?.cost_price ?? row.products.cost_price,
                base_price: productOverride?.base_price ?? row.products.base_price,
                sale_price: productOverride?.sale_price ?? row.products.sale_price,
              }
            : null,
          product_variants: row.product_variants
            ? {
                ...row.product_variants,
                price: variantOverride?.price ?? row.product_variants.price,
              }
            : undefined,
        };
      });

      return withScopedPrices.map(enrich);
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

/* ── Fetch countries for inventory filter (allowed/active) ── */
export function useInventoryCountries() {
  const { allowedCountries } = useCountry();

  return useQuery({
    queryKey: ['inventory-countries', allowedCountries.map((c) => c.id).join(',')],
    queryFn: async () => {
      return allowedCountries.map((c) => ({
        id: c.id,
        name: c.name,
        currency_symbol: c.currency_symbol,
      }));
    },
    staleTime: 60_000,
  });
}

/* ── Export CSV helper ── */
export function exportInventoryCsv(rows: EnrichedInventoryRow[]) {
  const headers = [
    'الكتاب',
    'المؤلف',
    'النسخة',
    'الدولة',
    'النوع',
    'المخزون الفعلي',
    'المحجوز',
    'المتاح',
    'الحد الأدنى',
    'الحالة',
    'آخر تحديث',
  ];

  const csvRows = rows.map((r) => [
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
  const csv =
    bom +
    [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}