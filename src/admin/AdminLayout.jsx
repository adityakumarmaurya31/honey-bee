import { Outlet, Navigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar.jsx';

const AdminLayout = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminNavbar />
      <div className="lg:pl-72">
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm lg:hidden">
          <div className="text-lg font-semibold">Honey Admin</div>
          <p className="text-sm text-slate-500">Dashboard, products, orders, users</p>
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
