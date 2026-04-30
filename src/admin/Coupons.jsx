import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';
import './Coupons.css';

const Coupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_discount: '',
    min_amount: '',
    description: '',
    usage_limit: '',
    expiry_date: '',
    is_active: true
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/coupons`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (handleAuthError(response, navigate)) return;

      if (!response.ok) {
        setMessage('Unable to load coupons');
        return;
      }
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      setMessage('Unable to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.discount_value) {
      setMessage('❌ Code and discount value are required');
      return;
    }

    setMessage('');

    try {
      const url = editingId 
        ? `${API_BASE}/api/coupons/${editingId}`
        : `${API_BASE}/api/coupons`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      if (handleAuthError(response, navigate)) return;

      const data = await response.json();

      if (!response.ok) {
        setMessage(`❌ ${data.message}`);
        return;
      }

      setMessage(`✅ Coupon ${editingId ? 'updated' : 'created'} successfully`);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_discount: '',
        min_amount: '',
        description: '',
        usage_limit: '',
        expiry_date: '',
        is_active: true
      });
      setShowForm(false);
      setEditingId(null);
      loadCoupons();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount: coupon.max_discount || '',
      min_amount: coupon.min_amount || '',
      description: coupon.description || '',
      usage_limit: coupon.usage_limit || '',
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      is_active: coupon.is_active === 1
    });
    setEditingId(coupon.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/coupons/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (handleAuthError(response, navigate)) return;

      if (!response.ok) {
        const data = await response.json();
        setMessage(`❌ ${data.message}`);
        return;
      }

      setMessage('✅ Coupon deleted successfully');
      loadCoupons();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      max_discount: '',
      min_amount: '',
      description: '',
      usage_limit: '',
      expiry_date: '',
      is_active: true
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="coupons-container">
      <div className="section-header">
        <h2>💝 Manage Discount Coupons</h2>
        <p>Create and manage discount coupons for your customers</p>
      </div>

      {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

      <button 
        className="btn btn-primary"
        onClick={() => showForm ? resetForm() : setShowForm(true)}
      >
        {showForm ? 'Cancel' : '+ Create New Coupon'}
      </button>

      {showForm && (
        <form className="coupon-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Coupon Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., WELCOME10"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>Discount Type *</label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleInputChange}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Discount Value *</label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleInputChange}
                placeholder="e.g., 10"
                min="0"
              />
            </div>

            {formData.discount_type === 'percentage' && (
              <div className="form-group">
                <label>Max Discount (₹)</label>
                <input
                  type="number"
                  name="max_discount"
                  value={formData.max_discount}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                  min="0"
                />
              </div>
            )}

            <div className="form-group">
              <label>Minimum Order Amount (₹)</label>
              <input
                type="number"
                name="min_amount"
                value={formData.min_amount}
                onChange={handleInputChange}
                placeholder="e.g., 500"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Usage Limit</label>
              <input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleInputChange}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Expiry Date</label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                {' '}Active
              </label>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Welcome discount for first-time users"
                rows={3}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading coupons...</p>
      ) : coupons.filter(c => c.is_active).length === 0 ? (
        <p className="empty-state">No active coupons created yet. Create your first coupon!</p>
      ) : (
        <div className="coupons-table-wrapper">
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Amount</th>
                <th>Usage Limit</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.filter(c => c.is_active).map(coupon => (
                <tr key={coupon.id}>
                  <td><strong>{coupon.code}</strong></td>
                  <td>
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%` 
                      : `₹${coupon.discount_value}`}
                    {coupon.max_discount && coupon.discount_type === 'percentage' && (
                      <div className="small-text">Max: ₹{coupon.max_discount}</div>
                    )}
                  </td>
                  <td>{coupon.min_amount ? `₹${coupon.min_amount}` : '-'}</td>
                  <td>{coupon.usage_limit ? coupon.usage_limit : 'Unlimited'}</td>
                  <td>
                    {coupon.expiry_date 
                      ? new Date(coupon.expiry_date).toLocaleDateString('en-IN')
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="btn-small btn-edit"
                      onClick={() => handleEdit(coupon)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-small btn-delete"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Coupons;
