import { create } from 'zustand';
import { AssetItem, AssetCategory, AssetSummary } from '@/types/asset';

interface AssetStore {
  assets: AssetItem[];
  loading: boolean;
  
  // Actions
  addAsset: (asset: Omit<AssetItem, 'id' | 'createdAt'>) => void;
  updateAsset: (id: string, asset: Partial<Omit<AssetItem, 'id' | 'createdAt'>>) => void;
  deleteAsset: (id: string) => void;
  loadAssets: () => void;
  clearAllAssets: () => void;
  
  // Computed
  getAssetsByCategory: (category: AssetCategory) => AssetItem[];
  getSummary: () => AssetSummary;
}

const STORAGE_KEY = 'assetly-assets';

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 从localStorage加载数据
const loadFromStorage = (): AssetItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load assets from storage:', error);
    return [];
  }
};

// 保存到localStorage
const saveToStorage = (assets: AssetItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (error) {
    console.error('Failed to save assets to storage:', error);
  }
};

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  loading: false,

  addAsset: (assetData) => {
    const newAsset: AssetItem = {
      ...assetData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    set((state) => {
      const newAssets = [...state.assets, newAsset];
      saveToStorage(newAssets);
      return { assets: newAssets };
    });
  },

  updateAsset: (id, updates) => {
    set((state) => {
      const newAssets = state.assets.map((asset) =>
        asset.id === id ? { ...asset, ...updates } : asset
      );
      saveToStorage(newAssets);
      return { assets: newAssets };
    });
  },

  deleteAsset: (id) => {
    set((state) => {
      const newAssets = state.assets.filter((asset) => asset.id !== id);
      saveToStorage(newAssets);
      return { assets: newAssets };
    });
  },

  loadAssets: () => {
    set({ loading: true });
    const assets = loadFromStorage();
    set({ assets, loading: false });
  },

  clearAllAssets: () => {
    set({ assets: [] });
    saveToStorage([]);
  },

  getAssetsByCategory: (category) => {
    return get().assets.filter((asset) => asset.category === category);
  },

  getSummary: () => {
    const assets = get().assets;
    // 按残值计算总资产
    const totalAmount = assets.reduce((sum, asset) => {
      // 优先使用当前残值，如果没有则使用原价
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      return sum + value;
    }, 0);
    
    const categoryTotals: Record<AssetCategory, number> = {
      '现金': 0,
      '存款': 0,
      '房产': 0,
      '车辆': 0,
      '基金': 0,
      '股票': 0,
      '其他': 0,
    };

    assets.forEach((asset) => {
      // 按残值计算分类总额
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      categoryTotals[asset.category] += value;
    });

    return { totalAmount, categoryTotals };
  },
}));