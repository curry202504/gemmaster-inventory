import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { api } from '../services/api'; 
import { generateDailyReport, RestockConfig } from '../services/exportService';
import { Category, Product, StockItem, ListingStatus, ExportSelection } from '../types';
import { 
  Plus, Search, Package, Download, ArrowRight, ArrowDownLeft, 
  Crown, Zap, TrendingUp, Layers, Gem, Store, Archive, Trash2, PieChart, CheckSquare, Square
} from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';

export const Dashboard = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'DASHBOARD' | 'PRODUCT_DETAIL'>('DASHBOARD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  
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
  
  const [restockConfig, setRestockConfig] = useState<RestockConfig>({ minSize: 10, maxSize: 24, targetQty: 5 });

  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newItemValues, setNewItemValues] = useState<Record<string, any>>({});
  const [newItemListingStatus, setNewItemListingStatus] = useState<ListingStatus>(ListingStatus.LISTED);

  useEffect(() => {
    const storedUserStr = localStorage.getItem('gem_user');
    if (!storedUserStr) {
        navigate('/login');
        return;
    }
    setUser(JSON.parse(storedUserStr));
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cats, prods, its] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getItems()
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setItems(its || []);
      
      if (cats && cats.length > 0 && !newProductCategory) {
        setNewProductCategory(String(cats[0].id));
      }
    } catch (error) {
      console.error("数据同步失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const activeProduct = useMemo(() => products.find(p => String(p.id) === String(selectedProductId)), [products, selectedProductId]);
  
  const listedItems = useMemo(() => {
    if (!selectedProductId) return [];
    return items.filter(i => String(i.productId) === String(selectedProductId) && i.listingStatus === ListingStatus.LISTED);
  }, [items, selectedProductId]);

  const unlistedItems = useMemo(() => {
    if (!selectedProductId) return [];
    return items.filter(i => String(i.productId) === String(selectedProductId) && i.listingStatus !== ListingStatus.LISTED);
  }, [items, selectedProductId]);

  const activeCategory = useMemo(() => {
    if (!activeProduct) return null;
    return categories.find(c => c.id === activeProduct.categoryId);
  }, [activeProduct, categories]);

  const stats = useMemo(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = items.reduce((sum, item) => {
        const weight = Number(item.customValues?.weight) || 0;
        return sum + (weight * item.quantity);
    }, 0);
    const activeProductCount = products.filter(p => {
      const pItems = items.filter(i => String(i.productId) === String(p.id));
      const totalQty = pItems.reduce((s, i) => s + i.quantity, 0);
      return totalQty > 0;
    }).length;
    return { totalCount, totalWeight, activeProductCount };
  }, [items, products]);

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catProdIds = products.filter(p => String(p.categoryId) === String(cat.id)).map(p => String(p.id));
      const count = items
        .filter(i => catProdIds.includes(String(i.productId)))
        .reduce((sum, i) => sum + i.quantity, 0);
      return { name: cat.name, count };
    }).filter(c => c.count > 0);
  }, [categories, products, items]);

  const toggleSelectProduct = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => String(p.id)));
    }
  };
  
  const handleCreateProduct = async () => {
    if (!newProductName || !newProductCategory) return alert('请填写完整信息');
    try {
        await api.createProduct(newProductName, newProductCategory);
        alert('创建成功');
        setNewProductName('');
        setIsAddProductOpen(false);
        await loadAllData();
    } catch (e: any) { 
        alert('创建失败: ' + e.message); 
    }
  };

  const handleInbound = async () => {
    if (!activeProduct || !activeCategory) return;
    if (!newItemValues['weight']) return alert('请输入克重 (g)');

    try {
        await api.inbound({
            productId: activeProduct.id,
            customValues: newItemValues,
            listingStatus: newItemListingStatus
        });
        alert('入库成功');
        setNewItemValues({});
        setIsAddItemOpen(false);
        await loadAllData();
    } catch (e: any) { alert(e.message); }
  };

  const handleOutbound = async (itemId: number, currentQty: number) => {
    if (!window.confirm(`确认出库吗？\n当前存量: ${currentQty}`)) return;
    try {
        await api.outbound(itemId);
        await loadAllData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteProduct = async (e: React.MouseEvent, prodId: number, prodName: string) => {
    e.stopPropagation();
    if (!window.confirm(`确认删除产品 "${prodName}" 吗？\n\n注意：该产品下的所有库存记录也会被一并删除！`)) return;
    
    try {
      const res = await fetch(`/api/products/${prodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gem_token')}` }
      });
      if (res.ok) {
        alert('删除成功');
        await loadAllData();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('网络错误');
    }
  };

  const executeExport = async () => {
    try {
      setExporting(true);
      const targetProducts = selectedProductIds.length > 0 
        ? products.filter(p => selectedProductIds.includes(String(p.id)))
        : products;
      
      console.log('正在请求后端生成报表...');
      await generateDailyReport(targetProducts, items, categories, restockConfig);
      
      setIsExportModalOpen(false);
      alert('报告已生成并自动下载！');
    } catch (error: any) {
      console.error(error);
      alert('导出失败，请检查后端服务是否正常运行 (npm start)');
    } finally {
      setExporting(false);
    }
  };

  // 【核心 UI 重构】九宫格库存卡片
  const StockGrid = ({ title, data, colorClass, icon: Icon }: any) => (
    <div className="mb-12">
      {/* 标题栏 */}
      <div className={`flex items-center gap-3 mb-6 px-2 ${colorClass}`}>
        <div className="p-2 bg-white/5 rounded-xl border border-white/5 shadow-inner">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-black text-sm uppercase tracking-[0.2em]">{title} <span className="ml-2 opacity-40 text-xs font-mono">/ {data.length}组</span></h3>
      </div>
      
      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((item: any) => (
            <div 
              key={item.id} 
              className="group relative bg-[#0F1629] border border-white/5 rounded-[2rem] p-6 hover:bg-[#141C33] hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-2xl shadow-black/50"
            >
              {/* 规格标签组 */}
              <div className="space-y-2 mb-8">
                 {activeCategory?.fields.map(f => (
                   <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{f.label}</span>
                      <span className="text-sm font-bold text-slate-200 font-mono tracking-tight">{item.customValues?.[f.key] || '-'}</span>
                   </div>
                 ))}
              </div>

              {/* 底部：数量 + 按钮 */}
              <div className="flex items-end justify-between border-t border-white/5 pt-5">
                 <div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">库存 QTY</span>
                    <span className={`text-4xl font-black tabular-nums tracking-tighter ${title.includes('已上架') ? 'text-white' : 'text-slate-500'}`}>
                      {item.quantity}
                    </span>
                 </div>
                 
                 <button 
                   onClick={() => handleOutbound(Number(item.id), item.quantity)}
                   className="h-10 px-6 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg"
                 >
                   出库
                 </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 空状态
        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
             <Icon className="w-6 h-6 opacity-50" />
           </div>
           <p className="text-slate-600 text-xs font-bold tracking-[0.2em] uppercase">暂无相关库存记录</p>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen text-slate-200 font-sans selection:bg-amber-500/30 pb-20">
        
        {/* Banner */}
        <div className="mb-12 group relative overflow-hidden bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30 p-8 rounded-[2.5rem] backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-amber-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  <Zap className="h-8 w-8 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">AurumFlow 御流 · {user?.vip ? '尊享版' : '基础授权'}</h2>
                <p className="text-slate-400 font-medium">当前库存储备 {stats.totalCount} 件，总克重 {stats.totalWeight.toFixed(2)}g</p>
              </div>
            </div>
            <button onClick={() => setIsPaymentOpen(true)} className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all">
              {user?.vip ? '延长服务期' : '立即激活 Pro 权限'}
            </button>
          </div>
        </div>

        {view === 'DASHBOARD' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div onClick={() => setIsStockDetailOpen(true)} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group cursor-pointer hover:bg-slate-800/60 hover:border-amber-500/30 transition-all">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">库存储备量 (点击详情)</p>
                    <h3 className="text-4xl font-black text-white tabular-nums">{loading ? '---' : stats.totalCount} <span className="text-xs font-bold text-slate-600 ml-1">件</span></h3>
                  </div>
                  <Package className="h-8 w-8 text-slate-700 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">总克重</p>
                    <h3 className="text-4xl font-black text-white tabular-nums">{loading ? '---' : stats.totalWeight.toFixed(2)} <span className="text-xs font-bold text-slate-600 ml-1">克</span></h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-slate-700 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">在售款式</p>
                    <h3 className="text-4xl font-black text-white tabular-nums">{loading ? '---' : stats.activeProductCount} <span className="text-xs font-bold text-slate-600 ml-1">款</span></h3>
                  </div>
                  <Layers className="h-8 w-8 text-slate-700 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
            </div>

            {/* 工具栏 */}
            <div className="bg-slate-900/40 border border-white/5 p-4 rounded-[2rem] flex flex-col lg:flex-row items-center gap-6">
              <button onClick={handleSelectAll} className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-amber-500 transition-colors" title="全选/反选">
                {selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length ? <CheckSquare className="w-5 h-5 text-amber-500" /> : <Square className="w-5 h-5" />}
                <span className="text-xs font-bold">全选</span>
              </button>
              <div className="relative flex-1 w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                <input type="text" placeholder="搜索产品名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-amber-500/50 transition-all font-medium text-slate-200" />
              </div>
              <div className="flex gap-4 w-full lg:w-auto">
                <button onClick={() => setIsExportModalOpen(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-slate-800 text-slate-300 rounded-2xl border border-white/5 hover:bg-slate-700 font-black text-xs uppercase tracking-widest transition-all">
                  <Download className="h-5 w-5 text-amber-500" /> 生成报告 {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}
                </button>
                <button onClick={() => setIsAddProductOpen(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10">
                  <Plus className="h-5 w-5" /> 新增登记
                </button>
              </div>
            </div>

            {/* 产品列表 */}
            <div className="space-y-10">
                {categories.map(cat => {
                  const catProds = filteredProducts.filter(p => String(p.categoryId) === String(cat.id));
                  if (catProds.length === 0) return null;
                  return (
                    <div key={cat.id} className="space-y-6">
                      <h4 className="flex items-center gap-4 text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">
                        <span>{cat.name}</span>
                        <span className="h-[1px] flex-1 bg-white/10"></span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {catProds.map(prod => {
                          const count = items.filter(i => String(i.productId) === String(prod.id)).reduce((s, i) => s + i.quantity, 0);
                          const isSelected = selectedProductIds.includes(String(prod.id));
                          return (
                            <div 
                              key={prod.id}
                              onClick={() => { setSelectedProductId(String(prod.id)); setView('PRODUCT_DETAIL'); }}
                              className={`group relative cursor-pointer overflow-hidden rounded-[2rem] border p-6 transition-all hover:-translate-y-1 hover:shadow-2xl ${isSelected ? 'bg-amber-500/10 border-amber-500/50 shadow-amber-500/10' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/80'}`}
                            >
                              <div onClick={(e) => toggleSelectProduct(e, String(prod.id))} className="absolute top-4 left-4 z-20 text-slate-500 hover:text-amber-500">
                                {isSelected ? <CheckSquare className="w-5 h-5 text-amber-500" /> : <Square className="w-5 h-5" />}
                              </div>
                              <button onClick={(e) => handleDeleteProduct(e, Number(prod.id), prod.name)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/50 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 z-10">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="mb-8 pl-6">
                                <h3 className="text-xl font-black text-white tracking-tight group-hover:text-amber-400 transition-colors line-clamp-1">{prod.name}</h3>
                                <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  登记于 {new Date(prod.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-end justify-between border-t border-white/5 pt-4">
                                <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">当前库存</p>
                                  <p className={`text-3xl font-black tabular-nums tracking-tighter ${count > 0 ? 'text-amber-500' : 'text-slate-600'}`}>
                                    {count} <span className="text-xs text-slate-600 font-bold ml-0.5">件</span>
                                  </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-all group-hover:bg-amber-500 group-hover:text-slate-900">
                                  <ArrowRight className="h-5 w-5" />
                                </div>
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
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
                <button onClick={() => setView('DASHBOARD')} className="w-16 h-16 flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500 hover:text-amber-500 transition-all">
                  <ArrowDownLeft className="h-8 w-8" />
                </button>
                <div>
                  <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{activeProduct?.name}</h1>
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">{activeCategory?.name}</span>
                  </div>
                </div>
                <div className="flex-1"></div>
                <div className="flex gap-4">
                  <button onClick={() => { setSelectedProductIds([String(activeProduct?.id)]); setIsExportModalOpen(true); }} className="px-8 py-5 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all border border-white/5">
                    导出补货单
                  </button>
                  <button onClick={() => setIsAddItemOpen(true)} className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-2xl flex items-center gap-3">
                    <Plus className="h-6 w-6" /> 办理入库
                  </button>
                </div>
              </div>
              
              {/* 使用新的 Grid 布局替换 Table */}
              <StockGrid title="已上架库存" data={listedItems} colorClass="text-amber-500" icon={Store} />
              <StockGrid title="仓库/未上架" data={unlistedItems} colorClass="text-slate-500" icon={Archive} />
          </div>
        )}

        {/* --- 弹窗区域 --- */}

        <Modal isOpen={isStockDetailOpen} onClose={() => setIsStockDetailOpen(false)} title="库存储备详情">
          <div className="space-y-4">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-500">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-200">{cat.name}</span>
                </div>
                <span className="text-2xl font-black text-white tabular-nums">
                  {cat.count} <span className="text-xs text-slate-500 font-bold ml-1">件</span>
                </span>
              </div>
            ))}
            {categoryStats.length === 0 && <p className="text-center text-slate-500 py-8">暂无任何库存</p>}
          </div>
        </Modal>

        <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="生成智能运营报告">
          <div className="space-y-6">
            <p className="text-slate-400 text-xs">系统将自动分析今日出入库流水，并根据以下规则计算选中产品的补货需求。</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">最小圈口</label>
                <input type="number" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-slate-200 focus:border-amber-500/50 focus:outline-none" value={restockConfig.minSize} onChange={(e) => setRestockConfig({...restockConfig, minSize: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">最大圈口</label>
                <input type="number" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-slate-200 focus:border-amber-500/50 focus:outline-none" value={restockConfig.maxSize} onChange={(e) => setRestockConfig({...restockConfig, maxSize: Number(e.target.value)})} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">安全库存水位 (Target Qty)</label>
              <input type="number" className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-slate-200 focus:border-amber-500/50 focus:outline-none" value={restockConfig.targetQty} onChange={(e) => setRestockConfig({...restockConfig, targetQty: Number(e.target.value)})} />
              <p className="text-[10px] text-slate-600 mt-2 ml-1">例如设置 5，当某个圈口库存为 3 时，报告将提示“缺 2 个”。</p>
            </div>
            <button onClick={executeExport} disabled={exporting} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs mt-4 disabled:opacity-50">
              {exporting ? '正在生成报表...' : '立即生成报告'}
            </button>
          </div>
        </Modal>

        <Modal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="登记新产品">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">产品名称</label>
              <input 
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-slate-200 focus:border-amber-500/50 focus:outline-none"
                placeholder="例如：古法三生石戒指"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">所属分类</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-slate-200 focus:border-amber-500/50 focus:outline-none appearance-none"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                >
                  {categories.map(cat => <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
              </div>
            </div>
            <button onClick={handleCreateProduct} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs mt-4">确认创建</button>
          </div>
        </Modal>

        {/* 入库弹窗 */}
        <Modal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} title={`入库: ${activeProduct?.name}`}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {activeCategory?.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{field.label}</label>
                  <input 
                    type={field.type === 'number' ? 'number' : 'text'}
                    step={field.type === 'number' ? '0.01' : undefined} 
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-slate-200 focus:border-amber-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={newItemValues[field.key] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (field.type === 'number') {
                         if (/^\d*\.?\d{0,2}$/.test(val)) {
                           setNewItemValues({...newItemValues, [field.key]: val})
                         }
                      } else {
                         setNewItemValues({...newItemValues, [field.key]: val})
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">库存状态</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setNewItemListingStatus(ListingStatus.LISTED)}
                  className={`flex-1 py-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${newItemListingStatus === ListingStatus.LISTED ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-950/50 border-white/10 text-slate-500 hover:bg-white/5'}`}
                >
                  已上架 (Listed)
                </button>
                <button 
                  onClick={() => setNewItemListingStatus(ListingStatus.UNLISTED)}
                  className={`flex-1 py-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${newItemListingStatus === ListingStatus.UNLISTED ? 'bg-slate-700 border-slate-600 text-white shadow-lg' : 'bg-slate-950/50 border-white/10 text-slate-500 hover:bg-white/5'}`}
                >
                  未上架 (Warehouse)
                </button>
              </div>
            </div>
            <button onClick={handleInbound} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20">确认入库</button>
          </div>
        </Modal>

        <PaymentModal 
          isOpen={isPaymentOpen} 
          onClose={() => setIsPaymentOpen(false)} 
        />

      </div>
    </Layout>
  );
};