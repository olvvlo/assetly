/**
 * 统一的人生圆满度AI分析工具
 * 整合资产分析、排名分析、雷达图评分和躺平生活分析
 */

// 分析人生圆满度（统一AI分析）
function analyzeLifeFulfillment(params) {
  return new Promise((resolve, reject) => {
    const { personalInfo, assets, categoryData, totalAmount, radarData } = params;
    
    // 获取设置信息
    const settings = wx.getStorageSync('settings') || {};
    const apiKey = settings.deepseekApiKey;
    
    if (!apiKey || !apiKey.trim()) {
      reject(new Error('未配置AI API密钥'));
      return;
    }

    // 构建统一的人生圆满度分析提示词
    const prompt = buildLifeFulfillmentPrompt(personalInfo, assets, categoryData, totalAmount, radarData);
    
    // 调用AI API
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
            role: 'system',
            content: '你是一位专业的人生规划师和生活质量评估专家，擅长基于个人资产状况分析人生圆满度、生活稳定性和丰富程度。你会结合中国当前的整体生活水平和社会状况，为用户提供客观、实用的人生状态评估和建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      },
      success: (res) => {
        try {
          const content = res.data.choices[0].message.content;
          const result = parseAnalysisResult(content);
          resolve(result);
        } catch (error) {
          console.error('AI分析结果解析失败:', error);
          reject(error);
        }
      },
      fail: (error) => {
        console.error('AI分析请求失败:', error);
        reject(error);
      }
    });
  });
}

// 格式化数字，添加千分位分隔符
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  const number = Number(num);
  
  // 强制使用英文逗号作为千分位分隔符，覆盖系统默认行为
  // 转换为字符串并分离整数和小数部分
  const parts = Math.round(number).toString().split('.');
  // 使用正则表达式强制添加英文逗号，确保不受系统语言影响
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// 构建人生圆满度分析提示词
function buildLifeFulfillmentPrompt(personalInfo, assets, categoryData, totalAmount, radarData) {
  const age = personalInfo.age || '未知';
  const city = personalInfo.city || '未知';
  const occupation = personalInfo.occupation || '未知';
  
  // 计算资产分布
  const assetDistribution = categoryData.map(item => 
    `${item.name}: ¥${formatNumber(item.value)} (${item.percentage}%)`
  ).join('\n');
  
  // 计算雷达图平均分
  const averageScore = radarData && radarData.length > 0 
    ? Math.round(radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length)
    : 0;

  return `请基于以下信息，对用户的人生圆满度进行全面分析评估：

## 个人基本信息
- 年龄：${age}岁
- 所在城市：${city}
- 职业：${occupation}

## 资产状况
- 总资产：¥${formatNumber(totalAmount)}
- 资产分布：
${assetDistribution}

## 当前评估维度
${radarData && radarData.length > 0 ? radarData.map(item => `- ${item.dimension}：${item.score}分`).join('\n') : '- 暂无评估数据'}

## 分析要求
请结合当前中国的整体生活水平、社会经济状况和不同年龄段的生活标准，对用户的人生状态进行全面评估。

请以JSON格式返回分析结果：
{
  "overallAnalysis": "整体人生圆满度分析（200-300字的详细分析）",
  "radarScores": {
    "栖居归宿": 评分数字(0-100),
    "财富积累": 评分数字(0-100),
    "生活精选": 评分数字(0-100),
    "守护保障": 评分数字(0-100),
    "自由便捷": 评分数字(0-100)
  },
  "lifeFulfillmentLevel": "人生圆满度等级（如：初级、良好、优秀、卓越）",
  "nationalRanking": 全国排名百分位数字(1-100),
  "regionalRanking": 地区排名百分位数字(1-100),
  "stabilityIndex": 生活稳定性指数(0-100),
  "richnessIndex": 生活丰富度指数(0-100),
  "suggestions": [
    "具体的人生改善建议1",
    "具体的人生改善建议2",
    "具体的人生改善建议3"
  ],
  "lifeAnalysis": {
    "lifeDuration": "基于当前资产的可维持生活时长（格式：X.X年 或 XX个月）",
    "dailyBudget": 建议日均生活预算数字,
    "recommendedCities": [
      {
        "name": "推荐城市名",
        "monthlyCost": 月生活成本数字,
        "duration": "可维持时长（格式：X.X年 或 XX个月）",
        "reason": "推荐理由"
      }
    ],
    "lifePlans": [
      {
        "type": "生活方案类型（如：节俭型、舒适型、品质型）",
        "dailyBudget": 日预算数字,
        "duration": "可维持时长（格式：X.X年 或 XX个月）",
        "description": "方案描述"
      }
    ]
  },
  "comparisonWithNational": "与全国平均水平的对比分析（100-150字）",
  "ageGroupComparison": "与同龄人群体的对比分析（100-150字）"
}

## 评估标准说明
1. **栖居归宿**：房产、居住环境、住房保障等
2. **财富积累**：现金、存款、投资理财等流动资产
3. **生活精选**：电子产品、奢侈品、生活品质提升物品等
4. **守护保障**：保险、应急资金、风险防范等
5. **自由便捷**：汽车、交通工具、出行便利性等

请基于中国当前的社会经济水平、不同城市的生活成本、同龄人群的平均资产状况等因素，给出客观、实用的评估和建议。重点关注用户的生活质量、未来保障和人生发展潜力。

## 特别要求
1. **时长格式**：所有时长必须使用标准格式，超过1年的用"X.X年"，不足1年的用"XX个月"
2. **推荐城市**：请推荐5个左右适合的城市，考虑生活成本和生活质量的平衡
3. **自由便捷维度**：请特别关注汽车、车辆、交通工具等资产对出行便利性的影响`;
}

