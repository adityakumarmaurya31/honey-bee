import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', description: '' });

  const fetchStats = async () => {
    const response = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
      headers: getAuthHeaders(),
    });
    if (handleAuthError(response, navigate)) return null;
    return response.ok ? await response.json() : null;
  };

  const fetchProducts = async () => {
    const response = await fetch(`${API_BASE}/api/admin/products`, {
      headers: getAuthHeaders(),
    });
    if (handleAuthError(response, navigate)) return [];
    return response.ok ? await response.json() : [];
  };

  const fetchOrders = async () => {
    const response = await fetch(`${API_BASE}/api/admin/orders`, {
      headers: getAuthHeaders(),
    });
    if (handleAuthError(response, navigate)) return [];
    return response.ok ? await response.json() : [];
  };

  const loadDashboard = async () => {
    setLoading(true);
    setMessage('');

    try {
      const [dashboardData, productsData, ordersData] = await Promise.all([
        fetchStats(),
        fetchProducts(),
        fetchOrders(),
      ]);

      if (!dashboardData) {
        setMessage('Unable to load admin dashboard');
      } else {
        setStats({
          totalProducts: Number(dashboardData.totalProducts) || 0,
          totalOrders: Number(dashboardData.totalOrders) || 0,
          totalUsers: Number(dashboardData.totalUsers) || 0,
          totalRevenue: Number(dashboardData.totalRevenue) || 0,
        });
      }

      setProducts(productsData);
      setOrders(ordersData);
    } catch (err) {
      setMessage('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
    });
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', stock: '', description: '' });
    setMessage('');
  };

  const submitProductUpdate = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;
    setMessage('');

    const response = await fetch(`${API_BASE}/api/admin/products/${editingProduct.id}`, {
      method: 'PUT',
      headers: { Authorization: getAuthHeaders().Authorization },
      body: new FormData(document.getElementById('product-update-form')),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || 'Unable to update product');
      return;
    }

    setMessage('Product updated successfully');
    cancelEdit();
    loadDashboard();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || 'Unable to delete product');
      return;
    }
    setMessage('Product deleted');
    loadDashboard();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-slate-500">Manage products, view orders, and update the store from one place.</p>
          </div>
          <button onClick={loadDashboard} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Refresh Data
          </button>
        </div>
      </div>

      {message && <div className="rounded-3xl bg-amber-50 p-4 text-amber-800 shadow-sm border border-amber-100">{message}</div>}

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">Loading admin panel...</div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Total Products</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalProducts}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-sky-50 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-700">Total Orders</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-lime-50 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-lime-700">Total Users</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalUsers}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Total Revenue</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">₹{Number(stats.totalRevenue || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Products</h2>
                  <p className="text-sm text-slate-500">Edit or remove products directly from the dashboard.</p>
                </div>
                <button onClick={() => navigate('/admin/products')} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Full Product Page
                </button>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3">Name</th>
                      <th className="py-3">Price</th>
                      <th className="py-3">Stock</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 font-medium text-slate-900">{product.name}</td>
                        <td className="py-4">₹{Number(product.price).toFixed(2)}</td>
                        <td className="py-4">{product.stock}</td>
                        <td className="py-4 space-x-2">
                          <button onClick={() => editProduct(product)} className="rounded-2xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600">
                            Edit
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editingProduct && (
                <form id="product-update-form" className="mt-6 space-y-4 rounded-3xl bg-slate-50 p-5" onSubmit={submitProductUpdate}>
                  <h3 className="text-lg font-semibold text-slate-900">Edit Product</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-slate-700">
                      Name
                      <input
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        name="name"
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      Price
                      <input
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      Stock
                      <input
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        name="stock"
                        type="number"
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      Description
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        name="description"
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        rows="4"
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={cancelEdit} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      Cancel
                    </button>
                    <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                      Update Product
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Recent Orders</h2>
                  <p className="text-sm text-slate-500">View the latest customer orders and status.</p>
                </div>
                <button onClick={() => navigate('/admin/orders')} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Full Orders Page
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {orders.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-4 text-slate-500">No orders yet.</div>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Order #{order.id}</p>
                          <p className="text-lg font-semibold text-slate-900">{order.user_name}</p>
                          <p className="text-sm text-slate-500">{order.user_email}</p>
                        </div>
                        <div className="space-x-2 text-sm">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{order.status}</span>
                          <span className="text-slate-700">₹{Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
