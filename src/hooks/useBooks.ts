import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCountry } from '@/contexts/CountryContext';

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

export interface BookSeries {
  id: string;
  name: string;
  author?: string;
}

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
  categories?: Category;
  product_variants?: ProductVariant[];
  electronic_books?: ElectronicBook[];
  product_series?: { series_id: string; book_series: BookSeries }[];
  product_images?: ProductImage[];
}

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
  ebookFilePath?: string;
  seriesIds?: string[];
  additionalImages?: { url: string; alt_text?: string; is_primary?: boolean }[];
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

async function fetchScopedProductIds(selectedCountryId?: string | null): Promise<string[] | null> {
  if (!selectedCountryId) return null;

  const { data, error } = await supabase
    .from('product_inventory')
    .select('product_id, country_id')
    .eq('country_id', selectedCountryId);

  if (error) {
    console.warn('[useBooks] product_inventory country scope fallback:', error.message);
    return null;
  }

  const ids = Array.from(
    new Set(
      ((data ?? []) as { product_id: string }[])
        .map((row) => row.product_id)
        .filter(Boolean)
    )
  );

  return ids;
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
    console.warn('[useBooks] product_country_prices fallback:', error.message);
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
    console.warn('[useBooks] product_variant_country_prices fallback:', error.message);
    return {};
  }

  const map: Record<string, VariantCountryPriceRow> = {};
  for (const row of (data ?? []) as VariantCountryPriceRow[]) {
    map[row.variant_id] = row;
  }
  return map;
}

/* ── Fetch all products (country-aware) ── */
export function useProducts() {
  const { selectedCountry } = useCountry();

  return useQuery({
    queryKey: ['products', selectedCountry?.id ?? 'all'],
    staleTime: 60_000,
    queryFn: async (): Promise<Product[]> => {
      const scopedIds = await fetchScopedProductIds(selectedCountry?.id);

      if (Array.isArray(scopedIds) && scopedIds.length === 0) {
        return [];
      }

      let query = supabase
        .from('products')
        .select(`
          id, title, author, description, cover_url, category_id, isbn, keywords,
          type, cost_price, base_price, sale_price, profit, is_active, created_at, updated_at,
          categories(id, name, slug),
          product_variants(id, product_id, variant_name, variant_type, sku, price),
          electronic_books(id, product_id, file_path, file_format, is_sold_once, file_size_mb, protected, watermark),
          product_series(series_id, book_series(id, name, author))
        `)
        .order('created_at', { ascending: false })
        .limit(300);

      if (Array.isArray(scopedIds) && scopedIds.length > 0) {
        query = query.in('id', scopedIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const products = (data ?? []) as Product[];

      if (products.length === 0) return [];

      const productIds = products.map((p) => p.id);

      const [{ data: imagesData }, countryPriceMap] = await Promise.all([
        supabase
          .from('product_images')
          .select('id, product_id, url, alt_text, sort_order, is_primary, created_at')
          .in('product_id', productIds)
          .order('sort_order'),
        fetchCountryPriceMap(productIds, selectedCountry?.id),
      ]);

      const allVariantIds = products.flatMap((p) => (p.product_variants ?? []).map((v) => v.id));
      const variantPriceMap = await fetchVariantCountryPriceMap(allVariantIds, selectedCountry?.id);

      const imagesByProduct: Record<string, ProductImage[]> = {};
      for (const img of (imagesData ?? []) as (ProductImage & { product_id: string })[]) {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      }

      return products.map((p) => {
        const priceOverride = countryPriceMap[p.id];

        const finalCost = priceOverride?.cost_price ?? p.cost_price;
        const finalBase = priceOverride?.base_price ?? p.base_price;
        const finalSale = priceOverride?.sale_price ?? p.sale_price ?? undefined;
        const finalProfit = (finalSale ?? finalBase) - finalCost;

        const scopedVariants = (p.product_variants ?? []).map((v) => {
          const override = variantPriceMap[v.id];
          return {
            ...v,
            price: override?.price ?? v.price,
          };
        });

        return {
          ...p,
          cost_price: finalCost,
          base_price: finalBase,
          sale_price: finalSale,
          profit: finalProfit,
          product_variants: scopedVariants,
          product_images: imagesByProduct[p.id] ?? [],
        };
      });
    },
  });
}

/* ── Fetch categories ── */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

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
      const { data, error } = await supabase
        .from('book_series')
        .select('id, name, author')
        .order('name');

      if (error) throw error;
      return (data ?? []) as BookSeries[];
    },
  });
}

