// pages/settings/settings.js
const app = getApp();

Page({
  data: {
    personalInfo: {
      name: '',
      birthday: '',
      education: '',
      familyStatus: '',
      job: '',
      location: ''
    },
    settings: {
      currency: 'CNY',
      notifications: true,
      autoBackup: false,
      deepseekApiKey: ''
    },
    version: '1.0.0',
    
    // 弹框状态
    showJobInput: false,
    showLocationInput: false,
    showApiKeyInput: false,
    showAbout: false,
    
    // 临时输入值
    tempJob: '',
    tempLocation: '',
    tempApiKey: '',
    
    // 选择器数据
    educationOptions: ['高中及以下', '大专', '本科', '硕士', '博士'],
    familyStatusOptions: ['单身', '恋爱中', '已婚无子女', '已婚有子女', '其他'],
    currencyOptions: [
      { value: 'CNY', name: '人民币 (¥)' },
      { value: 'USD', name: '美元 ($)' },
      { value: 'EUR', name: '欧元 (€)' },
      { value: 'JPY', name: '日元 (¥)' },
      { value: 'GBP', name: '英镑 (£)' }
    ]
  },

  onLoad: function() {
    this.loadSettings();
    this.loadPersonalInfo();
  },

  // 加载设置
  loadSettings: function() {
    const settings = app.getSettings();
    this.setData({
      settings: {
        notifications: settings.notifications || true,
        autoBackup: settings.autoBackup || false,
        deepseekApiKey: settings.deepseekApiKey || ''
      }
    });
  },

  // 加载个人信息
  loadPersonalInfo: function() {
    const personalInfo = wx.getStorageSync('personalInfo') || {};
    this.setData({
      personalInfo: personalInfo
    });
  },

  // 保存个人信息
  savePersonalInfo: function() {
    wx.setStorageSync('personalInfo', this.data.personalInfo);
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 出生日期相关
  onBirthdayChange: function(e) {
    this.setData({
      'personalInfo.birthday': e.detail.value
    });
    this.savePersonalInfo();
  },

  // 学历相关
  onEducationChange: function(e) {
    const selectedEducation = this.data.educationOptions[e.detail.value];
    this.setData({
      'personalInfo.education': selectedEducation,
      educationIndex: e.detail.value
    });
    this.savePersonalInfo();
  },

  // 家庭情况相关
  onFamilyChange: function(e) {
    const selectedFamily = this.data.familyOptions[e.detail.value];
    this.setData({
      'personalInfo.familyStatus': selectedFamily,
      familyIndex: e.detail.value
    });
    this.savePersonalInfo();
  },

  // 职业相关
  showJobInput: function() {
    this.setData({
      showJobInput: true,
      tempJob: this.data.personalInfo.job || ''
    });
  },

  cancelJobInput: function() {
    this.setData({
      showJobInput: false,
      tempJob: ''
    });
  },

  onJobInput: function(e) {
    this.setData({
      tempJob: e.detail.value
    });
  },

  confirmJobInput: function() {
    this.setData({
      'personalInfo.job': this.data.tempJob,
      showJobInput: false,
      tempJob: ''
    });
    this.savePersonalInfo();
  },

  // 地区相关
  showLocationInput: function() {
    this.setData({
      showLocationInput: true,
      tempLocation: this.data.personalInfo.location || ''
    });
  },

  cancelLocationInput: function() {
    this.setData({
      showLocationInput: false,
      tempLocation: ''
    });
  },

  onLocationInput: function(e) {
    this.setData({
      tempLocation: e.detail.value
    });
  },

  confirmLocationInput: function() {
    this.setData({
      'personalInfo.location': this.data.tempLocation,
      showLocationInput: false,
      tempLocation: ''
    });
    this.savePersonalInfo();
  },

  // API Key相关
  showApiKeyInput: function() {
    this.setData({
      showApiKeyInput: true,
      tempApiKey: this.data.settings.deepseekApiKey || ''
    });
  },

  cancelApiKeyInput: function() {
    this.setData({
      showApiKeyInput: false,
      tempApiKey: ''
    });
  },

  onApiKeyInput: function(e) {
    this.setData({
      tempApiKey: e.detail.value
    });
  },

  confirmApiKeyInput: function() {
    this.setData({
      'settings.deepseekApiKey': this.data.tempApiKey,
      showApiKeyInput: false,
      tempApiKey: ''
    });
    this.saveSettings();
  },

  // 保存设置
  saveSettings: function() {
    app.saveSettings(this.data.settings);
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    });
  },

  // 通知开关
  onNotificationChange: function(e) {
    this.setData({
      'settings.notifications': e.detail.value
    });
    this.saveSettings();
  },

  // 自动备份开关
  onAutoBackupChange: function(e) {
    this.setData({
      'settings.autoBackup': e.detail.value
    });
    this.saveSettings();
  },

  // 导出数据
  exportData: function() {
    const assets = app.getAssets();
    
    if (assets.length === 0) {
      wx.showToast({
        title: '暂无数据可导出',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '导出数据',
      content: `确定要导出 ${assets.length} 项资产数据吗？`,
      success: (res) => {
        if (res.confirm) {
          // 使用app.js中的导出功能，确保与浏览器插件格式一致
          const exportData = app.exportAssets();
          
          // 复制到剪贴板
          wx.setClipboardData({
            data: JSON.stringify(exportData, null, 2),
            success: () => {
              wx.showToast({
                title: '数据已复制到剪贴板',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 导入数据
  importData: function() {
    wx.showModal({
      title: '导入数据',
      content: '此操作将覆盖现有数据，确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          // 获取剪贴板数据
          wx.getClipboardData({
            success: (clipRes) => {
              try {
                let importData;
                
                // 尝试解析JSON数据
                try {
                  importData = JSON.parse(clipRes.data);
                } catch (parseError) {
                  throw new Error('数据格式不是有效的JSON');
                }
                
                // 使用app.js中的导入功能，支持多种格式
                const result = app.importAssets(importData);
                
                if (result.success) {
                  wx.showToast({
                    title: `成功导入 ${result.imported} 项资产`,
                    icon: 'success'
                  });
                } else {
                  throw new Error(result.error || '导入失败');
                }
              } catch (error) {
                wx.showToast({
                  title: error.message || '导入失败，请检查数据格式',
                  icon: 'none'
                });
              }
            },
            fail: () => {
              wx.showToast({
                title: '请先复制要导入的数据',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 清空数据
  clearData: function() {
    wx.showModal({
      title: '清空数据',
      content: '此操作将删除所有资产数据，且无法恢复，确定要继续吗？',
      confirmColor: '#ff3b30',
      success: (res) => {
        if (res.confirm) {
          app.clearAssets();
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 关于应用
  showAbout: function() {
    this.setData({
      showAbout: true
    });
  },

  closeAbout: function() {
    this.setData({
      showAbout: false
    });
  }
});