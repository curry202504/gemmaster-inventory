// 文件名: src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Smartphone, Lock, Hash } from 'lucide-react';
// 【引入复用 Toast】
import { ToastContainer, showToast } from '../components/Toast';

export const Register = () => {
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
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
    if (!phone) return showToast('请输入手机号', 'error');
    if (phone.length !== 11) return showToast('请输入正确的11位手机号', 'error');
    
    try {
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const res = await response.json();
      
      if (response.ok && res.success) {
         setCountdown(60);
         showToast('验证码发送成功，请注意查收', 'success'); // 使用高级悬浮窗
      } else {
         showToast(res.error || '发送失败', 'error');
      }
    } catch (error: any) {
      showToast('网络异常，发送失败', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !username || !password || !code) return showToast('请填写完整信息', 'error');
    
    try {
      setLoading(true);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, username, password, code })
      });
      const res = await response.json();
      
      if (response.ok && res.success) {
          showToast('注册成功！正在前往登录...', 'success');
          setTimeout(() => navigate('/login'), 1500); // 延迟跳转，让用户看到成功提示
      } else {
          showToast(res.error || '注册失败', 'error');
      }
    } catch (error: any) {
      showToast('网络请求失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* 必须挂载 Toast 容器才能显示 */}
      <ToastContainer />

      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-amber-100/40 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-slate-100 relative z-10 transition-all">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-100 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">申请访问账户</h2>
          <p className="text-slate-400 text-xs font-bold tracking-widest mt-2 uppercase">加入御流管家网络</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">手机号</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-400 focus:bg-white outline-none text-slate-800 transition-all font-medium"
                placeholder="作为您的登录账号"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">验证码</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-400 focus:bg-white outline-none text-slate-800 text-center tracking-[0.5em] font-mono text-lg font-bold placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal"
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">老板称呼</label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-400 focus:bg-white outline-none text-slate-800 transition-all font-medium"
                placeholder="输入您的姓名或店名"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">设置密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-400 focus:bg-white outline-none text-slate-800 transition-all font-medium"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black mt-4 tracking-widest uppercase text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md shadow-slate-900/10"
          >
            {loading ? '正在开通环境...' : '立即注册'}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-colors">
            已有账户? 返回登录
          </Link>
        </div>
      </div>
    </div>
  );
};