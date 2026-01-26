const API_URL = 'http://localhost:3001/api';

export const api = {
  // 1. 发送验证码
  sendSmsCode: async (phone: string) => {
    try {
      const res = await fetch(`${API_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发送失败');
      return true;
    } catch (e: any) {
      alert(e.message);
      return false;
    }
  },

  // 2. 注册
  register: async (payload: any) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');
      return data;
    } catch (e: any) {
      alert(e.message);
      return null;
    }
  },

  // 3. 登录
  login: async (payload: any) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登录失败');
      
      if (data.token) {
        localStorage.setItem('gem_token', data.token);
        localStorage.setItem('gem_user', JSON.stringify(data.user));
      }
      return data.user;
    } catch (e: any) {
      alert(e.message);
      return null;
    }
  },

  // 4. 重置密码
  resetPassword: async (payload: any) => {
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '重置失败');
      return true;
    } catch (e: any) {
      alert(e.message);
      return false;
    }
  }
};