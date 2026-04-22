export interface BookVariant {
  id: string;
  type: 'ورق عادي' | 'ورق فاخر' | 'A4' | 'كوشيه' | 'إلكتروني';
  productType: 'مادي' | 'رقمي';
  price: number;
  stock: number;
  sku: string;
  fileUrl?: string; // For digital books
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  category: string;
  type: 'ورقي' | 'رقمي' | 'ورقي ورقمي';
  price: number;
  salePrice?: number;
  profit?: number;
  stock: number;
  sales: number;
  cover: string;
  images?: string[];
  series?: string;
  isbn?: string;
  keywords?: string[];
  variants?: BookVariant[];
  status: 'متاح' | 'نافد' | 'قريباً' | 'مخفي';
  createdAt: string;
}

export interface Order {
  id: string;
  customer: string;
  customerAvatar: string;
  phone?: string;
  books: string[];
  total: number;
  status: 'جديد' | 'قيد المراجعة' | 'تم التأكيد' | 'جاري الشحن' | 'تم التوصيل' | 'ملغي' | 'مرتجع' | 'معلق' | 'قيد المعالجة' | 'تم الشحن';
  date: string;
  city: string;
  paymentMethod: string;
  shippingCompany?: string;
  trackingNumber?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  status: 'نشط' | 'محظور';
  joinedAt: string;
  avatar: string;
  lastOrder?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'نسبة' | 'مبلغ ثابت' | 'شحن مجاني' | 'خصم منتج';
  value: number;
  minOrder: number;
  usedCount: number;
  maxUses: number;
  startsAt?: string;
  expiresAt: string;
  status: 'نشط' | 'منتهي' | 'معطل';
  specificCustomer?: string;
  specificProduct?: string;
  specificCity?: string;
}

export interface Series {
  id: string;
  name: string;
  author: string;
  description?: string;
  booksCount: number;
  totalSales: number;
  cover: string;
  status: 'مكتملة' | 'جارية' | 'معطلة';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'مدير النظام' | 'مشرف' | 'محرر';
  permissions: string[];
  status: 'نشط' | 'معطل';
  lastLogin: string;
  avatar: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
  type: 'إضافة' | 'تعديل' | 'حذف' | 'تسجيل دخول' | 'تسجيل خروج';
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiresAdmin?: boolean;
}
