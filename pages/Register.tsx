import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gem, Smartphone, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    code: '',
    password: ''
  });
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 获取真实短信验证码
  const handleSendCode = async () => {
    if (!formData.phone || formData.phone.length !== 11) {
        return alert('请输入正确的11位手机号');
    }
    
    try {
      const success = await api.sendSmsCode(formData.phone);
      if (success) {
        alert('验证码已发送至您的手机，请查收');
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
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.code || !formData.password) {
        return alert('请填写完整注册信息');
    }

    setLoading(true);
    try {
      const success = await api.register(formData);
      if (success) {
        alert('账号授权成功！请登录');
        navigate('/login');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-amber-500/30">
      {/* 统一背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-md border border-white/5 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex bg-gradient-to-br from-amber-300 to-amber-600 p-4 rounded-2xl mb-6 shadow-lg border border-white/10">
            <ShieldCheck className="h-8 w-8 text-slate-950" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 bg-clip-text text-transparent">
            创建新账户
          </h2>
          <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">申请 AurumFlow 系统授权</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">用户名</label>
            <div className="relative group">
              <User className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200 transition-all"
                placeholder="设置您的显示名称"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">手机号</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="tel"
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200 transition-all"
                placeholder="输入11位手机号"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">短信验证</label>
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200 transition-all text-center tracking-[0.5em] font-bold"
                placeholder="验证码"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
              />
              <button 
                type="button" 
                onClick={handleSendCode}
                disabled={countdown > 0}
                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${countdown > 0 ? 'bg-slate-800 text-slate-500' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950'}`}
              >
                {countdown > 0 ? `${countdown}S` : '获取'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">访问密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="password"
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200 transition-all"
                placeholder="设置登录密码"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group relative overflow-hidden bg-slate-100 text-slate-950 py-5 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? '正在同步授权...' : '确认并提交申请'}
            </span>
          </button>
        </form>

        <div className="mt-10 text-center">
          <Link to="/login" className="text-slate-500 text-xs font-bold tracking-widest uppercase hover:text-amber-400 transition-colors">
            已有通行证? <span className="text-amber-500 underline underline-offset-8">立即登录</span>
          </Link>
        </div>
      </div>
    </div>
  );
};