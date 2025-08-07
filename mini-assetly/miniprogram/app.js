// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // 资产数据存储
      assets: [],
      // 设置数据
      settings: {
        currency: 'CNY',
        theme: 'light'
      }
    };
    
    // 初始化本地存储
    this.initStorage();
  },

  // 初始化本地存储
  initStorage: function() {
    try {
      const assets = wx.getStorageSync('assets');
      const settings = wx.getStorageSync('settings');
      
      if (assets) {
        this.globalData.assets = assets;
      }
      
      if (settings) {
        this.globalData.settings = { ...this.globalData.settings, ...settings };
      }
    } catch (e) {
      console.error('初始化存储失败:', e);
    }
  },

  // 获取资产数据
  getAssets: function() {
    try {
      return wx.getStorageSync('assets') || [];
    } catch (error) {
      console.error('获取资产数据失败:', error);
      return [];
    }
  },

  // 保存资产数据
  saveAssets: function(assets) {
    try {
      wx.setStorageSync('assets', assets);
      return true;
    } catch (error) {
      console.error('保存资产数据失败:', error);
      return false;
    }
  },

  // 保存设置数据
  saveSettings: function(settings) {
    this.globalData.settings = { ...this.globalData.settings, ...settings };
    try {
      wx.setStorageSync('settings', this.globalData.settings);
    } catch (e) {
      console.error('保存设置数据失败:', e);
    }
  },

  // 获取设置数据
  getSettings: function() {
    return this.globalData.settings;
  },

  // 生成ID
  generateId: function() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },

  // 添加资产
  addAsset: function(asset) {
    const assets = this.getAssets();
    const newAsset = {
      ...asset,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    assets.push(newAsset);
    const success = this.saveAssets(assets);
    if (success) {
      this.globalData.assets = assets; // 同步更新全局数据
    }
    return success;
  },

  // 导出资产数据
  exportAssets: function() {
    const assets = this.getAssets();
    // 确保数据格式与浏览器插件一致
    const exportData = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      amount: asset.amount,
      currentValue: asset.currentValue,
      purchaseDate: asset.purchaseDate,
      remark: asset.remark,
      createdAt: asset.createdAt || asset.createTime // 兼容旧数据
    }));
    return exportData;
  },

  // 导入资产数据
  importAssets: function(importedAssets) {
    try {
      // 验证数据格式
      if (!Array.isArray(importedAssets)) {
        throw new Error('数据格式不正确');
      }

      // 验证每个资产项的必要字段
      const validAssets = importedAssets.filter(asset => {
        return (
          typeof asset.id === 'string' &&
          typeof asset.name === 'string' &&
          typeof asset.category === 'string' &&
          typeof asset.amount === 'number' &&
          typeof asset.createdAt === 'string'
        );
      });

      if (validAssets.length === 0) {
        throw new Error('没有找到有效的资产数据');
      }

      // 保存导入的数据
      this.saveAssets(validAssets);
      
      return {
        success: true,
        imported: validAssets.length,
        skipped: importedAssets.length - validAssets.length
      };
    } catch (error) {
      console.error('导入资产数据失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 更新资产
  updateAsset: function(id, updatedAsset) {
    const assets = this.getAssets();
    const index = assets.findIndex(asset => asset.id === id);
    if (index !== -1) {
      assets[index] = { ...assets[index], ...updatedAsset };
      this.saveAssets(assets);
      this.globalData.assets = assets; // 同步更新全局数据
      return assets[index];
    }
    return null;
  },

  // 删除资产
  deleteAsset: function(id) {
    const assets = this.getAssets();
    const filteredAssets = assets.filter(asset => asset.id !== id);
    this.saveAssets(filteredAssets);
    this.globalData.assets = filteredAssets; // 同步更新全局数据
  },

  // 获取资产汇总
  getAssetSummary: function() {
    const assets = this.getAssets(); // 使用getAssets方法获取最新数据
    const totalAmount = assets.reduce((sum, asset) => {
      // 如果预估价为0或null/undefined，使用购买价格
      const value = (asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0) 
        ? asset.currentValue 
        : asset.amount;
      return sum + (value || 0);
    }, 0);
    
    const categoryTotals = {};
    assets.forEach(asset => {
      // 如果预估价为0或null/undefined，使用购买价格
      const value = (asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0) 
        ? asset.currentValue 
        : asset.amount;
      categoryTotals[asset.category] = (categoryTotals[asset.category] || 0) + (value || 0);
    });

    return {
      totalAmount,
      categoryTotals,
      assetCount: assets.length
    };
  },

  // 清空所有资产数据
  clearAssets: function() {
    try {
      wx.removeStorageSync('assets');
      this.globalData.assets = [];
      return true;
    } catch (error) {
      console.error('清空资产数据失败:', error);
      return false;
    }
  },

  // 格式化货币
  formatCurrency: function(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '¥0';
    }
    
    const num = Number(amount);
    // 如果是整数，不显示小数点
    if (num % 1 === 0) {
      return `¥${num.toLocaleString('zh-CN')}`;
    } else {
      // 如果是小数，保留两位小数
      return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
});
