// pages/chart/chart.js
import * as echarts from '../../components/ec-canvas/echarts';

const app = getApp();

Page({
  // 格式化分数的辅助函数
  formatScore: function(score) {
    const num = Number(score);
    if (isNaN(num)) return '0.0';
    return num.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
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
    
    // 躺平生活分析数据
    lifeDuration: '',
    dailyBudget: 0,
    recommendedCities: [],
    lifePlans: [],
    analysisType: 'local', // 'ai' | 'local'
    
    categories: [
      { key: '现金', name: '现金', color: '#10B981', icon: '/images/category/cash.png' },
      { key: '存款', name: '存款', color: '#3B82F6', icon: '/images/category/credit.png' },
      { key: '房产', name: '房产', color: '#F59E0B', icon: '/images/category/house.png' },
      { key: '车辆', name: '车辆', color: '#EF4444', icon: '/images/category/car.png' },
      { key: '基金', name: '基金', color: '#8B5CF6', icon: '/images/category/fund.png' },
      { key: '股票', name: '股票', color: '#EC4899', icon: '/images/category/stock.png' },
      { key: '其他', name: '其他', color: '#6B7280', icon: '/images/category/other.png' }
    ]
  },

  onLoad: function() {
    this.loadData();
    this.initPieChart();
    this.initTrendChart();
    this.initRadarChart();
    
    // 页面加载时自动执行一次分析
    setTimeout(() => {
 // 生成分析
    this.generateAIAnalysis(); // 统一的人生圆满度分析
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
            // 直接在这里实现formatScore的逻辑，避免this上下文问题
            const formatScore = (score) => {
              const num = Number(score);
              if (isNaN(num)) return '0.0';
              return num.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };
            return `{title|${value}}\n{value|${radarItem ? formatScore(radarItem.score) : '0.0'}分}`;
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
            // 强制使用英文数字格式，避免系统本地化影响
            const formatNumber = (n) => {
              const parts = n.toString().split('.');
              parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              return parts.join('.');
            };
            
            if (value >= 10000) {
              const formatted = (value / 10000).toFixed(1);
              return formatNumber(formatted) + '万';
            }
            return formatNumber(Math.round(value));
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
        percentage: totalAmount > 0 ? ((categoryTotals[category.key] / totalAmount) * 100).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0,
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
      formattedAverageValue: this.formatValue(averageValue) + '元', // 格式化数值
      topCategory: categoryData.length > 0 ? categoryData[0] : null
    };

    this.setData({ categorySummary });
  },

  // ========== 个人分析相关方法 ==========
  
  // 格式化数值（避免.00格式）
  formatValue: function(value) {
    const rounded = Math.round(value * 100) / 100;
    return rounded % 1 === 0 ? Math.round(rounded) : rounded;
  },
  
  // 生成AI分析（统一人生圆满度分析）
  generateAIAnalysis: function() {
    const { assets, categoryData, totalAmount } = this.data;
    
    if (assets.length === 0) {
      this.setData({ 
        aiAnalysis: '暂无资产数据，无法进行分析。请先添加一些资产信息。',
        isAnalyzing: false,
        isRankingAnalyzing: false
      });
      return;
    }

    // 显示加载状态
    this.setData({ 
      isAnalyzing: true,
      isRankingAnalyzing: true,
      aiAnalysis: '正在分析您的人生圆满度，请稍候...'
    });

    // 获取个人信息
    const personalInfo = wx.getStorageSync('personalInfo') || {};
    
    // 先计算基础雷达图数据（用于AI分析参考）
    this.calculateRadarData();
    
    // 获取当前雷达图数据
    const { radarData } = this.data;
    
    // 检查是否配置了AI Key
    const settings = wx.getStorageSync('settings') || {};
    const apiKey = settings.deepseekApiKey;
    
    if (apiKey && apiKey.trim()) {
      // 使用统一的AI人生圆满度分析
      this.performUnifiedAIAnalysis(personalInfo, radarData);
    } else {
      // 使用本地分析
      this.performLocalAnalysis(personalInfo);
    }
  },

  // 执行统一AI分析
  performUnifiedAIAnalysis: function(personalInfo, radarData) {
    const { assets, categoryData, totalAmount } = this.data;
    
    // 引入统一的人生圆满度分析工具
    const aiLifeAnalysis = require('../../utils/ai-life-analysis');
    
    const analysisParams = {
      personalInfo,
      assets,
      categoryData,
      totalAmount,
      radarData
    };

    aiLifeAnalysis.analyzeLifeFulfillment(analysisParams)
      .then(result => {
        // 更新雷达图数据（使用AI返回的评分）
        const formatScore = (score) => {
          const num = Number(score);
          if (isNaN(num)) return '0.0';
          return num.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        };
        
        const updatedRadarData = [
          { dimension: '栖居归宿', score: result.radarScores['栖居归宿'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['栖居归宿'] || 50) },
          { dimension: '财富积累', score: result.radarScores['财富积累'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['财富积累'] || 50) },
          { dimension: '生活精选', score: result.radarScores['生活精选'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['生活精选'] || 50) },
          { dimension: '守护保障', score: result.radarScores['守护保障'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['守护保障'] || 50) },
          { dimension: '自由便捷', score: result.radarScores['自由便捷'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['自由便捷'] || 50) }
        ];
        
        // 计算平均分和段位
        const averageScore = updatedRadarData.reduce((sum, item) => sum + item.score, 0) / updatedRadarData.length;
        const { rankingLevel, rankingClass, totalScore } = this.calculateRankingFromScore(averageScore);
        
        // 更新所有相关数据
        this.setData({ 
          // AI分析结果
          aiAnalysis: result.overallAnalysis,
          analysisType: 'ai',
          isAnalyzing: false,
          
          // 雷达图数据
          radarData: updatedRadarData,
          
          // 排名数据
          regionalRanking: result.regionalRanking || 50,
          nationalRanking: result.nationalRanking || 50,
          rankingAnalysisSummary: result.comparisonWithNational || '分析完成',
          rankingAnalysisType: 'ai',
          isRankingAnalyzing: false,
          
          // 段位数据
          rankingScore: Math.round(averageScore),
          rankingLevel: rankingLevel,
          rankingClass: rankingClass,
          totalScore: Math.round(totalScore),
          
          // 躺平生活数据
          lifeDuration: result.lifeAnalysis?.lifeDuration || '计算中',
          dailyBudget: result.lifeAnalysis?.dailyBudget || 0,
          recommendedCities: result.lifeAnalysis?.recommendedCities || [],
          lifePlans: result.lifeAnalysis?.lifePlans || [],
          
          // 额外指标
          stabilityIndex: result.stabilityIndex || 50,
          richnessIndex: result.richnessIndex || 50,
          lifeFulfillmentLevel: result.lifeFulfillmentLevel || '待评估',
          suggestions: result.suggestions || []
        });
      })
      .catch(error => {
        console.error('统一AI分析失败:', error);
        
        // AI分析失败时降级到本地分析
        this.setData({ 
          aiAnalysis: '⚠️ AI分析服务暂时不可用，已为您提供基础分析。\n\n',
          isAnalyzing: false,
          isRankingAnalyzing: false
        });
        
        // 执行本地分析作为备选
        setTimeout(() => {
          this.performLocalAnalysis(personalInfo, true);
        }, 500);
      });
  },

  // 执行本地分析
  performLocalAnalysis: function(personalInfo, isBackup = false) {
    const { assets, categoryData, totalAmount, radarData } = this.data;
    
    // 引入统一的人生圆满度分析工具
    const aiLifeAnalysis = require('../../utils/ai-life-analysis');
    
    const analysisParams = {
      personalInfo,
      assets,
      categoryData,
      totalAmount,
      radarData
    };

    const result = aiLifeAnalysis.generateBasicLifeAnalysis(analysisParams);
    
    // 更新雷达图数据（使用本地计算的评分）
    const formatScore = (score) => {
      const num = Number(score);
      if (isNaN(num)) return '0.0';
      return num.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    const updatedRadarData = [
      { dimension: '栖居归宿', score: result.radarScores['栖居归宿'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['栖居归宿'] || 50) },
      { dimension: '财富积累', score: result.radarScores['财富积累'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['财富积累'] || 50) },
      { dimension: '生活精选', score: result.radarScores['生活精选'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['生活精选'] || 50) },
      { dimension: '守护保障', score: result.radarScores['守护保障'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['守护保障'] || 50) },
      { dimension: '自由便捷', score: result.radarScores['自由便捷'] || 50, maxScore: 100, formattedScore: formatScore(result.radarScores['自由便捷'] || 50) }
    ];
    
    // 计算平均分和段位
    const averageScore = updatedRadarData.reduce((sum, item) => sum + item.score, 0) / updatedRadarData.length;
    const { rankingLevel, rankingClass, totalScore } = this.calculateRankingFromScore(averageScore);
    
    const finalAnalysis = isBackup 
      ? this.data.aiAnalysis + result.overallAnalysis
      : result.overallAnalysis;

    // 更新所有相关数据
    this.setData({ 
      // AI分析结果
      aiAnalysis: finalAnalysis,
      analysisType: 'local',
      isAnalyzing: false,
      
      // 雷达图数据
      radarData: updatedRadarData,
      
      // 排名数据
      regionalRanking: result.regionalRanking || 50,
      nationalRanking: result.nationalRanking || 50,
      rankingAnalysisSummary: result.comparisonWithNational || '本地分析完成',
      rankingAnalysisType: 'local',
      isRankingAnalyzing: false,
      
      // 段位数据
      rankingScore: Math.round(averageScore),
      rankingLevel: rankingLevel,
      rankingClass: rankingClass,
      totalScore: Math.round(totalScore),
      
      // 躺平生活数据
      lifeDuration: result.lifeAnalysis?.lifeDuration || '计算中',
      dailyBudget: result.lifeAnalysis?.dailyBudget || 0,
      recommendedCities: result.lifeAnalysis?.recommendedCities || [],
      lifePlans: result.lifeAnalysis?.lifePlans || [],
      
      // 额外指标
      stabilityIndex: result.stabilityIndex || 50,
      richnessIndex: result.richnessIndex || 50,
      lifeFulfillmentLevel: result.lifeFulfillmentLevel || '待评估',
      suggestions: result.suggestions || []
    });
  },

  // 根据评分计算段位信息
  calculateRankingFromScore: function(averageScore) {
    let rankingLevel = '';
    let rankingClass = '';
    let totalScore = averageScore;
    
    if (averageScore >= 90) {
      rankingLevel = '王者';
      rankingClass = 'king';
    } else if (averageScore >= 80) {
      rankingLevel = '钻石';
      rankingClass = 'diamond';
    } else if (averageScore >= 70) {
      rankingLevel = '铂金';
      rankingClass = 'platinum';
    } else if (averageScore >= 60) {
      rankingLevel = '黄金';
      rankingClass = 'gold';
    } else if (averageScore >= 50) {
      rankingLevel = '白银';
      rankingClass = 'silver';
    } else {
      rankingLevel = '青铜';
      rankingClass = 'bronze';
    }
    
    return { rankingLevel, rankingClass, totalScore };
  },

  // 计算雷达图数据
  calculateRadarData: function() {
    const { assets, categoryData, totalAmount } = this.data;
    
    // 强制使用英文数字格式的函数
    const formatScore = (score) => {
      const num = Number(score);
      if (isNaN(num)) return '0.0';
      return num.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    // 计算各维度得分（0-100分）
    const radarData = [
      {
        dimension: '栖居归宿',
        score: Math.round(Math.max(0, this.calculateHousingScore())),
        maxScore: 100,
        formattedScore: formatScore(Math.max(0, this.calculateHousingScore()))
      },
      {
        dimension: '财富积累',
        score: Math.round(Math.max(0, this.calculateWealthScore())),
        maxScore: 100,
        formattedScore: formatScore(Math.max(0, this.calculateWealthScore()))
      },
      {
        dimension: '生活精选',
        score: Math.round(Math.max(0, this.calculateLifestyleScore())),
        maxScore: 100,
        formattedScore: formatScore(Math.max(0, this.calculateLifestyleScore()))
      },
      {
        dimension: '守护保障',
        score: Math.round(Math.max(0, this.calculateProtectionScore())),
        maxScore: 100,
        formattedScore: formatScore(Math.max(0, this.calculateProtectionScore()))
      },
      {
        dimension: '自由便捷',
        score: Math.round(Math.max(0, this.calculateMobilityScore())),
        maxScore: 100,
        formattedScore: formatScore(Math.max(0, this.calculateMobilityScore()))
      }
    ];

    console.log('雷达图数据计算完成:', radarData);
    this.setData({ radarData });
    
    // 更新雷达图
    this.updateRadarChart();
  },

  // 计算栖居归宿得分（房产相关）
  calculateHousingScore: function() {
    const { assets, totalAmount } = this.data;
    if (totalAmount === 0) return 0;
    
    let housingAssets = 0;
    assets.forEach(asset => {
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      if (['房产'].includes(asset.category)) {
        housingAssets += value;
      }
    });
    
    const housingRatio = housingAssets / totalAmount;
    // 房产占比30-60%为最佳，超过或不足都会降分
    if (housingRatio >= 0.3 && housingRatio <= 0.6) {
      return Math.min(100, housingRatio * 100 * 1.5);
    } else if (housingRatio < 0.3) {
      return housingRatio * 100 * 2; // 不足30%按比例给分
    } else {
      return Math.max(60, 100 - (housingRatio - 0.6) * 200); // 超过60%扣分
    }
  },

  // 计算财富积累得分（现金、存款、投资）
  calculateWealthScore: function() {
    const { assets, totalAmount } = this.data;
    if (totalAmount === 0) return 0;
    
    let wealthAssets = 0;
    assets.forEach(asset => {
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      if (['现金', '存款', '股票', '基金'].includes(asset.category)) {
        wealthAssets += value;
      }
    });
    
    const wealthRatio = wealthAssets / totalAmount;
    // 基于总资产规模和流动资产比例综合评分
    const scaleScore = Math.min(50, (totalAmount / 1000000) * 50); // 资产规模得分，100万为满分50分
    const ratioScore = Math.min(50, wealthRatio * 100); // 比例得分，最高50分
    return scaleScore + ratioScore;
  },

  // 计算生活精选得分（电子产品、奢侈品等）
  calculateLifestyleScore: function() {
    const { assets, totalAmount } = this.data;
    if (totalAmount === 0) return 0;
    
    let lifestyleAssets = 0;
    assets.forEach(asset => {
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      if (['电子产品', '奢侈品', '收藏品', '其他'].includes(asset.category)) {
        lifestyleAssets += value;
      }
    });
    
    const lifestyleRatio = lifestyleAssets / totalAmount;
    // 生活品质资产占比5-20%为合理范围
    if (lifestyleRatio >= 0.05 && lifestyleRatio <= 0.2) {
      return Math.min(100, lifestyleRatio * 100 * 4); // 在合理范围内按比例给分
    } else if (lifestyleRatio < 0.05) {
      return lifestyleRatio * 100 * 10; // 不足5%按比例给分，但权重更高
    } else {
      return Math.max(50, 100 - (lifestyleRatio - 0.2) * 300); // 超过20%扣分
    }
  },

  // 计算守护保障得分（保险相关）
  calculateProtectionScore: function() {
    const { assets, totalAmount } = this.data;
    if (totalAmount === 0) return 0;
    
    let protectionAssets = 0;
    assets.forEach(asset => {
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      if (['保险'].includes(asset.category)) {
        protectionAssets += value;
      }
    });
    
    const protectionRatio = protectionAssets / totalAmount;
    // 保险资产占比2-10%为合理范围
    if (protectionRatio >= 0.02 && protectionRatio <= 0.1) {
      return Math.min(100, protectionRatio * 100 * 8); // 在合理范围内给高分
    } else if (protectionRatio < 0.02) {
      return protectionRatio * 100 * 20; // 不足2%按比例给分
    } else {
      return Math.max(70, 100 - (protectionRatio - 0.1) * 200); // 超过10%轻微扣分
    }
  },

  // 计算自由便捷得分（汽车、电动车、交通工具等）
  calculateMobilityScore: function() {
    const { assets, totalAmount } = this.data;
    if (totalAmount === 0) return 0;
    
    let mobilityAssets = 0;
    assets.forEach(asset => {
      const value = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      // 扩展车辆相关分类识别
      const mobilityCategories = ['汽车', '交通工具', '车辆', '电动车', '摩托车', '自行车'];
      if (mobilityCategories.includes(asset.category)) {
        mobilityAssets += value;
      }
    });
    
    console.log('自由便捷维度计算:', {
      mobilityAssets,
      totalAmount,
      ratio: mobilityAssets / totalAmount,
      assets: this.data.assets.filter(asset => {
        const mobilityCategories = ['汽车', '交通工具', '车辆', '电动车', '摩托车', '自行车'];
        return mobilityCategories.includes(asset.category);
      })
    });
    
    const mobilityRatio = mobilityAssets / totalAmount;
    // 交通工具占比5-25%为合理范围
    if (mobilityRatio >= 0.05 && mobilityRatio <= 0.25) {
      return Math.min(100, mobilityRatio * 100 * 3); // 在合理范围内按比例给分
    } else if (mobilityRatio < 0.05) {
      return mobilityRatio * 100 * 8; // 不足5%按比例给分
    } else {
      return Math.max(60, 100 - (mobilityRatio - 0.25) * 150); // 超过25%扣分
    }
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