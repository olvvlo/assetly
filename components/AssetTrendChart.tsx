import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AssetItem } from '@/types/asset';

interface AssetTrendChartProps {
  assets: AssetItem[];
}

export function AssetTrendChart({ assets }: AssetTrendChartProps) {
  // 生成资产趋势数据
  const generateTrendData = () => {
    if (assets.length === 0) return [];

    // 按创建时间排序
    const sortedAssets = [...assets].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const trendData: Array<{
      date: string;
      totalValue: number;
      assetCount: number;
      formattedDate: string;
    }> = [];

    let cumulativeValue = 0;
    let cumulativeCount = 0;

    // 按月分组数据
    const monthlyData = new Map<string, { value: number; count: number }>();

    sortedAssets.forEach(asset => {
      const date = new Date(asset.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const assetValue = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
      
      if (monthlyData.has(monthKey)) {
        const existing = monthlyData.get(monthKey)!;
        monthlyData.set(monthKey, {
          value: existing.value + assetValue,
          count: existing.count + 1
        });
      } else {
        monthlyData.set(monthKey, {
          value: assetValue,
          count: 1
        });
      }
    });

    // 转换为趋势数据
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    
    sortedMonths.forEach(monthKey => {
      const monthData = monthlyData.get(monthKey)!;
      cumulativeValue += monthData.value;
      cumulativeCount += monthData.count;
      
      const [year, month] = monthKey.split('-');
      trendData.push({
        date: monthKey,
        totalValue: cumulativeValue,
        assetCount: cumulativeCount,
        formattedDate: `${year}年${parseInt(month)}月`
      });
    });

    return trendData;
  };

  const trendData = generateTrendData();

  const formatCurrency = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(1)}万`;
    }
    return `¥${value.toLocaleString('zh-CN')}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.formattedDate}</p>
          <p className="text-primary">
            总资产: {formatCurrency(data.totalValue)}
          </p>
          <p className="text-muted-foreground">
            资产数量: {data.assetCount} 项
          </p>
        </div>
      );
    }
    return null;
  };

  if (trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>暂无足够数据生成趋势图</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">资产增长趋势</h3>
        <p className="text-sm text-muted-foreground">
          展示您的资产积累历程
        </p>
      </div>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="#2563eb"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-muted-foreground">当前总资产</div>
          <div className="text-lg font-bold text-primary">
            {formatCurrency(trendData[trendData.length - 1]?.totalValue || 0)}
          </div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-muted-foreground">资产项目数</div>
          <div className="text-lg font-bold text-primary">
            {trendData[trendData.length - 1]?.assetCount || 0} 项
          </div>
        </div>
      </div>
    </div>
  );
}