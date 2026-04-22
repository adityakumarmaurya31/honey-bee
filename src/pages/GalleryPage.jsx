import React, { useEffect, useState } from 'react';
import { API_BASE } from '../admin/api.js';

function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/gallery`);
      const data = await response.json();
      
      if (!response.ok) {
        setMessage('Unable to load gallery');
        return;
      }

      setItems(data);
    } catch (error) {
      setMessage('Unable to connect to server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Our Gallery</h1>
          <p className="text-amber-50 text-lg">Explore our honey production and special moments</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {message && (
          <div className="rounded-3xl bg-amber-50 p-4 text-amber-800 border border-amber-200 mb-6">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
            <p className="mt-4 text-slate-600">Loading gallery...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-lg">No gallery items yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group aspect-[3/4]"
              >
                <div className="relative overflow-hidden h-full bg-slate-200">
                  {item.media_type === 'image' ? (
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <video
                        src={item.media_url}
                        className="max-h-full max-w-full"
                        onMouseOver={(e) => e.target.play()}
                        onMouseOut={(e) => e.target.pause()}
                      />
                      <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/40 transition-all">
                        <div className="text-white text-2xl">▶</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-4xl max-h-screen flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">{selectedItem.title}</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-500 hover:text-slate-900 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 min-h-96">
              {selectedItem.media_type === 'image' ? (
                <img
                  src={selectedItem.media_url}
                  alt={selectedItem.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={selectedItem.media_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                />
              )}
            </div>
            {selectedItem.description && (
              <div className="p-6 border-t border-slate-200">
                <p className="text-slate-700">{selectedItem.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryPage;
