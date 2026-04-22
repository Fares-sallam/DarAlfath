import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════
   Countries
═══════════════════════════════════════════════ */
export interface Country {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  currency: string;
  currency_symbol: string;
  created_at: string;
}

export function useCountries() {
  return useQuery({
    queryKey: ['settings-countries'],
    queryFn: async (): Promise<Country[]> => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Country[];
    },
  });
}

export function useCreateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Country, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('countries').insert(input);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-countries'] }); toast.success('تمت إضافة الدولة'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Country> & { id: string }) => {
      const { error } = await supabase.from('countries').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-countries'] }); toast.success('تم تحديث الدولة'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('countries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-countries'] }); toast.success('تم حذف الدولة'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ═══════════════════════════════════════════════
   Payment Methods
═══════════════════════════════════════════════ */
export interface PaymentMethod {
  id: string;
  method_name: string;
  provider?: string | null;
  country_id?: string | null;
  is_active: boolean;
  config?: Record<string, unknown>;
  created_at: string;
  countries?: { name: string } | null;
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['settings-payment-methods'],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*, countries(name)')
        .order('method_name');
      if (error) throw error;
      return (data ?? []) as PaymentMethod[];
    },
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { method_name: string; provider?: string; country_id?: string | null; is_active: boolean }) => {
      const { error } = await supabase.from('payment_methods').insert(input);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-payment-methods'] }); toast.success('تمت إضافة طريقة الدفع'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; method_name?: string; provider?: string | null; country_id?: string | null; is_active?: boolean }) => {
      const { error } = await supabase.from('payment_methods').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-payment-methods'] }); toast.success('تم تحديث طريقة الدفع'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-payment-methods'] }); toast.success('تم حذف طريقة الدفع'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ═══════════════════════════════════════════════
   Categories
═══════════════════════════════════════════════ */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['settings-categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; slug: string; description?: string }) => {
      const { error } = await supabase.from('categories').insert(input);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-categories'] }); toast.success('تمت إضافة التصنيف'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; slug?: string; description?: string | null }) => {
      const { error } = await supabase.from('categories').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-categories'] }); toast.success('تم تحديث التصنيف'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-categories'] }); toast.success('تم حذف التصنيف'); },
    onError: (e: Error) => toast.error(e.message),
  });
}
