import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Wallet, 
  PieChart, 
  Settings,
  TrendingUp,
  Share2
} from 'lucide-react';

import { useAssetStore } from '@/stores/asset-store';
import { AssetModal } from '@/components/AssetModal';
import { AssetList } from '@/components/AssetList';
import { AssetChart } from '@/components/AssetChart';
import { AssetShare } from '@/components/AssetShare';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AssetItem } from '@/types/asset';

function App() {
  const {
    assets,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    loadAssets,
    clearAllAssets,
    getSummary,
  } = useAssetStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [sortBy, setSortBy] = useState<'amount' | 'time'>('amount');

  // 加载数据
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const summary = getSummary();

  const handleAddAsset = () => {
    setEditingAsset(null);
    setModalOpen(true);
  };

  const handleEditAsset = (asset: AssetItem) => {
    setEditingAsset(asset);
    setModalOpen(true);
  };

  const handleSubmitAsset = (assetData: Omit<AssetItem, 'id' | 'createdAt'>) => {
    if (editingAsset) {
      updateAsset(editingAsset.id, assetData);
    } else {
      addAsset(assetData);
    }
  };

  const handleImportAssets = (importedAssets: AssetItem[]) => {
    // 清空现有数据并导入新数据
    clearAllAssets();
    importedAssets.forEach(asset => {
      addAsset({
        name: asset.name,
        category: asset.category,
        amount: asset.amount,
        remark: asset.remark,
      });
    });
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">简资 Assetly</h1>
              <p className="text-sm text-muted-foreground">
                个人资产管理工具
              </p>
            </div>
          </div>
          <Button onClick={handleAddAsset} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加资产
          </Button>
        </div>
      </div>

      {/* Total Assets Summary */}
      <div className="border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">总资产</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(summary.totalAmount)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {assets.length} 项资产
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col gap-0">
          <TabsList className="h-auto rounded-none border-b bg-transparent p-0 w-full">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 flex items-center gap-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-1"
            >
              <Wallet className="h-4 w-4" />
              总览
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 flex items-center gap-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-1"
            >
              <PieChart className="h-4 w-4" />
              图表
            </TabsTrigger>
            <TabsTrigger
              value="share"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 flex items-center gap-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-1"
            >
              <Share2 className="h-4 w-4" />
              分享
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 flex items-center gap-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-1"
            >
              <Settings className="h-4 w-4" />
              设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <AssetList
                  assets={assets}
                  categoryTotals={summary.categoryTotals}
                  onEditAsset={handleEditAsset}
                  onDeleteAsset={deleteAsset}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chart" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>资产分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AssetChart categoryTotals={summary.categoryTotals} assets={assets} />
                  </CardContent>
                </Card>

                {/* 分类汇总 */}
                <Card>
                  <CardHeader>
                    <CardTitle>分类汇总</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(summary.categoryTotals)
                        .filter(([_, amount]) => amount > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, amount]) => {
                          const percentage = summary.totalAmount > 0 
                            ? (amount / summary.totalAmount * 100).toFixed(1)
                            : '0';
                          
                          return (
                            <div key={category} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{category}</span>
                                <Badge variant="outline">{percentage}%</Badge>
                              </div>
                              <span className="font-semibold">
                                {formatCurrency(amount)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="share" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <AssetShare
                  assets={assets}
                  categoryTotals={summary.categoryTotals}
                  totalAmount={summary.totalAmount}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <SettingsPanel
                  assets={assets}
                  onImportAssets={handleImportAssets}
                  onClearAllAssets={clearAllAssets}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Asset Modal */}
      <AssetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmitAsset}
        editingAsset={editingAsset}
      />
    </div>
  );
}

export default App;
