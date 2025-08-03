import { AnalysisResult } from './ai-analysis';

/**
 * 使用 DeepSeek AI 分析 OCR 文本并提取关键信息
 * @param text OCR 识别的文本
 * @param apiKey DeepSeek AI API 密钥
 * @returns 分析结果，包含名称、类别、金额和备注
 */
export async function analyzeWithDeepSeekAI(text: string, apiKey: string): Promise<AnalysisResult> {
  if (!text) {
    throw new Error('没有提供文本进行分析');
  }

  if (!apiKey) {
    throw new Error('DeepSeek AI API 密钥未配置');
  }

  try {
    // 构建 prompt
    const prompt = `
    你是一个专业的资产管理助手，请从以下OCR识别的文本中提取关键信息。文本可能是商品描述、收据、账单或交易记录。

    文本内容：
    ${text}
    
    请按照以下规则提取信息：
    
    1. **资产名称**：
       - 如果是商品描述，提取核心商品名称并简化（如"仙安粉 瑜伽垫健身垫女士减震静音加厚家用2025新款专业防滑加宽运动垫子" → "瑜伽垫"）
       - 如果是银行/金融机构，提取机构名称（如"招商银行" → "招商银行存款"）
       - 如果是商家名称，直接使用商家名称
       - 优先提取最核心、最简洁的名称
    
    2. **类别**：请从以下类别中选择最合适的一个
       - 现金：现金、零钱、钱包等
       - 存款：银行存款、定期存款等
       - 股票：股票投资、证券等
       - 基金：基金投资、理财产品等
       - 房产：房屋、房产、不动产等
       - 车辆：汽车、车辆等
       - 其他：其他类型资产、商品购买等
    
    3. **金额**：
       - 提取文本中的价格数字（支持¥、￥、$、元、万等格式）
       - 如果有多个金额，选择最主要的金额
       - 如果没有明确金额，返回0
    
    4. **备注**：
       - 包含重要的补充信息，如规格、型号、日期等
       - 保持简洁，不超过50字
    
    请以JSON格式返回结果，确保返回有效的JSON：
    {
      "name": "简化后的资产名称",
      "category": "资产类别",
      "amount": 数字金额,
      "remark": "重要补充信息"
    }
    
    示例：
    输入："仙女粉 61*185cm【赠*捆绑带】秒杀款；10mm（初学者）；仙安粉 瑜伽垫健身垫女士减震静音加厚家用2025新款专业防滑加宽运动垫子"
    输出：{"name": "瑜伽垫", "category": "其他", "amount": 0, "remark": "61*185cm，10mm厚度，初学者款"}
    `;

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API 请求失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 从 AI 响应中提取 JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从 AI 响应中提取 JSON 结果');
    }

    const result = JSON.parse(jsonMatch[0]) as AnalysisResult;
    
    // 确保所有字段都存在
    return {
      name: result.name || '',
      category: result.category || '',
      amount: result.amount ? Number(result.amount) : 0,
      remark: result.remark || '',
    };
  } catch (error) {
    console.error('DeepSeek AI 分析失败:', error);
    throw error;
  }
}