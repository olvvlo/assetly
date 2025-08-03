export interface AssetItem {
  id: string;
  name: string;
  category: '现金' | '存款' | '房产' | '车辆' | '基金' | '股票' | '其他';
  amount: number; // 购买价格
  currentValue?: number; // 当前残值（AI预估）
  purchaseDate?: string; // 购买日期（非现金、存款类目需要）
  remark?: string;
  createdAt: string; // ISO 格式时间戳
}

export type AssetCategory = AssetItem['category'];

export interface AssetSummary {
  totalAmount: number; // 按残值计算的总资产
  categoryTotals: Record<AssetCategory, number>; // 按残值计算的分类总额
}