// 智能判断开发与生产环境
const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : '/api';

// 获取令牌
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('gem_token')}`,
  'Content-Type': 'application/json'
});

export const api = {
  // --- 账户相关 ---
  sendSmsCode: async (phone: string) => {
    const res = await fetch(`${API_URL}/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
    if (!res.ok) throw new Error((await res.json()).error);
    return true;
  },
  register: async (payload: any) => {
    const res = await fetch(`${API_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.json()).error);
    return true;
  },
  login: async (payload: any) => {
    const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('gem_token', data.token);
    localStorage.setItem('gem_user', JSON.stringify(data.user));
    return data.user;
  },

  // --- 库存相关 (新增) ---
  getCategories: async () => {
    const res = await fetch(`${API_URL}/categories`, { headers: getAuthHeader() });
    return await res.json();
  },
  getProducts: async () => {
    const res = await fetch(`${API_URL}/products`, { headers: getAuthHeader() });
    return await res.json();
  },
  getItems: async () => {
    const res = await fetch(`${API_URL}/items`, { headers: getAuthHeader() });
    return await res.json();
  },
  createProduct: async (name: string, categoryId: string) => {
    const res = await fetch(`${API_URL}/products`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify({ name, categoryId }) });
    return await res.json();
  },
  inbound: async (payload: any) => {
    const res = await fetch(`${API_URL}/items`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify(payload) });
    return await res.json();
  },
  outbound: async (itemId: number) => {
    const res = await fetch(`${API_URL}/items/outbound`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify({ itemId }) });
    return await res.json();
  },

  // --- 支付相关 ---
  createOrder: async (planId: string, isRecurring: boolean) => {
    const res = await fetch(`${API_URL}/pay/create`, { method: 'POST', headers: getAuthHeader(), body: JSON.stringify({ planId, isRecurring }) });
    const data = await res.json();
    if (data.payUrl) window.location.href = data.payUrl; // 直接跳转支付宝
  }
};