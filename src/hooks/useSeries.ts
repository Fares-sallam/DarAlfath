import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/* ── Types ── */
export interface BookSeries {
  id: string;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  author?: string | null;
  year?: number | null;
  sort_order: number;
  is_active: boolean;
  total_sales: number;
  created_at: string;
  // computed
  books_count?: number;
}

export interface SeriesBook {
  product_id: string;
  series_id: string;
  sort_order: number;
  products: {
    id: string;
    title: string;
    author: string;
    cover_url?: string | null;
    type: string;
    is_active: boolean;
    base_price: number;
  } | null;
}

/* ── Fetch all series with book count ── */
export function useSeriesList() {
  return useQuery({
    queryKey: ['book-series'],
    queryFn: async (): Promise<BookSeries[]> => {
      const { data, error } = await supabase
        .from('book_series')
        .select(`
          id, name, description, cover_url, author, year,
          sort_order, is_active, total_sales, created_at,
          product_series(product_id)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data ?? []) as (BookSeries & { product_series: { product_id: string }[] })[]).map(s => ({
        ...s,
        books_count: s.product_series?.length ?? 0,
      }));
    },
  });
}

/* ── Fetch books in a specific series ── */
export function useSeriesBooks(seriesId: string | null) {
  return useQuery({
    queryKey: ['series-books', seriesId],
    enabled: !!seriesId,
    queryFn: async (): Promise<SeriesBook[]> => {
      const { data, error } = await supabase
        .from('product_series')
        .select(`
          product_id, series_id, sort_order,
          products(id, title, author, cover_url, type, is_active, base_price)
        `)
        .eq('series_id', seriesId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as SeriesBook[];
    },
  });
}

/* ── Fetch products not in a specific series (for adding) ── */
export function useAvailableProducts(seriesId: string | null) {
  return useQuery({
    queryKey: ['available-products', seriesId],
    enabled: !!seriesId,
    queryFn: async () => {
      // Get IDs already in series
      const { data: existing } = await supabase
        .from('product_series')
        .select('product_id')
        .eq('series_id', seriesId!);

      const excludedIds = (existing ?? []).map(e => e.product_id);

      let query = supabase
        .from('products')
        .select('id, title, author, cover_url, type, base_price')
        .eq('is_active', true)
        .order('title');

      if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ── Create series ── */
export function useCreateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      author?: string;
      description?: string;
      cover_url?: string;
      year?: number | null;
      is_active: boolean;
    }) => {
      const { error } = await supabase.from('book_series').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-series'] });
      toast.success('تمت إضافة السلسلة بنجاح');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Update series ── */
export function useUpdateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: {
      id: string;
      name?: string;
      author?: string | null;
      description?: string | null;
      cover_url?: string | null;
      year?: number | null;
      is_active?: boolean;
      sort_order?: number;
    }) => {
      const { error } = await supabase.from('book_series').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-series'] });
      toast.success('تم تحديث السلسلة');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Delete series ── */
export function useDeleteSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('book_series').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-series'] });
      toast.success('تم حذف السلسلة');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Add book to series ── */
export function useAddBookToSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      seriesId,
      productId,
      sortOrder,
    }: { seriesId: string; productId: string; sortOrder: number }) => {
      const { error } = await supabase
        .from('product_series')
        .insert({ series_id: seriesId, product_id: productId, sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: (_, { seriesId }) => {
      qc.invalidateQueries({ queryKey: ['series-books', seriesId] });
      qc.invalidateQueries({ queryKey: ['available-products', seriesId] });
      qc.invalidateQueries({ queryKey: ['book-series'] });
      toast.success('تمت إضافة الكتاب للسلسلة');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Remove book from series ── */
export function useRemoveBookFromSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      seriesId,
      productId,
    }: { seriesId: string; productId: string }) => {
      const { error } = await supabase
        .from('product_series')
        .delete()
        .eq('series_id', seriesId)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: (_, { seriesId }) => {
      qc.invalidateQueries({ queryKey: ['series-books', seriesId] });
      qc.invalidateQueries({ queryKey: ['available-products', seriesId] });
      qc.invalidateQueries({ queryKey: ['book-series'] });
      toast.success('تم إزالة الكتاب من السلسلة');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Update book sort order in series ── */
export function useUpdateBookSortOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      seriesId,
      productId,
      sortOrder,
    }: { seriesId: string; productId: string; sortOrder: number }) => {
      const { error } = await supabase
        .from('product_series')
        .update({ sort_order: sortOrder })
        .eq('series_id', seriesId)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: (_, { seriesId }) => {
      qc.invalidateQueries({ queryKey: ['series-books', seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
