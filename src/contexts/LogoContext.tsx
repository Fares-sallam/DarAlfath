import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';

interface LogoContextType {
  logoUrl: string | null;
  uploading: boolean;
  uploadLogo: (file: File) => Promise<void>;
  clearLogo: () => Promise<void>;
  refreshLogo: () => Promise<void>;
}

const LogoContext = createContext<LogoContextType>({
  logoUrl: null,
  uploading: false,
  uploadLogo: async () => {},
  clearLogo: async () => {},
  refreshLogo: async () => {},
});

type StoreSettingsRow = {
  logo_url: string | null;
  updated_at: string | null;
};

function withVersion(url: string | null, version?: string | null) {
  if (!url) return null;
  const v = version ? new Date(version).getTime() : Date.now();
  return `${url}${url.includes('?') ? '&' : '?'}v=${v}`;
}

export function LogoProvider({ children }: { children: ReactNode }) {
  const [rawLogoUrl, setRawLogoUrl] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const logoUrl = useMemo(() => withVersion(rawLogoUrl, updatedAt), [rawLogoUrl, updatedAt]);

  const refreshLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('logo_url, updated_at')
        .eq('id', 1)
        .maybeSingle<StoreSettingsRow>();

      if (error) {
        console.error('[Logo] load error:', error);
        return;
      }

      setRawLogoUrl(data?.logo_url ?? null);
      setUpdatedAt(data?.updated_at ?? null);
    } catch (err) {
      console.error('[Logo] unexpected load error:', err);
    }
  };

  useEffect(() => {
    void refreshLogo();

    const onFocus = () => {
      void refreshLogo();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshLogo();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshLogo();
    });

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      subscription.unsubscribe();
    };
  }, []);

  const uploadLogo = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('حجم الشعار يجب أن يكون أقل من 2MB');
    }

    setUploading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `brand/store-logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl ?? null;

      if (!publicUrl) {
        throw new Error('تعذر إنشاء رابط الشعار');
      }

      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('store_settings')
        .update({
          logo_url: publicUrl,
          updated_at: nowIso,
        })
        .eq('id', 1);

      if (updateError) throw updateError;

      setRawLogoUrl(publicUrl);
      setUpdatedAt(nowIso);
    } catch (err) {
      console.error('[Logo] upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const clearLogo = async () => {
    setUploading(true);

    try {
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from('store_settings')
        .update({
          logo_url: null,
          updated_at: nowIso,
        })
        .eq('id', 1);

      if (error) throw error;

      setRawLogoUrl(null);
      setUpdatedAt(nowIso);
    } catch (err) {
      console.error('[Logo] clear error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return (
    <LogoContext.Provider
      value={{
        logoUrl,
        uploading,
        uploadLogo,
        clearLogo,
        refreshLogo,
      }}
    >
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}