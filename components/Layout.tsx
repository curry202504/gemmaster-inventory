import React from 'react';
import { LogOut, Gem, LayoutGrid } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: string | null;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigateHome }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
            <div className="bg-primary/10 p-2 rounded-lg">
                <Gem className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">GemMaster 库存管理</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500 hidden sm:inline">欢迎, {user}</span>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};