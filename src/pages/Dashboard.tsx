// 文件名: src/pages/Dashboard.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { generateDailyReport, generateRestockReport, generateDailyFlowReport, RestockConfig } from '../services/exportService';
import { Category, Product, StockItem, ListingStatus } from '../types';
import { 
  Plus, Search, Package, Download, ArrowRight, ArrowDownLeft, 
  Zap, TrendingUp, Layers, Store, Archive, Trash2, PieChart, CheckSquare, Square, 
  FileSpreadsheet, Users, UserPlus, Upload, CheckCircle2, AlertCircle, Info,
  ChevronRight, LogOut, Crown, User, FileText
} from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileTab = location.search.includes('tab=profile');
  
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'DASHBOARD' | 'PRODUCT_DETAIL'>('DASHBOARD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isStockDetailOpen, setIsStockDetailOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [flowLogs, setFlowLogs] = useState<any[]>([]);
  const [isFlowLoading, setIsFlowLoading] = useState(false);
  
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [flowStartDate, setFlowStartDate] = useState(getTodayStr());
  const [flowEndDate, setFlowEndDate] = useState(getTodayStr());

  const [restockConfig, setRestockConfig] = useState<RestockConfig>({ minSize: 10, maxSize: 24, targetQty: 5 });

  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newItemValues, setNewItemValues] = useState<Record<string, any>>({});
  const [newItemListingStatus, setNewItemListingStatus] = useState<ListingStatus>(ListingStatus.LISTED);

  const [empForm, setEmpForm] = useState({ phone: '', username: '', password: '' });
  const [importCategory, setImportCategory] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toastConfig, setToastConfig] = useState<{show: boolean, msg: string, type: 'success'|'error'|'info'}>({show: false, msg: '', type: 'info'});
  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
      setToastConfig({ show: true, msg, type });
      setTimeout(() => setToastConfig(prev => ({...prev, show: false})), 3000);
  };

  const renderToast = () => {
    if (!toastConfig.show) return null;
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300 w-[90%] max-w-sm">
         <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${toastConfig.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' : toastConfig.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' : 'bg-blue-50/95 border-blue-200 text-blue-800'}`}>
             {toastConfig.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0"/> : toastConfig.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0"/> : <Info className="w-5 h-5 shrink-0"/>}
             <span className="text-sm font-bold tracking-wide break-words">{toastConfig.msg}</span>
         </div>
      </div>
    );
  };

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, msg: string, onConfirm: () => void}>({isOpen: false, msg: '', onConfirm: () => {}});
  const askConfirm = (msg: string, onConfirm: () => void) => {
      setConfirmDialog({ isOpen: true, msg, onConfirm });
  };

  useEffect(() => {
    const storedUserStr = localStorage.getItem('gem_user');
    if (!storedUserStr) {
        navigate('/login', { replace: true });
        return;
    }
    setUser(JSON.parse(storedUserStr));
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gem_token');
      if (!token) throw new Error("AUTH_FAILED");
      const headers = { 'Authorization': `Bearer ${token}` };

      const [catRes, prodRes, itemRes] = await Promise.all([
        fetch('/api/categories', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/items', { headers })
      ]);
      
      if (catRes.status === 401 || prodRes.status === 401 || itemRes.status === 401) throw new Error("AUTH_FAILED"); 
      
      const cats = await catRes.json();
      const prods = await prodRes.json();
      const its = await itemRes.json();
      
      const safeCats = Array.isArray(cats) ? cats : [];
      const safeProds = Array.isArray(prods) ? prods : [];
      const safeItems = Array.isArray(its) ? its : [];

      setCategories(safeCats);
      setProducts(safeProds);
      setItems(safeItems);
      
      if (safeCats.length > 0) {
        if(!newProductCategory) setNewProductCategory(String(safeCats[0].id));
        if(!importCategory) setImportCategory(String(safeCats[0].id));
      }
    } catch (error: any) {
      if (error.message === "AUTH_FAILED") {
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('gem_token');
      const res = await fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if(Array.isArray(data)) setEmployees(data);
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('gem_token');
    localStorage.removeItem('gem_user');
    localStorage.clear();
    window.location.href = '/';
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const activeProduct = useMemo(() => products.find(p => String(p.id) === String(selectedProductId)), [products, selectedProductId]);
  
  const getNumericSize = (sizeVal: any) => {
    if (!sizeVal) return 0;
    const str = String(sizeVal);
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const listedItems = useMemo(() => {
    if (!selectedProductId) return [];
    return items
      .filter(i => String(i.productId) === String(selectedProductId) && i.listingStatus === ListingStatus.LISTED)
      .sort((a, b) => getNumericSize(a.customValues?.size) - getNumericSize(b.customValues?.size));
  }, [items, selectedProductId]);

  const unlistedItems = useMemo(() => {
    if (!selectedProductId) return [];
    return items
      .filter(i => String(i.productId) === String(selectedProductId) && i.listingStatus !== ListingStatus.LISTED)
      .sort((a, b) => getNumericSize(a.customValues?.size) - getNumericSize(b.customValues?.size));
  }, [items, selectedProductId]);

  const activeCategory = useMemo(() => {
    if (!activeProduct) return null;
    return categories.find(c => c.id === activeProduct.categoryId);
  }, [activeProduct, categories]);

  const stats = useMemo(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = items.reduce((sum, item) => sum + ((Number(item.customValues?.weight) || 0) * item.quantity), 0);
    const activeProductCount = products.filter(p => items.filter(i => String(i.productId) === String(p.id)).reduce((s, i) => s + i.quantity, 0) > 0).length;
    return { totalCount, totalWeight, activeProductCount };
  }, [items, products]);

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catProdIds = products.filter(p => String(p.categoryId) === String(cat.id)).map(p => String(p.id));
      const count = items.filter(i => catProdIds.includes(String(i.productId))).reduce((sum, i) => sum + i.quantity, 0);
      return { name: cat.name, count };
    }).filter(c => c.count > 0);
  }, [categories, products, items]);

  const toggleSelectProduct = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => String(p.id)));
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    askConfirm(`高危操作警告：\n确认永久删除选中的 ${selectedProductIds.length} 款产品及库存吗？\n该操作不可逆！`, async () => {
        try {
          const res = await fetch(`/api/products/bulk-delete`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` },
            body: JSON.stringify({ productIds: selectedProductIds })
          });
          if (res.ok) { 
            showToast(`成功删除了 ${selectedProductIds.length} 项产品`, 'success');
            setSelectedProductIds([]);
            await loadAllData(); 
          } else { 
            const err = await res.json();
            showToast(err.error || '删除失败，可能无权限', 'error');
          }
        } catch (error) { showToast('网络错误', 'error'); }
    });
  };

  const handleCreateProduct = async () => {
    if (!newProductName || !newProductCategory) return showToast('请填写完整产品信息', 'error');
    try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` },
          body: JSON.stringify({ name: newProductName, categoryId: newProductCategory })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '创建失败');
        showToast('产品登记成功', 'success');
        setNewProductName('');
        setIsAddProductOpen(false);
        await loadAllData();
    } catch (e: any) { showToast('创建失败: ' + e.message, 'error'); }
  };

  const handleInbound = async () => {
    if (!activeProduct || !activeCategory) return;
    try {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` },
          body: JSON.stringify({ productId: activeProduct.id, customValues: newItemValues, listingStatus: newItemListingStatus })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '入库失败');
        showToast('办理入库成功', 'success');
        setNewItemValues({});
        setIsAddItemOpen(false);
        await loadAllData();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const confirmOutbound = (itemId: number, currentQty: number) => {
     askConfirm(`确认办理出库吗？\n当前该规格剩余库存为: ${currentQty} 件`, async () => {
        try {
            const res = await fetch('/api/items/outbound', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` },
              body: JSON.stringify({ itemId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '出库失败');
            showToast('商品已成功出库', 'success');
            await loadAllData();
        } catch (e: any) { showToast(e.message, 'error'); }
     });
  };

  const confirmDeleteProduct = (e: React.MouseEvent, prodId: number, prodName: string) => {
    e.stopPropagation();
    askConfirm(`危险操作：\n确认删除产品 "${prodName}" 吗？\n其下属的所有库存将一并被销毁！`, async () => {
        try {
          const res = await fetch(`/api/products/${prodId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` } });
          if (res.ok) { 
            showToast('产品已永久删除', 'success');
            await loadAllData(); 
          } else { showToast('删除失败，可能无权限', 'error'); }
        } catch (error) { showToast('网络错误', 'error'); }
    });
  };

  const handleExportInventoryCSV = () => {
    const targetProducts = selectedProductIds.length > 0 ? products.filter(p => selectedProductIds.includes(String(p.id))) : products;
    if (targetProducts.length === 0) return showToast('请先选择或登记产品', 'error');

    let csvContent = '\uFEFF品名,圈口/尺寸,克重(g),状态,登记系统时间\n';

    targetProducts.forEach(prod => {
      const prodItems = items.filter(i => String(i.productId) === String(prod.id));
      prodItems.forEach(item => {
        const size = item.customValues?.size || '-';
        const weight = item.customValues?.weight || '-';
        const statusStr = item.listingStatus === ListingStatus.LISTED ? '已上架' : '未上架';
        for (let j = 0; j < item.quantity; j++) {
          csvContent += `"${prod.name}","${size}","${weight}","${statusStr}","${new Date(item.updatedAt).toLocaleString()}"\n`;
        }
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `库存盘点表_${new Date().toLocaleDateString()}.csv`;
    link.click();
    showToast('盘点表已开始下载', 'success');
  };

  const fetchFlowLogs = async (startStr: string, endStr: string) => {
    setIsFlowLoading(true);
    try {
      const start = new Date(startStr).setHours(0,0,0,0);
      const end = new Date(endStr).setHours(23,59,59,999);
      
      const res = await fetch('/api/reports/flow', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` },
         body: JSON.stringify({ startDate: start, endDate: end })
      });
      const data = await res.json();
      setFlowLogs(Array.isArray(data) ? data : []);
    } catch(e) {
      showToast('获取流水失败，请检查网络', 'error');
    } finally {
      setIsFlowLoading(false);
    }
  };

  const openFlowModal = () => {
    const today = getTodayStr();
    setFlowStartDate(today);
    setFlowEndDate(today);
    setIsFlowModalOpen(true);
    fetchFlowLogs(today, today);
  };

  const handleExecuteFlowExport = async () => {
    if (flowLogs.length === 0) return showToast('当前区间无记录可导出', 'error');
    try {
      setExporting(true);
      await generateDailyFlowReport(flowLogs, `${flowStartDate}至${flowEndDate}出入库明细`);
      setIsFlowModalOpen(false);
      showToast('流水明细已开始下载！', 'success');
    } catch (error) { 
      showToast('生成流水报表失败', 'error'); 
    } finally { 
      setExporting(false); 
    }
  };

  const executeRestockExport = async () => {
    try {
      setExporting(true);
      const targetProducts = selectedProductIds.length > 0 ? products.filter(p => selectedProductIds.includes(String(p.id))) : products;
      await generateRestockReport(targetProducts, items, categories, restockConfig);
      setIsExportModalOpen(false);
      showToast('补货单生成成功！', 'success');
    } catch (error) { showToast('生成补货单失败', 'error'); } finally { setExporting(false); }
  };

  // 【核心功能修复】：添加员工逻辑
  const handleAddEmployee = async () => {
    // 【修改】：不依赖后端复杂的标记，直接用本地时间戳计算剩余时间
    // 假设 35 天的毫秒数 = 35 * 24 * 60 * 60 * 1000 = 3024000000
    // 如果系统里根本没有记到期时间，或者过期时间不够，就阻止
    const timeLeft = user?.vip_expiry ? (user.vip_expiry - Date.now()) : 0;
    
    // 我们约定：只要时间大于一个月的（比如买了年费），才允许添加员工
    if (timeLeft < 3024000000) {
        setIsPaymentOpen(true);
        return showToast('员工管理属于【PRO年度会员】专属特权，请先升级！', 'error');
    }
    
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` },
        body: JSON.stringify(empForm)
      });
      const data = await res.json();
      if(data.success) {
        showToast('成功开通员工终端', 'success');
        setEmpForm({phone:'', username:'', password:''});
        loadEmployees();
      } else { showToast(data.error, 'error'); }
    } catch (e) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        if (lines.length < 2) throw new Error('表格数据为空');
        
        const uploadData = [];
        for(let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols[0]) {
               const rawStatus = cols[3] ? cols[3].trim() : '';
               const finalStatus = rawStatus || '上架';

               uploadData.push({
                   name: cols[0],
                   size: cols[1] || '',
                   weight: cols[2] || '0',
                   status: finalStatus
               });
            }
        }

        const res = await fetch('/api/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` },
            body: JSON.stringify({ categoryId: importCategory, items: uploadData })
        });
        
        const data = await res.json();
        if (data.success) {
            showToast(`极速建库完成！导入 ${uploadData.length} 件商品`, 'success');
            setIsImportModalOpen(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
            await loadAllData();
        } else {
            showToast('导入失败: ' + data.error, 'error');
        }
      } catch (err: any) {
        showToast(err.message || '表格格式有误，请下载模板', 'error');
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
      const template = '\uFEFF品名(必填),圈口/尺寸(选填),克重(选填),上架情况(选填 默认上架)\n古法三生石戒指,12,2.5,上架\n麻花手镯,58,30.0,\n足金小挂件,,1.2,未上架';
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `批量极速入库模板.csv`;
      link.click();
      showToast('模板下载完成', 'info');
  };

  const roleType = user?.role ? String(user.role).toUpperCase() : '';
  const isOwnerOrLegacy = roleType !== 'EMPLOYEE';
  const roleDisplay = isOwnerOrLegacy ? '超级管理员' : '员工终端';

  const StockGrid = ({ title, data, colorClass, icon: Icon }: any) => (
    <div className="mb-6 lg:mb-8">
      <div className={`flex items-center gap-2 mb-3 pl-1 ${colorClass}`}>
        <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
        <h3 className="font-bold text-xs lg:text-sm tracking-widest">{title} <span className="ml-1 opacity-50 text-[9px] lg:text-[10px] font-mono">/ {data.length} 项</span></h3>
      </div>
      
      {data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 lg:gap-4">
          {data.map((item: any) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
              
              <div className="flex items-center justify-between gap-3 mb-4 mt-1">
                 {activeCategory?.fields.slice().sort((a, b) => {
                     if (a.label.includes('圈口') || a.label.includes('尺寸')) return -1;
                     return 1;
                 }).map(f => (
                   <div key={f.key} className="flex flex-col text-left">
                      <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 mb-0.5">{f.label}</span>
                      <span className="text-lg lg:text-xl font-black text-slate-800 leading-none tabular-nums tracking-tighter truncate">{item.customValues?.[f.key] || '-'}</span>
                   </div>
                 ))}

                 <div className="flex flex-col text-right">
                    <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 mb-0.5">数量</span>
                    <span className={`text-lg lg:text-xl font-black tabular-nums leading-none truncate ${title.includes('已上架') ? 'text-amber-600' : 'text-slate-500'}`}>{item.quantity}</span>
                 </div>
              </div>
              
              <button onClick={() => confirmOutbound(Number(item.id), item.quantity)} className="w-full py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold text-[10px] lg:text-xs shadow-sm">
                 出库
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
           <p className="text-slate-400 text-xs font-bold tracking-widest">暂无记录</p>
        </div>
      )}
    </div>
  );

  if (loading && categories.length === 0) {
     return <Layout><div className="flex h-[50vh] items-center justify-center text-slate-400 font-bold tracking-widest text-sm animate-pulse">正在进入系统核心...</div></Layout>;
  }

  // ===================== 移动端“我的”视图 =====================
  if (isProfileTab) {
    return (
      <Layout>
         {renderToast()}
         <div className="max-w-md mx-auto pt-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full border-2 border-slate-100 flex items-center justify-center mb-4">
                 <User className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{user?.username || '未命名'}</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">{user?.phone}</p>
              <div className="mt-4 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100">
                {roleDisplay} {user?.vip ? '· PRO会员' : ''}
              </div>
            </div>

            <div className="space-y-3">
              {isOwnerOrLegacy && (
                <button onClick={() => { 
                   // 校验是否拥有特权
                   const timeLeft = user?.vip_expiry ? (user.vip_expiry - Date.now()) : 0;
                   if (timeLeft < 3024000000) {
                      setIsPaymentOpen(true);
                      showToast('员工管理属于【PRO年度会员】专属特权，请先升级！', 'error');
                      return;
                   }
                   loadEmployees(); 
                   setIsEmployeeModalOpen(true); 
                }} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-500" /></div>
                    <span className="font-bold text-slate-700 text-sm">员工终端管理</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              )}

              {isOwnerOrLegacy && (
                <button onClick={() => setIsPaymentOpen(true)} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl"><Crown className="w-5 h-5 text-amber-500" /></div>
                    <span className="font-bold text-slate-700 text-sm">PRO 续费与升级</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              )}

              <button onClick={handleLogout} className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-all mt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-xl"><LogOut className="w-5 h-5 text-red-500" /></div>
                  <span className="font-bold text-red-600 text-sm">安全退出登录</span>
                </div>
              </button>
            </div>
         </div>

         {/* 此处提取到底部共享 Modal 区，这里不再重复渲染 */}
         <Modal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} title="员工终端管理">
            <div className="space-y-5 text-slate-800">
              <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-[11px] font-bold">
                注意：子账号功能需【PRO 年度会员】方可创建与使用。
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-500">新增子账号</h4>
                <div className="grid grid-cols-1 gap-2">
                  <input placeholder="手机号" value={empForm.phone} onChange={e=>setEmpForm({...empForm, phone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:border-amber-400 outline-none" />
                  <input placeholder="员工姓名" value={empForm.username} onChange={e=>setEmpForm({...empForm, username: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:border-amber-400 outline-none" />
                  <input placeholder="设置密码" type="password" value={empForm.password} onChange={e=>setEmpForm({...empForm, password: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:border-amber-400 outline-none" />
                </div>
                <button onClick={handleAddEmployee} className="w-full py-2 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 flex justify-center items-center gap-1.5 mt-2"><UserPlus className="w-3.5 h-3.5"/> 授权创建 (需年费VIP)</button>
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 mb-2">已授权终端 ({employees.length})</h4>
                {employees.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl bg-white">暂无</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {employees.map(emp => (
                      <div key={emp.id} className="flex justify-between items-center p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{emp.username}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{emp.phone}</p>
                        </div>
                        <button onClick={() => {
                          askConfirm(`确认永久吊销 "${emp.username}" 吗？`, async () => {
                            await fetch(`/api/employees/${emp.id}`, {method:'DELETE', headers:{'Authorization': `Bearer ${localStorage.getItem('gem_token')}`}});
                            showToast('权限已吊销', 'success');
                            loadEmployees();
                          })
                        }} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors text-[10px] font-bold">吊销</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Modal>
          <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
      </Layout>
    );
  }

  // ===================== 大屏或工作台视图 =====================
  return (
    <Layout>
      {renderToast()}
      <Modal isOpen={confirmDialog.isOpen} onClose={() => {
          if (confirmDialog.onCancel) confirmDialog.onCancel();
          setConfirmDialog({...confirmDialog, isOpen: false});
      }} title="系统确认">
        <div className="space-y-6">
           <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed font-medium">{confirmDialog.msg}</p>
           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  setConfirmDialog({...confirmDialog, isOpen: false});
              }} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">取消</button>
              <button onClick={() => { 
                  confirmDialog.onConfirm(); 
                  setConfirmDialog({...confirmDialog, isOpen: false}); 
              }} className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-600 transition-colors">确认执行</button>
           </div>
        </div>
      </Modal>

      <div className="w-full max-w-full overflow-x-hidden">
        {/* 大屏顶栏：在手机端隐藏此栏，因为功能已移至“我的”Tab */}
        <div className="hidden lg:grid mb-6 grid-cols-12 gap-4">
          <div className="col-span-4 bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-amber-50 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-2.5 rounded-xl shadow-md">
                    <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                    {roleDisplay} {user?.vip ? '(PRO)' : ''}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">AurumFlow 御流管家</p>
                </div>
            </div>
            <div className="relative z-10 flex gap-2 mt-4 pt-3 border-t border-slate-100">
                {isOwnerOrLegacy && (
                  <button onClick={() => { 
                     const timeLeft = user?.vip_expiry ? (user.vip_expiry - Date.now()) : 0;
                     if (timeLeft < 3024000000) {
                        setIsPaymentOpen(true);
                        showToast('员工管理属于【PRO年度会员】专属特权，请先升级！', 'error');
                        return;
                     }
                     loadEmployees(); 
                     setIsEmployeeModalOpen(true); 
                  }} className="flex-1 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <Users className="w-3.5 h-3.5" /> 员工管理
                  </button>
                )}
                <button onClick={() => setIsPaymentOpen(true)} className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md">
                  续费升级
                </button>
            </div>
          </div>

          <div className="col-span-8 grid grid-cols-3 gap-4">
            <div onClick={() => setIsStockDetailOpen(true)} className="bg-white border border-slate-200 shadow-sm hover:shadow-md p-4 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-center">
               <Package className="h-5 w-5 text-amber-500 mb-2" />
               <p className="text-slate-400 text-[10px] font-bold tracking-widest mb-1">总储备 (详情)</p>
               <h3 className="text-3xl font-black text-slate-800 tabular-nums leading-none">{stats.totalCount}</h3>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center">
               <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
               <p className="text-slate-400 text-[10px] font-bold tracking-widest mb-1">总克重</p>
               <h3 className="text-3xl font-black text-slate-800 tabular-nums leading-none">{stats.totalWeight.toFixed(2)}</h3>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex flex-col items-center justify-center text-center">
               <Layers className="h-5 w-5 text-blue-500 mb-2" />
               <p className="text-slate-400 text-[10px] font-bold tracking-widest mb-1">在售款式</p>
               <h3 className="text-3xl font-black text-slate-800 tabular-nums leading-none">{stats.activeProductCount}</h3>
            </div>
          </div>
        </div>

        {/* 手机端独享的顶部统计浓缩条 */}
        <div className="lg:hidden mb-4 grid grid-cols-3 gap-2 bg-white border border-slate-200 shadow-sm p-3 rounded-xl">
           <div onClick={() => setIsStockDetailOpen(true)} className="flex flex-col items-center border-r border-slate-100 pr-2">
             <span className="text-[10px] text-slate-400 font-bold mb-0.5">总储备</span>
             <span className="text-lg font-black text-slate-800 leading-none">{stats.totalCount}</span>
           </div>
           <div className="flex flex-col items-center border-r border-slate-100 px-2">
             <span className="text-[10px] text-slate-400 font-bold mb-0.5">总克重</span>
             <span className="text-lg font-black text-slate-800 leading-none">{stats.totalWeight.toFixed(1)}</span>
           </div>
           <div className="flex flex-col items-center pl-2">
             <span className="text-[10px] text-slate-400 font-bold mb-0.5">在售款</span>
             <span className="text-lg font-black text-slate-800 leading-none">{stats.activeProductCount}</span>
           </div>
        </div>

        {view === 'DASHBOARD' ? (
          <div className="space-y-4 lg:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white border border-slate-200 shadow-sm p-2 lg:p-3 rounded-xl lg:rounded-2xl flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
              <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto px-1">
                 <button onClick={handleSelectAll} className="flex items-center gap-1.5 px-2 py-1.5 text-slate-500 hover:text-amber-600 transition-colors rounded-lg hover:bg-slate-50" title="全选/反选">
                   {selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" /> : <Square className="w-4 h-4 lg:w-5 lg:h-5" />}
                   <span className="text-xs lg:text-sm font-bold whitespace-nowrap">全选</span>
                 </button>
                 
                 {selectedProductIds.length > 0 && isOwnerOrLegacy && (
                    <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors text-[10px] lg:text-xs font-bold whitespace-nowrap">
                      <Trash2 className="w-3.5 h-3.5" /> 批量删除 ({selectedProductIds.length})
                    </button>
                 )}
              </div>
              
              <div className="relative w-full lg:flex-1 lg:mx-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="搜索品名..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs lg:text-sm text-slate-800" />
              </div>
              
              <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
                <button onClick={openFlowModal} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 font-bold text-xs transition-all whitespace-nowrap">
                  <FileText className="h-4 w-4" /> 查流水
                </button>
                <button onClick={handleExportInventoryCSV} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-all whitespace-nowrap">
                  <FileSpreadsheet className="h-4 w-4" /> 盘点
                </button>
                <button onClick={() => setIsExportModalOpen(true)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs transition-all whitespace-nowrap">
                  <Download className="h-3.5 w-3.5 text-amber-500" /> 补货
                </button>
                <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center px-3 py-2.5 bg-white border border-slate-300 hover:border-amber-400 hover:text-amber-600 text-slate-700 rounded-xl font-bold text-xs transition-all whitespace-nowrap shadow-sm">
                   <Upload className="h-4 w-4 mr-1" /> 导入
                </button>
                <button onClick={() => setIsAddProductOpen(true)} className="col-span-2 lg:col-span-1 flex items-center justify-center px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-bold text-xs transition-all shadow-sm whitespace-nowrap">
                   <Plus className="h-4 w-4 mr-0.5" /> 新产品
                </button>
              </div>
            </div>

            <div className="space-y-6 pt-2">
                {categories.map(cat => {
                  const catProds = filteredProducts.filter(p => String(p.categoryId) === String(cat.id));
                  if (catProds.length === 0) return null;
                  return (
                    <div key={cat.id} className="space-y-3">
                      <h4 className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-slate-400 tracking-widest ml-1">
                        <span>{cat.name}</span>
                        <span className="h-[1px] flex-1 bg-slate-200"></span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 2xl:grid-cols-10 gap-2 lg:gap-3">
                        {catProds.map(prod => {
                          const count = items.filter(i => String(i.productId) === String(prod.id)).reduce((s, i) => s + i.quantity, 0);
                          const isSelected = selectedProductIds.includes(String(prod.id));
                          return (
                            <div 
                              key={prod.id}
                              onClick={() => { setSelectedProductId(String(prod.id)); setView('PRODUCT_DETAIL'); }}
                              className={`group relative cursor-pointer overflow-hidden rounded-xl border p-2.5 lg:p-3.5 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md lg:aspect-square ${isSelected ? 'bg-amber-50/50 border-amber-400 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'}`}
                            >
                              <div onClick={(e) => toggleSelectProduct(e, String(prod.id))} className="absolute top-1.5 left-1.5 lg:top-2.5 lg:left-2.5 z-20 text-slate-300 hover:text-amber-500">
                                {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4" />}
                              </div>
                              
                              {isOwnerOrLegacy && (
                                <button onClick={(e) => confirmDeleteProduct(e, Number(prod.id), prod.name)} className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-10">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              
                              <div className="flex-1 flex flex-col justify-center items-center text-center mt-3 lg:mt-5 px-1 lg:px-2">
                                <h3 className="text-[13px] lg:text-lg font-black text-slate-800 leading-snug lg:leading-tight group-hover:text-amber-600 transition-colors line-clamp-2">{prod.name}</h3>
                              </div>

                              <div className="flex items-end justify-between pt-2 border-t border-slate-100 mt-2">
                                <div className="flex items-baseline gap-0.5">
                                  <span className={`text-xl lg:text-2xl font-black tabular-nums leading-none ${count > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                                    {count}
                                  </span>
                                  <span className="text-[8px] lg:text-[9px] text-slate-400 font-bold mb-0.5">件</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-200 group-hover:text-amber-500 transition-colors mb-0.5" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="flex flex-col xl:flex-row gap-4 mb-4 lg:mb-6 bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm">
                
                <div className="flex items-start gap-3 xl:w-1/3">
                    <button onClick={() => setView('DASHBOARD')} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all shrink-0">
                      <ArrowDownLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">{activeProduct?.name}</h1>
                      <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold border border-amber-100">{activeCategory?.name}</span>
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col sm:flex-row items-end gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   {activeCategory?.fields.map(field => (
                      <div key={field.key} className="w-full sm:w-auto flex-1">
                         <label className="block text-[10px] font-bold text-slate-500 mb-1">{field.label}</label>
                         <input 
                           type={field.type === 'number' ? 'number' : 'text'} step={field.type === 'number' ? '0.01' : undefined} 
                           className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-slate-800 text-sm focus:border-amber-400 outline-none"
                           value={newItemValues[field.key] || ''}
                           onChange={(e) => {
                             const val = e.target.value;
                             if (field.type === 'number') { if (/^\d*\.?\d{0,2}$/.test(val)) setNewItemValues({...newItemValues, [field.key]: val}) }
                             else { setNewItemValues({...newItemValues, [field.key]: val}) }
                           }}
                         />
                      </div>
                   ))}
                   
                   <div className="w-full sm:w-auto flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">存放位置</label>
                      <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 h-10">
                         <button onClick={() => setNewItemListingStatus(ListingStatus.LISTED)} className={`flex-1 px-2 text-[11px] font-bold rounded-md transition-colors ${newItemListingStatus === ListingStatus.LISTED ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}>上架</button>
                         <button onClick={() => setNewItemListingStatus(ListingStatus.UNLISTED)} className={`flex-1 px-2 text-[11px] font-bold rounded-md transition-colors ${newItemListingStatus === ListingStatus.UNLISTED ? 'bg-slate-200 text-slate-700' : 'text-slate-500'}`}>仓库</button>
                      </div>
                   </div>
                   
                   <button onClick={handleInbound} className="w-full sm:w-auto h-10 px-6 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all shadow-md flex items-center justify-center whitespace-nowrap">
                      <Plus className="w-4 h-4 mr-1" /> 确认入库
                   </button>
                </div>
              </div>
              
              <StockGrid title="已上架库存" data={listedItems} colorClass="text-emerald-600" icon={Store} />
              <StockGrid title="仓库储备 (未上架)" data={unlistedItems} colorClass="text-slate-500" icon={Archive} />
          </div>
        )}

        {/* ===================== 全局共享弹窗 ===================== */}
        <Modal isOpen={isFlowModalOpen} onClose={() => setIsFlowModalOpen(false)} title="出入库明细记录">
          <div className="space-y-4">
             <div className="flex items-center gap-2">
               <input type="date" value={flowStartDate} onChange={(e) => {setFlowStartDate(e.target.value); fetchFlowLogs(e.target.value, flowEndDate);}} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400" />
               <span className="text-slate-400 text-xs font-bold">至</span>
               <input type="date" value={flowEndDate} onChange={(e) => {setFlowEndDate(e.target.value); fetchFlowLogs(flowStartDate, e.target.value);}} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400" />
             </div>
             
             <div className="flex gap-2">
                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-emerald-600 font-bold mb-1 tracking-widest">区间入库</span>
                  <span className="text-lg font-black text-emerald-700 tabular-nums">{flowLogs.filter(l=>l.type==='IN').reduce((s,l)=>s+l.quantity,0)} <span className="text-[10px]">件</span></span>
                </div>
                <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <span className="block text-[10px] text-red-600 font-bold mb-1 tracking-widest">区间出库</span>
                  <span className="text-lg font-black text-red-700 tabular-nums">{flowLogs.filter(l=>l.type==='OUT').reduce((s,l)=>s+l.quantity,0)} <span className="text-[10px]">件</span></span>
                </div>
             </div>

             <div className="border border-slate-200 rounded-xl h-64 overflow-y-auto bg-slate-50">
                {isFlowLoading ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">数据拉取中...</div>
                ) : flowLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">该区间无流水记录</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {flowLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-white flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${log.type==='IN'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>
                               {log.type==='IN' ? '入库' : '出库'}
                             </span>
                             <span className="font-bold text-sm text-slate-800 line-clamp-1">{log.product_name || '未知商品'}</span>
                          </div>
                          
                          {log.custom_values && log.custom_values !== '{}' ? (
                             <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                               {(() => {
                                 try {
                                   const cv = JSON.parse(log.custom_values);
                                   const s = cv.size ? `圈口: ${cv.size} | ` : '';
                                   return `${s}克重: ${cv.weight}g`;
                                 } catch(e) { return `克重: ${log.weight}g`; }
                               })()}
                             </span>
                          ) : (
                             <span className="text-[10px] text-slate-500 font-medium mt-0.5">克重: {log.weight}g</span>
                          )}
                          
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-right flex flex-col items-end justify-center">
                          <span className={`font-black text-lg tabular-nums leading-none ${log.type==='IN'?'text-emerald-600':'text-red-600'}`}>
                             {log.type==='IN'?'+':'-'}{log.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 font-bold">件</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <button onClick={handleExecuteFlowExport} disabled={exporting || flowLogs.length===0} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
                {exporting ? '正在生成报表...' : <><FileText className="w-4 h-4"/> 导出 Word 流水明细</>}
             </button>
          </div>
        </Modal>

        <Modal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} title="员工终端管理">
          <div className="space-y-5 text-slate-800">
            <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-[11px] font-bold">
               注意：子账号功能需【PRO 年度会员】方可创建与使用。
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
               <h4 className="text-[11px] font-bold text-slate-500">新增子账号</h4>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
                 <input placeholder="手机号" value={empForm.phone} onChange={e=>setEmpForm({...empForm, phone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-none" />
                 <input placeholder="员工姓名" value={empForm.username} onChange={e=>setEmpForm({...empForm, username: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-none" />
                 <input placeholder="设置密码" type="password" value={empForm.password} onChange={e=>setEmpForm({...empForm, password: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-none" />
               </div>
               <button onClick={handleAddEmployee} className="w-full py-2 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 flex justify-center items-center gap-1.5 mt-2"><UserPlus className="w-3.5 h-3.5"/> 授权创建</button>
            </div>
            
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 mb-2">已授权终端 ({employees.length})</h4>
              {employees.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl bg-white">暂无员工</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {employees.map(emp => (
                    <div key={emp.id} className="flex justify-between items-center p-2.5 border border-slate-200 rounded-lg bg-white shadow-sm">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{emp.username}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{emp.phone}</p>
                      </div>
                      <button onClick={() => {
                        askConfirm(`确认永久吊销员工 "${emp.username}" 的系统访问权限吗？`, async () => {
                           await fetch(`/api/employees/${emp.id}`, {method:'DELETE', headers:{'Authorization': `Bearer ${localStorage.getItem('gem_token')}`}});
                           showToast('权限已吊销', 'success');
                           loadEmployees();
                        })
                      }} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors text-[10px] font-bold">吊销</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>

        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="表格导入建库">
          <div className="space-y-5">
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-600 mb-2 font-bold">1. 选择存入分类</p>
                <select
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:border-amber-400 focus:outline-none shadow-sm text-sm"
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value)}
                >
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
             </div>
             
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-[11px] text-slate-600 font-bold">2. 上传数据表格</p>
                    <button onClick={downloadTemplate} className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">下载标准模板</button>
                 </div>
                 <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                    请确保 CSV 包含 1~4 列，从左到右依次为：<br/>
                    <strong className="text-slate-700">品名(必填)、圈口/尺寸、克重、上架情况 (选填 默认"上架")</strong>
                 </p>
                 
                 <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 hover:border-amber-400 transition-all">
                    <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload className="w-6 h-6 mb-2 text-slate-300" />
                        <p className="mb-1 text-xs text-slate-600 font-bold"><span className="text-amber-500">点击此处</span> 选择文件</p>
                        <p className="text-[9px] text-slate-400">支持 .csv 格式 (UTF-8)</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                 </label>
             </div>
          </div>
        </Modal>

        <Modal isOpen={isStockDetailOpen} onClose={() => setIsStockDetailOpen(false)} title="库存储备详情">
          <div className="space-y-3">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-slate-700">{cat.name}</span>
                </div>
                <span className="text-2xl font-black text-slate-800 tabular-nums">
                  {cat.count} <span className="text-[10px] text-slate-400 font-bold ml-0.5">件</span>
                </span>
              </div>
            ))}
            {categoryStats.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">暂无库存</p>}
          </div>
        </Modal>

        <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="生成智能补货单">
          <div className="space-y-5">
            <p className="text-slate-500 text-xs">系统将自动分析产品的缺口，生成补货建议表。</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">补货最小圈口</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:border-amber-400 outline-none" value={restockConfig.minSize} onChange={(e) => setRestockConfig({...restockConfig, minSize: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">补货最大圈口</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:border-amber-400 outline-none" value={restockConfig.maxSize} onChange={(e) => setRestockConfig({...restockConfig, maxSize: Number(e.target.value)})} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5">目标安全库存 (Target Qty)</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:border-amber-400 outline-none" value={restockConfig.targetQty} onChange={(e) => setRestockConfig({...restockConfig, targetQty: Number(e.target.value)})} />
            </div>
            <button onClick={executeRestockExport} disabled={exporting} className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-bold text-sm mt-2 disabled:opacity-50 transition-colors shadow-md">
              {exporting ? '正在生成...' : '立即生成'}
            </button>
          </div>
        </Modal>

        <Modal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="单品入库登记">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">产品名称</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-amber-400 outline-none"
                placeholder="例: 古法三生石戒指" value={newProductName} onChange={(e) => setNewProductName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">所属分类</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-amber-400 outline-none"
                value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}
              >
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <button onClick={handleCreateProduct} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm mt-2 transition-colors shadow-md">确认创建</button>
          </div>
        </Modal>

        <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
      </div>
    </Layout>
  );
};