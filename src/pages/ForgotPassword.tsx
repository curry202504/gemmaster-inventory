import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Smartphone, Lock, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone) return alert('请先输入手机号');
    if (phone.length !== 11) return alert('请输入正确的11位手机号');
    
    try {
      // 【核心修改】获取后端返回的真实消息
      const res: any = await api.sendSmsCode(phone);
      setCountdown(60);
      
      // 【核心修改】显示后端消息
      alert(res.message || '验证码发送成功');
    } catch (error: any) {
      alert(error.message || '发送失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code || !newPassword) return alert('请填写完整信息');

    try {
      setLoading(true);
      await api.resetPassword({ phone, code, newPassword });
      
      alert('密码重置成功！请使用新密码登录');
      navigate('/login');
    } catch (error: any) {
      console.error('重置失败:', error);
      alert(error.message || '重置失败，请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-md border border-white/5">
        
        <Link to="/login" className="inline-flex items-center text-slate-500 hover:text-amber-400 mb-8 transition-colors text-sm font-bold tracking-widest uppercase">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回登录
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/50 text-amber-500 mb-4 ring-1 ring-white/10">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">重置安全凭据</h2>
          <p className="text-slate-500 text-xs font-bold tracking-widest mt-2 uppercase">身份核验与密码重置</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">预留手机号</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 focus:ring-1 outline-none text-slate-200 transition-all placeholder:text-slate-700"
                placeholder="132..."
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">安全校验码</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 focus:ring-1 outline-none text-slate-200 text-center tracking-[0.5em] font-mono text-lg placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-700 placeholder:font-sans"
                placeholder="1 2 3 4 5 6"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="px-6 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-400 font-bold text-xs whitespace-nowrap hover:bg-white/[0.1] hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-24 flex items-center justify-center"
              >
                {countdown > 0 ? `${countdown}s` : '获取'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">设置新密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 focus:ring-1 outline-none text-slate-200 transition-all placeholder:text-slate-700"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-800 text-white/90 py-4 rounded-2xl font-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-amber-900/20"
          >
            {loading ? '正在更新凭据...' : '确认重置密码'}
          </button>
        </form>
      </div>
    </div>
  );
};