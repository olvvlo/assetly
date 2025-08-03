import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle,
  FileText,
  Database,
  Key,
  Sparkles,
  Save,
  Check,
  User
} from 'lucide-react';
import { AssetItem } from '@/types/asset';
import { useSettings } from '@/hooks/use-settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsPanelProps {
  assets: AssetItem[];
  onImportAssets: (assets: AssetItem[]) => void;
  onClearAllAssets: () => void;
}

export function SettingsPanel({ assets, onImportAssets, onClearAllAssets }: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { system, personalInfo, updateSystem, updatePersonalInfo } = useSettings();
  
  const [ocrApiKey, setOcrApiKey] = useState(system.ocrApiKey || '');
  const [deepseekApiKey, setDeepseekApiKey] = useState(system.deepseekApiKey || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 个人信息状态
  const [personalBirthDate, setPersonalBirthDate] = useState(personalInfo.birthDate || '');
  const [personalEducation, setPersonalEducation] = useState(personalInfo.education || '');
  const [personalFamilyStatus, setPersonalFamilyStatus] = useState(personalInfo.familyStatus || '');
  const [personalOccupation, setPersonalOccupation] = useState(personalInfo.occupation || '');
  const [personalLocation, setPersonalLocation] = useState(personalInfo.location || '');
  const [isPersonalSaving, setIsPersonalSaving] = useState(false);
  const [personalSaveSuccess, setPersonalSaveSuccess] = useState(false);

  // 监听系统设置变化，同步到本地状态
  useEffect(() => {
    setOcrApiKey(system.ocrApiKey || '');
    setDeepseekApiKey(system.deepseekApiKey || '');
  }, [system.ocrApiKey, system.deepseekApiKey]);

  // 监听个人信息变化，同步到本地状态
  useEffect(() => {
    setPersonalBirthDate(personalInfo.birthDate || '');
    setPersonalEducation(personalInfo.education || '');
    setPersonalFamilyStatus(personalInfo.familyStatus || '');
    setPersonalOccupation(personalInfo.occupation || '');
    setPersonalLocation(personalInfo.location || '');
  }, [personalInfo]);

  const handleExport = () => {
    const dataStr = JSON.stringify(assets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assetly-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedAssets = JSON.parse(content) as AssetItem[];
        
        // 验证数据格式
        if (!Array.isArray(importedAssets)) {
          throw new Error('Invalid data format');
        }

        // 简单验证每个资产项的必要字段
        const isValidAsset = (asset: any): asset is AssetItem => {
          return (
            typeof asset.id === 'string' &&
            typeof asset.name === 'string' &&
            typeof asset.category === 'string' &&
            typeof asset.amount === 'number' &&
            typeof asset.createdAt === 'string'
          );
        };

        const validAssets = importedAssets.filter(isValidAsset);
        
        if (validAssets.length === 0) {
          throw new Error('No valid assets found in file');
        }

        if (validAssets.length !== importedAssets.length) {
          alert(`导入了 ${validAssets.length} 项资产，跳过了 ${importedAssets.length - validAssets.length} 项无效数据`);
        }

        onImportAssets(validAssets);
        alert(`成功导入 ${validAssets.length} 项资产！`);
      } catch (error) {
        console.error('Import error:', error);
        alert('导入失败：文件格式不正确或数据无效');
      }
    };
    
    reader.readAsText(file);
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      '⚠️ 警告：此操作将删除所有资产数据，且无法恢复！\n\n建议在清空前先导出备份。\n\n确定要继续吗？'
    );
    
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        '请再次确认：您真的要删除所有资产数据吗？\n\n此操作不可撤销！'
      );
      
      if (doubleConfirmed) {
        onClearAllAssets();
        alert('所有资产数据已清空');
      }
    }
  };

  // 保存API密钥
  const saveApiKeys = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateSystem({
        ocrApiKey,
        deepseekApiKey
      });
      setSaveSuccess(true);
      // 3秒后重置成功状态
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('保存API密钥失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 保存个人信息
  const savePersonalInfo = async () => {
    setIsPersonalSaving(true);
    setPersonalSaveSuccess(false);
    try {
      await updatePersonalInfo({
        birthDate: personalBirthDate,
        education: personalEducation,
        familyStatus: personalFamilyStatus,
        occupation: personalOccupation,
        location: personalLocation
      });
      setPersonalSaveSuccess(true);
      // 3秒后重置成功状态
      setTimeout(() => setPersonalSaveSuccess(false), 3000);
    } catch (error) {
      console.error('保存个人信息失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsPersonalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 个人信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personalBirthDate">出生日期</Label>
              <Input
                id="personalBirthDate"
                type="date"
                value={personalBirthDate}
                onChange={(e) => setPersonalBirthDate(e.target.value)}
                placeholder="请选择出生日期"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="personalEducation">学历</Label>
              <Select value={personalEducation} onValueChange={setPersonalEducation}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择学历" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="小学">小学</SelectItem>
                  <SelectItem value="初中">初中</SelectItem>
                  <SelectItem value="普通高中">普通高中</SelectItem>
                  <SelectItem value="中专">中专</SelectItem>
                  <SelectItem value="大专">大专</SelectItem>
                  <SelectItem value="本科">本科</SelectItem>
                  <SelectItem value="研究生">研究生</SelectItem>
                  <SelectItem value="博士">博士</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="personalFamilyStatus">家庭状况</Label>
              <Select value={personalFamilyStatus} onValueChange={setPersonalFamilyStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择家庭状况" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="单身">单身</SelectItem>
                  <SelectItem value="已婚">已婚</SelectItem>
                  <SelectItem value="有子女">有子女</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="personalOccupation">职业</Label>
              <Input
                id="personalOccupation"
                value={personalOccupation}
                onChange={(e) => setPersonalOccupation(e.target.value)}
                placeholder="请输入职业"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="personalLocation">所在地区</Label>
              <Input
                id="personalLocation"
                value={personalLocation}
                onChange={(e) => setPersonalLocation(e.target.value)}
                placeholder="如：北京、上海、深圳等"
              />
            </div>
          </div>
          
          <Button 
            onClick={savePersonalInfo} 
            disabled={isPersonalSaving}
            className="mt-4 flex items-center gap-2"
          >
            {isPersonalSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                保存中...
              </>
            ) : personalSaveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存个人信息
              </>
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p>个人信息将用于生成更精准的资产分析报告和同类人群对比。所有信息仅存储在本地，不会上传到服务器。</p>
          </div>
        </CardContent>
      </Card>

      {/* API配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ocrApiKey">OCR.space API密钥</Label>
              <div className="flex gap-2">
                <Input
                  id="ocrApiKey"
                  type="password"
                  value={ocrApiKey}
                  onChange={(e) => setOcrApiKey(e.target.value)}
                  placeholder="输入OCR.space API密钥"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                用于图像文字识别，可在 <a href="https://ocr.space/ocrapi" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OCR.space</a> 获取免费密钥
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deepseekApiKey">DeepSeek AI API密钥</Label>
              <div className="flex gap-2">
                <Input
                  id="deepseekApiKey"
                  type="password"
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  placeholder="输入DeepSeek AI API密钥"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                用于智能分析，可在 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DeepSeek平台</a> 获取API密钥
              </p>
            </div>
            
            <Button 
              onClick={saveApiKeys} 
              disabled={isSaving}
              className="mt-2 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  保存中...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存API密钥
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleExport}
              className="flex items-center gap-2"
              disabled={assets.length === 0}
            >
              <Download className="h-4 w-4" />
              导出数据 ({assets.length} 项)
            </Button>
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              导入数据
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 导出：将当前所有资产数据保存为 JSON 文件</p>
            <p>• 导入：从 JSON 文件恢复资产数据</p>
          </div>
        </CardContent>
      </Card>

      {/* 危险操作 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            危险操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            onClick={handleClearAll}
            disabled={assets.length === 0}
            className="w-full flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            清空所有数据
          </Button>
          
          <div className="text-sm text-muted-foreground bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 mb-1">注意事项：</p>
                <ul className="space-y-1 text-red-700">
                  <li>• 清空操作不可撤销</li>
                  <li>• 建议在清空前先导出备份</li>
                  <li>• 所有资产记录将被永久删除</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 关于信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            关于简资
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">版本</span>
              <span>v0.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">数据存储</span>
              <span>本地浏览器</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">隐私保护</span>
              <span className="text-green-600">✓ 完全本地化</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-xs text-muted-foreground">
            <p>简资（Assetly）是一款极简本地化的个人资产管理工具。</p>
            <p className="mt-1">所有数据仅存储在您的浏览器中，确保隐私安全。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}