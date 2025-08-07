// AI排名分析工具
const app = getApp();

// 基于统计数据的排名分析
function calculateStatisticalRanking(params) {
  const { personalInfo, totalAssets, averageScore, categoryCount } = params;
  
  let age = personalInfo.age;
  if (!age && personalInfo.birthDate) {
    const birthYear = new Date(personalInfo.birthDate).getFullYear();
    age = new Date().getFullYear() - birthYear;
  }
  
  // 基于年龄和资产的基础排名计算
  const getAssetPercentile = (assets, userAge) => {
    // 根据年龄段的资产中位数进行排名计算
    const ageGroups = {
      '20-30': { median: 50000, p75: 150000, p90: 300000 },
      '30-40': { median: 200000, p75: 500000, p90: 1000000 },
      '40-50': { median: 500000, p75: 1200000, p90: 2500000 },
      '50+': { median: 800000, p75: 2000000, p90: 4000000 }
    };
    
    let ageGroup = '20-30';
    if (userAge >= 50) ageGroup = '50+';
    else if (userAge >= 40) ageGroup = '40-50';
    else if (userAge >= 30) ageGroup = '30-40';
    
    const benchmarks = ageGroups[ageGroup];
    
    if (assets >= benchmarks.p90) return 90;
    if (assets >= benchmarks.p75) return 75;
    if (assets >= benchmarks.median) return 50;
    if (assets >= benchmarks.median * 0.5) return 25;
    return 10;
  };
  
  // 基于综合评分调整排名
  const getScoreAdjustment = (score) => {
    if (score >= 90) return -10; // 优秀，排名提升
    if (score >= 80) return -5;  // 良好，排名略微提升
    if (score >= 70) return 0;   // 中等，无调整
    if (score >= 60) return 5;   // 一般，排名略微下降
    return 10; // 较差，排名下降
  };
  
  const basePercentile = getAssetPercentile(totalAssets, age || 30);
  const scoreAdjustment = getScoreAdjustment(averageScore);
  
  // 地区、全国排名计算
  const regional = Math.max(1, Math.min(99, Math.round(basePercentile + scoreAdjustment - 5))); // 地区排名通常更好
  const national = Math.max(1, Math.min(99, Math.round(basePercentile + scoreAdjustment)));
  
  const analysis = generateRankingAnalysis(regional, national, averageScore, categoryCount);
  
  return {
    regional,
    national,
    analysis
  };
}

// 生成排名分析文本
function generateRankingAnalysis(regional, national, score, categoryCount) {
  let analysis = `## 🏆 段位排名分析\n\n`;
  
  // 排名描述
  analysis += `### 📊 排名情况\n`;
  analysis += `- **地区排名**: 超越了 ${regional}% 的同地区用户\n`;
  analysis += `- **全国排名**: 超越了 ${national}% 的全国用户\n\n`;
  
  // 综合评价
  analysis += `### 💎 综合评价\n`;
  if (score >= 90) {
    analysis += `您的理财水平已达到**钻石级别**，在同龄人中表现卓越！资产配置非常均衡，风险控制能力强。\n\n`;
  } else if (score >= 80) {
    analysis += `您的理财水平达到**黄金级别**，在同龄人中表现优秀！继续保持并优化投资策略。\n\n`;
  } else if (score >= 70) {
    analysis += `您的理财水平达到**白银级别**，有良好的理财基础，可以考虑更多元化的投资。\n\n`;
  } else if (score >= 60) {
    analysis += `您的理财水平达到**青铜级别**，正在学习理财知识，建议多关注投资教育。\n\n`;
  } else {
    analysis += `您刚开始理财之路，建议从基础的储蓄和稳健投资开始。\n\n`;
  }
  
  // 优势分析
  analysis += `### ✨ 优势分析\n`;
  if (categoryCount >= 5) {
    analysis += `- **多元化配置**: 您的资产类别丰富，分散投资做得很好\n`;
  }
  if (regional >= 70) {
    analysis += `- **地区领先**: 在当地同龄人中表现突出\n`;
  }
  if (score >= 75) {
    analysis += `- **综合实力**: 各项理财指标均衡发展\n`;
  }
  analysis += `\n`;
  
  // 改进建议
  analysis += `### 🎯 提升建议\n`;
  if (categoryCount < 4) {
    analysis += `- **增加多元化**: 建议增加投资类别，降低单一风险\n`;
  }
  if (score < 80) {
    analysis += `- **优化配置**: 可以适当增加成长性资产比例\n`;
  }
  if (regional < 60) {
    analysis += `- **学习提升**: 建议多学习理财知识，关注市场动态\n`;
  }
  analysis += `- **定期调整**: 根据市场变化和个人情况调整资产配置\n`;
  
  return analysis;
}

// 使用DeepSeek AI进行排名分析
async function analyzeRankingWithAI(params, apiKey) {
  const { personalInfo, totalAssets, averageScore, categoryCount, radarData } = params;
  
  // 构建AI分析提示
  const prompt = `作为专业的理财顾问，请基于以下用户信息进行段位排名分析：

**用户基本信息：**
- 年龄：${personalInfo.age || '未知'}岁
- 职业：${personalInfo.job || '未知'}
- 所在城市：${personalInfo.location || '未知'}

**资产状况：**
- 资产总值：${totalAssets.toLocaleString()}元
- 综合评分：${averageScore.toFixed(1)}分
- 资产类别数：${categoryCount}个

**各维度得分：**
${radarData.map(item => `- ${item.dimension}：${item.score.toFixed(1)}分`).join('\n')}

请提供：
1. 基于真实统计数据的地区和全国排名估算（百分位）
2. 详细的段位分析和评价
3. 针对性的改进建议
4. 与同龄人的对比分析

请用markdown格式回复，包含表格和结构化内容。`;

  try {
    const response = await new Promise((resolve, reject) => {
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
              content: '你是一位专业的理财顾问和数据分析师，擅长基于统计数据进行排名分析和理财建议。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        timeout: 10 * 60 * 1000,
        success: resolve,
        fail: reject
      });
    });

    if (response.statusCode === 200 && response.data.choices && response.data.choices.length > 0) {
      const aiAnalysis = response.data.choices[0].message.content;
      
      // 尝试从AI回复中提取排名数据
      const regionalMatch = aiAnalysis.match(/地区.*?(\d+)%/);
      const nationalMatch = aiAnalysis.match(/全国.*?(\d+)%/);
      
      return {
        regional: regionalMatch ? parseInt(regionalMatch[1]) : null,
        national: nationalMatch ? parseInt(nationalMatch[1]) : null,
        analysis: aiAnalysis
      };
    } else {
      throw new Error('AI API响应异常');
    }
  } catch (error) {
    console.error('AI排名分析失败:', error);
    // 降级到统计数据分析
    return calculateStatisticalRanking(params);
  }
}

// 主要的排名分析函数
async function analyzeRanking(params) {
  const settings = app.getSettings();
  const apiKey = settings.deepseekApiKey;
  
  if (apiKey) {
    // 使用AI分析
    return await analyzeRankingWithAI(params, apiKey);
  } else {
    // 使用统计数据分析
    return calculateStatisticalRanking(params);
  }
}

module.exports = {
  analyzeRanking,
  calculateStatisticalRanking,
  generateRankingAnalysis
};