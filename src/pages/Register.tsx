import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Smartphone, Lock, Hash, AlertCircle } from 'lucide-react';

export const Register = () => {
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setErrorMsg('');
    if (!phone) return setErrorMsg('请输入手机号');
    if (phone.length !== 11) return setErrorMsg('请输入正确的11位手机号');
    
    try {
      // 强行使用原生 fetch，绝对可靠
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const res = await response.json();
      
      if (response.ok && res.success) {
         setCountdown(60);
         alert('验证码发送成功，请查收'); // 验证码发送成功可以用简单alert
      } else {
         setErrorMsg(res.error || '发送失败');
      }
    } catch (error: any) {
      setErrorMsg('网络异常，发送失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phone || !username || !password || !code) return setErrorMsg('请填写完整信息');
    
    try {
      setLoading(true);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, username, password, code })
      });
      const res = await response.json();
      
      if (response.ok && res.success) {
          alert('注册成功，欢迎加入御流管家！请登录');
          navigate('/login');
      } else {
          setErrorMsg(res.error || '注册失败');
      }
    } catch (error: any) {
      setErrorMsg('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-amber-100/40 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-slate-100 relative z-10 transition-all">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-100 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          {/* 中文化 */}
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
                onChange={(e) => {setPhone(e.target.value); setErrorMsg('');}}
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
                onChange={(e) => {setCode(e.target.value); setErrorMsg('');}}
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
                onChange={(e) => {setUsername(e.target.value); setErrorMsg('');}}
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
                onChange={(e) => {setPassword(e.target.value); setErrorMsg('');}}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-400 focus:bg-white outline-none text-slate-800 transition-all font-medium"
                placeholder="••••••"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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