/* ── Upsert (add/edit) product (country-aware pricing) ── */
export function useUpsertProduct() {
  const qc = useQueryClient();
  const { selectedCountry } = useCountry();

  return useMutation({
    mutationFn: async (input: UpsertProductInput) => {
      const isEdit = !!input.id;
      let productId = input.id ?? '';

      if (isEdit) {
        const { data: updated, error: updateErr } = await supabase
          .from('products')
          .update({
            title: input.title,
            author: input.author,
            description: input.description,
            cover_url: input.cover_url,
            category_id: input.category_id || null,
            isbn: input.isbn || null,
            keywords: input.keywords,
            type: input.type,
            is_active: input.is_active ?? true,
          })
          .eq('id', input.id!)
          .select()
          .single();

        if (updateErr) throw updateErr;
        productId = updated.id;

        // لو لا توجد دولة مختارة، أو لا يوجد جدول أسعار حسب الدولة، يحدث السعر العام
        if (!selectedCountry?.id) {
          const { error: priceErr } = await supabase
            .from('products')
            .update({
              cost_price: input.cost_price,
              base_price: input.base_price,
              sale_price: input.sale_price || null,
            })
            .eq('id', productId);

          if (priceErr) throw priceErr;
        } else {
          const { error: scopedPriceErr } = await supabase
            .from('product_country_prices')
            .upsert(
              {
                product_id: productId,
                country_id: selectedCountry.id,
                cost_price: input.cost_price,
                base_price: input.base_price,
                sale_price: input.sale_price || null,
              },
              { onConflict: 'product_id,country_id' }
            );

          if (scopedPriceErr) {
            console.warn('[useBooks] product_country_prices fallback to global:', scopedPriceErr.message);

            const { error: fallbackPriceErr } = await supabase
              .from('products')
              .update({
                cost_price: input.cost_price,
                base_price: input.base_price,
                sale_price: input.sale_price || null,
              })
              .eq('id', productId);

            if (fallbackPriceErr) throw fallbackPriceErr;
          }
        }
      } else {
        const { data: created, error: createErr } = await supabase
          .from('products')
          .insert({
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
          })
          .select()
          .single();

        if (createErr) throw createErr;
        productId = created.id;

        if (selectedCountry?.id) {
          const { error: scopedCreatePriceErr } = await supabase
            .from('product_country_prices')
            .upsert(
              {
                product_id: productId,
                country_id: selectedCountry.id,
                cost_price: input.cost_price,
                base_price: input.base_price,
                sale_price: input.sale_price || null,
              },
              { onConflict: 'product_id,country_id' }
            );

          if (scopedCreatePriceErr) {
            console.warn('[useBooks] product_country_prices create fallback:', scopedCreatePriceErr.message);
          }
        }
      }

      // احتفظ بنسخ الأسعار العامة قبل حذف النسخ القديمة إن لزم
      let existingVariantGlobals: Record<string, number> = {};
      if (isEdit && selectedCountry?.id) {
        const { data: oldVariants } = await supabase
          .from('product_variants')
          .select('variant_name, variant_type, price')
          .eq('product_id', productId);

        for (const row of (oldVariants ?? []) as { variant_name: string; variant_type: string; price: number }[]) {
          existingVariantGlobals[`${row.variant_name}__${row.variant_type}`] = row.price;
        }
      }

      // Sync variants
      if (isEdit) {
        await supabase.from('product_variants').delete().eq('product_id', productId);
      }

      let insertedVariants: ProductVariant[] = [];
      if (input.variants.length > 0) {
        const varData = input.variants.map((v) => {
          const key = `${v.variant_name}__${v.variant_type}`;
          const globalPrice =
            selectedCountry?.id && isEdit
              ? existingVariantGlobals[key] ?? v.price
              : v.price;

          return {
            product_id: productId,
            variant_name: v.variant_name,
            variant_type: v.variant_type,
            sku: v.sku || null,
            price: globalPrice,
          };
        });

        const { data: inserted, error: vErr } = await supabase
          .from('product_variants')
          .insert(varData)
          .select();

        if (vErr) throw vErr;
        insertedVariants = (inserted ?? []) as ProductVariant[];

        // حفظ أسعار النسخ حسب الدولة
        if (selectedCountry?.id && insertedVariants.length > 0) {
          const rows = insertedVariants.map((insertedVariant) => {
            const inputMatch = input.variants.find(
              (v) =>
                v.variant_name === insertedVariant.variant_name &&
                v.variant_type === insertedVariant.variant_type
            );

            return {
              variant_id: insertedVariant.id,
              country_id: selectedCountry.id,
              price: inputMatch?.price ?? insertedVariant.price,
            };
          });

          const { error: vpErr } = await supabase
            .from('product_variant_country_prices')
            .upsert(rows, { onConflict: 'variant_id,country_id' });

          if (vpErr) {
            console.warn('[useBooks] product_variant_country_prices fallback:', vpErr.message);
          }
        }
      }

      // Electronic book entry
      const hasDigital = input.variants.some((v) => v.variant_type === 'رقمي');
      if (hasDigital) {
        const ebookPayload = {
          product_id: productId,
          file_path: input.ebookFilePath || null,
          file_format: 'PDF',
          is_sold_once: true,
          protected: true,
          watermark: true,
        };

        await supabase
          .from('electronic_books')
          .upsert(ebookPayload, { onConflict: 'product_id' });
      } else if (isEdit) {
        await supabase.from('electronic_books').delete().eq('product_id', productId);
      }

      // Sync series
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

      // Additional images
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

      return { id: productId };
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
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
      await supabase.from('product_country_prices').delete().eq('product_id', id).then(() => {}).catch(() => {});
      await supabase.from('product_variants').select('id').eq('product_id', id).then(async ({ data }) => {
        const variantIds = (data ?? []).map((v: any) => v.id);
        if (variantIds.length > 0) {
          await supabase.from('product_variant_country_prices').delete().in('variant_id', variantIds).then(() => {}).catch(() => {});
        }
      }).catch(() => {});

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
      const { error } = await supabase
        .from('products')
        .update({ is_active })
        .eq('id', id);

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
  const { error } = await supabase.storage
    .from('book-covers')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('book-covers').getPublicUrl(path);
  return data.publicUrl;
}

/* ── Upload ebook PDF ── */
export async function uploadEbookFile(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `ebooks/${productId}.${ext}`;
  const { error } = await supabase.storage
    .from('ebooks')
    .upload(path, file, { upsert: true });

  if (error) throw error;
  return path;
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
    mutationFn: async ({
      imageId,
      productId,
      imageUrl,
    }: {
      imageId: string;
      productId: string;
      imageUrl: string;
    }) => {
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);
      await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId);
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

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/* ── Get signed URL for ebook download ── */
export async function getEbookSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('ebooks')
    .createSignedUrl(filePath, 60 * 60 * 24);

  if (error) throw error;
  return data.signedUrl;
}