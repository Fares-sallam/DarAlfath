import { Link } from 'react-router-dom';
import { ShieldX, ArrowRight } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
          <ShieldX className="text-red-600" size={28} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">
          غير مسموح لك بالدخول
        </h1>

        <p className="text-gray-500 mb-6">
          هذه الصفحة تحتاج صلاحية غير متاحة لحسابك الحالي.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0B1F4D] text-white font-bold hover:bg-[#162d6e] transition-colors"
        >
          <ArrowRight size={16} />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}