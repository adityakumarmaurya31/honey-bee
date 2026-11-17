export const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

const API_BASE_NORMALIZED = API_BASE.replace(/\/$/, '');

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const normalizedPath = String(url).replace(/\\/g, '/');

  if (/^(https?:)?\/\//i.test(normalizedPath)) {
    try {
      const parsed = new URL(normalizedPath, API_BASE_NORMALIZED);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${API_BASE_NORMALIZED}${parsed.pathname}`;
      }
      return normalizedPath;
    } catch {
      return normalizedPath;
    }
  }

  if (normalizedPath.startsWith('/uploads/')) {
    return `${API_BASE_NORMALIZED}${normalizedPath}`;
  }

  return normalizedPath.startsWith('/')
    ? `${API_BASE_NORMALIZED}${normalizedPath}`
    : `${API_BASE_NORMALIZED}/${normalizedPath}`;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const handleAuthError = (response, navigate) => {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
    return true;
  }
  return false;
};
