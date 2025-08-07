// pages/add-asset/add-asset.js
const app = getApp();

Page({
  data: {
    isEdit: false,
    assetId: '',
    formData: {
      name: '',
      category: '现金',
      amount: '',
      currentValue: '',
      purchaseDate: '',
      remark: ''
    },
    categories: [
      { key: '现金', name: '现金', color: '#10B981' },
      { key: '存款', name: '存款', color: '#3B82F6' },
      { key: '房产', name: '房产', color: '#F59E0B' },
      { key: '车辆', name: '车辆', color: '#EF4444' },
      { key: '基金', name: '基金', color: '#8B5CF6' },
      { key: '股票', name: '股票', color: '#EC4899' },
      { key: '其他', name: '其他', color: '#6B7280' }
    ],
    showCategoryPicker: false,
    categoryIndex: 0,
    maxDate: '',
    errors: {},
    hasApiKey: false,
    isEstimating: false,
    aiEstimateResult: ''
  },

  onLoad: function(options) {
    // 设置最大日期为今天
    const today = new Date();
    const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.setData({ maxDate });

    // 检查API key是否配置
    this.checkApiKey();

    // 如果有id参数，说明是编辑模式
    if (options.id) {
      this.setData({ 
        isEdit: true, 
        assetId: options.id 
      });
      this.loadAssetData(options.id);
    } else {
      // 新增模式，设置默认购买日期为今天
      this.setData({
        'formData.purchaseDate': maxDate
      });
    }
  },

  onShow: function() {
    // 页面显示时重新检查API key状态
    this.checkApiKey();
  },

  // 检查API key是否配置
  checkApiKey: function() {
    const settings = app.getSettings();
    const hasApiKey = !!(settings.deepseekApiKey && settings.deepseekApiKey.trim());
    this.setData({ hasApiKey });
  },

  // 加载资产数据（编辑模式）
  loadAssetData: function(id) {
    const assets = app.getAssets();
    const asset = assets.find(a => a.id === id);
    
    if (asset) {
      const categoryIndex = this.data.categories.findIndex(c => c.key === asset.category);
      
      this.setData({
        formData: {
          name: asset.name,
          category: asset.category,
          amount: asset.amount.toString(),
          currentValue: asset.currentValue ? asset.currentValue.toString() : '',
          purchaseDate: asset.purchaseDate,
          remark: asset.remark || ''
        },
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
      });
    }
  },

  // 输入框变化处理
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: '' // 清除错误信息
    });
  },

  // 数字输入框变化处理
  onNumberInput: function(e) {
    const { field } = e.currentTarget.dataset;
    let value = e.detail.value;
    
    // 只允许数字和小数点
    value = value.replace(/[^\d.]/g, '');
    
    // 确保只有一个小数点
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // 限制小数点后两位
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: ''
    });
  },

  // 日期选择
  onDateChange: function(e) {
    this.setData({
      'formData.purchaseDate': e.detail.value,
      'errors.purchaseDate': ''
    });
  },

  // 显示分类选择器
  showCategoryPicker: function() {
    this.setData({ showCategoryPicker: true });
  },

  // 分类选择
  onCategoryChange: function(e) {
    const index = e.detail.value[0]; // 修复：获取数组中的第一个值
    const category = this.data.categories[index];
    
    this.setData({
      categoryIndex: index,
      'formData.category': category.key,
      showCategoryPicker: false,
      'errors.category': ''
    });
  },

  // 取消分类选择
  onCategoryCancel: function() {
    this.setData({ showCategoryPicker: false });
  },

  // 表单验证
  validateForm: function() {
    const { formData } = this.data;
    const errors = {};
    let isValid = true;

    // 验证资产名称
    if (!formData.name.trim()) {
      errors.name = '请输入资产名称';
      isValid = false;
    }

    // 验证金额
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = '请输入有效的购买金额';
      isValid = false;
    }

    // 验证当前价值（如果填写了）
    if (formData.currentValue && parseFloat(formData.currentValue) < 0) {
      errors.currentValue = '当前价值不能为负数';
      isValid = false;
    }

    // 验证购买日期
    if (!formData.purchaseDate) {
      errors.purchaseDate = '请选择购买日期';
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  // 保存资产
  saveAsset: function() {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请检查输入信息',
        icon: 'none'
      });
      return;
    }

    const { formData, isEdit, assetId } = this.data;
    
    // 构建资产对象
    const assetData = {
      name: formData.name.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
      purchaseDate: formData.purchaseDate,
      remark: formData.remark.trim()
    };

    try {
      if (isEdit) {
        // 更新资产
        app.updateAsset(assetId, assetData);
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } else {
        // 添加新资产
        app.addAsset(assetData);
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      }

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 重置表单
  resetForm: function() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有输入内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            formData: {
              name: '',
              category: '现金',
              amount: '',
              currentValue: '',
              purchaseDate: this.data.maxDate,
              remark: ''
            },
            categoryIndex: 0,
            errors: {},
            aiEstimateResult: ''
          });
        }
      }
    });
  },

  // AI估值功能
  performAIEstimate: function() {
    const { formData } = this.data;
    
    // 验证必要字段
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请先输入资产名称',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.category) {
      wx.showToast({
        title: '请先选择资产分类',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      wx.showToast({
        title: '请先输入持有金额',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.purchaseDate) {
      wx.showToast({
        title: '请先选择持有日期',
        icon: 'none'
      });
      return;
    }

    this.setData({ isEstimating: true });
    
    this.callAIEstimateAPI()
      .then(result => {
        this.setData({
          isEstimating: false,
          aiEstimateResult: result.estimatedValue,
          'formData.currentValue': result.estimatedValue.toString()
        });
        
        wx.showToast({
          title: 'AI估值完成',
          icon: 'success'
        });
      })
      .catch(error => {
        this.setData({ isEstimating: false });
        wx.showToast({
          title: error.message || 'AI估值失败',
          icon: 'none'
        });
      });
  },

  // 调用AI估值API
  callAIEstimateAPI: function() {
    const { formData } = this.data;
    const settings = app.getSettings();
    const apiKey = settings.deepseekApiKey;
    
    if (!apiKey) {
      return Promise.reject(new Error('API密钥未配置'));
    }

    // 计算持有时间
    const purchaseDate = new Date(formData.purchaseDate);
    const currentDate = new Date();
    const holdingMonths = Math.floor((currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 30));
    const holdingYears = (holdingMonths / 12).toFixed(1);

    // 构建AI估值提示
    const prompt = `作为专业的资产评估师，请基于以下信息对资产进行估值：

资产信息：
- 资产名称：${formData.name}
- 资产分类：${formData.category}
- 购买金额：¥${formData.amount}
- 购买日期：${formData.purchaseDate}
- 持有时间：${holdingYears}年（${holdingMonths}个月）
- 备注：${formData.remark || '无'}

请考虑以下因素进行估值：
1. 资产类别的一般折旧/增值规律
2. 持有时间对价值的影响
3. 当前市场环境和趋势
4. 该类资产的流动性

请直接返回估值金额（仅数字，不含货币符号），范围应在原价的50%-200%之间。`;

    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.deepseek.com/v1/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        },
        timeout: 30000,
        success: (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`API请求失败: ${response.statusCode}`));
            return;
          }

          try {
            const aiResponse = response.data.choices[0].message.content.trim();
            // 提取数字
            const estimatedValue = parseFloat(aiResponse.replace(/[^\d.]/g, ''));
            
            if (isNaN(estimatedValue) || estimatedValue <= 0) {
              reject(new Error('AI返回的估值无效'));
              return;
            }

            // 确保估值在合理范围内
            const originalAmount = parseFloat(formData.amount);
            const minValue = originalAmount * 0.5;
            const maxValue = originalAmount * 2;
            const finalValue = Math.max(minValue, Math.min(maxValue, estimatedValue));

            resolve({
              estimatedValue: finalValue.toFixed(2),
              originalResponse: aiResponse
            });
          } catch (error) {
            reject(new Error('解析AI响应失败'));
          }
        },
        fail: (error) => {
          reject(new Error('网络请求失败'));
        }
      });
    });
  }
});