// 解析AI分析结果
function parseAnalysisResult(content) {
  try {
    // 尝试直接解析JSON
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    // 如果直接解析失败，尝试提取JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        return result;
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
      }
    }
    
    // 如果都失败了，返回基础结构
    return {
      overallAnalysis: '分析结果解析失败，请重试',
      radarScores: {
        "栖居归宿": 50,
        "财富积累": 50,
        "生活精选": 50,
        "守护保障": 50,
        "自由便捷": 50
      },
      lifeFulfillmentLevel: '待评估',
      nationalRanking: 50,
      regionalRanking: 50,
      stabilityIndex: 50,
      richnessIndex: 50,
      suggestions: ['请重新进行分析'],
      lifeAnalysis: {
        lifeDuration: '计算中',
        dailyBudget: 0,
        recommendedCities: [],
        lifePlans: []
      },
      comparisonWithNational: '分析结果解析失败',
      ageGroupComparison: '分析结果解析失败'
    };
  }
}

// 生成基础分析（本地备选方案）
function generateBasicLifeAnalysis(params) {
  const { personalInfo, totalAmount, categoryData, radarData } = params;
  const nationalData = require('./national-data');
  
  const age = personalInfo.age || 30;
  const city = personalInfo.city || '北京';
  
  // 使用真实的国家数据计算排名
  const nationalRanking = nationalData.formatPercentile(
    nationalData.calculateNationalRanking(totalAmount, age, city)
  );
  const regionalRanking = nationalData.formatPercentile(
    nationalData.calculateRegionalRanking(totalAmount, city)
  );
  
  // 基于真实数据计算人生圆满度等级
  const ageGroup = nationalData.getAgeGroup(age);
  const expectedAssets = nationalData.NATIONAL_DATA_2024.assetsByAge[ageGroup] * 10000;
  const assetRatio = totalAmount / expectedAssets;
  
  // 计算综合评分
  let baseScore = 50;
  if (assetRatio >= 2.0) baseScore = 90;
  else if (assetRatio >= 1.5) baseScore = 80;
  else if (assetRatio >= 1.2) baseScore = 70;
  else if (assetRatio >= 0.8) baseScore = 60;
  else if (assetRatio >= 0.5) baseScore = 45;
  else baseScore = 30;
  
  // 城市等级调整
  const cityTier = nationalData.getCityTier(city);
  const cityAdjustment = {
    'tier1Cities': 5,
    'tier2Cities': 0,
    'tier3Cities': -3,
    'tier4Cities': -5
  }[cityTier] || 0;
  
  const finalScore = Math.max(20, Math.min(95, baseScore + cityAdjustment));
  
  // 确定人生圆满度等级
  let fulfillmentLevel = '发展中';
  const levels = nationalData.NATIONAL_DATA_2024.fulfillmentLevels;
  if (finalScore >= levels.excellent.min) fulfillmentLevel = levels.excellent.label;
  else if (finalScore >= levels.good.min) fulfillmentLevel = levels.good.label;
  else if (finalScore >= levels.fair.min) fulfillmentLevel = levels.fair.label;
  else if (finalScore >= levels.basic.min) fulfillmentLevel = levels.basic.label;
  
  // 计算真实的雷达图评分（基于实际资产配置）
  const realRadarScores = calculateRealRadarScores(categoryData, totalAmount, nationalData);
  
  // 生成个性化建议
  const suggestions = generatePersonalizedSuggestions(assetRatio, cityTier, age, categoryData);
  
  // 计算躺平生活分析
  const lifeAnalysis = calculateLifeAnalysis(totalAmount, city, nationalData);
  
  // 生成对比分析
  const comparisonTexts = generateComparisonAnalysis(totalAmount, age, city, assetRatio, nationalData);
  
  return {
    overallAnalysis: `基于2024年国家统计数据分析，您的总资产为${(totalAmount/10000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}万元，在${age}岁${city}同龄人中排名前${100-nationalRanking}%。您的人生圆满度等级为"${fulfillmentLevel}"，${assetRatio >= 1.2 ? '资产配置较为合理' : assetRatio >= 0.8 ? '资产状况基本达标' : '仍有较大提升空间'}。建议重点关注${getWeakestDimension(realRadarScores)}维度的改善。`,
    radarScores: realRadarScores,
    lifeFulfillmentLevel: fulfillmentLevel,
    nationalRanking: nationalRanking,
    regionalRanking: regionalRanking,
    stabilityIndex: nationalData.formatPercentile(Math.max(30, finalScore - 5 + (Math.random() - 0.5) * 10)),
    richnessIndex: nationalData.formatPercentile(Math.max(25, finalScore - 10 + (Math.random() - 0.5) * 15)),
    suggestions: suggestions,
    lifeAnalysis: lifeAnalysis,
    comparisonWithNational: comparisonTexts.national,
    ageGroupComparison: comparisonTexts.ageGroup
  };
}

