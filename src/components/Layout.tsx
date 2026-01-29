import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, Crown, User, Settings, Gem } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('gem_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('gem_token');
    localStorage.removeItem('gem_user');
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: '总览仪表盘', path: '/dashboard' },
    { icon: Settings, label: '系统设置', path: '/settings' }, 
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex">
      {/* 侧边栏 */}
      <aside className="w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl shadow-lg shadow-amber-900/20">
             <Gem className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-slate-100">AurumFlow</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">御流 · 黄金管家</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                  isActive 
                    ? 'bg-amber-500/10 text-amber-500 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/10">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-sm truncate text-slate-200">{user.username || 'User'}</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                   {user.vip ? (
                     <span className="text-amber-500 flex items-center gap-1"><Crown className="w-3 h-3" /> PRO会员</span>
                   ) : (
                     '免费体验版'
                   )}
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors py-2"
            >
              <LogOut className="w-3 h-3" /> 退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
           <h2 className="font-bold text-sm text-slate-400">
             AurumFlow 御流库存管理系统 <span className="mx-2 text-slate-700">/</span> 控制台
           </h2>
           
           <div className="flex items-center gap-4">
             <div className="text-xs text-slate-500">
               {user.vip ? '数据实时同步中' : '本地离线模式'}
             </div>
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
           </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};