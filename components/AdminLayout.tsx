import React from 'react';

const AdminBooks = () => <div className="p-4"><h2>إدارة الكتب (Mock)</h2><p>قريباً...</p></div>;
const AdminPersonPolicies = () => <div className="p-4"><h2>إدارة سياسات الأشخاص (Mock)</h2><p>قريباً...</p></div>;
const AdminEvaluations = () => <div className="p-4"><h2>إدارة التقييمات (Mock)</h2><p>قريباً...</p></div>;

export const AdminLayout: React.FC = () => {
  const path = window.location.pathname;

  let Content = () => <div className="p-4"><h2>لوحة التحكم الرئيسية (Mock)</h2><p>اختر من القائمة لعرض المحتوى.</p></div>;
  if (path === '/admin/books') Content = AdminBooks;
  if (path === '/admin/person-policies') Content = AdminPersonPolicies;
  if (path === '/admin/evaluations') Content = AdminEvaluations;

  return (
    <div dir="rtl" className="min-h-screen flex text-gray-800" style={{ backgroundColor: 'var(--bg-main)' }}>
      <aside className="w-64 border-l p-4 space-y-4" style={{ backgroundColor: 'var(--bg-container)', borderColor: 'var(--border-color)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--primary-accent)' }}>لوحة الإدارة</h1>
        <nav className="flex flex-col gap-2">
          <a href="/" className="text-blue-600 hover:underline">العودة للتطبيق</a>
          <a href="/admin" className="hover:underline">الرئيسية</a>
          <a href="/admin/books" className="hover:underline">الكتب</a>
          <a href="/admin/person-policies" className="hover:underline">سياسات الأشخاص</a>
          <a href="/admin/evaluations" className="hover:underline">التقييمات</a>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Content />
      </main>
    </div>
  );
};
