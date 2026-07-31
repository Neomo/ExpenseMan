import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { TicketOcrResult, OcrConfig, TransportType } from '../types';

// Set worker source for pdfjs-dist using Vite static asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Converts the first page of a PDF file to JPEG Base64 image
 */
export async function convertPdfToImageBase64(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    if (pdf.numPages < 1) {
      throw new Error('PDF 文件为空');
    }

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.2 }); // scale >= 2.0 for HD rendering

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (!context) {
      throw new Error('无法创建 Canvas 绘图上下文');
    }

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (err: any) {
    if (
      err?.name === 'PasswordException' ||
      err?.message?.toLowerCase().includes('password') ||
      err?.message?.toLowerCase().includes('encrypted')
    ) {
      const error = new Error('该 PDF 已加密，请截图后上传图片格式');
      (error as any).isEncryptedPdf = true;
      throw error;
    }
    throw err;
  }
}

/**
 * Pre-processes and compresses an image if width exceeds maxWidth (2000px)
 */
export async function compressImageIfNeeded(
  file: File | string,
  maxWidth = 2000
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const processImageSource = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ base64: src, mimeType: 'image/jpeg' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        resolve({ base64: compressedBase64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('图片加载失败，请检查文件格式'));
      img.src = src;
    };

    if (typeof file === 'string') {
      processImageSource(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processImageSource(e.target.result as string);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取错误'));
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Infer transport type based on train/flight number prefix
 */
export function inferTransportType(trainNumber?: string): TransportType {
  if (!trainNumber) return '火车';
  const upper = trainNumber.trim().toUpperCase();

  if (/^[GCD]\d+/.test(upper)) {
    return '高铁';
  }
  if (/^[KTZ]\d+/.test(upper) || /^\d{3,4}$/.test(upper)) {
    return '火车';
  }
  if (/^[A-Z0-9]{2}\d{3,4}$/.test(upper) || upper.includes('航班') || upper.includes('机票')) {
    return '飞机';
  }
  if (upper.includes('客车') || upper.includes('大巴') || upper.includes('巴士')) {
    return '大巴';
  }
  return '火车';
}

/**
 * Sends image data to backend OCR service or custom key endpoint
 */
export async function processTicketOcr(
  file: File,
  ocrConfig?: OcrConfig
): Promise<TicketOcrResult> {
  const fileId = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fileName = file.name;
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

  let imageBase64 = '';
  let mimeType = 'image/jpeg';

  try {
    if (isPdf) {
      imageBase64 = await convertPdfToImageBase64(file);
    } else {
      const compressed = await compressImageIfNeeded(file, 2000);
      imageBase64 = compressed.base64;
      mimeType = compressed.mimeType;
    }
  } catch (err: any) {
    return {
      fileId,
      fileName,
      fileType: isPdf ? 'pdf' : 'image',
      isValidTicket: false,
      status: 'error',
      errorMessage: err.message || '文件解析失败',
      isEncryptedPdf: err.isEncryptedPdf || false,
    };
  }

  // Call OCR API endpoint
  try {
    const customApiKey = ocrConfig?.provider === 'custom_gemini' ? ocrConfig.apiKey : undefined;

    const res = await fetch('/api/ocr-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        customApiKey,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `服务器响应异常 (${res.status})`);
    }

    const data = await res.json();

    if (!data.isValidTicket && !data.trainNumber && !data.origin && !data.destination && !data.price) {
      return {
        fileId,
        fileName,
        fileType: isPdf ? 'pdf' : 'image',
        previewUrl: imageBase64,
        isValidTicket: false,
        status: 'error',
        errorMessage: '未识别到有效的火车票信息，请检查上传文件',
      };
    }

    const transportType = inferTransportType(data.trainNumber || data.transportType);

    return {
      fileId,
      fileName,
      fileType: isPdf ? 'pdf' : 'image',
      previewUrl: imageBase64,
      isValidTicket: true,
      trainNumber: data.trainNumber || '',
      transportType,
      origin: data.origin || '',
      destination: data.destination || '',
      departureDate: data.departureDate || '',
      departureTime: data.departureTime || '',
      price: typeof data.price === 'number' ? data.price : parseFloat(data.price || '0') || 0,
      seatInfo: data.seatInfo || '',
      confidenceScores: data.confidenceScores || {
        trainNumber: 0.9,
        origin: 0.9,
        destination: 0.9,
        departureDate: 0.9,
        departureTime: 0.85,
        price: 0.95,
        seatInfo: 0.8,
      },
      status: 'success',
    };
  } catch (err: any) {
    return {
      fileId,
      fileName,
      fileType: isPdf ? 'pdf' : 'image',
      previewUrl: imageBase64,
      isValidTicket: false,
      status: 'error',
      errorMessage: err.message || '识别失败，建议手动录入',
    };
  }
}
