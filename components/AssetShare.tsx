import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { AssetItem, AssetCategory } from '@/types/asset';

interface AssetShareProps {
  assets: AssetItem[];
  categoryTotals: Record<AssetCategory, number>;
  totalAmount: number;
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

const COLORS = {
  '现金': '#8884d8',
  '存款': '#82ca9d',
  '房产': '#ffc658',
  '车辆': '#ff7c7c',
  '基金': '#8dd1e1',
  '股票': '#d084d0',
  '其他': '#87d068',
};

export function AssetShare({ assets, categoryTotals, totalAmount }: AssetShareProps) {
  const shareRef = useRef<HTMLDivElement>(null);

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

  // 获取有资产的类别数据
  const categoryData = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category: category as AssetCategory,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount * 100).toFixed(1) : '0',
      color: COLORS[category as AssetCategory],
    }));

  // 获取所有资产（按残值排序）
  const allAssets = [...assets]
    .map(asset => ({
      ...asset,
      displayValue: asset.currentValue !== undefined ? asset.currentValue : asset.amount
    }))
    .sort((a, b) => b.displayValue - a.displayValue);

  const generateShareImage = async () => {
    if (!shareRef.current) return;

    try {
      // 使用 DOM 转换为 SVG 然后转换为图片
      const element = shareRef.current;
      const rect = element.getBoundingClientRect();
      
      // 创建 SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '400');
      svg.setAttribute('height', '800');
      svg.setAttribute('viewBox', '0 0 400 800');
      
      // 创建 foreignObject 来包含 HTML 内容
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      foreignObject.setAttribute('width', '400');
      foreignObject.setAttribute('height', '800');
      
      // 克隆元素并设置样式
      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.width = '400px';
      clonedElement.style.height = '800px';
      
      foreignObject.appendChild(clonedElement);
      svg.appendChild(foreignObject);
      
      // 转换为 data URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // 创建 canvas 并绘制
      const canvas = document.createElement('canvas');
      canvas.width = 800; // 2x for better quality
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // 创建下载链接
          const link = document.createElement('a');
          link.download = `资产报告_${new Date().toLocaleDateString('zh-CN')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
      }
    } catch (error) {
      console.error('生成分享图片失败:', error);
      // 降级到文本分享
      // Skip fallback sharing if image generation fails
      console.error('Failed to generate share image');
    }
  };

  const shareToClipboard = async () => {
    try {
      const element = shareRef.current;
      if (!element) return;

      // 使用Canvas API重新绘制完整的卡片样式
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 设置画布尺寸 (400px宽度，根据内容动态调整高度)
      const estimatedHeight = Math.max(600, 200 + categoryData.length * 40 + allAssets.length * 80 + 200);
      canvas.width = 800; // 2x for better quality
      canvas.height = estimatedHeight * 2; // 动态高度
      ctx.scale(2, 2);

      // 绘制卡片背景和边框 (rounded-lg shadow-sm)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, estimatedHeight);
      
      // 绘制圆角边框
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(0.5, 0.5, 399, estimatedHeight - 0.5);
      
      // 绘制阴影效果 (shadow-sm)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(2, 2, 400, estimatedHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, estimatedHeight);
      ctx.strokeRect(0.5, 0.5, 399, estimatedHeight - 0.5);

      // 设置字体
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      let y = 32; // 增加顶部边距 (原来是24px)

      // 1. 标题部分 (text-center border-b pb-4)
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'; // 增大字体
      ctx.textAlign = 'center';
      ctx.fillText('我的资产报告', 200, y);
      y += 36; // 增加间距

      ctx.fillStyle = '#6b7280';
      ctx.font = '16px system-ui, -apple-system, sans-serif'; // 增大字体
      const dateStr = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      ctx.fillText(dateStr, 200, y);
      y += 32; // 增加间距

      // 绘制标题下方分隔线 (border-b)
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(32, y); // 增加左右边距
      ctx.lineTo(368, y);
      ctx.stroke();
      y += 32; // 增加间距

      // 2. 总资产卡片 (bg-blue-50 rounded-lg p-4)
      ctx.fillStyle = '#dbeafe'; // bg-blue-50
      // 绘制圆角矩形
      const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      };
      
      roundRect(32, y, 336, 110, 8); // 增加卡片高度
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('总资产', 200, y + 25); // 标题位置
      
      ctx.fillStyle = '#2563eb'; // text-blue-600
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'; // 调整字体大小
      ctx.fillText(formatCurrency(totalAmount), 200, y + 52); // 数字往上移，减少与标题间距
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`共 ${assets.length} 项资产`, 200, y + 88); // 底部文字位置不变
      y += 134; // 增加底部边距

      // 3. 资产分布
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'; // 增大字体
      ctx.textAlign = 'left';
      ctx.fillText('资产分布', 32, y); // 增加左边距
      y += 40; // 增加间距

      categoryData.forEach(({ category, amount, percentage, color }) => {
        // 绘制颜色圆点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(44, y + 10, 6, 0, 2 * Math.PI); // 调整位置
        ctx.fill();

        // 类别名称
        ctx.fillStyle = '#374151';
        ctx.font = '16px system-ui, -apple-system, sans-serif'; // 增大字体
        ctx.fillText(`${CATEGORY_ICONS[category]} ${category}`, 60, y);

        // 百分比标签 (bg-gray-100 px-2 py-0.5 rounded)
        ctx.fillStyle = '#f3f4f6';
        roundRect(190, y - 2, 50, 20, 4); // 增大标签尺寸
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px system-ui, -apple-system, sans-serif'; // 增大字体
        ctx.textAlign = 'center';
        ctx.fillText(`${percentage}%`, 215, y + 3);

        // 金额
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'; // 增大字体
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(amount), 368, y); // 调整右边距
        ctx.textAlign = 'left';

        y += 36; // 增加行间距
      });

      y += 24; // 增加间距

      // 4. 主要资产
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'; // 增大字体
      ctx.fillText('资产列表', 32, y); // 修改标题
      y += 40; // 增加间距

      allAssets.forEach((asset, index) => {
        // 资产图标和名称
        ctx.fillStyle = '#374151';
        ctx.font = '18px system-ui, -apple-system, sans-serif'; // 增大字体
        ctx.fillText(`${CATEGORY_ICONS[asset.category]} ${asset.name}`, 32, y);

        // 类别和日期信息
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px system-ui, -apple-system, sans-serif'; // 增大字体
        ctx.fillText(`${asset.category} • ${formatDate(asset.createdAt)}`, 32, y + 24); // 增加间距

        // 备注信息
        if (asset.remark) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '14px system-ui, -apple-system, sans-serif'; // 增大字体
          const truncatedRemark = asset.remark.length > 30 ? asset.remark.substring(0, 30) + '...' : asset.remark;
          ctx.fillText(truncatedRemark, 32, y + 44); // 增加间距
        }

        // 显示价值
        const displayValue = asset.currentValue !== undefined ? asset.currentValue : asset.amount;
        ctx.fillStyle = '#2563eb'; // text-blue-600
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'; // 增大字体
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(displayValue), 368, y); // 调整右边距
        
        // 如果有原价且不同于显示价值，显示原价
        if (asset.currentValue !== undefined && asset.currentValue !== asset.amount) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '14px system-ui, -apple-system, sans-serif'; // 增大字体
          ctx.fillText(`原价: ${formatCurrency(asset.amount)}`, 368, y + 20); // 增加间距
        }
        
        ctx.textAlign = 'left';

        // 绘制分隔线（除了最后一项）
        if (index < allAssets.length - 1) {
          ctx.strokeStyle = '#f3f4f6';
          ctx.beginPath();
          ctx.moveTo(32, y + 64); // 增加间距
          ctx.lineTo(368, y + 64);
          ctx.stroke();
        }

        y += 76; // 增加行间距
      });

      y += 24; // 增加间距

      // 5. 页脚 (border-t pt-4)
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(32, y); // 增加左右边距
      ctx.lineTo(368, y);
      ctx.stroke();
      y += 24; // 增加间距

      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px system-ui, -apple-system, sans-serif'; // 增大字体
      ctx.textAlign = 'center';
      ctx.fillText('由 简资 Assetly 生成', 200, y);

      // 转换为blob并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `资产概览_${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');

    } catch (error) {
      console.error('生成图片失败:', error);
      alert('生成图片失败，请重试');
    }
  };



  return (
    <div className="space-y-4">
      {/* 操作按钮 */}
      <div className="flex justify-end">
          <Button onClick={shareToClipboard} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            下载图片
          </Button>
        </div>

      {/* 分享内容 - 居中显示 */}
      <div className="flex justify-center">
        <div 
          ref={shareRef}
          className="w-[400px] bg-white p-6 space-y-6 border rounded-lg shadow-sm"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* 标题 */}
          <div className="text-center border-b pb-4">
            <h1 className="text-xl font-bold text-gray-800">我的资产报告</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* 1. 总资产 */}
          <div className="text-center bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">总资产</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              共 {assets.length} 项资产
            </p>
          </div>

          {/* 2. 资产分布 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">资产分布</h3>
            <div className="space-y-2">
              {categoryData.map(({ category, amount, percentage, color }) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {CATEGORY_ICONS[category]} {category}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {percentage}%
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 资产列表（所有资产） */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">资产列表</h3>
            <div className="space-y-3">
              {allAssets.map((asset, index) => (
                <div key={asset.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{CATEGORY_ICONS[asset.category]}</span>
                      <span className="font-medium text-gray-800 truncate">
                        {asset.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{asset.category}</span>
                      <span>{formatDate(asset.createdAt)}</span>
                    </div>
                    {asset.remark && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {asset.remark}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-2">
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(asset.displayValue)}
                    </span>
                    {asset.currentValue !== undefined && asset.currentValue !== asset.amount && (
                      <div className="text-xs text-gray-500">
                        原价: {formatCurrency(asset.amount)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部标识 */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-400">
              由 简资 Assetly 生成
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}