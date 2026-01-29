import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gem, Smartphone, Lock } from 'lucide-react';
import { api } from '../services/api';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return alert('请输入完整信息');
    
    try {
      setLoading(true);
      const user = await api.login({ phone, password });
      
      if (user) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('登录异常:', error);
      alert(error.message || '登录请求失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-amber-500/30 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-md border border-white/5 relative z-10">
        <div className="flex justify-center mb-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 p-5 rounded-3xl shadow-inner border border-white/10">
               <Gem className="h-10 w-10 text-slate-950" />
            </div>
          </div>
        </div>
        
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 bg-clip-text text-transparent">
            AurumFlow
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-amber-500/50"></span>
            <p className="text-amber-500/70 text-sm font-bold tracking-[0.3em] uppercase">御流 · 黄金管家</p>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-amber-500/50"></span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">手机号识别</label>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 focus:ring-8 focus:ring-amber-500/5 outline-none text-slate-200 transition-all placeholder:text-slate-700"
                placeholder="输入注册手机号"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">安全令牌</label>
                {/* 修复点：移除了错误的 self-end 属性，改为 className */}
                <Link to="/forgot-password" className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors font-bold uppercase tracking-widest self-end">
                    忘记密码?
                </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-amber-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 focus:ring-8 focus:ring-amber-500/5 outline-none text-slate-200 transition-all placeholder:text-slate-700"
                placeholder="输入访问密码"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-slate-100 text-slate-950 py-5 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? '正在验证核心...' : '进入控制中心'}
            </span>
          </button>
        </form>

        <div className="mt-12 text-center">
          <Link to="/register" className="group text-slate-500 text-xs font-bold tracking-widest uppercase">
            尚未获得授权? <span className="text-amber-500 group-hover:text-amber-400 transition-colors underline underline-offset-8 decoration-amber-500/30">申请账户</span>
          </Link>
        </div>
      </div>
    </div>
  );
};