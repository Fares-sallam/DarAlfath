import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminPermissions {
  can_manage_products: boolean;
  can_manage_orders: boolean;
  can_manage_users: boolean;
  can_manage_inventory: boolean;
  can_manage_coupons: boolean;
  can_manage_shipping: boolean;
  can_view_analytics: boolean;
  can_export: boolean;
  can_view_activity_log: boolean;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  can_manage_products: false,
  can_manage_orders: false,
  can_manage_users: false,
  can_manage_inventory: false,
  can_manage_coupons: false,
  can_manage_shipping: false,
  can_view_analytics: false,
  can_export: false,
  can_view_activity_log: false,
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  permissions: AdminPermissions;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

async function fetchProfile(userId: string, email: string): Promise<AuthUser> {
  try {
    const [{ data: profile, error: profileError }, { data: adminSettings, error: adminError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url, is_active')
          .eq('id', userId)
          .maybeSingle(),

        supabase
          .from('admin_settings')
          .select(`
            can_manage_products,
            can_manage_orders,
            can_manage_users,
            can_manage_inventory,
            can_manage_coupons,
            can_manage_shipping,
            can_view_analytics,
            can_export,
            can_view_activity_log
          `)
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

    if (profileError) {
      console.error('[Auth] profile fetch error:', profileError.message);
    }

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('[Auth] admin settings fetch error:', adminError.message);
    }

    return {
      id: userId,
      email,
      fullName: profile?.full_name || email.split('@')[0],
      role: profile?.role || 'user',
      avatarUrl: profile?.avatar_url || undefined,
      isActive: profile?.is_active ?? true,
      permissions: adminSettings
        ? {
            can_manage_products: adminSettings.can_manage_products ?? false,
            can_manage_orders: adminSettings.can_manage_orders ?? false,
            can_manage_users: adminSettings.can_manage_users ?? false,
            can_manage_inventory: adminSettings.can_manage_inventory ?? false,
            can_manage_coupons: adminSettings.can_manage_coupons ?? false,
            can_manage_shipping: adminSettings.can_manage_shipping ?? false,
            can_view_analytics: adminSettings.can_view_analytics ?? false,
            can_export: adminSettings.can_export ?? false,
            can_view_activity_log: adminSettings.can_view_activity_log ?? false,
          }
        : { ...DEFAULT_PERMISSIONS },
    };
  } catch (err) {
    console.error('[Auth] fetchProfile unexpected error:', err);

    return {
      id: userId,
      email,
      fullName: email.split('@')[0],
      role: 'user',
      isActive: true,
      permissions: { ...DEFAULT_PERMISSIONS },
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const bootDone = useRef(false);
  const mountedRef = useRef(true);

  const finishBoot = useCallback((authUser: AuthUser | null) => {
    if (!mountedRef.current) return;
    if (!bootDone.current) {
      bootDone.current = true;
      setUser(authUser);
      setLoading(false);
    }
  }, []);

  const applySessionUser = useCallback(
    async (
      sessionUser: { id: string; email?: string | null } | null,
      finish = false
    ) => {
      if (!mountedRef.current) return;

      if (!sessionUser) {
        setUser(null);
        if (finish) finishBoot(null);
        return;
      }

      const authUser = await fetchProfile(sessionUser.id, sessionUser.email || '');
      if (!mountedRef.current) return;

      if (!authUser.isActive) {
        await supabase.auth.signOut();
        setUser(null);
        if (finish) finishBoot(null);
        return;
      }

      setUser(authUser);
      if (finish) finishBoot(authUser);
    },
    [finishBoot]
  );

  useEffect(() => {
    mountedRef.current = true;

    const safetyTimer = setTimeout(() => {
      if (!bootDone.current) {
        console.warn('[Auth] safety timeout — forcing boot done');
        finishBoot(null);
      }
    }, 4000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        finishBoot(null);
        return;
      }

      if (
        (event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED') &&
        session?.user
      ) {
        void applySessionUser(session.user, !bootDone.current);
      }
    });

    void (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        clearTimeout(safetyTimer);

        if (error) {
          console.error('[Auth] getSession error:', error.message);
          finishBoot(null);
          return;
        }

        if (session?.user) {
          await applySessionUser(session.user, true);
        } else {
          finishBoot(null);
        }
      } catch (err) {
        console.error('[Auth] boot error:', err);
        if (mountedRef.current) {
          clearTimeout(safetyTimer);
          finishBoot(null);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [applySessionUser, finishBoot]);

  const logout = async () => {
    setUser(null);
    bootDone.current = false;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}