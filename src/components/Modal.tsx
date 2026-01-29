import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* 弹窗主体 - 这里的样式决定了它是黑的还是白的 */}
      <div className="relative w-full max-w-lg bg-[#0B1121] border border-white/10 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* 顶部光效 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50"></div>
        
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-xl font-black text-slate-100 tracking-wide">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 - 强制文字颜色为淡白，防止黑字看不见 */}
        <div className="p-6 text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};