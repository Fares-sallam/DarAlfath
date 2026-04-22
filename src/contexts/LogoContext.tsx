/**
 * LogoContext — Global logo management
 * Stores logo URL in localStorage + Supabase Storage
 * Automatically syncs across Sidebar, Login, and all pages
 */
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'darelfath_logo_url';
const DEFAULT_LOGO = ''; // empty = show default icon

interface LogoContextType {
  logoUrl: string;
  uploading: boolean;
  uploadLogo: (file: File) => Promise<void>;
  clearLogo: () => void;
}

const LogoContext = createContext<LogoContextType>({
  logoUrl: DEFAULT_LOGO,
  uploading: false,
  uploadLogo: async () => {},
  clearLogo: () => {},
});

export function LogoProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LOGO; } catch { return DEFAULT_LOGO; }
  });
  const [uploading, setUploading] = useState(false);

  // Persist to localStorage whenever it changes
  useEffect(() => {
    try {
      if (logoUrl) localStorage.setItem(STORAGE_KEY, logoUrl);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore quota errors */ }
  }, [logoUrl]);

  const uploadLogo = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('حجم الشعار يجب أن يكون أقل من 2MB');
    }
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `brand/store-logo.${ext}`;

    setUploading(true);
    try {
      const { error: uploadErr } = await supabase.storage
        .from('book-covers')
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('book-covers').getPublicUrl(path);
      // Add cache-bust so the browser reloads the new image
      const url = `${data.publicUrl}?v=${Date.now()}`;
      setLogoUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const clearLogo = () => setLogoUrl(DEFAULT_LOGO);

  return (
    <LogoContext.Provider value={{ logoUrl, uploading, uploadLogo, clearLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}
