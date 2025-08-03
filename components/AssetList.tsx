import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Calendar,
  MessageSquare
} from 'lucide-react';
import { AssetItem, AssetCategory } from '@/types/asset';

interface AssetListProps {
  assets: AssetItem[];
  categoryTotals: Record<AssetCategory, number>;
  onEditAsset: (asset: AssetItem) => void;
  onDeleteAsset: (id: string) => void;
  sortBy: 'amount' | 'time';
  onSortChange: (sortBy: 'amount' | 'time') => void;
}

const CATEGORY_ICONS = {
  '现金': '💵',
  '存款': '🏦',
  '房产': '🏠',
  '车辆': '🚗',
  '基金': '📈',
  '股票': '📊',
  '其他': '📦',
};

export function AssetList({ 
  assets, 
  categoryTotals, 
  onEditAsset, 
  onDeleteAsset,
  sortBy,
  onSortChange
}: AssetListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<AssetCategory>>(
    new Set(['现金', '存款', '房产', '车辆', '基金', '股票', '其他'])
  );

  const toggleCategory = (category: AssetCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortAssets = (assets: AssetItem[]) => {
    return [...assets].sort((a, b) => {
      if (sortBy === 'amount') {
        // 按残值排序
        const aValue = a.currentValue !== undefined ? a.currentValue : a.amount;
        const bValue = b.currentValue !== undefined ? b.currentValue : b.amount;
        return bValue - aValue;
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const handleDeleteConfirm = (asset: AssetItem) => {
    if (window.confirm(`确定要删除资产"${asset.name}"吗？此操作不可撤销。`)) {
      onDeleteAsset(asset.id);
    }
  };

  // 按类别分组资产
  const assetsByCategory = assets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<AssetCategory, AssetItem[]>);

  // 只显示有资产的类别
  const categoriesWithAssets = Object.keys(assetsByCategory) as AssetCategory[];

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-muted-foreground text-center">
            还没有添加任何资产
            <br />
            点击上方的"添加资产"按钮开始记录吧！
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 排序控制 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">排序方式：</span>
        <Button
          variant={sortBy === 'amount' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortChange('amount')}
        >
          按金额
        </Button>
        <Button
          variant={sortBy === 'time' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortChange('time')}
        >
          按时间
        </Button>
      </div>

      {/* 资产列表 */}
      {categoriesWithAssets.map((category) => {
        const categoryAssets = sortAssets(assetsByCategory[category]);
        const isExpanded = expandedCategories.has(category);
        const categoryTotal = categoryTotals[category];

        return (
          <Card key={category}>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{category}</span>
                      <Badge variant="secondary">
                        {categoryAssets.length}项
                      </Badge>
                    </div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {formatCurrency(categoryTotal)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {categoryAssets.map((asset, index) => (
                    <div key={asset.id}>
                      {index > 0 && <Separator />}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium truncate">{asset.name}</h4>
                            <div className="text-right">
                              <span className="font-semibold text-primary">
                                {formatCurrency(asset.currentValue !== undefined ? asset.currentValue : asset.amount)}
                              </span>
                              {asset.currentValue !== undefined && asset.currentValue !== asset.amount && (
                                <div className="text-xs text-muted-foreground">
                                  原价: {formatCurrency(asset.amount)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(asset.createdAt)}</span>
                            </div>
                            {asset.purchaseDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>购买: {formatDate(asset.purchaseDate)}</span>
                              </div>
                            )}
                            {asset.remark && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span className="truncate max-w-32" title={asset.remark}>
                                  {asset.remark}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAsset(asset);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirm(asset);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}