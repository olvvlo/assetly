/**
 * AI分析工具 - 使用DeepSeek API进行个人资产分析
 */

/**
 * 使用DeepSeek API进行个人资产总结分析
 * @param {Object} params 分析参数
 * @param {Array} params.assets 资产列表
 * @param {Object} params.categoryData 分类数据
 * @param {number} params.totalAmount 总资产
 * @param {Object} params.personalInfo 个人信息
 * @param {string} apiKey DeepSeek API密钥
 * @returns {Promise<string>} 分析结果
 */
async function analyzeWithDeepSeekAI(params, apiKey) {
  const { assets, categoryData, totalAmount, personalInfo } = params;

  if (!apiKey) {
    throw new Error("DeepSeek API密钥未配置");
  }

  if (!assets || assets.length === 0) {
    return "暂无资产数据，无法进行分析。请先添加一些资产信息。";
  }

  try {
    // 构建分析数据
    const analysisData = {
      totalAssets: assets.length,
      totalAmount: totalAmount,
      categories: categoryData.map((item) => ({
        name: item.name,
        value: item.value,
        percentage: ((item.value / totalAmount) * 100).toFixed(1),
      })),
      personalInfo: {
        age: personalInfo.age || calculateAge(personalInfo.birthday),
        education: personalInfo.education || "未填写",
        familyStatus: personalInfo.familyStatus || "未填写",
        job: personalInfo.job || "未填写",
        location: personalInfo.location || "未填写",
      },
      assetDetails: assets.map((asset) => ({
        name: asset.name,
        category: asset.category,
        amount: asset.amount,
        remark: asset.remark || "",
      })),
    };

    // 构建prompt
    const prompt = `
你是一位专业的个人财务分析师，请基于以下用户的资产数据进行深度分析，并提供专业的财务建议。

用户基本信息：
- 年龄：${analysisData.personalInfo.age}岁
- 学历：${analysisData.personalInfo.education}
- 家庭状况：${analysisData.personalInfo.familyStatus}
- 职业：${analysisData.personalInfo.job}
- 所在地区：${analysisData.personalInfo.location}

资产概况：
- 资产总数：${analysisData.totalAssets}项
- 资产总值：¥${analysisData.totalAmount.toLocaleString()}

资产分布：
${analysisData.categories
  .map(
    (cat) =>
      `- ${cat.name}：¥${cat.value.toLocaleString()} (${cat.percentage}%)`
  )
  .join("\n")}

具体资产明细：
${analysisData.assetDetails
  .map(
    (asset) =>
      `- ${asset.name} (${asset.category})：¥${asset.amount.toLocaleString()}${
        asset.remark ? " - " + asset.remark : ""
      }`
  )
  .join("\n")}

请从以下几个维度进行专业分析：

1. **资产结构分析**：分析当前资产配置的合理性，包括流动性、风险分散等
2. **财务健康度评估**：基于年龄、收入水平等因素评估财务状况
3. **风险评估**：识别当前资产配置中的潜在风险
4. **优化建议**：针对用户情况提供具体的资产配置优化建议
5. **未来规划**：基于用户年龄和现状，提供中长期财务规划建议

请用专业但易懂的语言，提供一份800-1200字的详细分析报告。报告要有条理性，包含具体的数据分析和实用的建议。
`;

    // 调用DeepSeek API
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: "https://api.deepseek.com/v1/chat/completions",
        method: "POST",
        header: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        timeout: 10 * 60 * 1000,
        success: resolve,
        fail: reject,
      });
    });

    if (response.statusCode !== 200) {
      throw new Error(`DeepSeek API请求失败: ${response.statusCode}`);
    }

    const aiResponse = response.data.choices[0].message.content;
    return aiResponse;
  } catch (error) {
    console.error("DeepSeek AI分析失败:", error);
    throw error;
  }
}

/**
 * 计算年龄
 * @param {string} birthday 生日字符串
 * @returns {number} 年龄
 */
function calculateAge(birthday) {
  if (!birthday) return 30; // 默认年龄

  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * 生成基础分析（不使用AI的情况下）
 * @param {Object} params 分析参数
 * @returns {string} 基础分析结果
 */
function generateBasicAnalysis(params) {
  const { assets, categoryData, totalAmount, personalInfo } = params;

  let analysis = `基于您的 ${assets.length} 项资产数据分析：\n\n`;

  // 资产规模分析
  if (totalAmount >= 1000000) {
    analysis += "💎 资产规模：您的资产规模已达到百万级别，财务状况良好。\n\n";
  } else if (totalAmount >= 500000) {
    analysis +=
      "💰 资产规模：您已积累了可观的资产，继续保持良好的理财习惯。\n\n";
  } else if (totalAmount >= 100000) {
    analysis += "📈 资产规模：您的资产正在稳步增长，建议继续优化配置。\n\n";
  } else {
    analysis +=
      "🌱 资产规模：您正处于财富积累的起步阶段，建议制定合理的理财计划。\n\n";
  }

  // 资产分布分析
  analysis += "📊 资产分布分析：\n";
  categoryData.forEach((item) => {
    const percentage = ((item.value / totalAmount) * 100).toFixed(1);
    analysis += `• ${
      item.name
    }：¥${item.value.toLocaleString()} (${percentage}%)\n`;
  });

  // 简单建议
  analysis += "\n💡 基础建议：\n";
  analysis += "• 保持资产多样化，降低投资风险\n";
  analysis += "• 定期评估和调整资产配置\n";
  analysis += "• 建立应急资金，确保财务安全\n";

  return analysis;
}

module.exports = {
  analyzeWithDeepSeekAI,
  generateBasicAnalysis,
};
