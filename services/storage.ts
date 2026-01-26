import { Category, Product, StockItem, OperationLog, FieldType } from '../types';

const KEYS = {
  CATEGORIES: 'gem_categories',
  PRODUCTS: 'gem_products',
  ITEMS: 'gem_items',
  LOGS: 'gem_logs',
  USER: 'gem_user',
};

// Simple ID generator fallback to avoid crypto.randomUUID compatibility issues
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Seed default categories if empty
const seedCategories = (): Category[] => [
  {
    id: 'cat_ring',
    name: '戒指',
    fields: [
      { key: 'size', label: '圈口', type: FieldType.NUMBER, unit: '#' },
      { key: 'weight', label: '克重', type: FieldType.NUMBER, unit: 'g' },
    ],
  },
  {
    id: 'cat_necklace',
    name: '项链',
    fields: [
      { key: 'length', label: '长度', type: FieldType.NUMBER, unit: 'cm' },
      { key: 'weight', label: '克重', type: FieldType.NUMBER, unit: 'g' },
    ],
  },
];

export const StorageService = {
  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    if (!data) {
      const defaults = seedCategories();
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  saveCategory: (category: Category) => {
    const categories = StorageService.getCategories();
    categories.push(category);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },

  saveProduct: (product: Product) => {
    const products = StorageService.getProducts();
    products.push(product);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getItems: (): StockItem[] => {
    const data = localStorage.getItem(KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  },

  getLogs: (): OperationLog[] => {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  // Core logic: Add item (consolidate if exists)
  addItem: (
    productId: string, 
    customValues: Record<string, string | number>, 
    listingStatus: string, 
    category: Category
  ) => {
    const items = StorageService.getItems();
    const logs = StorageService.getLogs();
    
    // Create a signature to compare items
    const valueSignature = JSON.stringify(customValues);
    
    const existingIndex = items.findIndex(i => 
        i.productId === productId && 
        i.listingStatus === listingStatus && 
        JSON.stringify(i.customValues) === valueSignature
    );

    if (existingIndex !== -1) {
        // Consolidate: Increment quantity
        items[existingIndex].quantity += 1;
        items[existingIndex].updatedAt = Date.now();
    } else {
        // Create new
        const newItem: StockItem = {
            id: generateId(),
            productId,
            listingStatus: listingStatus as any,
            quantity: 1,
            customValues,
            updatedAt: Date.now()
        };
        items.push(newItem);
    }

    // Add Log
    const detailsStr = category.fields.map(f => `${f.label}:${customValues[f.key]}${f.unit || ''}`).join(' ');
    const newLog: OperationLog = {
        id: generateId(),
        productId,
        type: 'IN',
        quantity: 1,
        customValues,
        details: detailsStr,
        listingStatus: listingStatus as any,
        timestamp: Date.now()
    };
    logs.push(newLog);

    localStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },

  // Core logic: Remove item (decrement quantity)
  // Returns true if successful
  outboundItem: (item: StockItem, category: Category): boolean => {
    let items = StorageService.getItems();
    
    const index = items.findIndex(i => i.id === item.id);
    if (index === -1) {
        console.error("Item not found for outbound:", item.id);
        return false;
    }

    // 1. Update Inventory State
    items[index].quantity -= 1;
    
    // If quantity is 0, remove the item entirely
    let finalItems = items;
    if (items[index].quantity <= 0) {
        finalItems = items.filter(i => i.id !== item.id);
    }

    // 2. CRITICAL: Save Inventory IMMEDIATELY before attempting logging
    // This ensures that even if logging crashes (e.g. bad data), the stock is deducted.
    try {
        localStorage.setItem(KEYS.ITEMS, JSON.stringify(finalItems));
    } catch (e) {
        console.error("Failed to save items to localStorage", e);
        return false;
    }

    // 3. Attempt Logging (Fail-safe)
    try {
        const logs = StorageService.getLogs();
        const safeCustomValues = item.customValues || {};
        
        // Safety: ensure category.fields exists
        const fields = category?.fields || [];
        const detailsStr = fields.map(f => {
            const val = safeCustomValues[f.key] ?? '-';
            return `${f.label}:${val}${f.unit || ''}`;
        }).join(' ');
        
        const newLog: OperationLog = {
            id: generateId(),
            productId: item.productId,
            type: 'OUT',
            quantity: 1,
            customValues: safeCustomValues,
            details: detailsStr,
            listingStatus: item.listingStatus,
            timestamp: Date.now()
        };
        logs.push(newLog);
        localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
        console.warn("Log creation failed (Inventory was updated though):", e);
    }
    
    return true;
  },

  // Find item by criteria and outbound
  findAndOutboundItem: (
    productId: string,
    customValues: Record<string, string | number>,
    listingStatus: string,
    category: Category
  ): boolean => {
    const items = StorageService.getItems();
    const valueSignature = JSON.stringify(customValues);
    
    const item = items.find(i => 
        i.productId === productId && 
        i.listingStatus === listingStatus && 
        JSON.stringify(i.customValues) === valueSignature
    );

    if (!item) return false;

    return StorageService.outboundItem(item, category);
  },

  deleteProduct: (productId: string) => {
      const products = StorageService.getProducts().filter(p => p.id !== productId);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
      
      const items = StorageService.getItems().filter(i => i.productId !== productId);
      localStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
  },

  getUser: () => {
    return localStorage.getItem(KEYS.USER);
  },

  setUser: (username: string) => {
    localStorage.setItem(KEYS.USER, username);
  },
  
  logout: () => {
      localStorage.removeItem(KEYS.USER);
  }
};