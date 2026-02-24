// 文件名: src/services/api.ts
const API_BASE = '/api';

export const api = {
  async login(data: any) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async register(data: any) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  async sendSmsCode(phone: string) {
    const res = await fetch(`${API_BASE}/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  // ... 其他获取产品、分类的逻辑保持不变 ...
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` }
    });
    if (!res.ok) throw new Error('Auth failed');
    return res.json();
  },

  async getProducts() {
    const res = await fetch(`${API_BASE}/products`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` }
    });
    return res.json();
  },

  async getItems() {
    const res = await fetch(`${API_BASE}/items`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` }
    });
    return res.json();
  },

  async createProduct(name: string, categoryId: string) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gem_token')}`
      },
      body: JSON.stringify({ name, categoryId })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  async inbound(data: any) {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gem_token')}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  async outbound(itemId: number) {
    const res = await fetch(`${API_BASE}/items/outbound`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gem_token')}`
      },
      body: JSON.stringify({ itemId })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  // 【核心修改】：在创建订单时，告诉后端我是不是手机！
  async createOrder(planId: string, isRecurring: boolean) {
    // 使用最简单粗暴的正则判断当前是不是移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const res = await fetch(`${API_BASE}/pay/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('gem_token')}`
      },
      body: JSON.stringify({ planId, isRecurring, isMobile }) // 增加 isMobile 参数
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建订单失败');
    
    // 返回支付链接，由调用方负责跳转
    return data;
  }
};