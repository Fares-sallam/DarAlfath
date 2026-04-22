import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const OWNER_EMAIL = 'faresalsaid780@gmail.com';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
  console.log('[create-admin-user] OPTIONS preflight received');
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

  try {
    console.log('[create-admin-user] started');
    console.log('[create-admin-user] method:', req.method);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error('[create-admin-user] missing environment variables', {
        hasUrl: !!supabaseUrl,
        hasAnon: !!supabaseAnonKey,
        hasServiceRole: !!supabaseServiceRoleKey,
      });

      return jsonResponse(
        {
          error: 'إعدادات Supabase غير مكتملة داخل Edge Function',
          details: {
            hasUrl: !!supabaseUrl,
            hasAnon: !!supabaseAnonKey,
            hasServiceRole: !!supabaseServiceRoleKey,
          },
        },
        500
      );
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('[create-admin-user] auth header exists:', !!authHeader);
    console.log('[create-admin-user] token exists:', !!token);

    if (!token) {
      return jsonResponse(
        { error: 'غير مصرح: لا يوجد رمز مصادقة' },
        401
      );
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    console.log('[create-admin-user] verifying caller token...');
    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAnon.auth.getUser(token);

    console.log('[create-admin-user] caller fetched:', !!caller);

    if (callerError || !caller) {
      console.error('[create-admin-user] caller verification failed:', callerError);

      return jsonResponse(
        {
          error: 'غير مصرح: رمز المصادقة غير صالح',
          details: callerError?.message || null,
        },
        401
      );
    }

    console.log('[create-admin-user] caller email:', caller.email);

    if (caller.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      console.warn('[create-admin-user] unauthorized owner check failed for:', caller.email);

      return jsonResponse(
        { error: 'غير مصرح: هذه العملية متاحة لمالك النظام فقط' },
        403
      );
    }

    console.log('[create-admin-user] parsing request body...');
    const body = await req.json();

    const {
      email,
      password,
      full_name,
      phone,
      role,
      permissions,
    } = body as {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
      role: string;
      permissions?: Record<string, boolean>;
    };

    console.log('[create-admin-user] body parsed', {
      email,
      full_name,
      role,
      hasPhone: !!phone,
      hasPermissions: !!permissions,
    });

    if (!email || !password || !full_name || !role) {
      return jsonResponse(
        { error: 'البيانات المطلوبة ناقصة: email, password, full_name, role' },
        400
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        400
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFullName = full_name.trim();
    const trimmedPhone = phone?.trim() || null;

    console.log('[create-admin-user] creating admin client...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('[create-admin-user] checking if user already exists in profiles...');
    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', caller.id)
      .maybeSingle();

    console.log('[create-admin-user] owner profile check complete', {
      foundOwnerProfile: !!existingProfile,
      ownerProfileError: existingProfileError?.message || null,
    });

    console.log('[create-admin-user] creating auth user:', normalizedEmail);
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedFullName,
        has_password: true,
      },
    });

    if (createError) {
      console.error('[create-admin-user] createUser failed:', createError);

      return jsonResponse(
        { error: `فشل إنشاء المستخدم: ${createError.message}` },
        400
      );
    }

    const newUser = newUserData.user;

    if (!newUser) {
      console.error('[create-admin-user] createUser returned no user');

      return jsonResponse(
        { error: 'فشل إنشاء المستخدم: لم يتم إرجاع بيانات المستخدم' },
        500
      );
    }

    console.log('[create-admin-user] auth user created:', newUser.id);

    const profilePayload: Record<string, unknown> = {
      id: newUser.id,
      full_name: trimmedFullName,
      role,
      is_active: true,
    };

    if (trimmedPhone) {
      profilePayload.phone = trimmedPhone;
    }

    console.log('[create-admin-user] upserting profile...', profilePayload);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      console.error('[create-admin-user] profile upsert failed:', profileError);

      console.log('[create-admin-user] attempting fallback profile update...');
      const { error: fallbackProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: trimmedFullName,
          role,
          phone: trimmedPhone,
        })
        .eq('id', newUser.id);

      if (fallbackProfileError) {
        console.error('[create-admin-user] fallback profile update failed:', fallbackProfileError);

        return jsonResponse(
          {
            error: 'تم إنشاء المستخدم لكن فشل حفظ الملف الشخصي',
            details: fallbackProfileError.message,
            user_id: newUser.id,
          },
          500
        );
      }
    }

    console.log('[create-admin-user] profile created/updated successfully');

    const adminPayload = {
      user_id: newUser.id,
      can_manage_products: permissions?.can_manage_products ?? false,
      can_manage_orders: permissions?.can_manage_orders ?? false,
      can_manage_users: permissions?.can_manage_users ?? false,
      can_manage_inventory: permissions?.can_manage_inventory ?? false,
      can_manage_coupons: permissions?.can_manage_coupons ?? false,
      can_manage_shipping: permissions?.can_manage_shipping ?? false,
      can_view_analytics: permissions?.can_view_analytics ?? false,
      can_export: permissions?.can_export ?? false,
    };

    console.log('[create-admin-user] upserting admin settings...', adminPayload);

    const { error: settingsError } = await supabaseAdmin
      .from('admin_settings')
      .upsert(adminPayload, { onConflict: 'user_id' });

    if (settingsError) {
      console.error('[create-admin-user] admin_settings upsert failed:', settingsError);

      return jsonResponse(
        {
          error: 'تم إنشاء المستخدم والملف الشخصي لكن فشل حفظ صلاحيات المشرف',
          details: settingsError.message,
          user_id: newUser.id,
        },
        500
      );
    }

    console.log('[create-admin-user] done successfully for:', normalizedEmail);

    return jsonResponse(
      {
        success: true,
        user_id: newUser.id,
        email: newUser.email,
        message: `تم إنشاء حساب المشرف بنجاح: ${trimmedFullName}`,
      },
      200
    );
  } catch (error) {
    console.error('[create-admin-user] fatal error:', error);

    return jsonResponse(
      {
        error: error instanceof Error ? `خطأ غير متوقع: ${error.message}` : 'خطأ غير متوقع في الخادم',
      },
      500
    );
  }
});