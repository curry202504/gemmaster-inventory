import React, { useState } from 'react';
import { Modal } from './Modal';
import { Crown, Check, Zap, ShieldCheck, RefreshCcw } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: (planId: string, isRecurring: boolean, amount: number) => void;
}

export const PaymentModal = ({ isOpen, onClose, onPay }: PaymentModalProps) => {
  const [isRecurring, setIsRecurring] = useState(true);

  const plans = [
    {
      id: 'plan_month',
      name: '月度专业版',
      basePrice: 19.9,
      features: ['阿里云数据实时同步', '短信频控解除', '资产数量无限制', '多端实时登录'],
    },
    {
      id: 'plan_year',
      name: '年度尊享版',
      basePrice: 199,
      features: ['包含专业版所有功能', '多仓库管理权限', '专属高级财务报表', '1对1技术专员对接'],
      popular: true
    }
  ];

  const calculatePrice = (base: number) => {
    return isRecurring ? Number((base * 0.8).toFixed(2)) : base;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="升级 AurumFlow Pro">
      <div className="space-y-8">
        {/* 顶部标语 */}
        <div className="text-center">
            <p className="text-slate-400 text-sm font-medium tracking-wide">赋予您的黄金资产管理以专业级的安全与效能</p>
        </div>

        {/* 订阅模式切换 */}
        <div className="flex justify-center">
            <div className="bg-slate-900 p-1.5 rounded-2xl border border-white/5 flex items-center gap-2">
                <button 
                    onClick={() => setIsRecurring(false)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isRecurring ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    单次购买
                </button>
                <button 
                    onClick={() => setIsRecurring(true)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isRecurring ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <RefreshCcw className={`h-3 w-3 ${isRecurring ? 'animate-spin-slow' : ''}`} />
                    连续订阅 (8折)
                </button>
            </div>
        </div>

        {/* 方案选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const finalPrice = calculatePrice(plan.basePrice);
            return (
              <div 
                key={plan.id}
                className={`relative group bg-slate-900/50 border ${plan.popular ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.05)]' : 'border-white/5'} p-8 rounded-[2.5rem] transition-all hover:scale-[1.02] cursor-pointer`}
                onClick={() => onPay(plan.id, isRecurring, finalPrice)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-10 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                    最受欢迎
                  </div>
                )}
                
                <div className="mb-8">
                  <h4 className="text-xl font-black text-white mb-4 tracking-tight">{plan.name}</h4>
                  <div className="flex items-baseline gap-2">
                     <span className="text-sm font-bold text-amber-500/50 uppercase">RMB</span>
                     <span className="text-5xl font-black text-white tabular-nums tracking-tighter">
                        {finalPrice}
                     </span>
                     <span className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1">
                        / {plan.id.includes('month') ? '月' : '年'}
                     </span>
                  </div>
                  {isRecurring && (
                    <p className="mt-3 text-[10px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/5 py-1 px-3 rounded-lg w-fit">
                      已自动节省 ¥{(plan.basePrice - finalPrice).toFixed(2)}
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                      <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Check className="h-3 w-3 text-amber-500" />
                      </div> 
                      {f}
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${plan.popular ? 'bg-white text-slate-950 hover:bg-amber-400 shadow-xl' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  立即授权订阅
                </button>
              </div>
            );
          })}
        </div>

        {/* 底部保障 */}
        <div className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
           <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> 支付宝官方商户担保
           </div>
           <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <Zap className="h-4 w-4 text-amber-500" /> 权限实时下发
           </div>
        </div>
      </div>
    </Modal>
  );
};