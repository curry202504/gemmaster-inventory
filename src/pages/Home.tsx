// 文件名: src/pages/Home.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gem, ArrowRight, ShieldCheck, Users, Zap, Cloud, Smartphone, BarChart3 } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  // 判断用户是否已经登录
  const isAuthenticated = !!localStorage.getItem('gem_token');

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-200 overflow-x-hidden">
      
      {/* 顶部导航栏 (毛玻璃效果) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-lg border-b border-slate-200/50 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
           <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-1.5 rounded-lg shadow-sm">
              <Gem className="text-white w-5 h-5" />
           </div>
           <span className="font-black text-lg text-slate-800 tracking-tight">御流管家</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-500">
          <a href="#features" className="hover:text-amber-600 transition-colors">核心功能</a>
          <a href="#security" className="hover:text-amber-600 transition-colors">数据安全</a>
          <a href="#pricing" className="hover:text-amber-600 transition-colors">版本定价</a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button onClick={handleCtaClick} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs transition-all shadow-md flex items-center gap-1">
              进入控制台 <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-slate-600 font-bold text-xs hover:text-slate-900 transition-colors hidden md:block">
                登录账号
              </Link>
              <Link to="/register" className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full font-bold text-xs transition-all shadow-md shadow-amber-500/20">
                免费申请体验
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 首屏 Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center text-center overflow-hidden">
        {/* 背景光晕装饰 */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-100/50 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-20 -right-20 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AurumFlow Pro V2.0 已发布</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-6 animate-in slide-in-from-bottom-6 fade-in duration-700">
          化繁为简，重塑<br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">黄金珠宝库存</span>管理。
        </h1>
        
        <p className="text-base md:text-xl text-slate-500 max-w-2xl mb-10 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 font-medium">
          专为现代化金店与珠宝工作室打造。从极速盘点、智能补货到多店员协同，为您提供金融级的数据安全与丝滑的操控体验。
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
          <button onClick={handleCtaClick} className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-slate-900/10 hover:-translate-y-1 flex items-center justify-center gap-2">
            {isAuthenticated ? '进入我的控制台' : '立即免费开始'} <ArrowRight className="w-4 h-4" />
          </button>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm transition-all text-center">
            了解核心功能
          </a>
        </div>
      </section>

      {/* 核心功能展示区 */}
      <section id="features" className="py-20 bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">为什么选择御流管家？</h2>
            <p className="text-slate-500 font-medium">抛弃臃肿难用的传统软件，体验下一代 SaaS 架构的轻量与高效。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors group">
               <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                 <Zap className="w-6 h-6 text-amber-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-3">极速批量建库</h3>
               <p className="text-sm text-slate-500 leading-relaxed">
                 完美兼容 Excel/CSV 表格，支持智能识别上架状态与圈口克重，一键导入数千条库存记录，告别手动录入的折磨。
               </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors group">
               <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                 <Users className="w-6 h-6 text-blue-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-3">多终端员工协同</h3>
               <p className="text-sm text-slate-500 leading-relaxed">
                 老板专属控制台，支持为店员一键分配子账号。数据实时同步，店员仅有盘点与出入库权限，彻底杜绝数据篡改与泄露。
               </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors group">
               <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                 <BarChart3 className="w-6 h-6 text-emerald-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-3">智能报表与补货</h3>
               <p className="text-sm text-slate-500 leading-relaxed">
                 根据实时出入库流水，系统自动计算安全库存水位。一键导出采购补货单与精准的 WPS 盘点表，让财务对账清晰明了。
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* 信任与安全展示区 */}
      <section id="security" className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <ShieldCheck className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">您的商业机密，坚不可摧。</h2>
          <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto">
            全站采用银行级 SSL 加密传输，底层由阿里云提供实时分布式容灾备份。您的所有进货底价与客户流水，只有您本人有权访问。
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-300">
            <span className="flex items-center gap-2"><Cloud className="w-5 h-5 text-slate-500"/> 云端实时同步</span>
            <span className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-slate-500"/> 跨设备无缝适配</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-slate-500"/> 权限严格隔离</span>
          </div>
        </div>
      </section>

      {/* 底部 CTA 引导 */}
      <section className="py-20 bg-amber-400 text-slate-900 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">准备好升级您的门店管理了吗？</h2>
          <p className="text-slate-800 font-medium mb-10">只需 30 秒注册，立刻体验极速版库存管家。新用户专享 PRO 权益赠送。</p>
          <button onClick={handleCtaClick} className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-base transition-all shadow-2xl shadow-slate-900/20 hover:-translate-y-1">
            {isAuthenticated ? '返回我的控制台' : '免费申请账户'}
          </button>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-slate-400 text-xs font-bold">
        <p>© 2026 AurumFlow 御流管家. All rights reserved.</p>
        <p className="mt-2 text-[10px] font-normal">基于现代前沿技术栈构建 | 专为黄金珠宝行业设计</p>
      </footer>
    </div>
  );
};