// 文件名: src/components/Toast.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 触发进场动画
    requestAnimationFrame(() => setIsVisible(true));
    
    // 3秒后触发退场动画并关闭
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待退场动画播放完毕
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textColors = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  };

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border backdrop-blur-md ${bgColors[type]}`}>
        {icons[type]}
        <span className={`text-sm font-bold tracking-wide ${textColors[type]}`}>{message}</span>
      </div>
    </div>
  );
};

// 全局唯一的 Toast 控制器
let toastListener: ((msg: string, type: ToastType) => void) | null = null;

export const ToastContainer = () => {
  const [toast, setToast] = useState<{msg: string, type: ToastType} | null>(null);

  useEffect(() => {
    toastListener = (msg, type) => setToast({ msg, type });
    return () => { toastListener = null; };
  }, []);

  if (!toast) return null;
  return <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />;
};

export const showToast = (message: string, type: ToastType = 'info') => {
  if (toastListener) toastListener(message, type);
};