import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { api } from '../services/api'; // 使用我们新的 API 服务
import { generateDailyReport } from '../services/exportService';
import { Category, Product, StockItem, ListingStatus, ExportSelection } from '../types';
import { 
  Plus, Search, Package, Download, ArrowRight, ArrowDownLeft, 
  CheckCircle2, XCircle, Wallet, Gem, Layers, Crown, Zap, TrendingUp, Sliders
} from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';

export const Dashboard = () => {
  const navigate = useNavigate();
  
  // --- 核心数据状态 ---
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'DASHBOARD' | 'PRODUCT_DETAIL'>('DASHBOARD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  
  // --- 交互状态 ---
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForExport, setSelectedForExport] = useState<ExportSelection>({});
  const [loading, setLoading] = useState(true);

  // --- 弹窗与表单状态 ---
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newItemValues, setNewItemValues] = useState<Record<string, any>>({});
  const [newItemListingStatus, setNewItemListingStatus] = useState<ListingStatus>(ListingStatus.UNLISTED);

  // --- 初始化加载 ---
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
      // 真枪实弹：并发从后端获取数据
      const [cats, prods, its] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getItems()
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setItems(its || []);
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

  // --- 衍生计算逻辑 (与原逻辑完全一致且增强) ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const activeProduct = useMemo(() => products.find(p => String(p.id) === String(selectedProductId)), [products, selectedProductId]);
  
  const activeProductItems = useMemo(() => {
    if (!selectedProductId) return [];
    return items.filter(i => String(i.productId) === String(selectedProductId));
  }, [items, selectedProductId]);

  const activeCategory = useMemo(() => {
    if (!activeProduct) return null;
    return categories.find(c => c.id === activeProduct.categoryId);
  }, [activeProduct, categories]);

  const stats = useMemo(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = items.reduce((sum, item) => {
        // 动态识别克重字段
        const weight = Number(item.customValues?.weight) || Number(item.customValues?.克重) || 0;
        return sum + (weight * item.quantity);
    }, 0);
    return { totalCount, totalWeight, categoryCount: categories.length };
  }, [items, categories]);

  // --- 核心业务操作 (对接 API) ---
  
  const handleCreateProduct = async () => {
    if (!newProductName || !newProductCategory) return;
    try {
        await api.createProduct(newProductName, newProductCategory);
        setNewProductName('');
        setIsAddProductOpen(false);
        loadAllData();
    } catch (e: any) { alert(e.message); }
  };

  const handleInbound = async () => {
    if (!activeProduct || !activeCategory) return;
    try {
        await api.inbound({
            productId: activeProduct.id,
            customValues: newItemValues,
            listingStatus: newItemListingStatus
        });
        setNewItemValues({});
        setIsAddItemOpen(false);
        loadAllData();
    } catch (e: any) { alert(e.message); }
  };

  const handleOutbound = async (itemId: number, currentQty: number) => {
    if (!window.confirm(`确认将此项资产办理出库 (-1) 吗？\n当前存量: ${currentQty}`)) return;
    try {
        await api.outbound(itemId);
        loadAllData();
    } catch (e: any) { alert(e.message); }
  };

  const handleExport = async () => {
    const selectedIds = Object.keys(selectedForExport).filter(id => selectedForExport[id]);
    if (selectedIds.length === 0) return alert("请先选择需要导出的资产项");
    const productsToExport = products.filter(p => selectedIds.includes(String(p.id)));
    // 这里需要你原本的 exportService 支持 API 数据格式
    await generateDailyReport(productsToExport, items, [], categories);
  };

  const handlePaymentRequest = async (planId: string, isRecurring: boolean) => {
    try {
      await api.createOrder(planId, isRecurring);
    } catch (e: any) { alert(e.message); }
  };

  // --- 界面渲染 ---

  return (
    <Layout user={user?.username} onLogout={handleLogout} onNavigateHome={() => setView('DASHBOARD')}>
      <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-amber-500/30">
        
        <div className="max-w-7xl mx-auto px-6 py-10">
          
          {/* VIP 状态横幅 */}
          <div className="mb-12 group relative overflow-hidden bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30 p-8 rounded-[2.5rem] backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
               <Crown className="h-32 w-32 text-amber-500" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="bg-amber-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                   <Zap className="h-8 w-8 text-slate-950 fill-slate-950" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">AurumFlow 御流 · {user?.vip ? '尊享版' : '基础授权'}</h2>
                  <p className="text-slate-400 font-medium">您的资产数据已由阿里云加密中心实时托管，当前库存储备 {stats.totalCount} 件</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentOpen(true)}
                className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-xl shadow-white/5"
              >
                {user?.vip ? '延长服务期' : '立即激活 Pro 权限'}
              </button>
            </div>
          </div>

          {view === 'DASHBOARD' ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* 指标卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: '库存储备量', val: stats.totalCount, unit: 'PCS', icon: Package, color: 'from-blue-500/10' },
                  { label: '资产评估净重', val: stats.totalWeight.toFixed(2), unit: 'GRAMS', icon: TrendingUp, color: 'from-amber-500/10' },
                  { label: '运营管理模块', val: stats.categoryCount, unit: 'MODS', icon: Layers, color: 'from-emerald-500/10' }
                ].map((card, i) => (
                  <div key={i} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} to-transparent opacity-50`}></div>
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{card.label}</p>
                        <h3 className="text-4xl font-black text-white tabular-nums">{loading ? '---' : card.val} <span className="text-xs font-bold text-slate-600 ml-1">{card.unit}</span></h3>
                      </div>
                      <card.icon className="h-8 w-8 text-slate-700 group-hover:text-amber-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              {/* 工具栏 */}
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-[2rem] flex flex-col lg:flex-row items-center gap-6">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                  <input
                    type="text"
                    placeholder="全域搜索资产名、规格、流水号..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-amber-500/50 transition-all font-medium text-slate-200"
                  />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                  <button 
                    onClick={handleExport}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-slate-800 text-slate-300 rounded-2xl border border-white/5 hover:bg-slate-700 font-black text-xs uppercase tracking-widest transition-all"
                  >
                    <Download className="h-5 w-5 text-amber-500" /> 报表导出
                  </button>
                  <button 
                    onClick={() => {
                        setNewProductCategory(categories[0]?.id || '');
                        setIsAddProductOpen(true);
                    }}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10"
                  >
                    <Plus className="h-5 w-5" /> 新增登记
                  </button>
                </div>
              </div>

              {/* 资产名录列表 */}
              <div className="space-y-10">
                 {categories.map(cat => {
                   const catProds = filteredProducts.filter(p => p.categoryId === cat.id);
                   if (catProds.length === 0) return null;
                   return (
                     <div key={cat.id} className="space-y-6">
                       <h4 className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">
                         <span>{cat.name} 资源区</span>
                         <span className="h-[1px] flex-1 bg-white/5"></span>
                       </h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                         {catProds.map(prod => {
                           const count = items.filter(i => String(i.productId) === String(prod.id)).reduce((s, i) => s + i.quantity, 0);
                           return (
                             <div 
                               key={prod.id}
                               onClick={() => { setSelectedProductId(String(prod.id)); setView('PRODUCT_DETAIL'); }}
                               className="group relative bg-slate-900/20 border border-white/5 p-8 rounded-[2.5rem] hover:bg-slate-900/40 hover:border-amber-500/30 transition-all cursor-pointer overflow-hidden"
                             >
                                <div className="bg-slate-950/50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-amber-500/20">
                                   <Gem className="h-7 w-7 text-amber-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-amber-400 transition-colors">{prod.name}</h3>
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-8">ENTRY: {new Date(prod.createdAt).toLocaleDateString()}</p>
                                
                                <div className="flex justify-between items-end border-t border-white/5 pt-6">
                                  <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Stock Level</p>
                                    <p className="text-3xl font-black text-amber-500 tabular-nums">{count}</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-amber-500/5 text-amber-500 group-hover:translate-x-1 transition-all">
                                    <ArrowRight className="h-6 w-6" />
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
            // --- 详情视图 (PRODUCT_DETAIL) ---
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
                  <button onClick={() => setView('DASHBOARD')} className="w-16 h-16 flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500 hover:text-amber-500 transition-all">
                    <ArrowDownLeft className="h-8 w-8" />
                  </button>
                  <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{activeProduct?.name}</h1>
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">{activeCategory?.name}</span>
                      <span className="text-slate-700">|</span>
                      <span className="text-slate-500 text-sm font-medium">全局资源标识: {activeProduct?.id}</span>
                    </div>
                  </div>
                  <div className="flex-1"></div>
                  <button 
                    onClick={() => setIsAddItemOpen(true)}
                    className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-2xl flex items-center gap-3"
                  >
                    <Plus className="h-6 w-6" /> 办理入库登记
                  </button>
               </div>

               <div className="bg-slate-900/30 rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white/[0.02]">
                          <th className="px-10 py-7 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Status</th>
                          <th className="px-10 py-7 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Specifications</th>
                          <th className="px-10 py-7 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] text-center">Quantities</th>
                          <th className="px-10 py-7 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] text-right">Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeProductItems.map(item => (
                          <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="px-10 py-8">
                               {item.listingStatus === ListingStatus.LISTED ? (
                                 <div className="flex items-center gap-3 text-emerald-500">
                                   <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                   <span className="text-[10px] font-black uppercase tracking-widest">已在柜 (Listed)</span>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-3 text-slate-600">
                                   <div className="h-2.5 w-2.5 bg-slate-700 rounded-full"></div>
                                   <span className="text-[10px] font-black uppercase tracking-widest">库内 (Stock)</span>
                                 </div>
                               )}
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex flex-wrap gap-3">
                                 {activeCategory?.fields.map(f => (
                                   <div key={f.key} className="bg-slate-950/80 px-5 py-2.5 rounded-2xl border border-white/5">
                                      <span className="text-slate-600 text-[9px] font-black block uppercase tracking-widest mb-1">{f.label}</span>
                                      <span className="text-white font-bold tracking-tight">{item.customValues?.[f.key]}<span className="text-amber-500/50 ml-1 text-xs">{f.unit}</span></span>
                                   </div>
                                 ))}
                               </div>
                            </td>
                            <td className="px-10 py-8 text-center">
                               <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
                                 <span className="text-xs text-slate-700 mr-3 font-bold">QTY</span>
                                 {item.quantity}
                               </span>
                            </td>
                            <td className="px-10 py-8 text-right">
                               <button 
                                onClick={() => handleOutbound(Number(item.id), item.quantity)}
                                className="px-8 py-3 bg-red-500/5 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20"
                               >
                                 办理出库
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {activeProductItems.length === 0 && (
                    <div className="py-32 text-center">
                       <Package className="h-16 w-16 text-slate-800 mx-auto mb-6 opacity-20" />
                       <p className="text-slate-500 font-bold tracking-[0.4em] uppercase text-xs">当前资源库暂无资产存量</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* --- MODALS (全量整合) --- */}

        {/* 新建品名弹窗 */}
        <Modal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="登记新资产名录">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">资产名称</label>
              <input 
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 outline-none focus:border-amber-500/50 text-white"
                placeholder="例如：御制三生石戒指"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">业务模块分类</label>
              <select
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 outline-none focus:border-amber-500/50 text-white"
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
              >
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <button onClick={handleCreateProduct} className="w-full py-4 bg-amber-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs mt-4">确认登记</button>
          </div>
        </Modal>

        {/* 入库办理弹窗 */}
        <Modal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} title={`资产入库: ${activeProduct?.name}`}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {activeCategory?.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{field.label} ({field.unit})</label>
                  <input 
                    type={field.type === 'number' ? 'number' : 'text'}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 outline-none focus:border-amber-500/50 text-white"
                    placeholder="0"
                    value={newItemValues[field.key] || ''}
                    onChange={(e) => setNewItemValues({...newItemValues, [field.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">初次分发状态</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setNewItemListingStatus(ListingStatus.LISTED)}
                  className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${newItemListingStatus === ListingStatus.LISTED ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-900 border-white/10 text-slate-500'}`}
                >
                  直接上柜
                </button>
                <button 
                  onClick={() => setNewItemListingStatus(ListingStatus.UNLISTED)}
                  className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${newItemListingStatus === ListingStatus.UNLISTED ? 'bg-white border-white text-slate-950' : 'bg-slate-900 border-white/10 text-slate-500'}`}
                >
                  暂存仓库
                </button>
              </div>
            </div>
            <button onClick={handleInbound} className="w-full py-4 bg-amber-500 text-slate-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20">办理入库</button>
          </div>
        </Modal>

        {/* 支付订阅弹窗 */}
        <PaymentModal 
          isOpen={isPaymentOpen} 
          onClose={() => setIsPaymentOpen(false)} 
          onPay={handlePaymentRequest} 
        />

      </div>
    </Layout>
  );
};