// 计算真实的雷达图评分
function calculateRealRadarScores(categoryData, totalAmount, nationalData) {
  if (totalAmount === 0) {
    return {
      "栖居归宿": 0,
      "财富积累": 0,
      "生活精选": 0,
      "守护保障": 0,
      "自由便捷": 0
    };
  }
  
  const allocation = nationalData.NATIONAL_DATA_2024.assetAllocation;
  const categoryMap = {
    '房产': 'housing',
    '现金': 'wealth',
    '存款': 'wealth',
    '股票': 'wealth',
    '基金': 'wealth',
    '电子产品': 'lifestyle',
    '奢侈品': 'lifestyle',
    '收藏品': 'lifestyle',
    '其他': 'lifestyle',
    '保险': 'protection',
    '汽车': 'mobility',
    '交通工具': 'mobility',
    '车辆': 'mobility',
    '电动车': 'mobility',
    '摩托车': 'mobility',
    '自行车': 'mobility'
  };
  
  // 计算各维度实际占比
  const actualRatios = {
    housing: 0,
    wealth: 0,
    lifestyle: 0,
    protection: 0,
    mobility: 0
  };
  
  categoryData.forEach(item => {
    const dimension = categoryMap[item.name];
    if (dimension) {
      actualRatios[dimension] += item.value / totalAmount;
    }
  });
  
  // 基于实际占比和建议占比计算评分
  const scores = {};
  const dimensionNames = {
    housing: '栖居归宿',
    wealth: '财富积累',
    lifestyle: '生活精选',
    protection: '守护保障',
    mobility: '自由便捷'
  };
  
  Object.keys(actualRatios).forEach(key => {
    const actual = actualRatios[key];
    const optimal = allocation[key].optimal;
    const min = allocation[key].min;
    const max = allocation[key].max;
    
    let score;
    if (actual >= min && actual <= max) {
      // 在合理范围内，越接近最佳比例得分越高
      const deviation = Math.abs(actual - optimal) / optimal;
      score = Math.max(60, 100 - deviation * 40);
    } else if (actual < min) {
      // 低于最低比例
      score = Math.max(10, (actual / min) * 50);
    } else {
      // 高于最高比例
      score = Math.max(40, 100 - (actual - max) * 200);
    }
    
    scores[dimensionNames[key]] = nationalData.formatPercentile(Math.min(100, Math.max(0, score)));
  });
  
  return scores;
}

// 生成个性化建议
function generatePersonalizedSuggestions(assetRatio, cityTier, age, categoryData) {
  const suggestions = [];
  
  if (assetRatio < 0.8) {
    suggestions.push('建议增加储蓄和投资，提升资产总量');
  }
  
  if (age < 35 && assetRatio < 1.0) {
    suggestions.push('年轻阶段应重点积累财富，可适当增加风险投资');
  }
  
  if (cityTier === 'tier1Cities' && assetRatio < 1.5) {
    suggestions.push('一线城市生活成本较高，建议加强资产配置优化');
  }
  
  // 基于资产配置给出建议
  const housingRatio = categoryData.find(item => item.name === '房产')?.value / categoryData.reduce((sum, item) => sum + item.value, 0) || 0;
  if (housingRatio < 0.3) {
    suggestions.push('建议考虑房产投资，提升居住保障');
  } else if (housingRatio > 0.6) {
    suggestions.push('房产占比过高，建议增加流动性资产配置');
  }
  
  const protectionRatio = categoryData.find(item => item.name === '保险')?.value / categoryData.reduce((sum, item) => sum + item.value, 0) || 0;
  if (protectionRatio < 0.02) {
    suggestions.push('建议完善保险保障，降低人生风险');
  }
  
  return suggestions.length > 0 ? suggestions : ['继续保持良好的资产配置，适时调整优化'];
}

