import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Category { id: string; name: string; slug: string; }
export interface BookSeries { id: string; name: string; author?: string; }
export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_type: 'مادي' | 'رقمي';
  sku?: string;
  price: number;
}
export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ElectronicBook {
  id: string;
  product_id: string;
  file_path?: string;
  file_format?: string;
  is_sold_once: boolean;
  file_size_mb?: number;
  protected: boolean;
  watermark: boolean;
}
export interface Product {
  id: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  category_id?: string;
  isbn?: string;
  keywords?: string[];
  type: 'ورقي' | 'رقمي' | 'ورقي ورقمي';
  cost_price: number;
  base_price: number;
  sale_price?: number;
  profit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  categories?: Category;
  product_variants?: ProductVariant[];
  electronic_books?: ElectronicBook[];
  product_series?: { series_id: string; book_series: BookSeries }[];
  product_images?: ProductImage[];
}

/* ── Fetch all products ── */
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    staleTime: 60_000,
    queryFn: async () => {
      // Split into two queries to avoid 1MB PostgreSQL limit
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, author, description, cover_url, category_id, isbn, keywords,
          type, cost_price, base_price, sale_price, profit, is_active, created_at, updated_at,
          categories(id, name),
          product_variants(id, variant_name, variant_type, sku, price),
          electronic_books(id, file_path, file_format, is_sold_once, file_size_mb, protected, watermark),
          product_series(series_id, book_series(id, name, author))
        `)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      const products = (data ?? []) as Product[];

      // Fetch images separately for products that have them
      if (products.length > 0) {
        const ids = products.map(p => p.id);
        const { data: images } = await supabase
          .from('product_images')
          .select('id, product_id, url, alt_text, sort_order, is_primary, created_at')
          .in('product_id', ids)
          .order('sort_order');

        const imagesByProduct: Record<string, ProductImage[]> = {};
        for (const img of (images ?? []) as (ProductImage & { product_id: string })[]) {
          if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
          imagesByProduct[img.product_id].push(img);
        }

        return products.map(p => ({ ...p, product_images: imagesByProduct[p.id] ?? [] }));
      }

      return products;
    },
  });
}

/* ── Fetch categories ── */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

/* ── Fetch series ── */
export function useBookSeries() {
  return useQuery({
    queryKey: ['book_series'],
    queryFn: async () => {
      const { data, error } = await supabase.from('book_series').select('id, name, author').order('name');
      if (error) throw error;
      return (data ?? []) as BookSeries[];
    },
  });
}

/* ── Upsert (add/edit) product ── */
export interface UpsertProductInput {
  id?: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  category_id?: string;
  isbn?: string;
  keywords?: string[];
  type: 'ورقي' | 'رقمي' | 'ورقي ورقمي';
  cost_price: number;
  base_price: number;
  sale_price?: number;
  is_active?: boolean;
  variants: Omit<ProductVariant, 'product_id'>[];
  ebookFilePath?: string; // if digital
  seriesIds?: string[];
  additionalImages?: { url: string; alt_text?: string; is_primary?: boolean }[];
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertProductInput) => {
      const isEdit = !!input.id;

      // 1. Upsert product
      const payload = {
        id: input.id,
        title: input.title,
        author: input.author,
        description: input.description,
        cover_url: input.cover_url,
        category_id: input.category_id || null,
        isbn: input.isbn || null,
        keywords: input.keywords,
        type: input.type,
        cost_price: input.cost_price,
        base_price: input.base_price,
        sale_price: input.sale_price || null,
        is_active: input.is_active ?? true,
      };

      const { data: product, error: pErr } = await supabase
        .from('products')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (pErr) throw pErr;

      const productId = product.id;

      // 2. Sync variants
      if (isEdit) {
        await supabase.from('product_variants').delete().eq('product_id', productId);
      }
      if (input.variants.length > 0) {
        const varData = input.variants.map(v => ({
          product_id: productId,
          variant_name: v.variant_name,
          variant_type: v.variant_type,
          sku: v.sku || null,
          price: v.price,
        }));
        const { error: vErr } = await supabase.from('product_variants').insert(varData);
        if (vErr) throw vErr;
      }

      // 3. Electronic book entry
      const hasDigital = input.variants.some(v => v.variant_type === 'رقمي');
      if (hasDigital) {
        const ebookPayload = {
          product_id: productId,
          file_path: input.ebookFilePath || null,
          file_format: 'PDF',
          is_sold_once: true,
          protected: true,
          watermark: true,
        };
        await supabase.from('electronic_books').upsert(ebookPayload, { onConflict: 'product_id' });
      } else if (isEdit) {
        await supabase.from('electronic_books').delete().eq('product_id', productId);
      }

      // 4. Sync series
      if (isEdit) {
        await supabase.from('product_series').delete().eq('product_id', productId);
      }
      if (input.seriesIds && input.seriesIds.length > 0) {
        const seriesData = input.seriesIds.map((sid, idx) => ({
          product_id: productId,
          series_id: sid,
          sort_order: idx,
        }));
        await supabase.from('product_series').insert(seriesData);
      }

      // 5. Add additional images
      if (input.additionalImages && input.additionalImages.length > 0) {
        const imgData = input.additionalImages.map((img, idx) => ({
          product_id: productId,
          url: img.url,
          alt_text: img.alt_text || null,
          sort_order: idx,
          is_primary: img.is_primary ?? false,
        }));
        await supabase.from('product_images').insert(imgData);
      }

      return product;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(input.id ? 'تم تحديث الكتاب بنجاح' : 'تم إضافة الكتاب بنجاح');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Delete product ── */
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف الكتاب');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Toggle active status ── */
export function useToggleProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث حالة الكتاب');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Upload cover image ── */
export async function uploadCoverImage(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `covers/${productId}.${ext}`;
  const { error } = await supabase.storage.from('book-covers').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('book-covers').getPublicUrl(path);
  return data.publicUrl;
}

/* ── Upload ebook PDF ── */
export async function uploadEbookFile(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `ebooks/${productId}.${ext}`;
  const { error } = await supabase.storage.from('ebooks').upload(path, file, { upsert: true });
  if (error) throw error;
  return path; // store path, not public URL (private bucket)
}

/* ── Product images hooks ── */
export function useProductImages(productId: string) {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as ProductImage[];
    },
    enabled: !!productId,
  });
}

export function useDeleteProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      // Delete from storage if it's a storage URL
      if (url.includes('product-images')) {
        const parts = url.split('/product-images/');
        if (parts[1]) {
          await supabase.storage.from('product-images').remove([parts[1]]);
        }
      }
      const { error } = await supabase.from('product_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-images'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف الصورة');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetPrimaryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, productId, imageUrl }: { imageId: string; productId: string; imageUrl: string }) => {
      // Unset all primary
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);
      // Set this as primary
      await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId);
      // Update product cover_url
      await supabase.from('products').update({ cover_url: imageUrl }).eq('id', productId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-images'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تعيين الصورة الرئيسية');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Upload additional product image ── */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${productId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/* ── Get signed URL for ebook download ── */
export async function getEbookSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('ebooks')
    .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours
  if (error) throw error;
  return data.signedUrl;
}
