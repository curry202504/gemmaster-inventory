// 文件名: src/pages/ForgotPassword.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Smartphone, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { ToastContainer, showToast } from '../components/Toast'; // 引入优雅弹窗

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
    if (!phone) return showToast('请输入需要重置的手机号', 'error');
    if (phone.length !== 11) return showToast('请输入正确的11位手机号', 'error');
    
    try {
      // 使用底层 fetch 避免依赖外部封装
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const res = await response.json();

      if (response.ok && res.success) {
         setCountdown(60);
         showToast('验证码发送成功，请查收', 'success');
      } else {
         showToast(res.error || '发送失败', 'error');
      }
    } catch (error: any) {
      showToast('网络请求失败', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code || !newPassword) return showToast('请填写完整信息', 'error');
    
    try {
      setLoading(true);
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, newPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('密码重置成功！请使用新密码登录', 'success');
        setTimeout(() => navigate('/login'), 1500);
      } else {
         showToast(data.error || '重置失败', 'error');
      }
    } catch (error: any) {
      showToast('网络请求失败，请检查服务是否运行', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <ToastContainer />

      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-100/40 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-slate-100 relative z-10 transition-all">
        
        <Link to="/login" className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回登录
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">重置安全凭据</h2>
          <p className="text-slate-400 text-xs font-bold tracking-widest mt-2 uppercase">身份核验与密码重置</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">预留手机号</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-400 focus:bg-white outline-none text-slate-800 transition-all font-medium"
                placeholder="您账号的手机号码"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">安全校验码</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-400 focus:bg-white outline-none text-slate-800 text-center tracking-[0.5em] font-mono text-lg font-bold placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal"
                placeholder="000000"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="px-6 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs whitespace-nowrap hover:bg-slate-200 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-28 flex items-center justify-center"
              >
                {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">设置新密码</label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-400 focus:bg-white outline-none text-slate-800 transition-all font-medium"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black mt-6 tracking-widest uppercase text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md shadow-slate-900/10"
          >
            {loading ? '正在更新凭据...' : '确认重置'}
          </button>
        </form>
      </div>
    </div>
  );
};