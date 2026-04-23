import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'darelfath-selected-country-id';

export interface Country {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  currency: string;
  currency_symbol: string;
  created_at?: string;
}

interface CountryContextType {
  loading: boolean;
  countries: Country[];
  allowedCountries: Country[];
  selectedCountry: Country | null;
  selectedCountryId: string | null;
  currencyCode: string;
  currencySymbol: string;
  setSelectedCountryById: (countryId: string) => void;
  refreshCountries: () => Promise<void>;
  canAccessCountry: (countryId: string | null | undefined) => boolean;
}

const CountryContext = createContext<CountryContextType>({
  loading: true,
  countries: [],
  allowedCountries: [],
  selectedCountry: null,
  selectedCountryId: null,
  currencyCode: 'EGP',
  currencySymbol: 'ج.م',
  setSelectedCountryById: () => {},
  refreshCountries: async () => {},
  canAccessCountry: () => false,
});

function normalizeText(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  const allowedCountries = useMemo(() => {
    if (countries.length === 0) return [];

    // قبل تسجيل الدخول أو في الشاشات العامة
    if (!user) return countries;

    // مالك النظام يرى كل الدول
    if (user.isSystemOwner) return countries;

    // لو للمستخدم أكثر من دولة في admin_country_access
    if (user.allowedCountryIds.length > 0) {
      return countries.filter((country) => user.allowedCountryIds.includes(country.id));
    }

    // fallback قديم
    if (user.primaryCountryId) {
      return countries.filter((country) => country.id === user.primaryCountryId);
    }

    return countries.slice(0, 1);
  }, [countries, user]);

  const selectedCountry = useMemo(() => {
    if (allowedCountries.length === 0) return null;

    return (
      allowedCountries.find((country) => country.id === selectedCountryId) ??
      allowedCountries.find((country) => country.id === user?.primaryCountryId) ??
      allowedCountries[0]
    );
  }, [allowedCountries, selectedCountryId, user?.primaryCountryId]);

  const refreshCountries = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code, is_active, currency, currency_symbol, created_at')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setCountries((data ?? []) as Country[]);
    } catch (err) {
      console.error('[CountryContext] refreshCountries error:', err);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCountries();
  }, []);

  useEffect(() => {
    if (allowedCountries.length === 0) {
      setSelectedCountryId(null);
      return;
    }

    const savedId = localStorage.getItem(STORAGE_KEY);
    const validSaved = allowedCountries.find((country) => country.id === savedId);

    if (validSaved) {
      setSelectedCountryId(validSaved.id);
      return;
    }

    if (user?.primaryCountryId) {
      const primary = allowedCountries.find((country) => country.id === user.primaryCountryId);
      if (primary) {
        setSelectedCountryId(primary.id);
        localStorage.setItem(STORAGE_KEY, primary.id);
        return;
      }
    }

    setSelectedCountryId(allowedCountries[0].id);
    localStorage.setItem(STORAGE_KEY, allowedCountries[0].id);
  }, [allowedCountries, user?.primaryCountryId]);

  const setSelectedCountryById = (countryId: string) => {
    const exists = allowedCountries.find((country) => country.id === countryId);
    if (!exists) return;

    setSelectedCountryId(countryId);
    localStorage.setItem(STORAGE_KEY, countryId);
  };

  const canAccessCountry = (countryId: string | null | undefined) => {
    if (!countryId) return false;

    return allowedCountries.some(
      (country) => normalizeText(country.id) === normalizeText(countryId)
    );
  };

  return (
    <CountryContext.Provider
      value={{
        loading,
        countries,
        allowedCountries,
        selectedCountry,
        selectedCountryId: selectedCountry?.id ?? null,
        currencyCode: selectedCountry?.currency ?? 'EGP',
        currencySymbol: selectedCountry?.currency_symbol ?? 'ج.م',
        setSelectedCountryById,
        refreshCountries,
        canAccessCountry,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  return useContext(CountryContext);
}