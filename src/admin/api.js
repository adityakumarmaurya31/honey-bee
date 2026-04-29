export const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

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
