import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import {
  Plus,
  Power,
  ShieldCheck,
  X,
  Search,
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  Square,
  User,
  Trash2,
  Check,
  UserPlus,
  ChevronDown,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminSettings,
  useAdminProfiles,
  useUpdateAdminPermissions,
  useUpdateProfileRole,
  useToggleAdminStatus,
  useCreateAdminSetting,
  useDeleteAdminSetting,
  useCreateNewAdminUser,
  getRoleLabel,
  getRoleColor,
  ROLE_OPTIONS,
  PERMISSION_FIELDS,
  PERMISSION_SECTIONS_GROUPED,
  DEFAULT_PERMISSIONS,
  countActivePerms,
  isSystemOwner,
  type AdminSetting,
  type AdminPermissions,
} from '@/hooks/useAdminSettings';
import { useAuth } from '@/contexts/AuthContext';

/* ──────────────────────────────────────────
   Role badge
────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${getRoleColor(
        role
      )}`}
    >
      {getRoleLabel(role)}
    </span>
  );
}

/* ──────────────────────────────────────────
   Toggle switch
────────────────────────────────────────── */
function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
        value ? 'bg-blue-600' : 'bg-gray-200'
      } disabled:opacity-40`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${
          value ? 'right-0.5' : 'right-5'
        }`}
      />
    </button>
  );
}

/* ──────────────────────────────────────────
   Permissions panel
────────────────────────────────────────── */
interface PermissionsPanelProps {
  admin: AdminSetting;
}

