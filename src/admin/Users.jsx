import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response, navigate)) return;
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setMessage('Unable to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response, navigate)) return;
      await response.json();
      setMessage('User removed');
      loadUsers();
    } catch (err) {
      setMessage('Unable to remove user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">User Management</h2>
        <p className="mt-2 text-slate-500">View registered users and remove unwanted accounts.</p>
      </div>

      {message && <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-800 shadow-sm border border-emerald-100">{message}</div>}

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3">Name</th>
              <th className="py-3">Email</th>
              <th className="py-3">Role</th>
              <th className="py-3">Joined</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-4 font-medium text-slate-900">{user.name}</td>
                <td className="py-4 text-slate-600">{user.email}</td>
                <td className="py-4 text-slate-600">{user.role}</td>
                <td className="py-4 text-slate-600">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="py-4">
                  <button onClick={() => deleteUser(user.id)} className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
