import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Modal } from './components/Modal';
import { StorageService } from './services/storage';
import { generateDailyReport } from './services/exportService';
import { User, Category, Product, StockItem, ListingStatus, ExportSelection } from './types';
import { 
  Plus, Search, Package, Download, ArrowRight, ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle, Wallet, Gem, Layers
} from 'lucide-react';

// --- Helper for ID generation in App component ---
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// --- Sub-components defined here ---

// LOGIN COMPONENT
const LoginScreen = ({ onLogin }: { onLogin: (username: string) => void }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    onLogin(username);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-xl">
             <Package className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">GemMaster</h2>
        <p className="text-center text-slate-500 mb-8">黄金库存管理系统</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="请输入用户名"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
          >
            登 录
          </button>
        </form>
      </div>
    </div>
  );
};

// MAIN APP
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'DASHBOARD' | 'PRODUCT_DETAIL'>('DASHBOARD');
  
  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  
  // Selection / Navigation State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForExport, setSelectedForExport] = useState<ExportSelection>({});

  // Modals State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  
  // Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  
  const [newItemValues, setNewItemValues] = useState<Record<string, string>>({});
  const [newItemListingStatus, setNewItemListingStatus] = useState<ListingStatus>(ListingStatus.UNLISTED);

  // --- Initialization ---
  useEffect(() => {
    const storedUser = StorageService.getUser();
    if (storedUser) setUser({ username: storedUser });
    refreshData();
  }, []);

  const refreshData = () => {
    setCategories(StorageService.getCategories());
    setProducts(StorageService.getProducts());
    setItems(StorageService.getItems());
  };

  const handleLogin = (username: string) => {
    StorageService.setUser(username);
    setUser({ username });
    refreshData();
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
  };

  // --- Derived State ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const activeProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const activeProductItems = useMemo(() => {
    if (!selectedProductId) return [];
    return items.filter(i => i.productId === selectedProductId);
  }, [items, selectedProductId]);

  const activeCategory = useMemo(() => {
    if (!activeProduct) return null;
    return categories.find(c => c.id === activeProduct.categoryId);
  }, [activeProduct, categories]);

  const totalWeight = useMemo(() => {
    // Calculate total weight (assuming 'weight' key exists)
    return items.reduce((sum, item) => {
        // Try to find a key that looks like weight in customValues (handling old data gracefully)
        const cv = item.customValues || {};
        const weightKey = Object.keys(cv).find(k => k.includes('weight') || k === 'weight');
        const val = weightKey ? Number(cv[weightKey]) : 0;
        return sum + (val * item.quantity);
    }, 0);
  }, [items]);

  const totalCount = useMemo(() => {
      return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // --- Actions ---

  const handleCreateProduct = () => {
    if (!newProductName || !newProductCategory) return;
    const newProduct: Product = {
      id: generateId(),
      name: newProductName,
      categoryId: newProductCategory,
      createdAt: Date.now(),
    };
    StorageService.saveProduct(newProduct);
    refreshData();
    setIsAddProductOpen(false);
    setNewProductName('');
    setNewProductCategory('');
  };

  const handleCreateItem = () => {
    if (!activeProduct || !activeCategory) return;
    
    // Convert string inputs
    const customValues: Record<string, any> = {};
    activeCategory.fields.forEach(field => {
        const val = newItemValues[field.key];
        customValues[field.key] = field.type === 'number' ? Number(val) : val;
    });

    StorageService.addItem(activeProduct.id, customValues, newItemListingStatus, activeCategory);
    
    refreshData();
    setIsAddItemOpen(false);
    setNewItemValues({});
    setNewItemListingStatus(ListingStatus.UNLISTED);
  };

  const handleOutboundRow = (item: StockItem) => {
    if (!activeCategory) {
        alert("错误：无法获取分类信息。请刷新页面重试。");
        return;
    }
    
    if(!window.confirm(`确认出库 1 件吗？ (当前数量: ${item.quantity})`)) return;
    
    // Call service which now handles try/catch for logs internally
    const success = StorageService.outboundItem(item, activeCategory);
    
    if (success) {
        refreshData();
        // UI automatically updates due to refreshData
    } else {
        alert("出库失败！请刷新页面后重试。");
    }
  };

  const handleExport = async () => {
    const selectedIds = Object.keys(selectedForExport).filter(id => selectedForExport[id]);
    if (selectedIds.length === 0) {
      alert("请至少选择一个商品进行导出。");
      return;
    }
    const productsToExport = products.filter(p => selectedIds.includes(p.id));
    const logs = StorageService.getLogs(); // Get all logs for today's report
    await generateDailyReport(productsToExport, items, logs, categories);
  };

  const toggleSelectAll = () => {
    const allSelected = filteredProducts.every(p => selectedForExport[p.id]);
    const newSelection: ExportSelection = {};
    filteredProducts.forEach(p => {
      newSelection[p.id] = !allSelected;
    });
    setSelectedForExport(newSelection);
  };

  // --- Render ---

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Layout user={user.username} onLogout={handleLogout} onNavigateHome={() => setView('DASHBOARD')}>
      
      {/* DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">总库存件数</p>
                <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">总克重 (估算)</p>
                <p className="text-2xl font-bold text-slate-800">{totalWeight.toFixed(2)}g</p>
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">商品分类</p>
                <p className="text-2xl font-bold text-slate-800">{categories.length}</p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索商品品名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium shadow-sm flex-1 md:flex-none"
              >
                <Download className="h-4 w-4" />
                导出日报 (Word)
              </button>
              <button 
                onClick={() => {
                    setNewProductCategory(categories[0]?.id || '');
                    setIsAddProductOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors font-medium shadow-lg shadow-primary/30 flex-1 md:flex-none"
              >
                <Plus className="h-4 w-4" />
                新建品名
              </button>
            </div>
          </div>

          {/* Product Categories Sections */}
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">商品列表</h2>
              <button 
                onClick={toggleSelectAll} 
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                {filteredProducts.length > 0 && filteredProducts.every(p => selectedForExport[p.id]) ? '取消全选' : '全选'}
              </button>
            </div>

            {categories.map(category => {
                const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id);
                if (categoryProducts.length === 0) return null;

                return (
                    <div key={category.id} className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <span className="h-6 w-1 bg-primary rounded-full"></span>
                            <h3 className="text-xl font-bold text-slate-700">{category.name}区</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {categoryProducts.map((product) => {
                                const stockCount = items.filter(i => i.productId === product.id).reduce((sum, i) => sum + i.quantity, 0);
                                const isSelected = !!selectedForExport[product.id];

                                return (
                                <div 
                                    key={product.id} 
                                    className={`group bg-white rounded-xl shadow-sm border transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-slate-200'}`}
                                    onClick={() => {
                                        setSelectedProductId(product.id);
                                        setView('PRODUCT_DETAIL');
                                    }}
                                >
                                    {/* Selection Checkbox Overlay */}
                                    <div 
                                        className="absolute top-3 right-3 z-10" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedForExport(prev => ({...prev, [product.id]: !prev[product.id]}));
                                        }}
                                    >
                                        <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-300 hover:border-primary'}`}>
                                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <Gem className="h-6 w-6" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{product.name}</h3>
                                        <p className="text-sm text-slate-500 mb-4">创建于 {new Date(product.createdAt).toLocaleDateString()}</p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="text-sm font-medium text-slate-600">
                                                库存件数: <span className="text-slate-900 font-bold">{stockCount}</span>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}
            
            {filteredProducts.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>未找到匹配的商品。</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL VIEW */}
      {view === 'PRODUCT_DETAIL' && activeProduct && activeCategory && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <button 
              onClick={() => setView('DASHBOARD')}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <ArrowDownLeft className="h-6 w-6 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{activeProduct.name}</h1>
              <p className="text-slate-500 flex items-center gap-2">
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{activeCategory.name}</span>
                <span>•</span>
                <span>总库存: {activeProductItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </p>
            </div>
            <div className="flex-1" />
            <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddItemOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/30 font-medium transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="h-5 w-5" />
                  入库 (新建库存)
                </button>
            </div>
          </div>

          {/* Stock List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-1">状态</div>
                <div className="col-span-5">规格参数</div>
                <div className="col-span-2">当前数量</div>
                <div className="col-span-2">最后更新</div>
                <div className="col-span-2 text-right">操作</div>
             </div>
             
             <div className="divide-y divide-slate-50">
                {activeProductItems.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors group">
                    <div className="col-span-1">
                      {item.listingStatus === ListingStatus.LISTED ? (
                         <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                           <CheckCircle2 className="h-3 w-3 mr-1" /> 已上架
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                           <XCircle className="h-3 w-3 mr-1" /> 未上架
                         </span>
                      )}
                    </div>
                    <div className="col-span-5 text-sm text-slate-700">
                      <div className="flex flex-wrap gap-2">
                        {activeCategory.fields.map(field => (
                          <span key={field.key} className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs">
                             <span className="text-slate-500 mr-1">{field.label}:</span>
                             <span className="font-semibold">{(item.customValues || {})[field.key]}{field.unit}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm font-bold text-slate-900">
                        x {item.quantity}
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">
                        {new Date(item.updatedAt).toLocaleTimeString()}
                    </div>
                    <div className="col-span-2 text-right">
                       <button 
                         onClick={() => handleOutboundRow(item)}
                         className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ml-auto"
                       >
                         出库 (-1)
                         <ArrowUpRight className="h-3.5 w-3.5" />
                       </button>
                    </div>
                  </div>
                ))}

                {activeProductItems.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                    <p>暂无库存。</p>
                    <button onClick={() => setIsAddItemOpen(true)} className="text-primary hover:underline text-sm mt-2">添加第一个库存</button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      
      {/* Create Product Modal */}
      <Modal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="新建品名">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">品名</label>
            <input 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="例如：三生三世戒指"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">分类 (模块)</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">不同分类对应不同的规格参数（如：戒指对应圈口，项链对应长度）。</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
             <button onClick={() => setIsAddProductOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
             <button onClick={handleCreateProduct} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">创建</button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal (Inbound) */}
      <Modal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} title={`入库: ${activeProduct?.name}`}>
        <div className="space-y-4">
          {/* Dynamic Fields based on Category */}
          <div className="grid grid-cols-2 gap-4">
            {activeCategory?.fields.map(field => (
                <div key={field.key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{field.label}</label>
                    <div className="relative">
                        <input 
                            type={field.type}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="0"
                            value={newItemValues[field.key] || ''}
                            onChange={(e) => setNewItemValues({...newItemValues, [field.key]: e.target.value})}
                        />
                        {field.unit && <span className="absolute right-3 top-2 text-slate-400 text-sm">{field.unit}</span>}
                    </div>
                </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">上架状态 (抖店)</label>
            <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setNewItemListingStatus(ListingStatus.LISTED)}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${newItemListingStatus === ListingStatus.LISTED ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    <CheckCircle2 className="h-4 w-4" /> 已上架
                </button>
                <button 
                  type="button"
                  onClick={() => setNewItemListingStatus(ListingStatus.UNLISTED)}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${newItemListingStatus === ListingStatus.UNLISTED ? 'bg-slate-100 border-slate-400 text-slate-800 ring-1 ring-slate-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    <XCircle className="h-4 w-4" /> 未上架
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">提示: 如果存在完全相同的规格和状态，数量将自动 +1。</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
             <button onClick={() => setIsAddItemOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
             <button onClick={handleCreateItem} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">确认入库</button>
          </div>
        </div>
      </Modal>

    </Layout>
  );
}