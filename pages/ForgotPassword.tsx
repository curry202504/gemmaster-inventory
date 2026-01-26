import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gem, Smartphone, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    phone: '',
    code: '',
    newPassword: ''
  });
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!formData.phone) return alert('请输入注册手机号');
    try {
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
    } catch (e: any) { alert(e.message); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.newPassword) return alert('请完整填写验证信息');
    
    setLoading(true);
    try {
      const success = await api.resetPassword({
          phone: formData.phone,
          code: formData.code,
          password: formData.newPassword
      });

      if (success) {
        alert('安全凭据更新成功，请重新登录');
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

      <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5 relative z-10">
        <Link to="/login" className="absolute top-10 left-10 text-slate-500 hover:text-amber-400 transition-all">
            <ArrowLeft className="h-6 w-6" />
        </Link>

        <div className="text-center mb-10 mt-4">
          <div className="inline-flex bg-slate-800 p-4 rounded-2xl mb-6 border border-white/5">
            <KeyRound className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white">重置安全凭据</h2>
          <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">身份核验与密码重置</p>
        </div>
        
        <form onSubmit={handleReset} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">预留手机号</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="tel"
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200 transition-all"
                placeholder="输入注册时的手机号"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">安全校验码</label>
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200 transition-all text-center tracking-[0.5em] font-bold"
                placeholder="000000"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
              />
              <button 
                type="button" 
                onClick={handleSendCode}
                disabled={countdown > 0}
                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${countdown > 0 ? 'bg-slate-800 text-slate-500' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}
              >
                {countdown > 0 ? `${countdown}S` : '获取'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">设置新密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="password"
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200 transition-all"
                placeholder="输入新的访问密码"
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group bg-amber-500 text-slate-950 py-5 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-amber-500/20"
          >
            {loading ? '正在更新秘钥...' : '确认重置密码'}
          </button>
        </form>
      </div>
    </div>
  );
};