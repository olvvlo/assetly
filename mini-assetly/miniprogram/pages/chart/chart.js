// pages/chart/chart.js
import * as echarts from '../../components/ec-canvas/echarts';

const app = getApp();

Page({
  data: {
    assets: [],
    tabType: 'distribution', // 'distribution' | 'analysis'
    
    // 资产分布数据
    categoryData: [],
    totalAmount: 0,
    trendData: [],
    trendEc: {
      onInit: null
    },
    pieEc: {
      onInit: null
    },
    categoryComparison: [],
    categorySummary: {},
    
    // 个人分析数据
    aiAnalysis: '',
    radarData: [],
    radarEc: {
      onInit: null
    },
    rankingScore: 0,
    rankingLevel: '',
    totalScore: 0,
    regionalRanking: 0,
    nationalRanking: 0,
    rankingAnalysis: '',
    rankingAnalysisSummary: '',
    isAnalyzing: false,
    isRankingAnalyzing: false,
    
    categories: [
      { key: '现金', name: '现金', color: '#10B981', icon: '💰' },
      { key: '存款', name: '存款', color: '#3B82F6', icon: '🏦' },
      { key: '房产', name: '房产', color: '#F59E0B', icon: '🏠' },
      { key: '车辆', name: '车辆', color: '#EF4444', icon: '🚗' },
      { key: '基金', name: '基金', color: '#8B5CF6', icon: '📈' },
      { key: '股票', name: '股票', color: '#EC4899', icon: '📊' },
      { key: '其他', name: '其他', color: '#6B7280', icon: '📦' }
    ]
  },

  onLoad: function() {
    this.loadData();
    this.initPieChart();
    this.initTrendChart();
    this.initRadarChart();
    
    // 页面加载时自动执行一次分析
    setTimeout(() => {
      this.generateAIAnalysis();
    }, 1000);
  },

  onShow: function() {
    this.loadData();
  },

  onReady: function() {
    // 页面渲染完成
  },

  // 初始化矩形树图
  initPieChart: function() {
    this.setData({
      pieEc: {
        onInit: this.initPieEChart
      }
    });
  },

  // 初始化ECharts矩形树图
  initPieEChart: function(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr
    });
    canvas.setChart(chart);
    
    // 获取当前页面实例
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 初始化图表
    currentPage.updatePieChart(chart);
    
    return chart;
  },

  // 更新饼图（改为矩形树图）
  updatePieChart: function(chart) {
    const { categoryData, totalAmount } = this.data;
    
    if (!chart || categoryData.length === 0) return;
    
    const treeData = categoryData.map(item => ({
      name: `${item.name}\n${item.percentage}%`,
      value: item.value,
      itemStyle: {
        color: item.color
      }
    }));
    
    const option = {
      tooltip: {
        show: false
      },
      series: [{
        type: 'treemap',
        width: '90%',
        height: '90%',
        roam: false,
        nodeClick: false,
        data: treeData,
        breadcrumb: {
          show: false
        },
        label: {
          show: true,
          position: 'inside',
          fontSize: 12,
          color: '#fff',
          fontWeight: 'bold',
          formatter: function(params) {
            return params.name;
          }
        },
        upperLabel: {
          show: false
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          gapWidth: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
    
    chart.setOption(option);
  },

  // 初始化雷达图
  initRadarChart: function() {
    this.setData({
      radarEc: {
        onInit: this.initRadarEChart
      }
    });
  },

  // 初始化ECharts雷达图
  initRadarEChart: function(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr
    });
    canvas.setChart(chart);
    
    // 获取当前页面实例
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 初始化图表
    currentPage.updateRadarChart(chart);
    
    return chart;
  },

  // 更新雷达图
  updateRadarChart: function(chart) {
    const { radarData } = this.data;
    
    // 如果没有传入chart参数，尝试获取已存在的chart实例
    if (!chart) {
      const query = wx.createSelectorQuery();
      query.select('#mychart-dom-radar').fields({
        node: true,
        size: true
      }).exec((res) => {
        if (res[0] && res[0].node && res[0].node.chart) {
          this.updateRadarChart(res[0].node.chart);
        }
      });
      return;
    }
    
    if (!chart || radarData.length === 0) return;
    
    // 准备雷达图数据
    const indicators = radarData.map(item => ({
      name: item.dimension,
      max: 100
    }));
    
    const seriesData = [{
      value: radarData.map(item => item.score),
      name: '能力评分'
    }];
    
    const option = {
      radar: {
        indicator: indicators,
        center: ['50%', '50%'],
        radius: '55%', // 减小雷达图半径，为文字留出更多空间
        startAngle: 90,
        splitNumber: 4,
        shape: 'polygon',
        name: {
          formatter: function(value, indicator) {
            const radarItem = radarData.find(item => item.dimension === value);
            return `{title|${value}}\n{value|${radarItem ? radarItem.score.toFixed(1) : 0}分}`;
          },
          rich: {
            title: {
              color: '#333',
              fontSize: 11,
              align: 'center'
            },
            value: {
              color: '#3b82f6',
              fontSize: 10,
              fontWeight: 'bold',
              align: 'center'
            }
          },
          textStyle: {
            color: '#333',
            fontSize: 11
          }
        },
        splitLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 1
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)']
          }
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1'
          }
        }
      },
      series: [{
        type: 'radar',
        data: seriesData,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#3b82f6',
          width: 2
        },
        areaStyle: {
          color: 'rgba(59, 130, 246, 0.2)'
        },
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#fff',
          borderWidth: 2
        }
      }]
    };
    
    chart.setOption(option);
  },

  initTrendChart: function() {
    this.setData({
      trendEc: {
        onInit: this.initTrendEChart
      }
    });
  },

  // 初始化ECharts趋势图
  initTrendEChart: function(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr
    });
    canvas.setChart(chart);
    
    // 获取当前页面实例
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 初始化图表
    currentPage.updateTrendChart(chart);
    
    return chart;
  },

  // 更新趋势图
  updateTrendChart: function(chart) {
    const { trendData } = this.data;
    
    if (!chart || trendData.length === 0) return;
    
    // 处理数据，确保至少有两个数据点
    let chartData = [...trendData];
    if (chartData.length === 1) {
      // 如果只有一个数据点，添加一个起始点
      const firstData = chartData[0];
      const startDate = new Date(firstData.date);
      startDate.setMonth(startDate.getMonth() - 1);
      
      chartData.unshift({
        date: this.formatDate(startDate),
        value: 0,
        formattedValue: app.formatCurrency(0),
        assetName: '起始',
        index: -1
      });
    }
    
    const xAxisData = chartData.map(item => item.date);
    const seriesData = chartData.map(item => item.value);
    
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'transparent',
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        formatter: function(params) {
           const data = params[0];
           const index = data.dataIndex;
           const originalData = chartData[index];
           return `${originalData.formattedValue}`;
         }
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          fontSize: 10,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 10,
          color: '#666',
          formatter: function(value) {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万';
            }
            return value.toFixed(0);
          }
        },
        axisLine: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [{
        type: 'line',
        data: seriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#007aff',
          width: 3
        },
        itemStyle: {
          color: '#007aff',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(0, 122, 255, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(0, 122, 255, 0.05)'
            }]
          }
        }
      }],
      grid: {
        left: 40,
        right: 20,
        top: 20,
        bottom: 30
      }
    };
    
    chart.setOption(option);
  },

  // 加载数据
  loadData: function() {
    const assets = app.getAssets();
    this.setData({ assets });
    
    // 加载资产分布数据
    this.calculateCategoryData();
    this.calculateTrendData();
    this.calculateCategoryComparison();
    this.calculateCategorySummary();
    
    // 加载个人分析数据（移除重复调用）
    this.calculateRadarData();
    this.calculateRankingScore();
  },

  // 切换标签页
  switchTab: function(e) {
    const tabType = e.currentTarget.dataset.type;
    this.setData({ tabType });
  },

  // ========== 资产分布相关方法 ==========
  
  // 计算分类数据（饼图）
  calculateCategoryData: function() {
    const { assets, categories } = this.data;
    const categoryTotals = {};
    let totalAmount = 0;

    // 初始化分类总额
    categories.forEach(category => {
      categoryTotals[category.key] = 0;
    });

    // 计算每个分类的总额
    assets.forEach(asset => {
      // 如果预估价为0或null/undefined，使用购买价格
      const amount = (asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0) 
        ? asset.currentValue 
        : asset.amount;
      categoryTotals[asset.category] = (categoryTotals[asset.category] || 0) + amount;
      totalAmount += amount;
    });

    // 构建图表数据
    const categoryData = categories
      .map(category => ({
        name: category.name,
        key: category.key,
        value: categoryTotals[category.key],
        color: category.color,
        icon: category.icon,
        percentage: totalAmount > 0 ? ((categoryTotals[category.key] / totalAmount) * 100).toFixed(1) : 0,
        formattedValue: app.formatCurrency(categoryTotals[category.key])
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    this.setData({ 
      categoryData,
      totalAmount,
      formattedTotalAmount: app.formatCurrency(totalAmount)
    }, () => {
      // 数据更新后重新渲染矩形树图
      this.refreshPieChart();
    });
  },

  // 计算趋势数据
  calculateTrendData: function() {
    const { assets } = this.data;
    
    if (!assets || assets.length === 0) {
      this.setData({ trendData: [] });
      return;
    }

    // 按月度分组资产数据
    const monthlyData = {};
    
    assets.forEach(asset => {
      // 获取持有时间，如果没有则使用创建时间
      const holdDate = asset.purchaseDate || asset.createdAt || asset.createTime;
      if (!holdDate) return;
      
      const date = new Date(holdDate);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          date: yearMonth,
          assets: [],
          totalValue: 0
        };
      }
      
      // 处理多种价值字段格式
      const value = asset.currentValue !== undefined && asset.currentValue !== null && asset.currentValue !== 0
        ? asset.currentValue 
        : (asset.amount !== undefined ? asset.amount : (asset.value || 0));
      
      monthlyData[yearMonth].assets.push(asset);
      monthlyData[yearMonth].totalValue += value;
    });

    // 转换为数组并按时间排序
    const sortedMonths = Object.keys(monthlyData).sort();
    const trendData = [];
    let cumulativeValue = 0;

    sortedMonths.forEach(month => {
      cumulativeValue += monthlyData[month].totalValue;
      trendData.push({
        date: month,
        value: cumulativeValue,
        formattedValue: app.formatCurrency(cumulativeValue),
        monthlyValue: monthlyData[month].totalValue,
        formattedMonthlyValue: app.formatCurrency(monthlyData[month].totalValue),
        assetCount: monthlyData[month].assets.length
      });
    });

    console.log('趋势数据计算完成:', trendData);
    this.setData({ trendData }, () => {
      // 数据更新后重新渲染图表
      this.refreshTrendChart();
    });
  },

  // 刷新趋势图
  refreshTrendChart: function() {
    // 通过选择器获取图表组件并更新
    const query = wx.createSelectorQuery().in(this);
    query.select('#mychart-dom-trend').fields({ node: true, size: true }).exec((res) => {
      if (res[0] && res[0].node) {
        const canvas = res[0].node;
        const chart = canvas.chart;
        if (chart) {
          this.updateTrendChart(chart);
        }
      }
    });
  },

  // 刷新矩形树图
  refreshPieChart: function() {
    // 通过选择器获取图表组件并更新
    const query = wx.createSelectorQuery().in(this);
    query.select('#mychart-dom-pie').fields({ node: true, size: true }).exec((res) => {
      if (res[0] && res[0].node) {
        const canvas = res[0].node;
        const chart = canvas.chart;
        if (chart) {
          this.updatePieChart(chart);
        }
      }
    });
  },

  // 计算类别对比
  calculateCategoryComparison: function() {
    const { categoryData } = this.data;
    
    const categoryComparison = categoryData.map(item => ({
      ...item,
      barWidth: item.percentage // 用于显示条形图宽度
    }));

    this.setData({ categoryComparison });
  },

  // 计算分类汇总
  calculateCategorySummary: function() {
    const { assets, categoryData, totalAmount } = this.data;
    
    const averageValue = assets.length > 0 ? totalAmount / assets.length : 0;
    
    const categorySummary = {
      totalAssets: assets.length,
      totalValue: totalAmount,
      formattedTotalValue: app.formatCurrency(totalAmount),
      categoryCount: categoryData.length,
      averageValue: averageValue,
      formattedAverageValue: averageValue.toFixed(2) + '元', // 保留两位小数
      topCategory: categoryData.length > 0 ? categoryData[0] : null
    };

    this.setData({ categorySummary });
  },

  // ========== 个人分析相关方法 ==========
  
  // 生成AI分析
  generateAIAnalysis: function() {
    const { assets, categoryData, totalAmount } = this.data;
    
    if (assets.length === 0) {
      this.setData({ 
        aiAnalysis: '暂无资产数据，无法进行分析。请先添加一些资产信息。',
        isAnalyzing: false 
      });
      return;
    }

    // 显示加载状态
    this.setData({ 
      isAnalyzing: true,
      aiAnalysis: '正在分析您的资产状况，请稍候...'
    });

    // 获取个人信息和设置
    const personalInfo = wx.getStorageSync('personalInfo') || {};
    const settings = app.getSettings();
    const apiKey = settings.deepseekApiKey;
    
    // 计算雷达图数据
    this.calculateRadarData();
    
    // 计算段位评分
    this.calculateRankingScore();

    // 检查是否配置了AI Key
    if (apiKey && apiKey.trim()) {
      // 使用AI分析
      this.performAIAnalysis(apiKey, personalInfo);
    } else {
      // 使用本地分析
      this.performLocalAnalysis(personalInfo);
    }
  },

  // 执行AI分析
  performAIAnalysis: function(apiKey, personalInfo) {
    const { assets, categoryData, totalAmount } = this.data;
    
    // 引入AI分析工具
    const aiAnalysis = require('../../utils/ai-analysis');
    
    const analysisParams = {
      assets,
      categoryData,
      totalAmount,
      personalInfo
    };

    aiAnalysis.analyzeWithDeepSeekAI(analysisParams, apiKey)
      .then(result => {
        this.setData({ 
          aiAnalysis: result,
          isAnalyzing: false,
          analysisType: 'ai' // 标记为AI分析
        });
      })
      .catch(error => {
        console.error('AI分析失败:', error);
        
        // AI分析失败时降级到本地分析
        this.setData({ 
          aiAnalysis: '⚠️ AI分析服务暂时不可用，已为您提供基础分析。\n\n',
          isAnalyzing: false
        });
        
        // 执行本地分析作为备选
        setTimeout(() => {
          this.performLocalAnalysis(personalInfo, true);
        }, 500);
      });
  },

  // 执行本地分析
  performLocalAnalysis: function(personalInfo, isBackup = false) {
    const { assets, categoryData, totalAmount } = this.data;
    
    // 引入AI分析工具的基础分析功能
    const aiAnalysis = require('../../utils/ai-analysis');
    
    const analysisParams = {
      assets,
      categoryData,
      totalAmount,
      personalInfo
    };

    const basicAnalysis = aiAnalysis.generateBasicAnalysis(analysisParams);
    
    // 添加个性化建议
    const personalizedAnalysis = this.addPersonalizedSuggestions(basicAnalysis, personalInfo);
    
    const finalAnalysis = isBackup 
      ? this.data.aiAnalysis + personalizedAnalysis
      : personalizedAnalysis;

    this.setData({ 
      aiAnalysis: finalAnalysis,
      isAnalyzing: false,
      analysisType: 'local' // 标记为本地分析
    });
  },

  // 添加个性化建议
  addPersonalizedSuggestions: function(basicAnalysis, personalInfo) {
    let personalizedSuggestions = basicAnalysis;
    
    // 根据年龄给出建议
    const age = this.calculateAge(personalInfo.birthday);
    if (age) {
      personalizedSuggestions += "\n🎯 个性化建议：\n";
      
      if (age < 30) {
        personalizedSuggestions += "• 年轻阶段：建议增加高成长性投资比例，如股票基金\n";
        personalizedSuggestions += "• 可适当承担较高风险以获得更好收益\n";
      } else if (age < 45) {
        personalizedSuggestions += "• 中年阶段：建议平衡风险与收益，稳健投资\n";
        personalizedSuggestions += "• 考虑增加保险和养老金配置\n";
      } else {
        personalizedSuggestions += "• 成熟阶段：建议降低风险，增加稳定收益投资\n";
        personalizedSuggestions += "• 重点关注资产保值和流动性\n";
      }
    }
    
    // 根据地区给出建议
    if (personalInfo.location) {
      personalizedSuggestions += `• 地区特色：基于您在${personalInfo.location}的情况，建议关注当地房产和经济发展趋势\n`;
    }
    
    // 根据职业给出建议
    if (personalInfo.job) {
      personalizedSuggestions += `• 职业规划：结合您的${personalInfo.job}职业特点，建议制定相应的财务规划\n`;
    }
    
    return personalizedSuggestions;
  },

  // 计算年龄
  calculateAge: function(birthday) {
    if (!birthday) return null;
    
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // 计算雷达图数据
  calculateRadarData: function() {
    const { assets, categoryData, totalAmount } = this.data;
    
    // 计算各维度得分（0-100分）
    const radarData = [
      {
        dimension: '资产规模',
        score: Math.round(Math.min(100, Math.max(0, (totalAmount / 1000000) * 100))), // 100万为满分
        maxScore: 100
      },
      {
        dimension: '多元化程度',
        score: Math.round(Math.min(100, Math.max(0, (categoryData.length / 7) * 100))), // 7个类别为满分
        maxScore: 100
      },
      {
        dimension: '流动性',
        score: Math.round(Math.max(0, this.calculateLiquidityScore())),
        maxScore: 100
      },
      {
        dimension: '增长潜力',
        score: Math.round(Math.max(0, this.calculateGrowthScore())),
        maxScore: 100
      },
      {
        dimension: '风险控制',
        score: Math.round(Math.max(0, this.calculateRiskScore())),
        maxScore: 100
      }
    ];

    console.log('雷达图数据计算完成:', radarData);
    this.setData({ radarData });
    
    // 更新雷达图
    this.updateRadarChart();
  },

  // 计算流动性得分
  calculateLiquidityScore: function() {
    const { assets, totalAmount } = this.data;
    if (totalAmount === 0) return 0;
    
    let liquidAssets = 0;
    assets.forEach(asset => {
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      if (['现金', '存款'].includes(asset.category)) {
        liquidAssets += value;
      }
    });
    
    const liquidityRatio = liquidAssets / totalAmount;
    return Math.min(100, liquidityRatio * 100 * 2); // 50%流动资产为满分
  },

  // 计算增长潜力得分
  calculateGrowthScore: function() {
    const { assets, totalAmount } = this.data;
    if (totalAmount === 0) return 0;
    
    let growthAssets = 0;
    assets.forEach(asset => {
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      if (['股票', '基金', '房产'].includes(asset.category)) {
        growthAssets += value;
      }
    });
    
    const growthRatio = growthAssets / totalAmount;
    return Math.min(100, growthRatio * 100 * 1.5); // 67%增长型资产为满分
  },

  // 计算风险控制得分
  calculateRiskScore: function() {
    const { categoryData } = this.data;
    
    // 基于资产分散程度计算风险控制得分
    if (categoryData.length === 0) return 0;
    
    // 计算基尼系数的简化版本
    const values = categoryData.map(item => parseFloat(item.percentage));
    const maxConcentration = Math.max(...values);
    
    // 最大集中度越低，风险控制越好
    return Math.max(0, 100 - maxConcentration);
  },

  // 计算段位评分（支持AI分析）
  calculateRankingScore: function() {
    const { radarData, assets, totalAmount, categoryData } = this.data;
    
    // 计算平均得分
    const averageScore = radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length;
    const totalScore = radarData.reduce((sum, item) => sum + item.score, 0);
    
    let rankingLevel = '';
    let rankingClass = '';
    if (averageScore >= 90) {
      rankingLevel = '钻石';
      rankingClass = 'diamond';
    } else if (averageScore >= 80) {
      rankingLevel = '铂金';
      rankingClass = 'platinum';
    } else if (averageScore >= 70) {
      rankingLevel = '黄金';
      rankingClass = 'gold';
    } else if (averageScore >= 60) {
      rankingLevel = '白银';
      rankingClass = 'silver';
    } else if (averageScore >= 50) {
      rankingLevel = '青铜';
      rankingClass = 'bronze';
    } else {
      rankingLevel = '黑铁';
      rankingClass = 'iron';
    }

    this.setData({ 
      rankingScore: Math.round(averageScore),
      rankingLevel: rankingLevel,
      rankingClass: rankingClass,
      totalScore: Math.round(totalScore)
    });

    // 使用AI排名分析
    this.generateAIRankingAnalysis();
  },

  // 生成AI排名分析
  generateAIRankingAnalysis: function() {
    const { radarData, totalAmount, categoryData } = this.data;
    
    if (radarData.length === 0) {
      this.setData({ 
        regionalRanking: 50,
        nationalRanking: 60,
        rankingAnalysisSummary: '暂无数据进行排名分析'
      });
      return;
    }

    // 显示加载状态
    this.setData({ 
      isRankingAnalyzing: true 
    });

    // 获取个人信息和设置
    const personalInfo = wx.getStorageSync('personalInfo') || {};
    const settings = wx.getStorageSync('settings') || {};
    const apiKey = settings.deepseekApiKey;
    
    // 计算平均得分
    const averageScore = radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length;
    
    // 准备分析参数
    const analysisParams = {
      personalInfo,
      totalAssets: totalAmount,
      averageScore,
      categoryCount: categoryData.length,
      radarData
    };

    // 使用AI排名分析工具
    const aiRanking = require('../../utils/ai-ranking');
    
    aiRanking.analyzeRanking(analysisParams)
      .then(result => {
        // 检查AI返回的数值，如果为null则使用本地计算的兜底数值
        let finalRegional = result.regional;
        let finalNational = result.national;
        
        if (finalRegional === null || finalRegional === undefined || isNaN(finalRegional)) {
          finalRegional = Math.max(5, Math.min(95, Math.round(100 - averageScore + Math.random() * 10)));
        }
        
        if (finalNational === null || finalNational === undefined || isNaN(finalNational)) {
          finalNational = Math.max(10, Math.min(98, Math.round(100 - averageScore + 15 + Math.random() * 10)));
        }
        
        this.setData({ 
          regionalRanking: finalRegional,
          nationalRanking: finalNational,
          rankingAnalysisSummary: this.extractSummary(result.analysis, averageScore),
          rankingAnalysisType: apiKey ? 'ai' : 'local',
          isRankingAnalyzing: false 
        });
      })
      .catch(error => {
        console.error('排名分析失败:', error);
        
        // 降级到基础排名计算
        const regionalRanking = Math.max(5, Math.min(95, Math.round(100 - averageScore + Math.random() * 10)));
        const nationalRanking = Math.max(10, Math.min(98, Math.round(100 - averageScore + 15 + Math.random() * 10)));
        
        this.setData({ 
          regionalRanking: regionalRanking,
          nationalRanking: nationalRanking,
          rankingAnalysisSummary: this.generateBasicRankingSummary(averageScore, regionalRanking, nationalRanking),
          rankingAnalysisType: 'local',
          isRankingAnalyzing: false 
        });
      });
  },

  // 提取分析摘要（从完整分析中提取关键信息，限制在50字左右）
  extractSummary: function(fullAnalysis, averageScore) {
    if (!fullAnalysis) return this.generateBasicRankingSummary(averageScore || 60, 50, 60);
    
    // 尝试提取综合评价部分的简短描述
    const evaluationMatch = fullAnalysis.match(/### 💎 综合评价\n([^#]+)/);
    if (evaluationMatch) {
      const evaluation = evaluationMatch[1].trim();
      // 提取第一句话，限制在50字以内
      const firstSentence = evaluation.split(/[。！？\n]/)[0];
      if (firstSentence && firstSentence.length <= 50) {
        return firstSentence.replace(/\*\*/g, '').trim();
      }
    }
    
    // 如果没有找到合适的摘要，生成基础摘要
    return this.generateBasicRankingSummary(averageScore || 60, 50, 60);
  },

  // 生成基础排名摘要
  generateBasicRankingSummary: function(averageScore, regionalRanking, nationalRanking) {
    if (averageScore >= 80) {
      return `您的财务状况表现优秀，位于前${Math.round(regionalRanking)}%的地区排名中。`;
    } else if (averageScore >= 60) {
      return `您的财务状况良好，建议在资产配置方面进一步优化。`;
    } else {
      return `您的财务状况有较大提升空间，建议增加储蓄和投资多样化。`;
    }
  },

  // ========== 工具方法 ==========
  
  // 格式化货币
  formatCurrency: function(amount) {
    return app.formatCurrency(amount);
  },

  // 格式化日期
  formatDate: function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '';
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
});