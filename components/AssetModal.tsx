import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AssetItem, AssetCategory } from '@/types/asset';
import { Sparkles, X, Loader2, AlertCircle, Calendar, Zap } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { analyzeTextWithAI } from '@/utils/ai-analysis';
import { analyzeWithDeepSeekAI } from '@/utils/ai-analysis-deepseek';

import { estimateValueWithAI } from '@/utils/ai-value-estimation';

interface AssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (asset: Omit<AssetItem, 'id' | 'createdAt'>) => void;
  editingAsset?: AssetItem | null;
}

const ASSET_CATEGORIES: AssetCategory[] = [
  '现金',
  '存款',
  '房产',
  '车辆',
  '基金',
  '股票',
  '其他',
];

export function AssetModal({ open, onOpenChange, onSubmit, editingAsset }: AssetModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '' as AssetCategory,
    amount: '',
    remark: '',
    purchaseDate: '',
    currentValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSmartCapture, setShowSmartCapture] = useState(false);
  const [isEstimatingValue, setIsEstimatingValue] = useState(false);
  
  // Smart Capture states
  const [isSelecting, setIsSelecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [elementInfo, setElementInfo] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const { system } = useSettings();

  useEffect(() => {
    if (editingAsset) {
      setFormData({
        name: editingAsset.name,
        category: editingAsset.category,
        amount: editingAsset.amount.toString(),
        remark: editingAsset.remark || '',
        purchaseDate: editingAsset.purchaseDate || '',
        currentValue: editingAsset.currentValue?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        category: '' as AssetCategory,
        amount: '',
        remark: '',
        purchaseDate: '',
        currentValue: '',
      });
    }
    setErrors({});
  }, [editingAsset, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '资产名称不能为空';
    }

    if (!formData.category) {
      newErrors.category = '请选择资产类别';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = '请输入有效的金额（大于0）';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const assetData: Omit<AssetItem, 'id' | 'createdAt'> = {
      name: formData.name.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      remark: formData.remark.trim() || undefined,
    };

    // 对于非存款、现金类目的资产，添加购买日期和当前残值
    if (formData.category !== '存款' && formData.category !== '现金') {
      if (formData.purchaseDate) {
        assetData.purchaseDate = formData.purchaseDate;
      }
      if (formData.currentValue) {
        assetData.currentValue = parseFloat(formData.currentValue);
      }
    }

    onSubmit(assetData);
    onOpenChange(false);
  };

  // AI估值功能
  const handleEstimateValue = async () => {
    if (!formData.name || !formData.category || !formData.amount || !formData.purchaseDate) {
      return;
    }

    setIsEstimatingValue(true);
    try {
      const estimatedValue = await estimateValueWithAI({
        name: formData.name,
        category: formData.category,
        originalPrice: parseFloat(formData.amount),
        purchaseDate: formData.purchaseDate,
        remark: formData.remark,
      });
      
      setFormData(prev => ({ ...prev, currentValue: estimatedValue.estimatedValue.toString() }));
    } catch (error) {
      console.error('AI估值失败:', error);
    } finally {
      setIsEstimatingValue(false);
    }
  };

  // 检查是否需要显示购买日期和残值字段
  const shouldShowAdditionalFields = formData.category && formData.category !== '存款' && formData.category !== '现金';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // 当金额变化时，如果残值为空，自动设置为金额值
      if (field === 'amount' && shouldShowAdditionalFields && !prev.currentValue) {
        newData.currentValue = value;
      }
      
      return newData;
    });
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Smart Capture functions
  const startSmartCapture = async () => {
    setIsSelecting(true);
    setCapturedImage(null);
    setElementInfo(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    
    // 发送消息到content script开始智能选区
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await browser.tabs.sendMessage(tab.id, { type: 'START_SMART_CAPTURE' });
      }
    } catch (error) {
      console.error('启动智能选区失败:', error);
    }
  };

  const performOCRAnalysis = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    
    try {
      // 获取所有存储数据进行调试
      const allStorageData = await browser.storage.local.get(null);
      console.log('All storage data:', allStorageData); // 调试日志
      
      // 尝试不同的存储键名 - 根据调试信息，实际键名是 systemSettings
      const storageData = await browser.storage.local.get(['systemSettings', 'local:systemSettings']);
      const systemSettings = storageData['systemSettings'] || storageData['local:systemSettings'];
      
      console.log('Storage data with both keys:', storageData); // 调试日志
      console.log('System settings:', systemSettings); // 调试日志
      
      // 获取API密钥
      const ocrApiKey = systemSettings?.ocrApiKey?.trim() || '';
      const deepseekApiKey = systemSettings?.deepseekApiKey?.trim() || '';
      
      console.log('OCR API Key available:', !!ocrApiKey, 'Length:', ocrApiKey.length); // 调试日志
      console.log('OCR API Key value (first 10 chars):', ocrApiKey.substring(0, 10)); // 调试日志
      
      if (!ocrApiKey) {
        throw new Error('OCR API 密钥未配置，请在设置中添加 OCR.space API 密钥');
      }
      
      const base64Data = imageData.split(',')[1];
      
      const formData = new FormData();
      formData.append('apikey', ocrApiKey);
      formData.append('base64Image', `data:image/png;base64,${base64Data}`);
      formData.append('language', 'chs');
      formData.append('scale', 'true');
      formData.append('isTable', 'true');
      formData.append('OCREngine', '2');
      
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok || result.OCRExitCode !== 1) {
        throw new Error(result.ErrorMessage || '识别失败');
      }
      
      const text = result.ParsedResults
        .map((result: any) => result.ParsedText)
        .join('\n');
      
      let aiResult;
      
      if (deepseekApiKey) {
        try {
          aiResult = await analyzeWithDeepSeekAI(text, deepseekApiKey);
        } catch (aiError) {
          aiResult = analyzeTextWithAI(text);
        }
      } else {
        aiResult = analyzeTextWithAI(text);
      }
      
      setAnalysisResult({
        ...aiResult,
        ocrText: text
      });
      setIsAnalyzing(false);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : '识别失败');
      setIsAnalyzing(false);
    }
  };

  const applyAnalysisResult = () => {
    if (analysisResult) {
      setFormData({
        name: analysisResult.name,
        category: analysisResult.category as AssetCategory,
        amount: analysisResult.amount.toString(),
        remark: analysisResult.remark || '',
      });
      setShowSmartCapture(false);
      setErrors({});
    }
  };

  const restartSelection = () => {
    startSmartCapture();
  };

  // Message listener for Smart Capture
  useEffect(() => {
    if (!showSmartCapture) return;

    const handleMessage = (message: any) => {
      if (message.type === 'SMART_CAPTURE_RESULT') {
        setIsSelecting(false);
        setCapturedImage(message.data.image);
        setElementInfo(message.data.elementInfo);
        performOCRAnalysis(message.data.image);
      } else if (message.type === 'SMART_CAPTURE_ERROR') {
        setIsSelecting(false);
        console.error('智能选区错误:', message.error);
      } else if (message.type === 'SMART_CAPTURE_CANCELLED') {
        setIsSelecting(false);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);
    startSmartCapture();

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [showSmartCapture, system]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAsset ? '编辑资产' : '添加资产'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Smart Capture Content */}
        {showSmartCapture && (
          <div className="mb-6 border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                智能选区识别
              </h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSmartCapture(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isSelecting && (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                </div>
                <h5 className="font-medium mb-2">正在启动智能选区...</h5>
                <p className="text-sm text-gray-600 mb-4">
                  请在网页上移动鼠标选择要识别的元素
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <div className="space-y-1">
                    <div>• 移动鼠标到要选择的元素上，元素会高亮显示</div>
                    <div>• 点击鼠标确认选择该元素</div>
                    <div>• 按 ESC 键取消选择</div>
                  </div>
                </div>
              </div>
            )}
            
            {capturedImage && !isSelecting && (
              <div className="space-y-3">
                {isAnalyzing ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <h5 className="font-medium mb-1">正在分析识别...</h5>
                    <p className="text-sm text-gray-600">
                      正在进行OCR文字识别和AI智能分析，请稍候...
                    </p>
                  </div>
                ) : analysisError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-red-700 text-sm mb-1">分析失败</h5>
                        <p className="text-xs text-red-600">{analysisError}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={restartSelection}
                          className="mt-2 h-7 text-xs"
                        >
                          重新选择
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        智能分析结果
                        {analysisResult.ocrText && (
                          <div className="relative group">
                            <div className="h-4 w-4 rounded bg-gray-200 flex items-center justify-center cursor-help text-xs">
                              OCR
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-[300px] max-w-[500px]">
                              <div className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                                {analysisResult.ocrText}
                              </div>
                            </div>
                          </div>
                        )}
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">资产名称:</span>
                          <div className="font-medium">{analysisResult.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">类别:</span>
                          <div className="font-medium">{analysisResult.category}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">金额:</span>
                          <div className="font-medium">¥{analysisResult.amount}</div>
                        </div>
                        {analysisResult.remark && (
                          <div className="col-span-2">
                            <span className="text-gray-600">备注:</span>
                            <div className="font-medium">{analysisResult.remark}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={restartSelection}
                        className="flex-1 h-8 text-xs"
                      >
                        重新选择
                      </Button>
                      <Button 
                        onClick={applyAnalysisResult}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                      >
                        应用结果
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 智能选区按钮 */}
          {!editingAsset && !showSmartCapture && (
            <div className="flex justify-center pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSmartCapture(true)}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4" />
                智能选区识别
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">资产名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="如：招商银行存款"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">资产类别 *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="请选择资产类别" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">金额 *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* 购买日期和当前残值字段 - 仅对非存款、现金类目显示 */}
          {shouldShowAdditionalFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  购买日期
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentValue" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  预估当前残值
                  {formData.name && formData.category && formData.amount && formData.purchaseDate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEstimateValue}
                      disabled={isEstimatingValue}
                      className="ml-auto h-6 px-2 text-xs"
                    >
                      {isEstimatingValue ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          AI估值中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI估值
                        </>
                      )}
                    </Button>
                  )}
                </Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentValue}
                  onChange={(e) => handleInputChange('currentValue', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500">
                  留空将使用原价计算总资产，填写后将按残值计算
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="remark">备注</Label>
            <Textarea
              id="remark"
              value={formData.remark}
              onChange={(e) => handleInputChange('remark', e.target.value)}
              placeholder="可选备注信息"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">
              {editingAsset ? '更新' : '添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}