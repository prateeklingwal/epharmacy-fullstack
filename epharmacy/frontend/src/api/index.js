import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect on 401
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───
export const userSignup   = data => API.post('/auth/user/signup', data);
export const userLogin    = data => API.post('/auth/user/login', data);
export const retailerSignup = data => API.post('/auth/retailer/signup', data);
export const retailerLogin  = data => API.post('/auth/retailer/login', data);

// ─── Medicines ───
export const searchMedicines = params => API.get('/medicines/search', { params });
export const getMedicine     = id    => API.get(`/medicines/${id}`);
export const getCategories   = ()    => API.get('/medicines/meta/categories');

// ─── Cart ───
export const getCart         = ()           => API.get('/cart');
export const addToCart       = data         => API.post('/cart', data);
export const removeFromCart  = medicineId   => API.delete(`/cart/${medicineId}`);
export const clearCart       = ()           => API.delete('/cart');

// ─── Orders ───
export const placeOrder      = data => API.post('/orders', data);
export const getMyOrders     = ()   => API.get('/orders/my');
export const getOrderDetail  = id  => API.get(`/orders/${id}`);
export const cancelOrder     = id  => API.patch(`/orders/${id}/cancel`);

// ─── Prescriptions ───
export const uploadPrescription = formData => API.post('/prescriptions/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getMyPrescriptions = () => API.get('/prescriptions/my');

// ─── Retailer ───
export const getRetailerMedicines    = params => API.get('/retailer/medicines', { params });
export const addRetailerMedicine     = data   => API.post('/retailer/medicines', data);
export const updateRetailerMedicine  = (id, data) => API.put(`/retailer/medicines/${id}`, data);
export const deleteRetailerMedicine  = id     => API.delete(`/retailer/medicines/${id}`);
export const updateStock             = (id, stock_qty) => API.patch(`/retailer/medicines/${id}/stock`, { stock_qty });
export const getRetailerOrders       = ()     => API.get('/retailer/orders');
export const updateOrderStatus       = (id, status) => API.patch(`/retailer/orders/${id}/status`, { status });

// ─── Admin ───
export const getAdminStats       = ()       => API.get('/admin/stats');
export const getAdminUsers       = params   => API.get('/admin/users', { params });
export const toggleUser          = id       => API.patch(`/admin/users/${id}/toggle`);
export const getAdminRetailers   = params   => API.get('/admin/retailers', { params });
export const approveRetailer     = id       => API.patch(`/admin/retailers/${id}/approve`);
export const toggleRetailer      = id       => API.patch(`/admin/retailers/${id}/toggle`);
export const getAdminMedicines   = params   => API.get('/admin/medicines', { params });
export const getAdminOrders      = params   => API.get('/admin/orders', { params });
export const getPrescriptions    = ()       => API.get('/admin/prescriptions');
export const reviewPrescription  = (id, data) => API.patch(`/admin/prescriptions/${id}`, data);
export const getRevenueReport    = ()       => API.get('/admin/reports/revenue');

export default API;
