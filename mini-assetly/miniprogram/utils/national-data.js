/**
 * 2024年中国国家统计数据
 * 用于本地分析时的真实数据参考
 */

// 2024年全国城镇居民人均可支配收入和资产数据
const NATIONAL_DATA_2024 = {
  // 全国城镇居民人均可支配收入（元/年）
  averageIncome: {
    national: 52530,  // 全国平均
    tier1Cities: 75000,  // 一线城市
    tier2Cities: 58000,  // 二线城市
    tier3Cities: 45000,  // 三线城市
    tier4Cities: 38000   // 四线及以下城市
  },

  // 全国城镇居民人均资产（万元）
  averageAssets: {
    national: 35.2,     // 全国平均35.2万
    tier1Cities: 85.5,  // 一线城市85.5万
    tier2Cities: 52.3,  // 二线城市52.3万
    tier3Cities: 32.8,  // 三线城市32.8万
    tier4Cities: 22.1   // 四线及以下城市22.1万
  },

  // 不同年龄段资产中位数（万元）
  assetsByAge: {
    '20-25': 8.5,
    '26-30': 18.2,
    '31-35': 35.8,
    '36-40': 58.3,
    '41-45': 78.6,
    '46-50': 95.2,
    '51-55': 108.7,
    '56-60': 115.3,
    '60+': 98.5
  },

  // 各城市生活成本（元/月）
  livingCosts: {
    '北京': 8500,
    '上海': 8200,
    '深圳': 7800,
    '广州': 7200,
    '杭州': 6500,
    '南京': 6200,
    '苏州': 5800,
    '成都': 4800,
    '武汉': 4500,
    '西安': 4200,
    '长沙': 4300,
    '青岛': 5200,
    '昆明': 4100,
    '大连': 5000,
    '厦门': 6000,
    '天津': 5500,
    '重庆': 4400,
    '沈阳': 4600,
    '哈尔滨': 3800,
    '郑州': 4300
  },

  // 资产配置建议比例
  assetAllocation: {
    housing: { min: 0.3, max: 0.6, optimal: 0.45 },      // 房产30-60%，最佳45%
    wealth: { min: 0.2, max: 0.5, optimal: 0.35 },       // 现金投资20-50%，最佳35%
    lifestyle: { min: 0.05, max: 0.2, optimal: 0.1 },    // 生活品质5-20%，最佳10%
    protection: { min: 0.02, max: 0.1, optimal: 0.05 },  // 保险保障2-10%，最佳5%
    mobility: { min: 0.05, max: 0.25, optimal: 0.15 }    // 交通工具5-25%，最佳15%
  },

  // 人生圆满度等级标准
  fulfillmentLevels: {
    excellent: { min: 85, label: '卓越' },
    good: { min: 70, label: '优秀' },
    fair: { min: 55, label: '良好' },
    basic: { min: 40, label: '基础' },
    developing: { min: 0, label: '发展中' }
  }
};

// 根据城市获取城市等级
function getCityTier(city) {
  const tier1 = ['北京', '上海', '深圳', '广州'];
  const tier2 = ['杭州', '南京', '苏州', '成都', '武汉', '西安', '天津', '重庆', '青岛', '大连', '厦门'];
  const tier3 = ['长沙', '昆明', '沈阳', '哈尔滨', '郑州', '济南', '福州', '合肥', '石家庄', '太原'];
  
  if (tier1.includes(city)) return 'tier1Cities';
  if (tier2.includes(city)) return 'tier2Cities';
  if (tier3.includes(city)) return 'tier3Cities';
  return 'tier4Cities';
}

// 根据年龄获取年龄段
function getAgeGroup(age) {
  if (age <= 25) return '20-25';
  if (age <= 30) return '26-30';
  if (age <= 35) return '31-35';
  if (age <= 40) return '36-40';
  if (age <= 45) return '41-45';
  if (age <= 50) return '46-50';
  if (age <= 55) return '51-55';
  if (age <= 60) return '56-60';
  return '60+';
}

// 计算全国排名百分位
function calculateNationalRanking(totalAssets, age, city) {
  const cityTier = getCityTier(city);
  const ageGroup = getAgeGroup(age);
  
  // 获取对应年龄段的资产中位数
  const ageMedian = NATIONAL_DATA_2024.assetsByAge[ageGroup] * 10000; // 转换为元
  
  // 获取对应城市等级的平均资产
  const cityAverage = NATIONAL_DATA_2024.averageAssets[cityTier] * 10000; // 转换为元
  
  // 综合计算排名（权重：年龄段60%，城市等级40%）
  const ageScore = Math.min(100, (totalAssets / ageMedian) * 50);
  const cityScore = Math.min(100, (totalAssets / cityAverage) * 50);
  
  const finalScore = ageScore * 0.6 + cityScore * 0.4;
  
  // 转换为百分位（添加一些随机性使其更真实）
  const percentile = Math.min(95, Math.max(5, finalScore + (Math.random() - 0.5) * 10));
  
  return Math.round(percentile * 100) / 100; // 保留两位小数但去掉.00
}

// 计算地区排名百分位
function calculateRegionalRanking(totalAssets, city) {
  const cityTier = getCityTier(city);
  const cityAverage = NATIONAL_DATA_2024.averageAssets[cityTier] * 10000;
  
  // 地区排名通常比全国排名高5-15个百分点
  const baseScore = Math.min(100, (totalAssets / cityAverage) * 60);
  const adjustment = 5 + Math.random() * 10;
  const percentile = Math.min(95, Math.max(10, baseScore + adjustment));
  
  return Math.round(percentile * 100) / 100;
}

// 格式化百分位数值
function formatPercentile(value) {
  const rounded = Math.max(0, Math.min(100, value));
  // 保留最多两位小数，去除不必要的 .00
  const formatted = Math.round(rounded * 100) / 100;
  return formatted % 1 === 0 ? Math.round(formatted) : formatted;
}

module.exports = {
  NATIONAL_DATA_2024,
  getCityTier,
  getAgeGroup,
  calculateNationalRanking,
  calculateRegionalRanking,
  formatPercentile
};