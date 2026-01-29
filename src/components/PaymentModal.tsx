import React, { useState } from 'react';
import { Check, Zap, Crown, ShieldCheck, Smartphone } from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState(false);

  // 处理支付
  const handlePay = async (planId: 'plan_month' | 'plan_year') => {
    try {
      setLoading(true);
      // 调用创建订单接口 (后端 index.js 已有)
      const res = await api.createOrder(planId, isYearly); 
      // api.createOrder 内部会自动跳转支付宝链接
    } catch (error: any) {
      alert(error.message || '支付发起失败');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="升级 AurumFlow Pro">
      <div className="space-y-6">
        
        {/* 顶部宣传语 */}
        <div className="text-center space-y-2">
          <p className="text-slate-400 text-sm">
            解锁企业级库存管理能力，享受金融级数据安全
          </p>
          
          {/* 切换年付/月付 */}
          <div className="flex justify-center mt-4">
            <div className="bg-slate-900/50 p-1 rounded-xl border border-white/10 flex items-center relative">
               <button
                onClick={() => setIsYearly(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isYearly ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                单次购买
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isYearly ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Zap className="w-3 h-3 fill-current" />
                连续订阅 (8折)
              </button>
            </div>
          </div>
        </div>

        {/* 价格卡片容器 */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* 月度版 */}
          <div className="relative group p-5 rounded-2xl bg-slate-800/30 border border-white/5 hover:border-amber-500/30 transition-all hover:bg-slate-800/50 flex flex-col items-center text-center">
            <div className="text-slate-400 font-bold text-sm mb-2">月度专业版</div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-sm text-amber-600 font-bold">RMB</span>
              <span className="text-4xl font-black text-slate-100">{isYearly ? '15.9' : '19.9'}</span>
              <span className="text-xs text-slate-500">/月</span>
            </div>
            {isYearly && (
               <div className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold mb-4">
                 已自动节省 ¥48
               </div>
            )}
            <ul className="space-y-2 text-left w-full mb-6">
              <li className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="w-3 h-3 text-amber-500" /> 阿里云实时同步
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="w-3 h-3 text-amber-500" /> 无限资产数量
              </li>
            </ul>
            <button 
              onClick={() => handlePay('plan_month')}
              disabled={loading}
              className="w-full mt-auto py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
            >
              订阅月卡
            </button>
          </div>

          {/* 年度版 (高亮推荐) */}
          <div className="relative group p-5 rounded-2xl bg-gradient-to-b from-amber-900/20 to-slate-800/30 border border-amber-500/30 flex flex-col items-center text-center overflow-hidden">
            {/* 标签 */}
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl">
              最受欢迎
            </div>

            <div className="text-amber-200 font-bold text-sm mb-2 flex items-center gap-1">
              <Crown className="w-4 h-4" /> 年度尊享版
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-sm text-amber-600 font-bold">RMB</span>
              <span className="text-4xl font-black text-white">{isYearly ? '159' : '199'}</span>
              <span className="text-xs text-slate-500">/年</span>
            </div>
            {isYearly && (
               <div className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold mb-4 border border-amber-500/20">
                 限时立减 ¥40
               </div>
            )}
            <ul className="space-y-2 text-left w-full mb-6">
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-amber-500" /> 包含专业版所有功能
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-amber-500" /> 专属高级财务报表
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-amber-500" /> 1对1技术专家对接
              </li>
            </ul>
            <button 
              onClick={() => handlePay('plan_year')}
              disabled={loading}
              className="w-full mt-auto py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg shadow-amber-900/40"
            >
              {loading ? '处理中...' : '立即开通年卡'}
            </button>
          </div>
        </div>

        {/* 底部支付方式与保障 */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500 font-bold">支持支付方式</span>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#1677FF]/20 border border-[#1677FF]/30 text-[#1677FF] text-[10px] font-bold">
                 <Smartphone className="w-3 h-3" /> 支付宝
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#07C160]/20 border border-[#07C160]/30 text-[#07C160] text-[10px] font-bold">
                 <Smartphone className="w-3 h-3" /> 微信支付
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-6">
             <div className="flex items-center gap-1 text-[10px] text-slate-500">
               <ShieldCheck className="w-3 h-3 text-emerald-500" /> 支付官方商户担保
             </div>
             <div className="flex items-center gap-1 text-[10px] text-slate-500">
               <Zap className="w-3 h-3 text-amber-500" /> 权限实时下发
             </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};