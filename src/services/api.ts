// 文件名: src/services/api.ts
const API_BASE = '/api';

// 全局请求处理引擎
async function fetchWithInterceptor(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('gem_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 403) {
    const errorData = await res.json().catch(() => ({}));
    if (errorData.error === 'VIP_EXPIRED') {
       window.dispatchEvent(new CustomEvent('VIP_EXPIRED_EVENT'));
       throw new Error('VIP_EXPIRED');
    }
    if (errorData.error === 'EMPLOYEE_DENIED') {
       throw new Error(errorData.message || '员工无权限执行此操作');
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || '请求失败');
  }

  return res.json();
}

export const api = {
  login(data: any) {
    return fetchWithInterceptor(`${API_BASE}/login`, { method: 'POST', body: JSON.stringify(data) });
  },

  register(data: any) {
    return fetchWithInterceptor(`${API_BASE}/register`, { method: 'POST', body: JSON.stringify(data) });
  },

  sendSmsCode(phone: string) {
    return fetchWithInterceptor(`${API_BASE}/send-code`, { method: 'POST', body: JSON.stringify({ phone }) });
  },

  getCategories() {
    return fetchWithInterceptor(`${API_BASE}/categories`);
  },

  getProducts() {
    return fetchWithInterceptor(`${API_BASE}/products`);
  },

  getItems() {
    return fetchWithInterceptor(`${API_BASE}/items`);
  },

  createProduct(name: string, categoryId: string) {
    return fetchWithInterceptor(`${API_BASE}/products`, {
      method: 'POST',
      body: JSON.stringify({ name, categoryId })
    });
  },

  // 🚀 新增：修改产品名称
  updateProduct(id: number | string, name: string) {
    return fetchWithInterceptor(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  },

  inbound(data: any) {
    return fetchWithInterceptor(`${API_BASE}/items`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  outbound(itemId: number) {
    return fetchWithInterceptor(`${API_BASE}/items/outbound`, {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  },

  // 🚀 新增：切换上下架状态
  toggleItemStatus(itemId: number) {
    return fetchWithInterceptor(`${API_BASE}/items/${itemId}/toggle-status`, {
      method: 'PUT'
    });
  },

  createOrder(planId: string, isRecurring: boolean) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return fetchWithInterceptor(`${API_BASE}/pay/create`, {
      method: 'POST',
      body: JSON.stringify({ planId, isRecurring, isMobile })
    });
  }
};