// 计算躺平生活分析
function calculateLifeAnalysis(totalAmount, city, nationalData) {
  const livingCosts = nationalData.NATIONAL_DATA_2024.livingCosts;
  const currentCityCost = livingCosts[city] || 5000;
  
  // 计算可维持时长（按70%资产用于生活）
  const availableAssets = totalAmount * 0.7;
  const monthsCanLive = availableAssets / currentCityCost;
  
  let lifeDuration;
  if (monthsCanLive >= 12) {
    lifeDuration = `${(monthsCanLive / 12).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}年`;
  } else {
    lifeDuration = `${Math.round(monthsCanLive)}个月`;
  }
  
  // 推荐5个性价比高的城市
  const cityRecommendations = Object.entries(livingCosts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([cityName, cost]) => {
      const months = availableAssets / cost;
      const duration = months >= 12 ? `${(months / 12).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}年` : `${Math.round(months)}个月`;
      return {
        name: cityName,
        monthlyCost: cost,
        duration: duration,
        reason: getCityRecommendationReason(cityName)
      };
    });
  
  // 生活方案
  const lifePlans = [
    {
      type: '节俭型',
      dailyBudget: Math.round(currentCityCost * 0.6 / 30),
      duration: monthsCanLive >= 12 ? `${(monthsCanLive * 1.4 / 12).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}年` : `${Math.round(monthsCanLive * 1.4)}个月`,
      description: '基础生活保障，注重节约'
    },
    {
      type: '舒适型',
      dailyBudget: Math.round(currentCityCost / 30),
      duration: lifeDuration,
      description: '适度消费，生活品质较好'
    },
    {
      type: '品质型',
      dailyBudget: Math.round(currentCityCost * 1.5 / 30),
      duration: monthsCanLive >= 12 ? `${(monthsCanLive * 0.67 / 12).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}年` : `${Math.round(monthsCanLive * 0.67)}个月`,
      description: '高品质生活，注重体验'
    }
  ];
  
  return {
    lifeDuration: lifeDuration,
    dailyBudget: Math.round(currentCityCost / 30),
    recommendedCities: cityRecommendations,
    lifePlans: lifePlans
  };
}

// 获取城市推荐理由
function getCityRecommendationReason(cityName) {
  const reasons = {
    '哈尔滨': '东北明珠，冰雪文化浓厚',
    '昆明': '四季如春，气候宜人',
    '西安': '历史文化名城，消费水平较低',
    '长沙': '美食之都，生活节奏适中',
    '重庆': '山城魅力，火锅文化',
    '郑州': '交通枢纽，发展潜力大',
    '沈阳': '东北重镇，工业基础雄厚',
    '成都': '生活成本适中，文化氛围浓厚',
    '武汉': '九省通衢，教育资源丰富',
    '青岛': '海滨城市，环境宜居'
  };
  return reasons[cityName] || '生活成本相对较低，适合长期居住';
}

// 生成对比分析
function generateComparisonAnalysis(totalAssets, age, city, assetRatio, nationalData) {
  const ageGroup = nationalData.getAgeGroup(age);
  const expectedAssets = nationalData.NATIONAL_DATA_2024.assetsByAge[ageGroup] * 10000;
  const cityTier = nationalData.getCityTier(city);
  const cityAverage = nationalData.NATIONAL_DATA_2024.averageAssets[cityTier] * 10000;
  
  const national = assetRatio >= 1.2 
    ? `您的资产水平超过全国同龄人平均水平${((assetRatio - 1) * 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%，处于较好状态。建议继续保持并优化资产配置结构。`
    : assetRatio >= 0.8
    ? `您的资产水平接近全国同龄人平均水平，还有${((1 - assetRatio) * expectedAssets / 10000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}万元的提升空间。`
    : `您的资产水平低于全国同龄人平均水平，建议加强储蓄和投资，目标提升${((1.2 - assetRatio) * expectedAssets / 10000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}万元。`;
  
  const cityRatio = totalAssets / cityAverage;
  const ageGroup_text = `与${city}同龄人相比，您的资产水平${cityRatio >= 1.1 ? '处于领先地位' : cityRatio >= 0.9 ? '基本持平' : '仍有提升空间'}，${cityRatio >= 1.0 ? '继续保持优势' : '建议重点关注财富积累'}。`;
  
  return {
    national: national,
    ageGroup: ageGroup_text
  };
}

// 获取最薄弱的维度
function getWeakestDimension(radarScores) {
  let minScore = 100;
  let weakestDimension = '';
  
  Object.entries(radarScores).forEach(([dimension, score]) => {
    if (score < minScore) {
      minScore = score;
      weakestDimension = dimension;
    }
  });
  
  return weakestDimension;
}

module.exports = {
  analyzeLifeFulfillment,
  generateBasicLifeAnalysis
};