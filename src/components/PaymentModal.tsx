// 文件名: src/components/PaymentModal.tsx
import React, { useState } from 'react';
import { Check, Zap, Crown, ShieldCheck, Smartphone } from 'lucide-react';
import { Modal } from './Modal';
// 我们不需要从外层传 showToast 进来了，为了简单，直接在这里也 import
import { showToast } from './Toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async (planId: 'plan_month' | 'plan_year') => {
    try {
      setLoading(true);
      // 因为之前的 api.js 黑盒封装可能吃掉了错误，我们改用原生 fetch
      const response = await fetch('/api/pay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('gem_token')}`
        },
        body: JSON.stringify({ planId, isRecurring: false })
      });

      const data = await response.json();

      if (response.ok && data.payUrl) {
         // 后端成功返回了支付宝链接，直接强行跳转到支付宝收银台！
         window.location.href = data.payUrl;
      } else {
         // 【核心修复】：把后端具体的报错信息优雅地弹出来
         showToast(data.error || '创建订单失败，请检查服务器密钥', 'error');
         setLoading(false);
      }
    } catch (error: any) {
      showToast('网络请求失败，请确认后端已启动', 'error');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="升级 御流管家 Pro">
      <div className="space-y-6">
        <div className="text-center space-y-2 mb-6">
          <p className="text-slate-500 text-sm font-bold">
            解锁企业级库存管理能力，享受金融级数据安全
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative group p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all flex flex-col items-center text-center">
            <div className="text-slate-600 font-bold text-sm mb-2">月度专业版</div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-sm text-amber-600 font-bold">RMB</span>
              <span className="text-4xl font-black text-slate-800">19.9</span>
              <span className="text-xs text-slate-400">/月</span>
            </div>
            <ul className="space-y-2 text-left w-full mb-6">
              <li className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Check className="w-3 h-3 text-amber-500 shrink-0" /> 阿里云实时同步
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Check className="w-3 h-3 text-amber-500 shrink-0" /> 无限资产数量
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-400 font-medium line-through opacity-50">
                <Check className="w-3 h-3 text-slate-300 shrink-0" /> 员工子账号权限
              </li>
            </ul>
            <button 
              onClick={() => handlePay('plan_month')} 
              disabled={loading} 
              className="w-full mt-auto py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              订阅月卡
            </button>
          </div>

          <div className="relative group p-5 rounded-2xl bg-gradient-to-b from-amber-50 to-white border border-amber-300 flex flex-col items-center text-center overflow-hidden shadow-lg shadow-amber-100/50">
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm">
              最受欢迎
            </div>
            <div className="text-amber-700 font-black text-sm mb-2 flex items-center gap-1">
              <Crown className="w-4 h-4" /> 年度尊享版
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-sm text-amber-600 font-bold">RMB</span>
              <span className="text-4xl font-black text-slate-900">199</span>
              <span className="text-xs text-slate-500">/年</span>
            </div>
            <ul className="space-y-2 text-left w-full mb-6">
              <li className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                <Check className="w-3 h-3 text-amber-500 shrink-0" /> 包含专业版所有功能
              </li>
              <li className="flex items-center gap-2 text-xs text-amber-600 font-bold">
                <Check className="w-3 h-3 text-amber-500 shrink-0" /> 专属员工子账号功能
              </li>
            </ul>
            <button 
              onClick={() => handlePay('plan_year')} 
              disabled={loading} 
              className="w-full mt-auto py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 text-slate-900 text-xs font-black transition-all shadow-md"
            >
              {loading ? '处理中...' : '立即开通年卡'}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400 font-bold">支持支付方式</span>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#1677FF]/10 border border-[#1677FF]/20 text-[#1677FF] text-[10px] font-bold">
                 <Smartphone className="w-3 h-3" /> 支付宝
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-6">
             <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
               <ShieldCheck className="w-3 h-3 text-emerald-500" /> 官方商户担保
             </div>
             <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
               <Zap className="w-3 h-3 text-amber-500" /> 权限实时下发
             </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};