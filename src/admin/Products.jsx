import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const emptyForm = { name: '', price: '', description: '', stock: '', discount: '', image: null };

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/products`, {
        headers: getAuthHeaders(),
      });

      if (handleAuthError(response, navigate)) return;

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setMessage('Unable to load products');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const body = new FormData();
      body.append('name', form.name);
      body.append('price', form.price);
      body.append('discount', form.discount || 0);
      body.append('description', form.description);
      body.append('stock', form.stock);
      if (form.image) {
        body.append('image', form.image);
      }

      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_BASE}/api/admin/products/${editing.id}` : `${API_BASE}/api/admin/products`;

      const response = await fetch(url, {
        method,
        headers: { Authorization: getAuthHeaders().Authorization },
        body,
      });

      if (handleAuthError(response, navigate)) return;
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Save failed');
        return;
      }

      setMessage(editing ? 'Product updated successfully' : 'Product added successfully');
      resetForm();
      loadProducts();
    } catch (err) {
      setMessage('Unable to save product');
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      stock: product.stock.toString(),
      discount: (product.discount || 0).toString(),
      image: null,
    });
    setMessage('');
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response, navigate)) return;
      await response.json();
      setMessage('Product deleted');
      loadProducts();
    } catch (err) {
      setMessage('Unable to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Product Management</h2>
            <p className="text-sm text-slate-500">Create, update, and remove product listings.</p>
          </div>
          <button onClick={resetForm} className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
            New Product
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">{editing ? 'Edit Product' : 'Add Product'}</h3>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />

            <label className="block text-sm font-medium text-slate-700">Price (MRP)</label>
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required type="number" step="0.01" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />

            <label className="block text-sm font-medium text-slate-700">Discount (%)</label>
            <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} type="number" min="0" max="100" step="0.01" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
            {form.discount && form.price && (
              <div className="text-xs text-slate-600">
                Final Price: ₹{(form.price * (1 - form.discount / 100)).toFixed(2)}
              </div>
            )}

            <label className="block text-sm font-medium text-slate-700">Stock</label>
            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required type="number" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />

            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows="4" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />

            <label className="block text-sm font-medium text-slate-700">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="w-full text-slate-700" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" disabled={loading} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {editing ? 'Update Product' : 'Save Product'}
              </button>
              {editing && (
                <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              )}
            </div>
            {message && <p className="text-sm text-slate-700">{message}</p>}
          </form>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 overflow-x-auto">
          <h3 className="text-xl font-semibold text-slate-900">Product Catalog</h3>
          <table className="mt-5 w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3">Product</th>
                <th className="py-3">Price (MRP)</th>
                <th className="py-3">Discount</th>
                <th className="py-3">Final Price</th>
                <th className="py-3">Stock</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image.startsWith('/uploads') ? `${API_BASE}${product.image}` : product.image}
                          alt={product.name}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{product.description.slice(0, 60)}{product.description.length > 60 ? '...' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">₹{Number(product.price).toFixed(2)}</td>
                  <td className="py-4">{Number(product.discount || 0).toFixed(2)}%</td>
                  <td className="py-4 font-semibold text-amber-600">₹{(product.price * (1 - (product.discount || 0) / 100)).toFixed(2)}</td>
                  <td className={`py-4 font-semibold ${product.stock === 0 ? 'text-red-600 bg-red-50' : 'text-slate-900'}`}>
                    {product.stock === 0 ? '0 - OUT OF STOCK' : product.stock}
                  </td>
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
      </div>
    </div>
  );
};

export default Products;
