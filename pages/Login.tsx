import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Smartphone } from 'lucide-react';
import { api } from '../services/api';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return alert('请输入手机号和密码');
    
    const user = await api.login({ phone, password });
    if (user) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-xl">
             <Package className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">GemMaster</h2>
        <p className="text-center text-slate-500 mb-8">黄金库存管理系统</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                placeholder="请输入手机号"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">密码</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    忘记密码?
                </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
              placeholder="请输入密码"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            登 录
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            注册新账号
          </Link>
        </div>
      </div>
    </div>
  );
};