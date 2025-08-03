import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AssetCategory, AssetItem } from '@/types/asset';
import { Button } from '@/components/ui/button';
import { PersonalAnalysisChart } from './PersonalAnalysisChart';
import { AssetTrendChart } from './AssetTrendChart';
import { CategoryComparisonChart } from './CategoryComparisonChart';

interface AssetChartProps {
  categoryTotals: Record<AssetCategory, number>;
  assets?: AssetItem[];
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

export function AssetChart({ categoryTotals, assets = [] }: AssetChartProps) {
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'trend' | 'analysis'>('pie');
  
  // 过滤掉金额为0的类别
  const chartData = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
      color: COLORS[category as AssetCategory],
    }));

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // 不显示小于5%的标签
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      {/* 图表类型切换按钮 */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={activeChart === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('pie')}
        >
          饼图分析
        </Button>
        <Button
          variant={activeChart === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('bar')}
        >
          类别对比
        </Button>
        <Button
          variant={activeChart === 'trend' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('trend')}
        >
          趋势分析
        </Button>
        <Button
          variant={activeChart === 'analysis' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveChart('analysis')}
        >
          个人分析
        </Button>
      </div>

      {/* 根据选择的图表类型渲染不同的图表 */}
      {activeChart === 'pie' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">资产分布</h3>
            <p className="text-sm text-muted-foreground">
              各类别资产占比分析
            </p>
          </div>
          
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>暂无资产数据</p>
            </div>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.color }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeChart === 'bar' && (
        <CategoryComparisonChart categoryTotals={categoryTotals} />
      )}

      {activeChart === 'trend' && (
        <AssetTrendChart assets={assets} />
      )}

      {activeChart === 'analysis' && (
        <PersonalAnalysisChart categoryTotals={categoryTotals} />
      )}
    </div>
  );
}