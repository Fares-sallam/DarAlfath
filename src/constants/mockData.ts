import type { Book, Order, Customer, Coupon, Series, AdminUser, ActivityLog } from '@/types';

export const MOCK_BOOKS: Book[] = [
  { id: '1', title: 'أطلس الغيوم', author: 'ديفيد ميتشل', description: 'رواية فلسفية تربط ست قصص عبر قرون', category: 'رواية', type: 'ورقي ورقمي', price: 180, salePrice: 250, profit: 70, stock: 42, sales: 312, cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop', status: 'متاح', isbn: '978-0-375-50752-5', keywords: ['رواية', 'فلسفة', 'خيال'], createdAt: '2024-01-15' },
  { id: '2', title: 'فن الحرب', author: 'صن تزو', description: 'أقدم الكتب في فن الاستراتيجية العسكرية', category: 'تنمية بشرية', type: 'رقمي', price: 80, salePrice: 140, profit: 60, stock: 0, sales: 890, cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=200&h=280&fit=crop', status: 'متاح', isbn: '978-1-59030-459-9', keywords: ['استراتيجية', 'حرب', 'قيادة'], createdAt: '2024-01-20' },
  { id: '3', title: 'البؤساء', author: 'فيكتور هيغو', description: 'ملحمة أدبية عالمية عن العدالة والحب والتضحية', category: 'أدب عالمي', type: 'ورقي', price: 280, salePrice: 380, profit: 100, stock: 8, sales: 156, cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&h=280&fit=crop', status: 'متاح', series: 'الكلاسيكيات العالمية', isbn: '978-0-14-044430-1', keywords: ['كلاسيكي', 'أدب فرنسي'], createdAt: '2024-02-01' },
  { id: '4', title: 'هاري بوتر والحجر الفلسفي', author: 'ج. ك. رولينج', description: 'مغامرات الساحر الصغير في عالم السحر والخيال', category: 'فانتازيا', type: 'ورقي ورقمي', price: 220, salePrice: 300, profit: 80, stock: 0, sales: 1240, cover: 'https://images.unsplash.com/photo-1608848461950-0fe51dfc41cb?w=200&h=280&fit=crop', status: 'نافد', series: 'هاري بوتر', isbn: '978-1-4088-5565-2', keywords: ['فانتازيا', 'سحر', 'مغامرة'], createdAt: '2024-02-10' },
  { id: '5', title: 'الكيمياوي', author: 'باولو كويلو', description: 'قصة رعي أندلسي يبحث عن كنزه الحقيقي', category: 'رواية', type: 'رقمي', price: 90, salePrice: 160, profit: 70, stock: 200, sales: 2100, cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200&h=280&fit=crop', status: 'متاح', isbn: '978-0-06-231500-7', keywords: ['رحلة', 'فلسفة', 'قدر'], createdAt: '2024-02-15' },
  { id: '6', title: 'تفكير سريع وتفكير بطيء', author: 'دانيال كانيمان', description: 'كشف أسرار كيفية عمل العقل البشري', category: 'علم النفس', type: 'ورقي', price: 250, salePrice: 340, profit: 90, stock: 5, sales: 445, cover: 'https://images.unsplash.com/photo-1602052793312-b99c2a9ee797?w=200&h=280&fit=crop', status: 'متاح', isbn: '978-0-374-27563-1', keywords: ['علم نفس', 'تفكير', 'قرارات'], createdAt: '2024-03-01' },
  { id: '7', title: 'عقل بلا خوف', author: 'رابندرانات طاغور', description: 'قصائد خالدة في الحرية والعشق والإنسانية', category: 'شعر', type: 'ورقي', price: 140, salePrice: 200, profit: 60, stock: 30, sales: 89, cover: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=200&h=280&fit=crop', status: 'متاح', isbn: '978-0-02-045500-5', keywords: ['شعر', 'حرية', 'روحانيات'], createdAt: '2024-03-10' },
  { id: '8', title: 'ذاكرة الجسد', author: 'أحلام مستغانمي', description: 'ثلاثية الجزائر الشهيرة في رواية الحب والحرب والوطن', category: 'رواية عربية', type: 'ورقي ورقمي', price: 160, salePrice: 230, profit: 70, stock: 0, sales: 3200, cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop', status: 'نافد', isbn: '978-9953-86-260-3', keywords: ['رواية عربية', 'جزائر', 'حب'], createdAt: '2024-03-15' },
];

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', customer: 'أحمد محمد', customerAvatar: 'https://i.pravatar.cc/40?img=1', phone: '01012345678', books: ['أطلس الغيوم', 'فن الحرب'], total: 390, status: 'تم التوصيل', date: '2024-04-10', city: 'القاهرة', paymentMethod: 'فيزا', shippingCompany: 'بوسطة', trackingNumber: 'POST123456789' },
  { id: 'ORD-002', customer: 'سارة علي', customerAvatar: 'https://i.pravatar.cc/40?img=5', phone: '01198765432', books: ['البؤساء'], total: 380, status: 'قيد المراجعة', date: '2024-04-11', city: 'الإسكندرية', paymentMethod: 'إنستاباي' },
  { id: 'ORD-003', customer: 'محمد خالد', customerAvatar: 'https://i.pravatar.cc/40?img=3', phone: '01511223344', books: ['الكيمياوي', 'تفكير سريع وتفكير بطيء'], total: 500, status: 'جاري الشحن', date: '2024-04-12', city: 'الجيزة', paymentMethod: 'كاش', shippingCompany: 'Mylerz', trackingNumber: 'MYL987654321' },
  { id: 'ORD-004', customer: 'فاطمة حسن', customerAvatar: 'https://i.pravatar.cc/40?img=9', phone: '01065544332', books: ['ذاكرة الجسد'], total: 230, status: 'جديد', date: '2024-04-12', city: 'المنصورة', paymentMethod: 'فودافون كاش' },
  { id: 'ORD-005', customer: 'عمر يوسف', customerAvatar: 'https://i.pravatar.cc/40?img=7', phone: '01277665544', books: ['هاري بوتر والحجر الفلسفي'], total: 300, status: 'ملغي', date: '2024-04-09', city: 'أسيوط', paymentMethod: 'فيزا' },
  { id: 'ORD-006', customer: 'نورة سعيد', customerAvatar: 'https://i.pravatar.cc/40?img=11', phone: '01009988776', books: ['فن الحرب', 'عقل بلا خوف'], total: 340, status: 'تم التوصيل', date: '2024-04-08', city: 'طنطا', paymentMethod: 'إنستاباي', shippingCompany: 'J&T Express', trackingNumber: 'JT556677889' },
  { id: 'ORD-007', customer: 'يوسف الأحمد', customerAvatar: 'https://i.pravatar.cc/40?img=13', phone: '01534455667', books: ['البؤساء', 'الكيمياوي'], total: 540, status: 'تم التأكيد', date: '2024-04-13', city: 'الإسماعيلية', paymentMethod: 'كاش' },
  { id: 'ORD-008', customer: 'أحمد محمد', customerAvatar: 'https://i.pravatar.cc/40?img=1', phone: '01012345678', books: ['ذاكرة الجسد', 'الكيمياوي', 'فن الحرب'], total: 530, status: 'مرتجع', date: '2024-04-05', city: 'القاهرة', paymentMethod: 'فيزا' },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com', phone: '01012345678', city: 'القاهرة', totalOrders: 12, totalSpent: 4200, status: 'نشط', joinedAt: '2023-06-01', avatar: 'https://i.pravatar.cc/40?img=1', lastOrder: '2024-04-13' },
  { id: '2', name: 'سارة علي', email: 'sara@example.com', phone: '01198765432', city: 'الإسكندرية', totalOrders: 5, totalSpent: 1800, status: 'نشط', joinedAt: '2023-08-15', avatar: 'https://i.pravatar.cc/40?img=5', lastOrder: '2024-04-11' },
  { id: '3', name: 'محمد خالد', email: 'mokhaled@example.com', phone: '01511223344', city: 'الجيزة', totalOrders: 8, totalSpent: 2900, status: 'نشط', joinedAt: '2023-09-20', avatar: 'https://i.pravatar.cc/40?img=3', lastOrder: '2024-04-12' },
  { id: '4', name: 'فاطمة حسن', email: 'fatma@example.com', phone: '01065544332', city: 'المنصورة', totalOrders: 3, totalSpent: 750, status: 'نشط', joinedAt: '2024-01-10', avatar: 'https://i.pravatar.cc/40?img=9', lastOrder: '2024-04-12' },
  { id: '5', name: 'عمر يوسف', email: 'omar@example.com', phone: '01277665544', city: 'أسيوط', totalOrders: 1, totalSpent: 300, status: 'محظور', joinedAt: '2024-02-20', avatar: 'https://i.pravatar.cc/40?img=7', lastOrder: '2024-04-09' },
  { id: '6', name: 'نورة سعيد', email: 'noura@example.com', phone: '01009988776', city: 'طنطا', totalOrders: 7, totalSpent: 2400, status: 'نشط', joinedAt: '2023-11-05', avatar: 'https://i.pravatar.cc/40?img=11', lastOrder: '2024-04-08' },
];

export const MOCK_COUPONS: Coupon[] = [
  { id: '1', code: 'SUMMER24', type: 'نسبة', value: 20, minOrder: 300, usedCount: 45, maxUses: 100, expiresAt: '2024-08-31', status: 'نشط' },
  { id: '2', code: 'BOOKS50', type: 'مبلغ ثابت', value: 150, minOrder: 600, usedCount: 100, maxUses: 100, expiresAt: '2024-04-30', status: 'منتهي' },
  { id: '3', code: 'NEWUSER', type: 'نسبة', value: 15, minOrder: 200, usedCount: 23, maxUses: 500, expiresAt: '2024-12-31', status: 'نشط' },
  { id: '4', code: 'RAMADAN', type: 'نسبة', value: 30, minOrder: 500, usedCount: 0, maxUses: 200, expiresAt: '2024-04-10', status: 'منتهي' },
  { id: '5', code: 'VIP100', type: 'مبلغ ثابت', value: 300, minOrder: 1500, usedCount: 5, maxUses: 50, expiresAt: '2024-12-31', status: 'نشط' },
];

export const MOCK_SERIES: Series[] = [
  { id: '1', name: 'هاري بوتر', author: 'ج. ك. رولينج', booksCount: 7, totalSales: 4500, cover: 'https://images.unsplash.com/photo-1608848461950-0fe51dfc41cb?w=100&h=140&fit=crop', status: 'مكتملة' },
  { id: '2', name: 'الكلاسيكيات العالمية', author: 'متعدد المؤلفين', booksCount: 12, totalSales: 2800, cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=140&fit=crop', status: 'جارية' },
  { id: '3', name: 'روايات نجيب محفوظ', author: 'نجيب محفوظ', booksCount: 8, totalSales: 3200, cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=100&h=140&fit=crop', status: 'مكتملة' },
  { id: '4', name: 'سلسلة التنمية الذاتية', author: 'متعدد المؤلفين', booksCount: 5, totalSales: 1900, cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=140&fit=crop', status: 'جارية' },
];

export const MOCK_ADMINS: AdminUser[] = [
  { id: '1', name: 'أحمد محمد', email: 'admin@darelfath.com', role: 'مدير النظام', permissions: ['all'], status: 'نشط', lastLogin: '2024-04-13 09:30', avatar: 'https://i.pravatar.cc/40?img=1' },
  { id: '2', name: 'سارة علي', email: 'sara.admin@darelfath.com', role: 'مشرف', permissions: ['books', 'orders', 'customers'], status: 'نشط', lastLogin: '2024-04-12 14:20', avatar: 'https://i.pravatar.cc/40?img=5' },
  { id: '3', name: 'خالد الجمل', email: 'khalid@darelfath.com', role: 'محرر', permissions: ['books'], status: 'نشط', lastLogin: '2024-04-11 11:00', avatar: 'https://i.pravatar.cc/40?img=3' },
  { id: '4', name: 'نورة إبراهيم', email: 'noura@darelfath.com', role: 'مشرف', permissions: ['orders', 'customers', 'shipping'], status: 'معطل', lastLogin: '2024-03-28 08:45', avatar: 'https://i.pravatar.cc/40?img=11' },
];

export const MOCK_ACTIVITY: ActivityLog[] = [
  { id: '1', user: 'أحمد محمد', action: 'أضاف كتاباً جديداً', target: 'أطلس الغيوم', ip: '192.168.1.1', timestamp: '2024-04-13 09:30', type: 'إضافة' },
  { id: '2', user: 'سارة علي', action: 'عدّل حالة طلب', target: 'ORD-002', ip: '192.168.1.2', timestamp: '2024-04-13 09:15', type: 'تعديل' },
  { id: '3', user: 'أحمد محمد', action: 'سجّل دخولاً', target: 'لوحة التحكم', ip: '192.168.1.1', timestamp: '2024-04-13 09:00', type: 'تسجيل دخول' },
  { id: '4', user: 'خالد العمري', action: 'حذف كوبون', target: 'RAMADAN', ip: '192.168.1.5', timestamp: '2024-04-12 16:45', type: 'حذف' },
  { id: '5', user: 'نورة الزهراني', action: 'عدّلت بيانات عميل', target: 'عمر يوسف', ip: '192.168.1.8', timestamp: '2024-04-12 14:20', type: 'تعديل' },
  { id: '6', user: 'سارة علي', action: 'أضافت كوبون جديد', target: 'VIP100', ip: '192.168.1.2', timestamp: '2024-04-12 11:00', type: 'إضافة' },
  { id: '7', user: 'أحمد محمد', action: 'سجّل خروجاً', target: 'لوحة التحكم', ip: '192.168.1.1', timestamp: '2024-04-11 18:00', type: 'تسجيل خروج' },
];

export const SALES_WEEKLY = [
  { day: 'السبت', sales: 38500, orders: 34 },
  { day: 'الأحد', sales: 29800, orders: 28 },
  { day: 'الاثنين', sales: 47200, orders: 45 },
  { day: 'الثلاثاء', sales: 33600, orders: 31 },
  { day: 'الأربعاء', sales: 56700, orders: 52 },
  { day: 'الخميس', sales: 66300, orders: 64 },
  { day: 'الجمعة', sales: 25500, orders: 24 },
];

export const SALES_MONTHLY = [
  { month: 'يناير', sales: 375000, orders: 380 },
  { month: 'فبراير', sales: 435000, orders: 420 },
  { month: 'مارس', sales: 534000, orders: 510 },
  { month: 'أبريل', sales: 396000, orders: 390 },
  { month: 'مايو', sales: 585000, orders: 560 },
  { month: 'يونيو', sales: 630000, orders: 620 },
];

export const TOP_BOOKS_CHART = [
  { name: 'ذاكرة الجسد', value: 3200 },
  { name: 'الكيمياوي', value: 2100 },
  { name: 'هاري بوتر', value: 1240 },
  { name: 'فن الحرب', value: 890 },
  { name: 'تفكير سريع', value: 445 },
];

export const CITIES_DATA = [
  { city: 'القاهرة', orders: 1850, percentage: 38 },
  { city: 'الإسكندرية', orders: 1310, percentage: 27 },
  { city: 'الجيزة', orders: 632, percentage: 13 },
  { city: 'المنصورة', orders: 437, percentage: 9 },
  { city: 'أسيوط', orders: 340, percentage: 7 },
  { city: 'طنطا', orders: 194, percentage: 4 },
  { city: 'أخرى', orders: 146, percentage: 2 },
];
