import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { api } from '../services/api';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    code: '',
    password: ''
  });
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // 获取真实验证码
  const handleSendCode = async () => {
    if (!formData.phone) return alert('请输入手机号');
    if (formData.phone.length !== 11) return alert('手机号格式不对');
    
    // 倒计时逻辑
    const success = await api.sendSmsCode(formData.phone);
    if (success) {
      alert('验证码已发送，请留意手机短信！');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return alert('请输入验证码');
    
    const result = await api.register(formData);
    if (result) {
      alert('注册成功！请登录');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-green-50 p-4 rounded-xl">
             <ShieldCheck className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">注册新账号</h2>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-green-500"
              placeholder="设置您的用户名"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-green-500"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-green-500"
              placeholder="短信验证码"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})}
            />
            <button 
              type="button" 
              onClick={handleSendCode}
              disabled={countdown > 0}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${countdown > 0 ? 'bg-slate-200 text-slate-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">登录密码</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-green-500"
              placeholder="设置密码"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors mt-2"
          >
            立即注册
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-slate-500 hover:text-slate-800">
            已有账号？返回登录
          </Link>
        </div>
      </div>
    </div>
  );
};