import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const emptyForm = { name: '', price: '', description: '', stock: '', discount: '', image: null, currentImage: null };

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/products`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
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
    setImagePreview(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate form before submission
    if (!form.name || form.name.trim() === '') {
      setMessage('❌ Product name is required');
      setLoading(false);
      return;
    }
    if (!form.price || form.price === '' || parseFloat(form.price) <= 0) {
      setMessage('❌ Price must be a positive number');
      setLoading(false);
      return;
    }
    if (!form.description || form.description.trim() === '') {
      setMessage('❌ Description is required');
      setLoading(false);
      return;
    }
    if (!form.stock || form.stock === '' || parseInt(form.stock) < 0) {
      setMessage('❌ Stock must be a non-negative number');
      setLoading(false);
      return;
    }
    if (!editing && !form.image) {
      setMessage('❌ Image is required for new products');
      setLoading(false);
      return;
    }

    try {
      const body = new FormData();
      body.append('name', form.name.trim());
      body.append('price', form.price.toString());
      body.append('discount', form.discount ? form.discount.toString() : '0');
      body.append('description', form.description.trim());
      body.append('stock', form.stock.toString());
      
      // Append image if provided (new file or existing)
      if (form.image) {
        console.log('[Products] Appending NEW image file:', form.image.name);
        body.append('image', form.image);
      } else if (editing && form.currentImage) {
        console.log('[Products] Keeping existing image:', form.currentImage);
      }

      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_BASE}/api/admin/products/${editing.id}` : `${API_BASE}/api/admin/products`;

      console.log(`[Products] Submitting ${method} request to ${url}`);
      console.log('[Products] Form data:', { 
        name: form.name.trim(),
        price: form.price,
        discount: form.discount,
        description: form.description.substring(0, 30) + '...',
        stock: form.stock,
        hasImage: !!form.image,
        hasCurrentImage: !!form.currentImage
      });

      const response = await fetch(url, {
        method,
        headers: { Authorization: getAuthHeaders().Authorization },
        body,
      });

      if (handleAuthError(response, navigate)) return;
      
      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        data = { message: responseText || 'Server returned invalid response' };
      }

      if (!response.ok) {
        // Show detailed error message
        const errorMsg = data.message || data.error || data.details || 'Failed to save product';
        console.error('[Products] Server error:', errorMsg, data);
        setMessage(`❌ ${errorMsg}`);
        return;
      }

      console.log('[Products] Success! Product saved:', data.id, 'New image:', data.image);
      setMessage(editing ? '✅ Product updated successfully!' : '✅ Product added successfully!');
      
      // Clear form and reload products
      resetForm();
      setTimeout(() => {
        loadProducts();
      }, 500);
      
    } catch (err) {
      console.error('[Products] Submit error:', err);
      setMessage(`❌ Unable to save product: ${err.message}`);
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
      currentImage: product.image,
    });
    setImagePreview(null);
    setMessage('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('❌ Please select a valid image file');
        e.target.value = '';
        setForm((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
        return;
      }

      setForm((prev) => ({ ...prev, image: file }));
      setMessage('');
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getProductImageSrc = (image) => {
    if (!image) return null;
    if (image.startsWith('data:') || image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${API_BASE}${image}?t=${Date.now()}`;
    if (image.startsWith('/')) return `${image}?t=${Date.now()}`;
    return `${API_BASE}/uploads/${image}?t=${Date.now()}`;
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response, navigate)) return;
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Unable to delete product');
        return;
      }

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
            
            {editing && form.currentImage && !imagePreview && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-semibold mb-2">📷 Current Image:</p>
                <img
                  src={
                    getProductImageSrc(form.currentImage)
                  }
                  alt="Current product"
                  className="h-24 w-24 rounded-xl object-cover"
                  onError={(e) => console.error('Current image failed to load:', form.currentImage, e)}
                />
                <p className="text-xs text-blue-600 mt-2">👉 Select a new image below to replace it</p>
              </div>
            )}
            
            {imagePreview && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 font-semibold mb-2">✅ New Image Preview:</p>
                <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-xl object-cover" />
                <p className="text-xs text-green-600 mt-2">Ready to upload on save</p>
              </div>
            )}
            
            <div className="mb-3 border-2 border-dashed border-slate-300 rounded-lg p-4">
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!editing}
                className="w-full text-slate-700 cursor-pointer"
              />
              <p className="text-xs text-slate-600 mt-2">
                {editing ? (
                  imagePreview 
                    ? '✅ New image selected - click Update to save' 
                    : '📁 Select a new image to replace current one'
                ) : (
                  '📁 Required - Select a product image'
                )}
              </p>
            </div>

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
            {message && <p className="mt-2 text-sm text-slate-700">{message}</p>}
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
              {products.map((product) => {
                // Construct proper image URL
                let imageUrl = null;
                if (product.image) {
                  imageUrl = getProductImageSrc(product.image);
                }
                
                return (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-14 w-14 rounded-2xl object-cover"
                          onError={(e) => console.error('Image failed to load:', imageUrl, e)}
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-gray-200 flex items-center justify-center text-xs text-gray-500">No image</div>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;
