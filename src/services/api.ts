// 统一 API 路径配置
const API_URL = '/api';

// 获取令牌辅助函数
const getAuthHeader = () => {
  const token = localStorage.getItem('gem_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

// 通用响应处理
const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || '请求失败');
    }
    return data;
  } else {
    if (!res.ok) throw new Error(`网络错误: ${res.status} ${res.statusText}`);
    return await res.text();
  }
};

export const api = {
  // --- 账户相关 ---
  sendSmsCode: async (phone: string) => {
    const res = await fetch(`${API_URL}/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return handleResponse(res);
  },

  register: async (payload: any) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  login: async (payload: any) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    
    // 登录成功后持久化存储
    if (data.token) {
      localStorage.setItem('gem_token', data.token);
      localStorage.setItem('gem_user', JSON.stringify(data.user));
    }
    return data.user;
  },

  resetPassword: async (payload: { phone: string, code: string, newPassword: string }) => {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // --- 库存相关 ---
  getCategories: async () => {
    const res = await fetch(`${API_URL}/categories`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  getProducts: async () => {
    const res = await fetch(`${API_URL}/products`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  getItems: async () => {
    const res = await fetch(`${API_URL}/items`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  // 【核心】获取今日流水日志 (修复报错的关键)
  getDailyLogs: async () => {
    const res = await fetch(`${API_URL}/reports/daily`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  createProduct: async (name: string, categoryId: string) => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ name, categoryId })
    });
    return handleResponse(res);
  },

  inbound: async (payload: any) => {
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  outbound: async (itemId: number) => {
    const res = await fetch(`${API_URL}/items/outbound`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ itemId })
    });
    return handleResponse(res);
  },

  // --- 支付相关 ---
  createOrder: async (planId: string, isRecurring: boolean) => {
    const res = await fetch(`${API_URL}/pay/create`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ planId, isRecurring })
    });
    const data = await handleResponse(res);
    if (data.payUrl) window.location.href = data.payUrl; // 直接跳转支付宝
    return data;
  }
};