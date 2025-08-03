// AI分析工具函数
import { AssetCategory } from '@/types/asset';

export interface AnalysisResult {
  name: string;
  category: AssetCategory;
  amount: number;
  remark?: string;
}

// 智能分析文本内容
export function analyzeTextWithAI(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  
  // 提取金额 - 支持多种格式
  const amountPatterns = [
    /¥\s*[\d,]+\.?\d*/g,           // ¥1,234.56
    /￥\s*[\d,]+\.?\d*/g,           // ￥1,234.56
    /\$\s*[\d,]+\.?\d*/g,          // $1,234.56
    /[\d,]+\.?\d*\s*元/g,          // 1,234.56元
    /[\d,]+\.?\d*\s*万/g,          // 12.34万
    /[\d,]+\.?\d*/g,               // 1,234.56
  ];
  
  let amounts: number[] = [];
  
  amountPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        let numStr = match.replace(/[¥￥$元,]/g, '');
        if (match.includes('万')) {
          numStr = numStr.replace('万', '');
          const num = parseFloat(numStr) * 10000;
          if (!isNaN(num) && num > 0) amounts.push(num);
        } else {
          const num = parseFloat(numStr);
          if (!isNaN(num) && num > 0) amounts.push(num);
        }
      });
    }
  });
  
  const amount = amounts.length > 0 ? Math.max(...amounts) : 0;
  
  // 智能分析类别和名称
  const categoryAnalysis = analyzeCategoryAndName(text, lowerText);
  
  return {
    name: categoryAnalysis.name,
    category: categoryAnalysis.category,
    amount,
    remark: `智能识别：${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`
  };
}

// 分析类别和名称
function analyzeCategoryAndName(originalText: string, lowerText: string): {
  category: AssetCategory;
  name: string;
} {
  // 商品描述智能提取
  const productKeywords = {
    '瑜伽垫': ['瑜伽垫', '瑜伽', '健身垫', '运动垫'],
    '手机': ['手机', 'iphone', 'android', '华为', '小米', '苹果'],
    '电脑': ['电脑', '笔记本', 'macbook', '联想', '戴尔'],
    '衣服': ['衣服', '上衣', '裤子', '裙子', '外套', 'T恤'],
    '鞋子': ['鞋子', '运动鞋', '皮鞋', '靴子', '凉鞋'],
    '化妆品': ['化妆品', '口红', '粉底', '面膜', '护肤'],
    '食品': ['食品', '零食', '饮料', '水果', '蔬菜'],
    '书籍': ['书籍', '图书', '小说', '教材', '杂志'],
  };
  
  // 检查是否为商品描述
  for (const [productName, keywords] of Object.entries(productKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return { category: '其他', name: productName };
    }
  }
  
  // 银行相关
  if (lowerText.includes('银行') || lowerText.includes('存款') || lowerText.includes('储蓄')) {
    const bankNames = ['工商银行', '建设银行', '农业银行', '中国银行', '招商银行', '交通银行', '浦发银行', '民生银行', '兴业银行', '平安银行'];
    const foundBank = bankNames.find(bank => originalText.includes(bank));
    return {
      category: '存款',
      name: foundBank ? `${foundBank}存款` : '银行存款'
    };
  }
  
  // 支付宝相关
  if (lowerText.includes('支付宝') || lowerText.includes('余额宝') || lowerText.includes('alipay')) {
    if (lowerText.includes('余额宝')) {
      return { category: '基金', name: '余额宝' };
    }
    return { category: '现金', name: '支付宝余额' };
  }
  
  // 微信相关
  if (lowerText.includes('微信') || lowerText.includes('零钱') || lowerText.includes('wechat')) {
    if (lowerText.includes('理财通')) {
      return { category: '基金', name: '微信理财通' };
    }
    return { category: '现金', name: '微信零钱' };
  }
  
  // 股票相关
  if (lowerText.includes('股票') || lowerText.includes('证券') || lowerText.includes('沪深') || lowerText.includes('上证') || lowerText.includes('深证')) {
    return { category: '股票', name: '股票投资' };
  }
  
  // 基金相关
  if (lowerText.includes('基金') || lowerText.includes('理财') || lowerText.includes('投资')) {
    return { category: '基金', name: '基金投资' };
  }
  
  // 房产相关
  if (lowerText.includes('房') || lowerText.includes('房产') || lowerText.includes('房屋') || lowerText.includes('住宅')) {
    return { category: '房产', name: '房产' };
  }
  
  // 车辆相关
  if (lowerText.includes('车') || lowerText.includes('汽车') || lowerText.includes('车辆')) {
    return { category: '车辆', name: '汽车' };
  }
  
  // 电商平台
  if (lowerText.includes('淘宝') || lowerText.includes('天猫') || lowerText.includes('京东') || lowerText.includes('拼多多')) {
    return { category: '其他', name: '电商订单' };
  }
  
  // 尝试从文本中提取简化的商品名称
  const words = originalText.split(/[\s\n\r\t，。；：！？【】（）()]+/).filter(word => word.length > 0);
  if (words.length > 0) {
    // 找到最可能是商品名称的词
    const possibleNames = words.filter(word => 
      word.length >= 2 && 
      word.length <= 10 && 
      !word.match(/^\d+$/) && // 不是纯数字
      !word.match(/^[¥￥$]+/) // 不是价格符号
    );
    
    if (possibleNames.length > 0) {
      return { category: '其他', name: possibleNames[0] };
    }
  }
  
  // 默认情况
  return { category: '其他', name: '未知资产' };
}