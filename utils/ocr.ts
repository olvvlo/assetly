interface OCRSpaceResponse {
  ParsedResults: {
    ParsedText: string;
    ErrorMessage?: string;
  }[];
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string;
  ProcessingTimeInMilliseconds: string;
}

/**
 * 使用 OCR.space API 进行图像文字识别
 * @param imageBase64 Base64 编码的图像数据
 * @param apiKey OCR.space API 密钥
 * @returns 识别结果文本
 */
export async function performOCR(imageBase64: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('OCR API 密钥未配置');
  }

  // 移除 Base64 数据的前缀
  const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const formData = new FormData();
  formData.append('base64Image', base64Data);
  formData.append('language', 'chs'); // 中文简体
  formData.append('isOverlayRequired', 'false');
  formData.append('scale', 'true');
  formData.append('detectOrientation', 'true');
  formData.append('OCREngine', '2'); // 使用更高级的 OCR 引擎

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OCRSpaceResponse;

    if (data.IsErroredOnProcessing || data.ErrorMessage) {
      throw new Error(`OCR 处理错误: ${data.ErrorMessage || '未知错误'}`);
    }

    if (!data.ParsedResults || data.ParsedResults.length === 0) {
      throw new Error('OCR 未返回识别结果');
    }

    return data.ParsedResults[0].ParsedText;
  } catch (error) {
    console.error('OCR 处理失败:', error);
    throw error;
  }
}