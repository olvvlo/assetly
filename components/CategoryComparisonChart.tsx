import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AssetCategory } from '@/types/asset';

interface CategoryComparisonChartProps {
  categoryTotals: Record<AssetCategory, number>;
}

const COLORS = {
  '现金': '#8884d8',
  '存款': '#82ca9d',
  '房产': '#ffc658',
  '车辆': '#ff7c7c',
  '基金': '#8dd1e1',
  '股票': '#d084d0',
  '其他': '#87d068',
};

export function CategoryComparisonChart({ categoryTotals }: CategoryComparisonChartProps) {
  // 转换数据格式并排序
  const chartData = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      amount,
      color: COLORS[category as AssetCategory],
    }))
    .sort((a, b) => b.amount - a.amount);

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value.toLocaleString('zh-CN');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.category}</p>
          <p className="text-primary">
            ¥{data.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>暂无资产数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">资产类别对比</h3>
        <p className="text-sm text-muted-foreground">
          各类别资产金额对比分析
        </p>
      </div>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.category}</div>
              <div className="text-muted-foreground">
                ¥{formatCurrency(item.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}