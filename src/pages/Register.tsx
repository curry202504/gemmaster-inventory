import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Smartphone, Lock, Hash } from 'lucide-react';
import { api } from '../services/api';

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
    if (!phone) return alert('请输入手机号');
    if (phone.length !== 11) return alert('请输入正确的11位手机号');
    
    try {
      await api.sendSmsCode(phone);
      setCountdown(60);
      alert('验证码已发送 (请查看后端控制台)');
    } catch (error: any) {
      alert(error.message || '发送失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !username || !password || !code) return alert('请填写完整信息');
    
    try {
      setLoading(true);
      await api.register({ phone, username, password, code });
      alert('注册成功，赠送3天PRO会员！请登录');
      navigate('/login');
    } catch (error: any) {
      alert(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/5">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/50 text-amber-500 mb-4 ring-1 ring-white/10">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">申请访问账户</h2>
          <p className="text-slate-500 text-xs font-bold tracking-widest mt-2 uppercase">加入 AurumFlow 御流网络</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">手机号</label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-4 h-5 w-5 text-slate-600" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-slate-200"
                placeholder="132..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">验证码</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl outline-none text-slate-200 text-center tracking-[0.5em] font-mono text-lg"
                placeholder="000000"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="px-6 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-400 font-bold text-xs whitespace-nowrap hover:bg-white/[0.1] hover:text-amber-400 w-24 flex items-center justify-center"
              >
                {countdown > 0 ? `${countdown}s` : '获取'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">账户昵称</label>
            <div className="relative">
              <Hash className="absolute left-4 top-4 h-5 w-5 text-slate-600" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl outline-none text-slate-200"
                placeholder="您的称呼"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest ml-1">设置密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl outline-none text-slate-200"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-100 text-slate-950 py-4 rounded-2xl font-black mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {loading ? '正在注册...' : '立即开通'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-amber-400 uppercase tracking-widest">
            已有账户? 立即登录
          </Link>
        </div>
      </div>
    </div>
  );
};