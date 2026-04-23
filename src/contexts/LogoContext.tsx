import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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

export function LogoProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refreshLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('logo_url')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('[Logo] load error:', error);
        return;
      }

      setLogoUrl(data?.logo_url ?? null);
    } catch (err) {
      console.error('[Logo] unexpected load error:', err);
    }
  };

  useEffect(() => {
    void refreshLogo();
  }, []);

  const uploadLogo = async (file: File) => {
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

      const publicUrl = publicData.publicUrl
        ? `${publicData.publicUrl}?t=${Date.now()}`
        : null;

      if (!publicUrl) {
        throw new Error('تعذر إنشاء رابط الشعار');
      }

      const { error: updateError } = await supabase
        .from('store_settings')
        .update({
          logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
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
      const { error } = await supabase
        .from('store_settings')
        .update({
          logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      if (error) throw error;

      setLogoUrl(null);
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