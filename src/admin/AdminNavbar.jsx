import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Products', to: '/admin/products' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Enquiries', to: '/admin/enquiries' },
  { label: 'Gallery', to: '/admin/gallery' },
  { label: 'Coupons', to: '/admin/coupons' },
  { label: 'Users', to: '/admin/users' },
];

const AdminNavbar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 px-6 py-8 hidden lg:flex flex-col justify-between">
      <div>
        <div className="mb-10">
          <div className="text-xl font-semibold text-slate-900">Honey Admin</div>
          <p className="text-sm text-slate-500 mt-1">Manage products, orders, and users</p>
        </div>

        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        onClick={logout}
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Logout
      </button>
    </aside>
  );
};

export default AdminNavbar;
