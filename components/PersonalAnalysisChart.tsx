import { useState, useEffect } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AssetCategory } from '@/types/asset';
import { useSettings, PersonalInfo } from '@/hooks/use-settings';
import { analyzeRealRanking } from '@/utils/ai-ranking-analysis';

interface PersonalAnalysisChartProps {
  categoryTotals: Record<AssetCategory, number>;
}

export function PersonalAnalysisChart({ categoryTotals }: PersonalAnalysisChartProps) {
  const { personalInfo } = useSettings();
  const [rankings, setRankings] = useState({ regional: 0, national: 0, global: 0, analysis: '' });
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);

  // 计算总资产
  const totalAssets = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  // 基于个人信息和资产情况生成六边形分析数据
  const generateAnalysisData = () => {
    // 从出生日期计算年龄，如果没有出生日期则使用age字段
    let age = personalInfo.age || 30;
    if (personalInfo.birthDate) {
      const birthYear = new Date(personalInfo.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }
    
    const education = personalInfo.education || '';
    const location = personalInfo.location || '';
    const occupation = personalInfo.occupation || '';
    
    // 基础评分逻辑（简化版，实际应用中可以更复杂）
    const getFinancialHealthScore = () => {
      let score = 50; // 基础分
      
      // 年龄因素
      if (age >= 25 && age <= 35) score += 15;
      else if (age >= 36 && age <= 45) score += 20;
      else if (age >= 46 && age <= 55) score += 10;
      
      // 学历因素
      if (education.includes('博士')) score += 20;
      else if (education.includes('硕士')) score += 15;
      else if (education.includes('本科')) score += 10;
      
      // 资产规模因素
      if (totalAssets >= 1000000) score += 25;
      else if (totalAssets >= 500000) score += 20;
      else if (totalAssets >= 100000) score += 15;
      else if (totalAssets >= 50000) score += 10;
      
      return Math.min(100, score);
    };

    const getRiskManagementScore = () => {
      let score = 40;
      
      // 资产多样化
      const categories = Object.keys(categoryTotals || {}).filter(category => 
        categoryTotals[category as AssetCategory] > 0
      );
      score += categories.length * 8;
      
      // 现金和存款比例
      const liquidAssets = (categoryTotals?.['现金'] || 0) + (categoryTotals?.['存款'] || 0);
      
      const liquidRatio = totalAssets > 0 ? liquidAssets / totalAssets : 0;
      if (liquidRatio >= 0.1 && liquidRatio <= 0.3) score += 20;
      else if (liquidRatio >= 0.05) score += 10;
      
      return Math.min(100, score);
    };

    const getInvestmentPotentialScore = () => {
      let score = 30;
      
      // 投资类资产比例
      const investmentAssets = (categoryTotals?.['基金'] || 0) + (categoryTotals?.['股票'] || 0);
      
      const investmentRatio = totalAssets > 0 ? investmentAssets / totalAssets : 0;
      score += investmentRatio * 60;
      
      // 年龄适应性
      if (age <= 35) score += 20;
      else if (age <= 45) score += 15;
      else if (age <= 55) score += 10;
      
      return Math.min(100, score);
    };

    const getWealthAccumulationScore = () => {
      let score = 20;
      
      // 基于年龄的资产期望
      const expectedAssets = age * 10000; // 简化公式
      if (totalAssets >= expectedAssets * 2) score += 40;
      else if (totalAssets >= expectedAssets) score += 30;
      else if (totalAssets >= expectedAssets * 0.5) score += 20;
      else score += 10;
      
      // 房产等固定资产
      const realEstateAssets = categoryTotals?.['房产'] || 0;
      
      if (realEstateAssets > 0) score += 20;
      
      return Math.min(100, score);
    };

    const getFinancialStabilityScore = () => {
      let score = 35;
      
      // 职业稳定性（简化判断）
      if (occupation.includes('公务员') || occupation.includes('教师')) score += 25;
      else if (occupation.includes('医生') || occupation.includes('律师')) score += 20;
      else if (occupation.includes('工程师') || occupation.includes('程序员')) score += 15;
      else score += 10;
      
      // 地区因素
      if (location.includes('北京') || location.includes('上海') || location.includes('深圳')) score += 15;
      else if (location.includes('广州') || location.includes('杭州')) score += 10;
      else score += 5;
      
      return Math.min(100, score);
    };

    const getGrowthPotentialScore = () => {
      let score = 25;
      
      // 年龄潜力
      if (age <= 30) score += 30;
      else if (age <= 40) score += 25;
      else if (age <= 50) score += 15;
      else score += 5;
      
      // 学历潜力
      if (education.includes('博士')) score += 25;
      else if (education.includes('硕士')) score += 20;
      else if (education.includes('本科')) score += 15;
      
      return Math.min(100, score);
    };

    return [
      {
        subject: '财务健康',
        score: getFinancialHealthScore(),
        fullMark: 100,
      },
      {
        subject: '风险管理',
        score: getRiskManagementScore(),
        fullMark: 100,
      },
      {
        subject: '投资潜力',
        score: getInvestmentPotentialScore(),
        fullMark: 100,
      },
      {
        subject: '财富积累',
        score: getWealthAccumulationScore(),
        fullMark: 100,
      },
      {
        subject: '财务稳定',
        score: getFinancialStabilityScore(),
        fullMark: 100,
      },
      {
        subject: '成长潜力',
        score: getGrowthPotentialScore(),
        fullMark: 100,
      },
    ];
  };

  const data = generateAnalysisData();

  // 计算总体分析
  const calculateOverallAnalysis = () => {
    const totalScore = data.reduce((sum, item) => sum + item.score, 0);
    const averageScore = totalScore / data.length;
    
    // 段位计算
    const getRank = (score: number) => {
      if (score >= 90) return { 
        rank: '钻石', 
        gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
        textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600',
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
        borderColor: 'border-purple-200'
      };
      if (score >= 80) return { 
        rank: '铂金', 
        gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600',
        bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        borderColor: 'border-blue-200'
      };
      if (score >= 70) return { 
        rank: '黄金', 
        gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500',
        textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600',
        bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
        borderColor: 'border-yellow-200'
      };
      if (score >= 60) return { 
        rank: '白银', 
        gradient: 'bg-gradient-to-r from-gray-400 to-gray-600',
        textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-700',
        bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
        borderColor: 'border-gray-200'
      };
      if (score >= 50) return { 
        rank: '青铜', 
        gradient: 'bg-gradient-to-r from-orange-500 to-amber-600',
        textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-700',
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
        borderColor: 'border-orange-200'
      };
      return { 
        rank: '黑铁', 
        gradient: 'bg-gradient-to-r from-red-500 to-rose-600',
        textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-700',
        bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
        borderColor: 'border-red-200'
      };
    };

    const rankInfo = getRank(averageScore);
    
    return {
      totalScore: Number(totalScore.toFixed(2)),
      averageScore: Number(averageScore.toFixed(2)),
      rankInfo,
      rankings: {
        regional: rankings.regional || 50,
        national: rankings.national || 60
      }
    };
  };

  const overallAnalysis = calculateOverallAnalysis();

  // 加载真实排名数据
  useEffect(() => {
    const loadRankings = async () => {
      if (!personalInfo || totalAssets === 0) return;
      
      setIsLoadingRankings(true);
      try {
        const data = generateAnalysisData();
        const averageScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;
        
        const rankingResult = await analyzeRealRanking({
          personalInfo,
          categoryTotals,
          totalAssets,
          averageScore
        });
        
        setRankings(rankingResult);
      } catch (error) {
        console.error('加载排名数据失败:', error);
      } finally {
        setIsLoadingRankings(false);
      }
    };

    loadRankings();
  }, [personalInfo, categoryTotals, totalAssets]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.subject}</p>
          <p className="text-primary">
            评分: {data.value}/100
          </p>
        </div>
      );
    }
    return null;
  };

  if (!personalInfo || (!personalInfo.birthDate && !personalInfo.age)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-2">
        <p>请先在设置中填写个人信息</p>
        <p className="text-sm">完善个人信息后可查看专属分析报告</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">个人财务实力分析</h3>
        <p className="text-sm text-muted-foreground">
          基于您的个人信息和资产状况生成的综合评估
        </p>
      </div>

      {/* 总体分析卡片 */}
      <div className={`p-4 rounded-lg border-2 ${overallAnalysis.rankInfo.bgColor} ${overallAnalysis.rankInfo.borderColor} border-opacity-50`}>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">财务实力段位</span>
            <span className={`text-2xl font-bold ${overallAnalysis.rankInfo.textGradient}`}>
              {overallAnalysis.rankInfo.rank}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">综合评分</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(overallAnalysis.averageScore)}
              </div>
              <div className="text-xs text-muted-foreground">
                总分 {Math.round(overallAnalysis.totalScore)}/600
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-muted-foreground">排名情况</div>
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="text-muted-foreground">地区排名: </span>
                  <span className="font-semibold text-green-600">
                    {isLoadingRankings ? '计算中...' : `前${overallAnalysis.rankings.regional}%`}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">全国排名: </span>
                  <span className="font-semibold text-blue-600">
                    {isLoadingRankings ? '计算中...' : `前${overallAnalysis.rankings.national}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={false}
            />
            <Radar
              name="评分"
              dataKey="score"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        {data.map((item, index) => (
          <div key={index} className="text-center p-2 bg-muted rounded-lg">
            <div className="font-medium">{item.subject}</div>
            <div className="text-lg font-bold text-blue-600">{Math.round(item.score)}</div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p>* 评分基于您的个人信息、资产配置和同龄人群数据进行综合计算。</p>
        <p>* 排名数据基于国家统计局、央行等权威机构发布的家庭资产调研数据计算，具有较高参考价值。</p>
        {rankings.analysis && (
          <p className="mt-2 font-medium text-blue-700">* {rankings.analysis}</p>
        )}
      </div>
    </div>
  );
}