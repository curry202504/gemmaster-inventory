// 文件名: src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gem, Smartphone, Lock, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanPhone || !cleanPassword) {
        setErrorMsg('请输入手机号和密码');
        return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password: cleanPassword })
      });

      const res = await response.json();
      
      if (response.ok && res.success) {
        // 1. 稳稳地把通行证存入保险柜
        localStorage.setItem('gem_token', res.token);
        localStorage.setItem('gem_user', JSON.stringify(res.user));
        
        // 2. 【核心修复】：放弃软路由跳转，采用霸道的原生硬跳转
        // 这样可以彻底杀死 React 脑子里残留的无权限状态，直接以满血姿态进入控制台！
        window.location.href = '/dashboard';
      } else {
        setErrorMsg(res.error || res.message || '账号或密码错误');
      }
    } catch (error: any) {
      setErrorMsg('网络请求失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-amber-200 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-amber-100/40 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-50/50 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-slate-100 relative z-10 transition-all">
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-amber-400 to-amber-500 p-4 rounded-3xl shadow-md border border-amber-200/50">
               <Gem className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black tracking-tight text-slate-800">
            御流管家
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-slate-200"></span>
            <p className="text-slate-400 text-xs font-black tracking-[0.3em] uppercase">AurumFlow</p>
            <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-slate-200"></span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">手机号</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {setPhone(e.target.value); setErrorMsg('');}}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 outline-none text-slate-800 transition-all font-medium"
                placeholder="输入注册手机号"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">访问密码</label>
                <Link to="/forgot-password" className="text-[10px] text-amber-600 hover:text-amber-500 transition-colors font-bold tracking-widest">
                    忘记密码?
                </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => {setPassword(e.target.value); setErrorMsg('');}}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 outline-none text-slate-800 transition-all font-medium"
                placeholder="输入您的密码"
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
            className="w-full mt-2 relative group overflow-hidden bg-slate-900 text-white py-4 rounded-2xl font-black text-sm tracking-widest transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-slate-900/10"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? '正在验证身份...' : '进入控制中心'}
            </span>
          </button>
        </form>

        <div className="mt-10 text-center">
          <Link to="/register" className="group text-slate-400 text-xs font-bold tracking-widest">
            尚未获得授权? <span className="text-amber-600 group-hover:text-amber-500 transition-colors underline underline-offset-4 decoration-amber-200">免费申请账户</span>
          </Link>
        </div>
      </div>
    </div>
  );
};