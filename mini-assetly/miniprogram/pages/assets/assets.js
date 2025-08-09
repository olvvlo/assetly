// pages/assets/assets.js
Page({
  data: {
    assets: [],
    categoryTotals: {},
    totalAmount: 0,
    categoryData: [],
    allAssets: [],
    currentDate: '',
    showShareModal: false,
    shareImagePath: '',
    categories: [
      { key: '现金', name: '现金', color: '#10B981', icon: '/images/category/cash.png' },
      { key: '存款', name: '存款', color: '#3B82F6', icon: '/images/category/credit.png' },
      { key: '房产', name: '房产', color: '#F59E0B', icon: '/images/category/house.png' },
      { key: '车辆', name: '车辆', color: '#EF4444', icon: '/images/category/car.png' },
      { key: '基金', name: '基金', color: '#8B5CF6', icon: '/images/category/fund.png' },
      { key: '股票', name: '股票', color: '#EC4899', icon: '/images/category/stock.png' },
      { key: '投资', name: '投资', color: '#8B5CF6', icon: '/images/category/investment.png' },
      { key: '其他', name: '其他', color: '#6B7280', icon: '/images/category/other.png' }
    ]
  },

  calculateHoldingTime(purchaseDate) {
    if (!purchaseDate) return '';
    
    const now = new Date();
    const purchase = new Date(purchaseDate);
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
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    try {
      const assets = wx.getStorageSync('assets') || [];
      const categoryTotals = this.calculateCategoryTotals(assets);
      const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      
      // 获取当前日期
      const currentDate = this.formatDate(new Date().toISOString());
      
      // 获取有资产的类别数据，预格式化金额
      const categoryData = Object.entries(categoryTotals)
        .filter(([_, amount]) => amount > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({
          category,
          amount,
          formattedAmount: this.formatCurrency(amount),
          percentage: totalAmount > 0 ? (amount / totalAmount * 100).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0',
          color: this.getCategoryColor(category),
          icon: this.getCategoryIcon(category)
        }));

      // 获取所有资产（按残值排序），预格式化所有显示数据
      const allAssets = [...assets]
        .map(asset => ({
          ...asset,
          displayValue: (asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0) ? asset.currentValue : asset.amount,
          formattedDisplayValue: this.formatCurrency((asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0) ? asset.currentValue : asset.amount),
          formattedAmount: this.formatCurrency(asset.amount),
          formattedCreatedAt: this.formatDate(asset.createdAt || asset.createTime),
          formattedPurchaseDate: this.formatDate(asset.purchaseDate),
          categoryIcon: this.getCategoryIcon(asset.category),
          holdingTime: this.calculateHoldingTime(asset.purchaseDate)
        }))
        .sort((a, b) => b.displayValue - a.displayValue);

      this.setData({
        assets,
        categoryTotals,
        totalAmount,
        formattedTotalAmount: this.formatCurrency(totalAmount),
        categoryData,
        allAssets,
        currentDate
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'error'
      });
    }
  },

  // 计算分类总额
  calculateCategoryTotals(assets) {
    const totals = {};
    this.data.categories.forEach(cat => {
      totals[cat.key] = 0;
    });

    assets.forEach(asset => {
      const value = (asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0) ? asset.currentValue : asset.amount;
      if (totals.hasOwnProperty(asset.category)) {
        totals[asset.category] += value;
      } else {
        totals['其他'] += value;
      }
    });

    return totals;
  },

  // 获取分类颜色
  getCategoryColor(category) {
    const categoryInfo = this.data.categories.find(c => c.key === category);
    return categoryInfo ? categoryInfo.color : '#a0a0a0';
  },

  // 获取分类图标
  getCategoryIcon(category) {
    const categoryInfo = this.data.categories.find(c => c.key === category);
    return categoryInfo ? categoryInfo.icon : '📦';
  },

  // 格式化货币
  formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '¥0';
    }
    
    const num = Number(amount);
    
    // 强制使用英文逗号作为千分位分隔符，覆盖系统默认行为
    const formatNumber = (n) => {
      // 转换为字符串并分离整数和小数部分
      const parts = n.toString().split('.');
      // 使用正则表达式强制添加英文逗号，确保不受系统语言影响
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    };
    
    // 总是显示为整数，不显示小数点
    return `¥${formatNumber(Math.round(num))}`;
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '';
    }
    // 使用中文格式
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 预览分享图片
  previewShareImage(tempFilePath) {
    this.setData({
      shareImagePath: tempFilePath,
      showShareModal: true
    });
  },

  // 关闭分享弹框
  closeShareModal() {
    this.setData({
      showShareModal: false,
      shareImagePath: ''
    });
  },

  // 下载图片到相册
  downloadImage() {
    if (!this.data.shareImagePath) return;
    
    wx.saveImageToPhotosAlbum({
      filePath: this.data.shareImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        this.closeShareModal();
      },
      fail: (error) => {
        if (error.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册',
            showCancel: false
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          });
        }
      }
    });
  },

  // 分享图片
  shareImage() {
    if (this.data.shareImagePath) {
      // 生成文件名：应用名 + 日期 + 时间戳
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timestamp = now.getTime();
      const fileName = `口袋轻账-${dateStr}-${timestamp}.png`;
      
      // 直接使用微信分享API
      wx.shareFileMessage({
        filePath: this.data.shareImagePath,
        fileName: fileName,
        success: () => {
          wx.showToast({
            title: '分享成功',
            icon: 'success'
          });
          this.closeShareModal();
        },
        fail: (err) => {
          console.error('分享失败:', err);
          // 如果直接分享失败，回退到系统分享
          wx.previewImage({
            urls: [this.data.shareImagePath],
            current: this.data.shareImagePath
          });
        }
      });
    } else {
      // 如果没有图片路径，重新生成
      wx.showLoading({
        title: '生成中...'
      });

      // 创建画布上下文
      const query = wx.createSelectorQuery();
      query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 动态计算画布高度
          const { categoryData, allAssets } = this.data;
          const baseHeight = 400; // 基础高度（标题、总资产、页脚等）
          const categoryHeight = categoryData.length * 30 + 80; // 资产分布高度，减少行间距
          const assetHeight = Math.min(allAssets.length, 10) * 65 + 80; // 资产列表高度，最多显示10个
          const totalHeight = baseHeight + categoryHeight + assetHeight;
          
          // 设置画布尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = 400 * dpr;
          canvas.height = totalHeight * dpr;
          ctx.scale(dpr, dpr);

          this.drawShareImage(ctx, canvas, totalHeight);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '生成失败',
            icon: 'error'
          });
        }
      });
    }
  },

  // 绘制分享图片
  drawShareImage(ctx, canvas, canvasHeight = 800) {
    const { categoryData, allAssets, totalAmount, assets } = this.data;
    
    // 绘制背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, canvasHeight);
    
    // 绘制边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 399, canvasHeight - 1);

    let y = 40;

    // 1. 标题
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('我的资产报告', 200, y);
    y += 40;

    ctx.fillStyle = '#6b7280';
    ctx.font = '16px sans-serif';
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    ctx.fillText(dateStr, 200, y);
    y += 40;

    // 分隔线
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(368, y);
    ctx.stroke();
    y += 40;

    // 2. 总资产
    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.1)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 32, y, 336, 90, 12);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('总资产', 200, y + 25);
    
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 28px system-ui, "PingFang SC", STHeiti, sans-serif';
    ctx.fillText(this.formatCurrency(totalAmount), 200, y + 55);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px sans-serif';
    ctx.fillText(`共 ${assets.length} 项资产`, 200, y + 75);
    y += 110;

    // 3. 资产分布
    y += 30; // 增加与总资产区块的间距
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('资产分布', 32, y);
    y += 40;

    categoryData.forEach(item => {
      // 颜色圆点
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(45, y + 10, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // 添加圆点阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 分类名称（不显示图标路径，只显示分类名称）
      ctx.fillStyle = '#374151';
      ctx.font = '16px sans-serif';
      ctx.fillText(item.category, 65, y + 15);

      // 百分比（简单文本显示，不使用标签样式）
      ctx.fillStyle = item.color;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.percentage}%`, 205, y + 15);

      // 金额
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px system-ui, "PingFang SC", STHeiti, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatCurrency(item.amount), 368, y + 15);
      ctx.textAlign = 'left';

      y += 30; // 减少行间距
    });

    y += 15; // 减少间距

    // 4. 资产列表
    y += 25; // 增加与资产分布的间距
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('资产列表', 32, y);
    y += 40;

    // 显示所有资产，最多10个
    const displayAssets = allAssets.slice(0, 10);
    displayAssets.forEach((asset, index) => {
      // 绘制资产项背景
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      this.roundRect(ctx, 32, y - 5, 336, 55, 10);
      ctx.fill();
      ctx.stroke();
      
      // 计算显示值
      const displayValue = (asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== '') 
        ? asset.currentValue 
        : asset.amount;
      
      // 资产名称（不显示图标路径，只显示资产名称）
      ctx.fillStyle = '#374151';
      ctx.font = '16px sans-serif';
      ctx.fillText(asset.name, 45, y + 15);

      // 分类和日期
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${asset.category} • ${this.formatDate(asset.createdAt)}`, 45, y + 35);

      // 价值
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 16px system-ui, "PingFang SC", STHeiti, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatCurrency(displayValue), 355, y + 20);
      ctx.textAlign = 'left';

      y += 65;
    });

    // 5. 页脚
    y += 10; // 减少与资产列表的间距
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(368, y);
    ctx.stroke();
    y += 25; // 减少页脚内部间距

    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('由 口袋轻账 生成', 200, y);

    // 保存图片
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: (res) => {
            wx.hideLoading();
            // 直接显示预览弹框
            this.previewShareImage(res.tempFilePath);
          },
          fail: (error) => {
            wx.hideLoading();
            console.error('生成图片失败:', error);
            wx.showToast({
              title: '生成失败',
              icon: 'error'
            });
          }
        });
  },

  // 绘制圆角矩形
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  // 保存到相册
  saveToAlbum(filePath) {
    // 生成临时文件名，添加时间戳确保唯一性
    const timestamp = new Date().getTime();
    const tempFilePath = `${wx.env.USER_DATA_PATH}/口袋轻账-${timestamp}.png`;
    
    // 先将文件复制到临时目录，确保文件名唯一
    wx.getFileSystemManager().copyFile({
      srcPath: filePath,
      destPath: tempFilePath,
      success: () => {
        // 保存到相册
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
            // 删除临时文件
            wx.getFileSystemManager().unlink({
              filePath: tempFilePath,
              fail: (err) => console.error('删除临时文件失败', err)
            });
          },
          fail: (error) => {
            if (error.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '提示',
                content: '需要您授权保存相册',
                showCancel: false
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'error'
              });
            }
            // 删除临时文件
            wx.getFileSystemManager().unlink({
              filePath: tempFilePath,
              fail: (err) => console.error('删除临时文件失败', err)
            });
          }
        });
      },
      fail: (error) => {
        console.error('复制文件失败', error);
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
      }
    });
  },

  // 分享给朋友
  shareToFriend(filePath) {
    // 小程序中可以通过转发分享
    wx.showToast({
      title: '请使用右上角分享',
      icon: 'none'
    });
  },

  // 转发分享
  onShareAppMessage() {
    return {
      title: `我的资产总额：${this.formatCurrency(this.data.totalAmount)}`,
      path: '/pages/assets/assets'
    };
  }
});