import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Smartphone, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    phone: '',
    code: '',
    newPassword: ''
  });
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!formData.phone) return alert('请输入手机号');
    
    // 频控已经在后端做好了，前端只需要调用
    const success = await api.sendSmsCode(formData.phone);
    if (success) {
      alert('验证码已发送');
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.newPassword) return alert('请填写完整');
    
    const success = await api.resetPassword({
        phone: formData.phone,
        code: formData.code,
        password: formData.newPassword
    });

    if (success) {
      alert('密码修改成功，请重新登录');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 relative">
        <Link to="/login" className="absolute top-8 left-8 text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-6 w-6" />
        </Link>

        <div className="flex justify-center mb-6">
          <div className="bg-orange-50 p-4 rounded-xl">
             <KeyRound className="h-10 w-10 text-orange-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">找回密码</h2>
        
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-orange-500"
                placeholder="请输入注册手机号"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-orange-500"
              placeholder="验证码"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})}
            />
            <button 
              type="button" 
              onClick={handleSendCode}
              disabled={countdown > 0}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${countdown > 0 ? 'bg-slate-200 text-slate-500' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-orange-500"
              placeholder="设置新密码"
              value={formData.newPassword}
              onChange={e => setFormData({...formData, newPassword: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700 transition-colors mt-2"
          >
            确认修改
          </button>
        </form>
      </div>
    </div>
  );
};