import { AssetCategory } from '@/types/asset';

interface ValueEstimationParams {
  name: string;
  category: AssetCategory;
  originalPrice: number;
  purchaseDate: string;
  remark?: string;
}

interface ValueEstimationResult {
  estimatedValue: number;
  depreciationRate: number;
  reasoning: string;
}

// 不同类别的默认折旧率（年化）
const DEFAULT_DEPRECIATION_RATES = {
  '房产': 0.02, // 房产通常保值或升值，设置较低折旧率
  '车辆': 0.15, // 汽车折旧较快
  '基金': 0.05, // 基金波动，设置保守折旧率
  '股票': 0.08, // 股票风险较高
  '其他': 0.10, // 其他物品一般折旧率
  '现金': 0, // 现金不折旧
  '存款': 0, // 存款不折旧
};

// 计算年份差
function getYearsDifference(purchaseDate: string): number {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - purchase.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return diffYears;
}

// 基于规则的残值估算
function calculateDepreciatedValue(
  originalPrice: number,
  category: AssetCategory,
  years: number,
  name: string,
  remark?: string
): ValueEstimationResult {
  // 现金和存款不折旧
  if (category === '现金' || category === '存款') {
    return {
      estimatedValue: originalPrice,
      depreciationRate: 0,
      reasoning: '现金和存款类资产不存在折旧'
    };
  }

  let depreciationRate = DEFAULT_DEPRECIATION_RATES[category];
  let reasoning = `基于${category}类别的标准折旧率`;

  // 根据名称和备注调整折旧率
  const nameAndRemark = `${name} ${remark || ''}`.toLowerCase();

  // 特殊物品调整
  if (category === '车辆') {
    if (nameAndRemark.includes('豪华') || nameAndRemark.includes('奔驰') || nameAndRemark.includes('宝马') || nameAndRemark.includes('奥迪')) {
      depreciationRate = 0.12; // 豪华车保值性稍好
      reasoning += '，豪华品牌车辆保值性较好';
    } else if (nameAndRemark.includes('二手') || nameAndRemark.includes('旧')) {
      depreciationRate = 0.20; // 二手车折旧更快
      reasoning += '，二手车辆折旧较快';
    }
  } else if (category === '房产') {
    if (nameAndRemark.includes('一线城市') || nameAndRemark.includes('核心地段')) {
      depreciationRate = -0.02; // 可能升值
      reasoning += '，核心地段房产可能升值';
    } else if (nameAndRemark.includes('老旧') || nameAndRemark.includes('偏远')) {
      depreciationRate = 0.05; // 折旧较快
      reasoning += '，老旧或偏远房产折旧较快';
    }
  } else if (category === '其他') {
    if (nameAndRemark.includes('电子') || nameAndRemark.includes('手机') || nameAndRemark.includes('电脑')) {
      depreciationRate = 0.25; // 电子产品折旧很快
      reasoning += '，电子产品折旧较快';
    } else if (nameAndRemark.includes('奢侈品') || nameAndRemark.includes('收藏') || nameAndRemark.includes('古董')) {
      depreciationRate = 0.02; // 奢侈品和收藏品保值性好
      reasoning += '，奢侈品或收藏品保值性较好';
    }
  }

  // 计算残值
  const totalDepreciation = Math.min(depreciationRate * years, 0.8); // 最大折旧80%
  const estimatedValue = Math.max(originalPrice * (1 - totalDepreciation), originalPrice * 0.1); // 最低保留10%价值

  return {
    estimatedValue: Math.round(estimatedValue),
    depreciationRate: totalDepreciation,
    reasoning: `${reasoning}，${years.toFixed(1)}年折旧${(totalDepreciation * 100).toFixed(1)}%`
  };
}

// 使用DeepSeek AI进行更精确的残值估算
async function estimateValueWithAI(params: ValueEstimationParams): Promise<ValueEstimationResult> {
  try {
    // 获取DeepSeek API密钥
    const settings = await browser.storage.local.get(['systemSettings']);
    const systemSettings = settings.systemSettings || settings['local:systemSettings'];
    
    if (!systemSettings?.deepseekApiKey) {
      console.log('未配置DeepSeek API密钥，使用基于规则的估算');
      const years = getYearsDifference(params.purchaseDate);
      return calculateDepreciatedValue(
        params.originalPrice,
        params.category,
        years,
        params.name,
        params.remark
      );
    }

    const years = getYearsDifference(params.purchaseDate);
    
    const prompt = `你是一个专业的资产评估师。请根据以下信息估算资产的当前市场价值：

资产信息：
- 名称：${params.name}
- 类别：${params.category}
- 购买价格：¥${params.originalPrice.toLocaleString()}
- 购买日期：${params.purchaseDate}
- 使用年限：${years.toFixed(1)}年
- 备注：${params.remark || '无'}

请考虑以下因素：
1. 该类别资产的一般折旧规律
2. 市场行情变化
3. 品牌和型号的保值性
4. 使用年限和磨损程度
5. 当前市场供需情况

请以JSON格式返回评估结果：
{
  "estimatedValue": 当前估值（数字），
  "depreciationRate": 总折旧率（0-1之间的小数），
  "reasoning": "详细的评估理由"
}

注意：
- 现金和存款类资产不折旧，保持原值
- 房产可能升值或贬值，需考虑地段和市场
- 车辆、电子产品等消费品通常折旧较快
- 奢侈品、收藏品可能保值或升值`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${systemSettings.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('DeepSeek API返回内容为空');
    }

    // 解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析DeepSeek API返回的JSON');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      estimatedValue: Math.round(result.estimatedValue),
      depreciationRate: result.depreciationRate,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error('AI残值估算失败，使用基于规则的估算:', error);
    const years = getYearsDifference(params.purchaseDate);
    return calculateDepreciatedValue(
      params.originalPrice,
      params.category,
      years,
      params.name,
      params.remark
    );
  }
}

export { estimateValueWithAI, calculateDepreciatedValue, getYearsDifference };
export type { ValueEstimationParams, ValueEstimationResult };