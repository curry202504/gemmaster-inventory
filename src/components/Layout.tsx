// 文件名: src/components/Layout.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gem, LayoutDashboard, LogOut, User } from 'lucide-react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('gem_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('gem_token');
    localStorage.removeItem('gem_user');
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    // 注意：在移动端我们加了 pb-16 给底部导航栏留出空间
    <div className="flex h-[100dvh] bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-amber-200">
      
      {/* ================== 【大屏专属】左侧边栏 ================== */}
      <div className="hidden lg:flex fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-2.5 rounded-xl shadow-md shadow-amber-500/20">
            <Gem className="text-white w-6 h-6" />
          </div>
          <div className="ml-3 flex flex-col justify-center mt-0.5">
            <span className="font-black text-xl text-slate-800 tracking-tight leading-none mb-1">御流管家</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">AurumFlow</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-2">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`flex items-center w-full px-4 py-3.5 rounded-2xl font-bold transition-all ${
              location.pathname.includes('/dashboard') && !location.search.includes('tab=profile')
              ? 'bg-amber-50 text-amber-600 shadow-sm border border-amber-100/50' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span className="text-sm">总览仪表盘</span>
          </button>
        </nav>

        <div className="p-4 mb-4 mx-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
               <User className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-700 truncate">{user?.username || '未命名'}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                 {user?.role === 'OWNER' ? '超级管理员' : (user?.role === 'EMPLOYEE' ? '员工终端' : '授权用户')}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" /> 退出登录
          </button>
        </div>
      </div>

      {/* ================== 主体内容区 ================== */}
      <div className="flex-1 flex flex-col relative z-10 w-full min-w-0 pt-14 lg:pt-0 pb-16 lg:pb-0 h-[100dvh]">
        
        {/* 【移动端】顶部极简栏 (无抽屉按钮) */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-center px-4">
          <div className="flex items-center gap-2">
             <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-1 rounded-lg shadow-sm">
                <Gem className="text-white w-4 h-4" />
             </div>
             <span className="font-black text-base text-slate-800 tracking-tight">御流管家</span>
          </div>
        </header>

        {/* 【大屏】面包屑 */}
        <header className="hidden lg:flex h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>御流管家系统</span>
            <span className="mx-3 text-slate-300">/</span>
            <span className="text-slate-700">控制台</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            本地离线模式
          </div>
        </header>

        {/* 注入 Dashboard 内容，自动处理滚动 */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-8 relative scroll-smooth w-full">
          {children}
        </main>
      </div>

      {/* ================== 【移动端专属】底部 Tab 导航栏 ================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
            !location.search.includes('tab=profile') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-1 transition-transform ${!location.search.includes('tab=profile') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">工作台</span>
        </button>

        <button 
          onClick={() => navigate('/dashboard?tab=profile')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
            location.search.includes('tab=profile') ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className={`w-5 h-5 mb-1 transition-transform ${location.search.includes('tab=profile') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">我的</span>
        </button>
      </div>

    </div>
  );
};