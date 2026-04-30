import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const Gallery = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'image'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/gallery`, { cache: 'no-store' });
      if (!response.ok) {
        setMessage('Unable to load gallery');
        return;
      }
      const data = await response.json();
      setItems(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setMessage('Unable to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !selectedFile) {
      setMessage('❌ Title and file are required');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('media_type', formData.media_type);
      uploadFormData.append('media', selectedFile);

      const response = await fetch(`${API_BASE}/api/admin/gallery`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: uploadFormData
      });

      if (handleAuthError(response, navigate)) return;

      const data = await response.json();

      if (!response.ok) {
        setMessage(`❌ ${data.message}`);
        return;
      }

      setMessage('✅ Gallery item added successfully in passport size');
      setFormData({ title: '', description: '', media_type: 'image' });
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';

      // Reload gallery
      loadGallery();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gallery item?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (handleAuthError(response, navigate)) return;

      if (!response.ok) {
        setMessage('❌ Unable to delete item');
        return;
      }

      setMessage('✅ Gallery item deleted');
      loadGallery();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Unable to delete item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Gallery Management</h2>
            <p className="mt-2 text-slate-500">Upload and manage photos and videos.</p>
          </div>
          <button
            onClick={loadGallery}
            disabled={loading}
            className="rounded-2xl bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
          </button>
        </div>
        {lastUpdated && (
          <p className="mt-3 text-xs text-slate-500">Last updated: {lastUpdated}</p>
        )}
      </div>

      {message && (
        <div className={`rounded-3xl p-4 ${
          message.includes('Error') || message.includes('❌')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Add New Gallery Item</h3>
        <p className="text-sm text-slate-500">📸 Photos will be automatically resized to passport size (4cm × 6cm)</p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter title"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter description (optional)"
            rows="3"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Media Type *</label>
            <select
              name="media_type"
              value={formData.media_type}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="image">Photo</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {formData.media_type === 'image' ? 'Photo' : 'Video'} File *
            </label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? '📤 Uploading...' : '📤 Upload Gallery Item'}
        </button>
      </form>

      {/* Gallery Items */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Gallery Items ({items.length})
        </h3>

        {items.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center border border-slate-200">
            <p className="text-slate-500">No gallery items yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg bg-white overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-slate-200 overflow-hidden">
                  {item.media_type === 'image' ? (
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <video src={item.media_url} className="max-h-full" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="text-white text-lg">▶</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-600 font-medium truncate mb-2">{item.title}</p>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="w-full rounded-lg bg-red-500 px-2 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
