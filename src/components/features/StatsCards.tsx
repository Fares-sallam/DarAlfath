import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  Users, BookOpen, AlertTriangle, Clock, Star
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, iconBg, iconColor, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className={iconColor} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            changeType === 'up' ? 'bg-green-50 text-green-600' : 
            changeType === 'down' ? 'bg-red-50 text-red-500' : 
            'bg-gray-50 text-gray-500'
          }`}>
            {changeType === 'up' ? <TrendingUp size={12} /> : changeType === 'down' ? <TrendingDown size={12} /> : null}
            {change}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function StatsCards() {
  const stats: StatCardProps[] = [
    {
      title: 'إجمالي المبيعات',
      value: '٩٨٥,٤٠٠ ر.س',
      change: '+١٢.٥٪',
      changeType: 'up',
      icon: DollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtitle: 'هذا الشهر',
    },
    {
      title: 'صافي الربح',
      value: '٣٤٢,٨٠٠ ر.س',
      change: '+٨.٣٪',
      changeType: 'up',
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      subtitle: 'بعد المصاريف',
    },
    {
      title: 'عدد الطلبات',
      value: '١,٢٤٨',
      change: '+٢٣.١٪',
      changeType: 'up',
      icon: ShoppingBag,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitle: 'آخر ٣٠ يوم',
    },
    {
      title: 'متوسط قيمة الطلب',
      value: '٧٨٩ ر.س',
      change: '-٢.١٪',
      changeType: 'down',
      icon: Star,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      subtitle: 'لكل طلب',
    },
    {
      title: 'العملاء الجدد',
      value: '٣٤٧',
      change: '+١٥.٦٪',
      changeType: 'up',
      icon: Users,
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      subtitle: 'هذا الشهر',
    },
    {
      title: 'الكتب المتاحة',
      value: '٨٩٤',
      change: '+٥ جديد',
      changeType: 'up',
      icon: BookOpen,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      subtitle: 'في المخزون',
    },
    {
      title: 'الكتب النافدة',
      value: '٢٣',
      change: 'بحاجة توريد',
      changeType: 'down',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      subtitle: 'رصيد صفر',
    },
    {
      title: 'الطلبات المعلقة',
      value: '٨٧',
      change: 'بانتظار معالجة',
      changeType: 'neutral',
      icon: Clock,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
      subtitle: 'تحتاج مراجعة',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}
