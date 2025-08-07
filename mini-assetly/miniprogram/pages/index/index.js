// pages/index/index.js
const app = getApp();

Page({
  data: {
    totalAmount: 0,
    assetCount: 0,
    categoryTotals: {},
    groupedAssets: [],
    sortBy: 'time', // 'time' 或 'amount'
    categories: [
      { key: '现金', name: '现金', color: '#10B981' },
      { key: '存款', name: '存款', color: '#3B82F6' },
      { key: '房产', name: '房产', color: '#F59E0B' },
      { key: '车辆', name: '车辆', color: '#EF4444' },
      { key: '基金', name: '基金', color: '#8B5CF6' },
      { key: '股票', name: '股票', color: '#EC4899' },
      { key: '其他', name: '其他', color: '#6B7280' }
    ]
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  // 加载数据
  loadData: function() {
    const summary = app.getAssetSummary();
    const assets = app.getAssets();

    console.log('loadData summary:', summary);
    console.log('loadData assets:', assets);
    
    // 直接格式化totalAmount并存储
    const formattedTotalAmount = app.formatCurrency(summary.totalAmount);
    console.log('formattedTotalAmount:', formattedTotalAmount);
    
    this.setData({
      totalAmount: summary.totalAmount,
      formattedTotalAmount: formattedTotalAmount,
      assetCount: summary.assetCount,
      categoryTotals: summary.categoryTotals
    });

    this.groupAssetsByCategory(assets);
  },

  // 按分类分组资产
  groupAssetsByCategory: function(assets) {
    const grouped = {};
    
    // 按分类分组
    assets.forEach(asset => {
      const category = asset.category || '其他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      // 为每个资产添加显示值 - 如果currentValue为空、null或0，使用原价
      const displayValue = (asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0) 
        ? asset.currentValue 
        : (asset.amount || 0);
      const formattedDisplayValue = app.formatCurrency(displayValue);
      const formattedAmount = app.formatCurrency(asset.amount);
      
      grouped[category].push({
        ...asset,
        displayValue: displayValue,
        formattedDisplayValue: formattedDisplayValue,
        formattedAmount: formattedAmount,
        holdingTime: this.calculateHoldingTime(asset.purchaseDate)
      });
    });

    // 转换为数组格式并排序
    const groupedArray = Object.keys(grouped).map(category => {
      const categoryAssets = grouped[category];
      const categoryInfo = this.data.categories.find(c => c.key === category);
      
      // 根据排序方式排序资产
      if (this.data.sortBy === 'time') {
        categoryAssets.sort((a, b) => new Date(b.createTime || b.createdAt) - new Date(a.createTime || a.createdAt));
      } else {
        categoryAssets.sort((a, b) => (b.displayValue || 0) - (a.displayValue || 0));
      }

      const total = categoryAssets.reduce((sum, asset) => sum + (asset.displayValue || 0), 0);
      const formattedTotal = app.formatCurrency(total);

      return {
        category: category,
        color: categoryInfo ? categoryInfo.color : '#6B7280',
        total: total,
        formattedTotal: formattedTotal,
        assets: categoryAssets
      };
    });

    // 按总金额排序分类
    groupedArray.sort((a, b) => b.total - a.total);

    this.setData({
      groupedAssets: groupedArray
    });
  },

  // 按时间排序
  sortByTime: function() {
    this.setData({ sortBy: 'time' });
    const assets = app.getAssets();
    this.groupAssetsByCategory(assets);
  },

  // 按金额排序
  sortByAmount: function() {
    this.setData({ sortBy: 'amount' });
    const assets = app.getAssets();
    this.groupAssetsByCategory(assets);
  },

  // 跳转到添加页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add-asset/add-asset'
    });
  },

  // 编辑资产
  editAsset(e) {
    const asset = e.currentTarget.dataset.asset;
    wx.navigateTo({
      url: `/pages/add-asset/add-asset?id=${asset.id}`
    });
  },

  // 跳转到资产列表页面
  goToAssets: function() {
    wx.switchTab({
      url: '/pages/assets/assets'
    });
  },

  // 跳转到图表页面
  goToChart: function() {
    wx.switchTab({
      url: '/pages/chart/chart'
    });
  },

  // 格式化日期
  formatDate: function(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '';
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 获取分类颜色
  getCategoryColor: function(category) {
    const categoryInfo = this.data.categories.find(c => c.key === category);
    return categoryInfo ? categoryInfo.color : '#6B7280';
  },

  // 计算分类百分比
  getCategoryPercentage: function(categoryAmount) {
    if (this.data.totalAmount === 0) return 0;
    return ((categoryAmount / this.data.totalAmount) * 100).toFixed(1);
  },

  // 计算持有时间
  calculateHoldingTime: function(purchaseDate) {
    if (!purchaseDate) return '';
    
    const purchase = new Date(purchaseDate);
    // 检查日期是否有效
    if (isNaN(purchase.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - purchase);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays}天`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}个月`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths > 0) {
        return `${years}年${remainingMonths}个月`;
      } else {
        return `${years}年`;
      }
    }
  }
});
