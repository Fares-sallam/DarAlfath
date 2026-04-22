import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-black text-blue-700">٤٠٤</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">الصفحة غير موجودة</h1>
        <p className="text-gray-500 mb-6">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
