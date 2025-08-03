import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyzeTextWithAI, AnalysisResult } from '@/utils/ai-analysis';
import { performOCR } from '@/utils/ocr';
import { analyzeWithDeepSeekAI } from '@/utils/ai-analysis-deepseek';
import { useSettings } from '@/hooks/use-settings';

interface SmartCaptureProps {
  onCaptureComplete: (result: any) => void;
  onClose: () => void;
}

export default function SmartCapture({ onCaptureComplete, onClose }: SmartCaptureProps) {
  const { system } = useSettings();
  const [isSelecting, setIsSelecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [elementInfo, setElementInfo] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<(AnalysisResult & { ocrText?: string }) | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 开始智能选区
  const startSmartCapture = async () => {
    setIsSelecting(true);
    setCapturedImage(null);
    setElementInfo(null);
    
    try {
      // 向content script发送开始选区的消息
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await browser.tabs.sendMessage(tab.id, { type: 'START_SMART_CAPTURE' });
      }
    } catch (error) {
      console.error('启动智能选区失败:', error);
      setIsSelecting(false);
    }
  };

  // 重新选择
  const restartSelection = () => {
    setCapturedImage(null);
    setElementInfo(null);
    setIsAnalyzing(false);
    startSmartCapture();
  };

  // 执行OCR分析
  const performOCRAnalysis = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    
    try {
      // 从设置中获取 API 密钥，确保获取最新值
      const currentSettings = await browser.storage.local.get('local:systemSettings');
      const systemSettings = currentSettings['local:systemSettings'] || {};
      
      const ocrApiKey = (systemSettings.ocrApiKey || system.ocrApiKey || '').trim();
      const deepseekApiKey = (systemSettings.deepseekApiKey || system.deepseekApiKey || '').trim();
      
      console.log('当前OCR API密钥:', ocrApiKey ? '已配置' : '未配置');
      console.log('系统设置:', systemSettings);
      console.log('Hook设置:', system);
      
      if (!ocrApiKey) {
        throw new Error('OCR API 密钥未配置，请在设置中添加 OCR.space API 密钥');
      }
      
      // 准备图像数据
      const base64Data = imageData.split(',')[1];
      
      // 调用OCR.space API
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
      
      // 提取识别的文本
      const text = result.ParsedResults
        .map((result: any) => result.ParsedText)
        .join('\n');
      
      console.log('OCR识别结果:', text);
      
      // AI分析文本内容
      let aiResult;
      
      if (deepseekApiKey) {
        // 如果配置了 DeepSeek API 密钥，使用 DeepSeek AI 进行分析
        try {
          aiResult = await analyzeWithDeepSeekAI(text, deepseekApiKey);
          console.log('DeepSeek AI 分析结果:', aiResult);
        } catch (aiError) {
          console.error('DeepSeek AI 分析失败，回退到本地分析:', aiError);
          aiResult = analyzeTextWithAI(text);
        }
      } else {
        // 否则使用本地分析
        aiResult = analyzeTextWithAI(text);
      }
      
      console.log('最终分析结果:', aiResult);
      
      setAnalysisResult({
        ...aiResult,
        ocrText: text
      });
      setIsAnalyzing(false);
    } catch (error) {
      console.error('OCR识别失败:', error);
      setAnalysisError(error instanceof Error ? error.message : '识别失败');
      setIsAnalyzing(false);
    }
  };
  
  // 应用分析结果
  const applyAnalysisResult = () => {
    if (analysisResult) {
      onCaptureComplete(analysisResult);
      onClose(); // 关闭弹框
    }
  };

  // 监听来自content script的消息
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'SMART_CAPTURE_RESULT') {
        setIsSelecting(false);
        setCapturedImage(message.data.image);
        setElementInfo(message.data.elementInfo);
        
        // 自动开始OCR分析
        performOCRAnalysis(message.data.image);
      } else if (message.type === 'SMART_CAPTURE_ERROR') {
        setIsSelecting(false);
        console.error('智能选区错误:', message.error);
      } else if (message.type === 'SMART_CAPTURE_CANCELLED') {
        setIsSelecting(false);
      }
    };

    // 添加消息监听器
    browser.runtime.onMessage.addListener(handleMessage);
    
    // 组件挂载时自动开始智能选区
    startSmartCapture();

    // 清理函数
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [system]); // 添加system依赖，确保设置变化时重新初始化

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                智能选区识别
              </h3>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isSelecting && (
              <div className="text-center py-12">
                <div className="animate-pulse">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                </div>
                <h4 className="text-xl font-medium mb-2">正在启动智能选区...</h4>
                <p className="text-gray-600 mb-6">
                  请在网页上移动鼠标选择要识别的元素
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <div className="space-y-2">
                    <div>• 移动鼠标到要选择的元素上，元素会高亮显示</div>
                    <div>• 点击鼠标确认选择该元素</div>
                    <div>• 按 ESC 键取消选择</div>
                  </div>
                </div>
              </div>
            )}
            
            {capturedImage && !isSelecting && (
              <div className="space-y-4">
                {isAnalyzing ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                    <h4 className="font-medium mb-2">正在分析识别...</h4>
                    <p className="text-gray-600 text-sm">
                      正在进行OCR文字识别和AI智能分析，请稍候...
                    </p>
                  </div>
                ) : analysisError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-700 mb-1">分析失败</h4>
                        <p className="text-sm text-red-600">{analysisError}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={restartSelection}
                          className="mt-3"
                        >
                          重新选择
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        智能分析结果
                        {analysisResult.ocrText && (
                          <div className="relative group">
                            <div className="h-5 w-5 rounded bg-gray-200 flex items-center justify-center cursor-help">
                              <span className="text-xs font-mono">OCR</span>
                            </div>
                            <div className="absolute left-0 top-6 z-50 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <h5 className="font-medium text-gray-700 mb-2">OCR识别文本</h5>
                              <div className="text-sm text-gray-600 max-h-32 overflow-y-auto p-2 bg-gray-50 border border-gray-100 rounded">
                                {analysisResult.ocrText.split('\n').map((line: string, i: number) => (
                                  <div key={i}>{line || ' '}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">资产名称:</span>
                          <span className="font-medium">{analysisResult.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">资产类别:</span>
                          <span className="font-medium">{analysisResult.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">金额:</span>
                          <span className="font-medium">¥{analysisResult.amount}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={restartSelection}
                        >
                          重新选择
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={applyAnalysisResult}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          应用结果
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}