function PermissionsPanel({ admin }: PermissionsPanelProps) {
  const updateMutation = useUpdateAdminPermissions();

  const [perms, setPerms] = useState<AdminPermissions>(() => ({
    can_manage_products: admin.can_manage_products,
    can_manage_orders: admin.can_manage_orders,
    can_manage_users: admin.can_manage_users,
    can_manage_inventory: admin.can_manage_inventory,
    can_manage_coupons: admin.can_manage_coupons,
    can_manage_shipping: admin.can_manage_shipping,
    can_view_analytics: admin.can_view_analytics,
    can_export: admin.can_export,
    can_view_activity_log: admin.can_view_activity_log,
  }));

  useEffect(() => {
    setPerms({
      can_manage_products: admin.can_manage_products,
      can_manage_orders: admin.can_manage_orders,
      can_manage_users: admin.can_manage_users,
      can_manage_inventory: admin.can_manage_inventory,
      can_manage_coupons: admin.can_manage_coupons,
      can_manage_shipping: admin.can_manage_shipping,
      can_view_analytics: admin.can_view_analytics,
      can_export: admin.can_export,
      can_view_activity_log: admin.can_view_activity_log,
    });
  }, [admin.id]);

  const togglePerm = (key: keyof AdminPermissions) => {
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleSection = (keys: (keyof AdminPermissions)[]) => {
    const allOn = keys.every((k) => perms[k]);
    setPerms((p) => {
      const next = { ...p };
      keys.forEach((k) => {
        next[k] = !allOn;
      });
      return next;
    });
  };

  const selectAll = () => {
    setPerms({
      can_manage_products: true,
      can_manage_orders: true,
      can_manage_users: true,
      can_manage_inventory: true,
      can_manage_coupons: true,
      can_manage_shipping: true,
      can_view_analytics: true,
      can_export: true,
      can_view_activity_log: true,
    });
  };

  const clearAll = () => setPerms({ ...DEFAULT_PERMISSIONS });

  const originalPerms: AdminPermissions = {
    can_manage_products: admin.can_manage_products,
    can_manage_orders: admin.can_manage_orders,
    can_manage_users: admin.can_manage_users,
    can_manage_inventory: admin.can_manage_inventory,
    can_manage_coupons: admin.can_manage_coupons,
    can_manage_shipping: admin.can_manage_shipping,
    can_view_analytics: admin.can_view_analytics,
    can_export: admin.can_export,
    can_view_activity_log: admin.can_view_activity_log,
  };

  const dirty = JSON.stringify(perms) !== JSON.stringify(originalPerms);

  const name = admin.profiles?.full_name ?? 'مشرف';
  const email = admin.profiles?.email ?? '—';
  const activeCount = countActivePerms(perms);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-l from-blue-50 to-indigo-50/30">
        {admin.profiles?.avatar_url ? (
          <img
            src={admin.profiles.avatar_url}
            alt={name}
            className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-blue-200 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
            <span className="text-blue-800 font-black text-lg">
              {name.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-800 text-sm">{name}</h3>
            <RoleBadge role={admin.profiles?.role ?? ''} />
          </div>

          <p className="text-xs text-gray-400 mt-0.5" dir="ltr">
            {email}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {activeCount} / {PERMISSION_FIELDS.length} صلاحية مفعّلة
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {dirty && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-xl font-semibold">
              تعديلات غير محفوظة
            </span>
          )}

          <button
            onClick={() =>
              updateMutation.mutate({
                settingId: admin.id,
                permissions: perms,
              })
            }
            disabled={updateMutation.isPending || !dirty}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ShieldCheck size={13} />
            )}
            حفظ
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-50">
        <button
          onClick={selectAll}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-colors"
        >
          <CheckSquare size={12} /> تحديد الكل
        </button>

        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          <Square size={12} /> إلغاء الكل
        </button>

        <span className="text-xs text-gray-400 mr-auto">
          التغييرات مباشرة على Supabase
        </span>
      </div>

      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {PERMISSION_SECTIONS_GROUPED.map(([sectionName, fields]) => {
          const sectionKeys = fields.map((f) => f.key);
          const allSectionOn = sectionKeys.every((k) => perms[k]);
          const someSectionOn = sectionKeys.some((k) => perms[k]);

          return (
            <div
              key={sectionName}
              className="border border-gray-100 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => toggleSection(sectionKeys)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-bold text-gray-700">
                  {sectionName}
                </span>

                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    allSectionOn
                      ? 'bg-blue-600 border-blue-600'
                      : someSectionOn
                      ? 'bg-blue-200 border-blue-400'
                      : 'border-gray-300'
                  }`}
                >
                  {allSectionOn && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}

                  {someSectionOn && !allSectionOn && (
                    <div className="w-2 h-0.5 bg-blue-600 rounded" />
                  )}
                </div>
              </button>

              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fields.map((field) => {
                  const active = perms[field.key];

                  return (
                    <label
                      key={field.key}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-50 border border-blue-100'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => togglePerm(field.key)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          active
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {active && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>

                      <span className="text-sm">{field.icon}</span>
                      <span
                        className={`text-sm ${
                          active
                            ? 'font-semibold text-blue-800'
                            : 'text-gray-700'
                        }`}
                      >
                        {field.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Add existing admin modal
────────────────────────────────────────── */
interface AddAdminModalProps {
  onClose: () => void;
  existingUserIds: string[];
}

function AddAdminModal({ onClose, existingUserIds }: AddAdminModalProps) {
  const { data: profiles = [], isLoading } = useAdminProfiles();
  const createMutation = useCreateAdminSetting();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [perms, setPerms] = useState<AdminPermissions>({
    ...DEFAULT_PERMISSIONS,
  });

  const available = profiles.filter((p) => !existingUserIds.includes(p.id));

  const handleAdd = async () => {
    if (!selectedUserId) {
      toast.error('اختر مستخدمًا');
      return;
    }

    await createMutation.mutateAsync({
      userId: selectedUserId,
      permissions: perms,
    });

    onClose();
  };

  const togglePerm = (key: keyof AdminPermissions) =>
    setPerms((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-6">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserPlus size={18} className="text-blue-700" />
            </div>
            <h2 className="font-bold text-gray-800">إضافة مشرف موجود</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              اختر المستخدم
            </label>

            {isLoading ? (
              <div className="input-field flex items-center gap-2 text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                جارٍ التحميل...
              </div>
            ) : available.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-700 font-semibold">
                جميع المستخدمين المؤهلين مضافون بالفعل
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input-field"
              >
                <option value="">— اختر مستخدمًا —</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.id} — {p.email ?? 'بدون بريد'} (
                    {getRoleLabel(p.role)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              الصلاحيات الابتدائية
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERMISSION_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    perms[field.key]
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => togglePerm(field.key)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      perms[field.key]
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {perms[field.key] && (
                      <Check size={10} className="text-white" />
                    )}
                  </button>

                  <span className="text-sm">{field.icon}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {field.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
          <button onClick={onClose} className="btn-secondary">
            إلغاء
          </button>

          <button
            onClick={handleAdd}
            disabled={createMutation.isPending || !selectedUserId}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={14} />
            )}
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Create new admin modal
────────────────────────────────────────── */
function PasswordStrengthBar({ password }: { password: string }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const colors = [
    'bg-red-400',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-blue-500',
    'bg-green-500',
  ];
  const labels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < score ? colors[score] : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        القوة: <span className="font-semibold">{labels[score]}</span>
      </p>
    </div>
  );
}

interface CreateNewAdminModalProps {
  onClose: () => void;
}

function CreateNewAdminModal({ onClose }: CreateNewAdminModalProps) {
  const createMutation = useCreateNewAdminUser();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'admin',
    password: '',
    confirmPassword: '',
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [perms, setPerms] = useState<AdminPermissions>({
    ...DEFAULT_PERMISSIONS,
  });
  const [step, setStep] = useState<1 | 2>(1);

  const togglePerm = (key: keyof AdminPermissions) =>
    setPerms((p) => ({ ...p, [key]: !p[key] }));

  const setAllPerms = (val: boolean) => {
    setPerms({
      can_manage_products: val,
      can_manage_orders: val,
      can_manage_users: val,
      can_manage_inventory: val,
      can_manage_coupons: val,
      can_manage_shipping: val,
      can_view_analytics: val,
      can_export: val,
      can_view_activity_log: val,
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }

    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) {
      toast.error('بريد إلكتروني غير صالح');
      return;
    }

    if (form.password.length < 8) {
      toast.error('كلمة المرور يجب 8 أحرف على الأقل');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setStep(2);
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      permissions: perms,
    });

    onClose();
  };

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === form.role);
  const activePermsCount = Object.values(perms).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-l from-[#0B1F4D]/5 to-[#D4AF37]/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0B1F4D] rounded-2xl flex items-center justify-center shadow-md">
              <Shield size={20} className="text-[#D4AF37]" />
            </div>

            <div>
              <h2 className="font-black text-gray-800">إنشاء مشرف جديد</h2>
              <p className="text-xs text-gray-400">صلاحية مالك النظام فقط</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === 1
                    ? 'bg-[#0B1F4D] text-white'
                    : 'bg-green-500 text-white'
                }`}
              >
                {step > 1 ? <Check size={12} /> : '1'}
              </div>

              <div
                className={`w-8 h-0.5 ${
                  step === 2 ? 'bg-[#0B1F4D]' : 'bg-gray-200'
                }`}
              />

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === 2
                    ? 'bg-[#0B1F4D] text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                2
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <User size={15} className="text-[#0B1F4D]" />
                <h3 className="font-bold text-gray-700">البيانات الأساسية</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    placeholder="محمد أحمد السيد"
                    required
                    autoFocus
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="01XXXXXXXXX"
                    className="input-field"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="admin@darelfath.com"
                  required
                  className="input-field"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  الدور الوظيفي <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLE_OPTIONS.filter((r) => r.value !== 'super_admin').map(
                    (opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, role: opt.value }))
                        }
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          form.role === opt.value
                            ? 'border-[#0B1F4D] bg-[#0B1F4D]/5 text-[#0B1F4D]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {form.role === opt.value && (
                          <Check size={13} className="text-[#0B1F4D]" />
                        )}
                        {opt.label}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="8 أحرف على الأقل"
                      required
                      className="input-field pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <PasswordStrengthBar password={form.password} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    تأكيد كلمة المرور <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="أعد الإدخال"
                      required
                      className={`input-field pl-10 ${
                        form.confirmPassword &&
                        form.password !== form.confirmPassword
                          ? 'border-red-400'
                          : form.confirmPassword &&
                            form.password === form.confirmPassword
                          ? 'border-green-400'
                          : ''
                      }`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {form.confirmPassword &&
                    form.password !== form.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        كلمتا المرور غير متطابقتين
                      </p>
                    )}

                  {form.confirmPassword &&
                    form.password === form.confirmPassword && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Check size={10} /> متطابقتان
                      </p>
                    )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-lg mt-0.5">💡</span>
                <div>
                  <p className="text-xs font-bold text-amber-800">
                    ملاحظة للمالك
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    سيتم إنشاء الحساب فورًا في Supabase Auth وتفعيله. أبلغ
                    المشرف الجديد بكلمة المرور المؤقتة.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={onClose} className="btn-secondary">
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={
                    !form.full_name ||
                    !form.email ||
                    form.password.length < 8 ||
                    form.password !== form.confirmPassword
                  }
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  التالي: الصلاحيات{' '}
                  <ChevronDown size={14} className="rotate-[-90deg]" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-[#0B1F4D]/5 rounded-2xl border border-[#0B1F4D]/10">
                <div className="w-12 h-12 bg-[#0B1F4D] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-xl">
                    {form.full_name.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{form.full_name}</p>
                  <p className="text-sm text-gray-500" dir="ltr">
                    {form.email}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedRole?.color}`}
                >
                  {selectedRole?.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#0B1F4D]" />
                  <h3 className="font-bold text-gray-700">الصلاحيات</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    {activePermsCount} / {PERMISSION_FIELDS.length}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAllPerms(true)}
                    className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    <CheckSquare size={11} /> تحديد الكل
                  </button>

                  <button
                    onClick={() => setAllPerms(false)}
                    className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <Square size={11} /> إلغاء الكل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {PERMISSION_FIELDS.map((field) => {
                  const active = perms[field.key];

                  return (
                    <label
                      key={field.key}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        active
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-100'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => togglePerm(field.key)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          active
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {active && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>

                      <span>{field.icon}</span>
                      <span
                        className={`text-sm ${
                          active
                            ? 'font-semibold text-blue-800'
                            : 'text-gray-700'
                        }`}
                      >
                        {field.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-1.5"
                >
                  <ChevronDown size={14} className="rotate-90" />
                  رجوع
                </button>

                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60 bg-[#0B1F4D] hover:bg-[#162d6e]"
                >
                  {createMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Shield size={14} />
                  )}
                  {createMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Admin card
────────────────────────────────────────── */
interface AdminCardProps {
  admin: AdminSetting;
  isSelected: boolean;
  onSelect: () => void;
}

function AdminCard({ admin, isSelected, onSelect }: AdminCardProps) {
  const toggleStatus = useToggleAdminStatus();
  const updateRole = useUpdateProfileRole();
  const deleteSetting = useDeleteAdminSetting();

  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const name = admin.profiles?.full_name ?? 'مشرف';
  const email = admin.profiles?.email ?? '—';
  const role = admin.profiles?.role ?? '';
  const isActive = admin.profiles?.is_active ?? true;

  const permissionValues: AdminPermissions = {
    can_manage_products: admin.can_manage_products,
    can_manage_orders: admin.can_manage_orders,
    can_manage_users: admin.can_manage_users,
    can_manage_inventory: admin.can_manage_inventory,
    can_manage_coupons: admin.can_manage_coupons,
    can_manage_shipping: admin.can_manage_shipping,
    can_view_analytics: admin.can_view_analytics,
    can_export: admin.can_export,
    can_view_activity_log: admin.can_view_activity_log,
  };

  const activeCount = countActivePerms(permissionValues);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {admin.profiles?.avatar_url ? (
          <img
            src={admin.profiles.avatar_url}
            alt={name}
            className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 border-2 border-gray-100"
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${
              isActive
                ? 'bg-blue-100 border-blue-200'
                : 'bg-gray-100 border-gray-200'
            }`}
          >
            <span
              className={`font-black text-lg ${
                isActive ? 'text-blue-700' : 'text-gray-400'
              }`}
            >
              {name.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p
              className={`text-sm font-bold ${
                isActive ? 'text-gray-800' : 'text-gray-400'
              }`}
            >
              {name}
            </p>

            {!isActive && (
              <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-bold">
                معطّل
              </span>
            )}
          </div>

          <p
            className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"
            dir="ltr"
          >
            <Mail size={11} />
            <span>{email}</span>
          </p>

          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowRoleMenu((m) => !m)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${getRoleColor(
                role
              )}`}
            >
              {getRoleLabel(role)}
              <ChevronDown size={9} />
            </button>

            {showRoleMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-10 py-1 min-w-[130px]">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateRole.mutate({ userId: admin.user_id, role: opt.value });
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-right px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 flex items-center gap-2 ${
                      role === opt.value ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {role === opt.value && (
                      <Check size={10} className="text-blue-600" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-xs text-gray-400">{activeCount} صلاحية</span>

            <div className="flex gap-0.5">
              {PERMISSION_FIELDS.map((field) => {
                const on = permissionValues[field.key];
                return (
                  <div
                    key={field.key}
                    title={field.label}
                    className={`w-1.5 h-1.5 rounded-full ${
                      on ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-end gap-1.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() =>
              toggleStatus.mutate({
                userId: admin.user_id,
                isActive: !isActive,
              })
            }
            className={`p-1.5 rounded-lg transition-colors ${
              isActive
                ? 'hover:bg-red-50 text-red-400 hover:text-red-600'
                : 'hover:bg-green-50 text-green-500'
            }`}
            title={isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
          >
            <Power size={13} />
          </button>

          <button
            onClick={() => {
              if (confirm(`هل تريد حذف صلاحيات ${name}؟`)) {
                deleteSetting.mutate(admin.id);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
            title="حذف من المشرفين"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="mt-2 pt-2 border-t border-blue-100 flex items-center gap-1 text-xs text-blue-600 font-semibold">
          <Shield size={11} /> جارٍ تعديل الصلاحيات
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Main page
────────────────────────────────────────── */
export default function AdminSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: admins = [], isLoading, isError } = useAdminSettings();

  const isOwner = isSystemOwner(user?.email);

  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = admins.filter((a) => {
    if (!search) return true;

    const q = search.toLowerCase();
    const name = (a.profiles?.full_name ?? '').toLowerCase();
    const role = getRoleLabel(a.profiles?.role ?? '').toLowerCase();
    const email = (a.profiles?.email ?? '').toLowerCase();

    return name.includes(q) || role.includes(q) || email.includes(q);
  });

  const selectedAdmin =
    admins.find((a) => a.id === selectedAdminId) ?? null;

  const roleCounts = {
    super_admin: admins.filter((a) => a.profiles?.role === 'super_admin').length,
    admin: admins.filter((a) => a.profiles?.role === 'admin').length,
    manager: admins.filter((a) => a.profiles?.role === 'manager').length,
    other: admins.filter(
      (a) => !['super_admin', 'admin', 'manager'].includes(a.profiles?.role ?? '')
    ).length,
  };

  return (
    <Layout>
      <div className="fade-in" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="section-title">إعدادات المشرفين</h1>
            <p className="section-subtitle">
              إدارة صلاحيات المشرفين مباشرة من Supabase — {admins.length} مشرف مسجّل
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                qc.invalidateQueries({ queryKey: ['admin-settings'] });
                toast.info('جارٍ التحديث...');
              }}
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors"
              title="تحديث"
            >
              <RefreshCw size={16} />
            </button>

            {isOwner && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B1F4D] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-colors text-sm shadow-md"
                title="إنشاء مشرف جديد — صلاحية مالك النظام"
              >
                <Shield size={15} className="text-[#D4AF37]" />
                إنشاء مشرف جديد
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> ربط مشرف موجود
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'مدير النظام',
              value: roleCounts.super_admin,
              color: 'text-blue-900',
              bg: 'bg-blue-50',
              icon: '👑',
            },
            {
              label: 'مشرف',
              value: roleCounts.admin,
              color: 'text-indigo-700',
              bg: 'bg-indigo-50',
              icon: '🛡️',
            },
            {
              label: 'مدير',
              value: roleCounts.manager,
              color: 'text-blue-600',
              bg: 'bg-sky-50',
              icon: '👤',
            },
            {
              label: 'أدوار أخرى',
              value: roleCounts.other,
              color: 'text-gray-700',
              bg: 'bg-gray-50',
              icon: '🔧',
            },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className={`text-xl font-black ${s.color}`}>
                {isLoading ? '—' : s.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
            <span>جارٍ تحميل بيانات المشرفين...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-red-400">
            <AlertCircle size={32} />
            <span className="font-semibold">تعذّر تحميل البيانات</span>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              تأكد من أنك تمتلك صلاحية إدارة المستخدمين أو أنك مالك النظام
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو الدور أو البريد..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pr-9 text-sm py-2.5 h-auto"
                  />
                  <Search
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
                  <User size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm">لا يوجد مشرفون</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 btn-primary text-xs flex items-center gap-1.5 mx-auto"
                  >
                    <Plus size={12} /> إضافة أول مشرف
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((admin) => (
                    <AdminCard
                      key={admin.id}
                      admin={admin}
                      isSelected={selectedAdminId === admin.id}
                      onSelect={() =>
                        setSelectedAdminId(
                          selectedAdminId === admin.id ? null : admin.id
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              {selectedAdmin ? (
                <PermissionsPanel key={selectedAdmin.id} admin={selectedAdmin} />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm h-72 flex items-center justify-center">
                  <div className="text-center px-6">
                    <ShieldCheck size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-500">
                      اختر مشرفًا لتعديل صلاحياته
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      انقر على أي مشرف من القائمة لعرض الصلاحيات وتعديلها مباشرة في Supabase
                    </p>
                  </div>
                </div>
              )}

              {!selectedAdmin && (
                <div className="mt-4 bg-blue-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-800 mb-3">
                    الصلاحيات المتاحة في النظام:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSION_FIELDS.map((f) => (
                      <div
                        key={f.key}
                        className="flex items-center gap-2 text-xs text-blue-700"
                      >
                        <span>{f.icon}</span>
                        <span className="font-medium">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          existingUserIds={admins.map((a) => a.user_id)}
        />
      )}

      {showCreateModal && isOwner && (
        <CreateNewAdminModal onClose={() => setShowCreateModal(false)} />
      )}
    </Layout>
  );
}