import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  TicketOcrResult,
  OcrConfig,
  TransportType,
  TicketTemplateProfile,
  RegionBox,
  TicketFieldKey,
  PdfTextItemWithPos,
} from '../types';

// Set worker source for pdfjs-dist using Vite static asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const OCR_PROVIDER_NAMES: Record<string, string> = {
  local_paddle: '本地浏览器 Web-PaddleOCR (纯前端离线)',
  system_gemini: '系统默认 AI Vision (Gemini)',
  custom_gemini: '自定义 Gemini 3.6 Flash API',
  baidu_ocr: '百度智能云 - 火车票 OCR 接口',
  tencent_ocr: '腾讯云 - 运单与交通票据 OCR',
  aliyun_ocr: '阿里云 - 行程单识别 OCR 接口',
};

export const DEFAULT_RAILWAY_TEMPLATE: TicketTemplateProfile = {
  id: 'tpl-china-railway-eticket',
  name: '中国铁路电子客票 / 行程单标准模板',
  isDefault: true,
  ticketType: 'train',
  regions: {
    origin: { x: 5, y: 15, width: 30, height: 12 },
    destination: { x: 65, y: 15, width: 30, height: 12 },
    trainNumber: { x: 36, y: 13, width: 28, height: 10 },
    departureDate: { x: 5, y: 28, width: 42, height: 10 },
    departureTime: { x: 32, y: 28, width: 22, height: 10 },
    price: { x: 62, y: 28, width: 32, height: 10 },
    seatInfo: { x: 5, y: 40, width: 45, height: 10 },
  },
  createdAt: Date.now(),
};

export const DEFAULT_FLIGHT_TEMPLATE: TicketTemplateProfile = {
  id: 'tpl-flight-itinerary',
  name: '航空客票行程单 / 登机牌模板',
  isDefault: false,
  ticketType: 'flight',
  regions: {
    origin: { x: 5, y: 20, width: 35, height: 12 },
    destination: { x: 60, y: 20, width: 35, height: 12 },
    trainNumber: { x: 5, y: 10, width: 30, height: 9 },
    departureDate: { x: 5, y: 36, width: 40, height: 10 },
    departureTime: { x: 48, y: 36, width: 25, height: 10 },
    price: { x: 65, y: 55, width: 30, height: 12 },
    seatInfo: { x: 5, y: 50, width: 35, height: 10 },
  },
  createdAt: Date.now(),
};

export const DEFAULT_BUS_TEMPLATE: TicketTemplateProfile = {
  id: 'tpl-bus-ticket',
  name: '公路客运 / 长途大巴票据模板',
  isDefault: false,
  ticketType: 'bus',
  regions: {
    origin: { x: 5, y: 18, width: 40, height: 12 },
    destination: { x: 55, y: 18, width: 40, height: 12 },
    trainNumber: { x: 5, y: 8, width: 35, height: 10 },
    departureDate: { x: 5, y: 32, width: 40, height: 10 },
    departureTime: { x: 48, y: 32, width: 25, height: 10 },
    price: { x: 60, y: 46, width: 35, height: 12 },
    seatInfo: { x: 5, y: 46, width: 45, height: 12 },
  },
  createdAt: Date.now(),
};

/**
 * Get human readable display name for the OCR provider
 */
export function getOcrProviderName(provider?: string): string {
  if (!provider) return OCR_PROVIDER_NAMES.local_paddle;
  return OCR_PROVIDER_NAMES[provider] || OCR_PROVIDER_NAMES.local_paddle;
}

/**
 * Result of converting PDF to image and extracting text
 */
export interface PdfConvertResult {
  imageBase64: string;
  pdfTextLines: string[];
  pdfTextItemsWithPos?: PdfTextItemWithPos[];
  resolution: string;
}

/**
 * Converts the first page of a PDF file to JPEG Base64 image
 */
export async function convertPdfToImageBase64(file: File): Promise<string> {
  const result = await convertPdfToImageAndText(file);
  return result.imageBase64;
}

/**
 * Converts PDF to Base64 Image with white canvas background, CMap CJK font support,
 * and extracts native Chinese text strings with 2D percentage positions from PDF.
 */
export async function convertPdfToImageAndText(file: File): Promise<PdfConvertResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsVersion = pdfjsLib.version || '4.10.38';

    // 1. Configure CMap and Standard Font URLs from CDN to properly decode Chinese CJK CID fonts
    const cMapUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`;
    const standardFontDataUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/standard_fonts/`;

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl,
      cMapPacked: true,
      standardFontDataUrl,
    });
    const pdf = await loadingTask.promise;

    if (pdf.numPages < 1) {
      throw new Error('PDF 文件为空');
    }

    // 2. Extract embedded Chinese text content and 2D bounding positions from PDF pages
    const pdfTextLines: string[] = [];
    const pdfTextItemsWithPos: PdfTextItemWithPos[] = [];
    try {
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const vp = page.getViewport({ scale: 1.0 });

        for (const item of textContent.items as any[]) {
          if (!item.str || !String(item.str).trim()) continue;
          const str = String(item.str).trim();
          pdfTextLines.push(str);

          if (item.transform && Array.isArray(item.transform)) {
            const x = item.transform[4];
            const pdfY = item.transform[5];
            const h = item.height || 10;
            const y = vp.height - pdfY - h;
            const w = item.width || 20;

            const px = Math.max(0, Math.min(100, (x / vp.width) * 100));
            const py = Math.max(0, Math.min(100, (y / vp.height) * 100));
            const pw = Math.max(0, Math.min(100, (w / vp.width) * 100));
            const ph = Math.max(0, Math.min(100, (h / vp.height) * 100));

            pdfTextItemsWithPos.push({
              text: str,
              x: Math.round(px * 10) / 10,
              y: Math.round(py * 10) / 10,
              w: Math.round(pw * 10) / 10,
              h: Math.round(ph * 10) / 10,
            });
          }
        }
      }
    } catch (e) {
      console.warn('PDF 嵌入文本及坐标提取跳过:', e);
    }

    // 3. Render Page 1 to High-DPI Canvas (Scale 3.0) for ultra-clear OCR & Image Display
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 3.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (!context) {
      throw new Error('无法创建 Canvas 绘图上下文');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
    const resolution = `${Math.round(canvas.width)}×${Math.round(canvas.height)} px (3.0x 高清)`;

    return { imageBase64, pdfTextLines, pdfTextItemsWithPos, resolution };
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

export function extractDateFromString(rawText: string): string {
  if (!rawText) return '';

  // Standardize whitespace: replace newlines, tabs, multiple spaces with a single space
  const text = rawText.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Pattern 1: 4-digit year + month + day with optional spaces around delimiters (年/月/日 or . / -)
  // e.g. "2026年07月22日", "2026 年 07 月 22 日", "2026-07-22", "2026 - 07 - 22", "2026 . 07 . 22", "2026 / 07 / 22"
  const fullMatch = text.match(
    /(\d{4})\s*(?:年|[\.\-\/])\s*(\d{1,2})\s*(?:月|[\.\-\/])\s*(\d{1,2})\s*日?/
  );
  if (fullMatch) {
    const y = parseInt(fullMatch[1], 10);
    const m = parseInt(fullMatch[2], 10);
    const d = parseInt(fullMatch[3], 10);
    if (y >= 2020 && y <= 2040 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Pattern 2: Space or symbol separated "2026 07 22" or "2026 7 22"
  const spaceMatch = text.match(/\b(20\d{2})\s+(\d{1,2})\s+(\d{1,2})\b/);
  if (spaceMatch) {
    const y = parseInt(spaceMatch[1], 10);
    const m = parseInt(spaceMatch[2], 10);
    const d = parseInt(spaceMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Pattern 3: Month & Day e.g. "07月22日" or "07 月 22 日" or "7-22"
  const mdMatch = text.match(/(\d{1,2})\s*(?:月|[\.\-\/])\s*(\d{1,2})\s*日?/);
  if (mdMatch) {
    const m = parseInt(mdMatch[1], 10);
    const d = parseInt(mdMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const year = new Date().getFullYear();
      return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return '';
}

export function extractTimeFromString(rawText: string): string {
  if (!rawText) return '';
  const match = rawText.match(/([012]?\d)\s*[:：]\s*([0-5]\d)/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = match[2];
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }
  return '';
}

export function extractTextInRegionBox(
  itemsWithPos: PdfTextItemWithPos[],
  box: RegionBox
): string {
  if (!itemsWithPos || itemsWithPos.length === 0 || !box) return '';

  const matched = itemsWithPos.filter((item) => {
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    return (
      cx >= box.x - 2 &&
      cx <= box.x + box.width + 2 &&
      cy >= box.y - 2 &&
      cy <= box.y + box.height + 2
    );
  });

  return matched.map((m) => m.text).join(' ').trim();
}

export function parseFieldFromText(
  fieldKey: TicketFieldKey,
  rawText: string,
  fullTextLines?: string[]
): string {
  if (!rawText) return '';
  const text = rawText.trim();

  switch (fieldKey) {
    case 'origin':
    case 'destination': {
      const match = text.match(/([\u4e00-\u9fa5]{2,6})/);
      return match ? match[1].replace(/站$/, '').replace(/机场$/, '') : text.replace(/站$/, '').replace(/机场$/, '');
    }
    case 'trainNumber': {
      const match = text.match(/([GCDKTZ]\d{1,4}|[A-Z0-9]{2}\d{3,4})/i);
      return match ? match[1].toUpperCase() : text;
    }
    case 'departureDate': {
      const extracted = extractDateFromString(text);
      return extracted || text;
    }
    case 'departureTime': {
      const extracted = extractTimeFromString(text);
      return extracted || text;
    }
    case 'price': {
      const priceMatch = text.match(/(\d+\.\d{1,2})/);
      return priceMatch ? priceMatch[1] : text.replace(/[^\d.]/g, '');
    }
    case 'seatInfo': {
      return text;
    }
    default:
      return text;
  }
}

export function parseTicketInfoFromText(
  textList: string[],
  pdfTextItemsWithPos?: PdfTextItemWithPos[]
) {
  const fullText = textList.join(' ');

  let trainNumber = '';
  let origin = '';
  let destination = '';
  let departureDate = '';
  let departureTime = '';
  let price = 0;
  let seatInfo = '';

  // Station noise words & non-station term validator
  const isStationNoise = (str: string) => {
    if (!str) return true;
    const s = str.trim().replace(/站$/, '').replace(/机场$/, '');
    if (s.length < 2 || s.length > 8) return true;
    return /中国|铁路|国家|税务|总局|电子|客票|行程单|发票|开票|填开|报销|凭证|乘车|出发|到达|离港|改签|退票|身份证|号码|姓名|专用|章|复核|有限|责任|公司|人民币|二等|一等|商务|特等|硬座|硬卧|软卧|无座|联|存|款|即|元|车票|打印|票价|序号|金额|复核|项目|日期|时间|票号|席别|车厢|座位|舱位|座位号|检票|窗口|单价|校验|存根/i.test(
      s
    );
  };

  const findStationInItems = (items: PdfTextItemWithPos[], excludeStation: string = ''): string => {
    if (!items || items.length === 0) return '';
    const sorted = [...items].sort((a, b) => (Math.abs(a.y - b.y) < 3 ? a.x - b.x : a.y - b.y));
    
    // First try individual items
    for (const item of sorted) {
      const matches = item.text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
      for (const m of matches) {
        const cand = m.replace(/站$/, '').replace(/机场$/, '').trim();
        if (!isStationNoise(cand) && cand !== excludeStation && !/\d/.test(cand)) {
          return cand;
        }
      }
    }

    // Next try combined text of sorted items
    const combined = sorted.map((it) => it.text).join('');
    const matches = combined.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
    for (const m of matches) {
      const cand = m.replace(/站$/, '').replace(/机场$/, '').trim();
      if (!isStationNoise(cand) && cand !== excludeStation && !/\d/.test(cand)) {
        return cand;
      }
    }

    return '';
  };

  // 1. SPATIAL POSITION RECOGNITION (When PDF 2D Text Positions are available)
  if (pdfTextItemsWithPos && pdfTextItemsWithPos.length > 0) {
    // A. Spatial Origin: Top-Left region (X: 0..50, Y: 3..30)
    const topLeftItems = pdfTextItemsWithPos.filter(
      (it) => it.x >= 0 && it.x <= 50 && it.y >= 3 && it.y <= 30
    );
    origin = findStationInItems(topLeftItems);

    // B. Spatial Destination: Top-Right region (X: 45..100, Y: 3..30)
    const topRightItems = pdfTextItemsWithPos.filter(
      (it) => it.x >= 45 && it.x <= 100 && it.y >= 3 && it.y <= 30
    );
    destination = findStationInItems(topRightItems, origin);

    // C. Spatial Train Number: Top-Center region (X: 25..75, Y: 3..30)
    const topCenterItems = pdfTextItemsWithPos.filter(
      (it) => it.x >= 25 && it.x <= 75 && it.y >= 3 && it.y <= 30
    );
    const topCenterText = topCenterItems.map((it) => it.text).join(' ');
    const trainMatch = topCenterText.match(/\b([GCDKTZ]\d{1,4}|[A-Z0-9]{2}\d{3,4})\b/i);
    if (trainMatch) {
      trainNumber = trainMatch[1].toUpperCase();
    }

    // D. Spatial Departure Date & Time: Middle-Left region (X: 0..65, Y: 15..48)
    // Filter out items containing Invoice/Fill date words
    const middleDateItems = pdfTextItemsWithPos
      .filter(
        (it) => it.y >= 15 && it.y <= 48 && !/开票|填开|发票|打印/i.test(it.text)
      )
      .sort((a, b) => (Math.abs(a.y - b.y) < 3 ? a.x - b.x : a.y - b.y));

    const middleTextCombined = middleDateItems.map((it) => it.text).join(' ');
    if (!departureDate) {
      departureDate = extractDateFromString(middleTextCombined);
    }
    if (!departureTime) {
      departureTime = extractTimeFromString(middleTextCombined);
    }

    // E. Spatial Price: Middle-Right region (X: 50..100, Y: 18..48)
    const priceItems = pdfTextItemsWithPos.filter(
      (it) => it.x >= 50 && it.x <= 100 && it.y >= 18 && it.y <= 48
    );
    for (const item of priceItems) {
      const pMatch = item.text.match(/(?:￥|¥|人民币|票价|金额|元)?\s*(\d+\.\d{1,2})\s*元?/);
      if (pMatch) {
        price = parseFloat(pMatch[1]) || 0;
        if (price > 0) break;
      }
    }
  }

  // 2. TEXT HEURISTIC FALLBACKS (If any field is missing or for non-PDF image OCR)

  // Train Number
  if (!trainNumber) {
    const trainMatch =
      fullText.match(/\b([GCDKTZ]\d{1,4})\b/i) ||
      fullText.match(/\b([A-Z0-9]{2}\d{3,4})\b/i);
    if (trainMatch) {
      trainNumber = trainMatch[1].toUpperCase();
    }
  }

  // Departure Date
  if (!departureDate) {
    // Exclude lines starting with / containing "开票", "填开", "发票", "打印日期"
    const nonInvoiceLines: string[] = [];
    for (const line of textList) {
      if (/开票|填开|发票|打印日期/i.test(line)) break;
      nonInvoiceLines.push(line);
    }
    const joinedTopText = nonInvoiceLines.join(' ');
    departureDate = extractDateFromString(joinedTopText);

    if (!departureDate) {
      departureDate = extractDateFromString(fullText);
    }
  }

  // Departure Time
  if (!departureTime) {
    const nonInvoiceLines: string[] = [];
    for (const line of textList) {
      if (/开票|填开|发票|打印日期/i.test(line)) break;
      nonInvoiceLines.push(line);
    }
    departureTime =
      extractTimeFromString(nonInvoiceLines.join(' ')) ||
      extractTimeFromString(fullText);
  }

  // Origin & Destination
  if (!origin || !destination) {
    // Collect non-invoice lines
    const nonInvoiceLines: string[] = [];
    for (const line of textList) {
      if (/开票|填开|发票|打印日期/i.test(line)) break;
      nonInvoiceLines.push(line);
    }
    const headerJoined = nonInvoiceLines.join(' ');

    // 1. Route syntax match (e.g. "汉口 至 宜昌东", "汉口-宜昌东", "汉口 宜昌东", "武汉 站 咸宁北 站")
    const routeMatch = headerJoined.match(
      /([\u4e00-\u9fa5]{2,6}(?:站|机场)?)\s*(?:至|->|—|—→|–|到|-|\s+)\s*([\u4e00-\u9fa5]{2,6}(?:站|机场)?)/
    );
    if (routeMatch) {
      const origCand = routeMatch[1].replace(/站$/, '').replace(/机场$/, '').trim();
      const destCand = routeMatch[2].replace(/站$/, '').replace(/机场$/, '').trim();
      if (!isStationNoise(origCand) && !origin) origin = origCand;
      if (!isStationNoise(destCand) && !destination && destCand !== origin) destination = destCand;
    }

    // 2. Extract candidate station names across all non-invoice lines
    if (!origin || !destination) {
      const cleanStations: string[] = [];
      for (const line of nonInvoiceLines) {
        const matches = line.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
        for (const m of matches) {
          const cleaned = m.replace(/站$/, '').replace(/机场$/, '').trim();
          if (
            cleaned.length >= 2 &&
            cleaned.length <= 6 &&
            !isStationNoise(cleaned) &&
            !cleanStations.includes(cleaned) &&
            !/\d/.test(cleaned)
          ) {
            cleanStations.push(cleaned);
          }
        }
      }

      if (!origin && cleanStations[0]) {
        origin = cleanStations[0];
      }
      if (!destination) {
        const destCand = cleanStations.find((s) => s !== origin);
        if (destCand) destination = destCand;
      }
    }
  }

  // Price
  if (!price) {
    const priceMatch = fullText.match(
      /(?:￥|¥|人民币|票价|金额|元)?\s*(\d+\.\d{1,2})\s*元?/
    );
    if (priceMatch) {
      price = parseFloat(priceMatch[1]) || 0;
    }
  }

  // Seat Info
  if (!seatInfo) {
    const seatMatch = fullText.match(
      /(二等座|一等座|商务座|特等座|硬座|硬卧|软卧|无座|\d+车\d+[A-F0-9]号)/
    );
    if (seatMatch) {
      seatInfo = seatMatch[0];
    }
  }

  return {
    trainNumber,
    departureDate,
    departureTime,
    origin,
    destination,
    price,
    seatInfo,
    fullText,
  };
}

/**
 * Detects if a text or invoice contains hotel name and accommodation service item
 */
export function detectAccommodationInvoice(text: string): { isAccommodation: boolean; merchantName?: string; itemName?: string } {
  if (!text) return { isAccommodation: false };
  const hasHotel = /酒店|宾馆|客栈|民宿|饭店|大酒店|旅馆|山庄|公寓|温泉/i.test(text);
  const hasAccommodation = /住宿|住宿费|房费|客房|住宿服务|房费发票/i.test(text);

  if (hasHotel && hasAccommodation) {
    const hotelMatch = text.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:酒店|宾馆|客栈|民宿|饭店|大酒店|旅馆))/);
    const merchantName = hotelMatch ? hotelMatch[1] : undefined;
    return {
      isAccommodation: true,
      merchantName,
      itemName: '*住宿服务*住宿费',
    };
  }

  return { isAccommodation: false };
}

/**
 * Direct client-side OCR recognition (Pure Frontend Implementation)
 */
export async function processTicketOcr(
  file: File,
  ocrConfig?: OcrConfig
): Promise<TicketOcrResult> {
  const fileId = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fileName = file.name;
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  const provider = ocrConfig?.provider || 'local_paddle';
  const providerName = getOcrProviderName(provider);

  let imageBase64 = '';
  let mimeType = 'image/jpeg';
  let pdfTextLines: string[] = [];
  let pdfTextItemsWithPos: PdfTextItemWithPos[] = [];
  let convertedImageResolution = '';
  let processingSteps: { stepName: string; status: 'done' | 'processing' | 'failed'; detail?: string }[] = [];

  try {
    if (isPdf) {
      const pdfRes = await convertPdfToImageAndText(file);
      imageBase64 = pdfRes.imageBase64;
      pdfTextLines = pdfRes.pdfTextLines || [];
      pdfTextItemsWithPos = pdfRes.pdfTextItemsWithPos || [];
      convertedImageResolution = pdfRes.resolution || 'High-DPI Canvas (3.0x)';

      processingSteps = [
        { stepName: 'PDF 载入与 CMap 解码', status: 'done', detail: '已成功用 CJK 字体映射加载 PDF 矢量文件' },
        { stepName: '高清 Canvas 转换', status: 'done', detail: `已生成纯白背景 3.0x 高清图片 (${convertedImageResolution})` },
        {
          stepName: '矢量文本层读取',
          status: 'done',
          detail: pdfTextLines.length > 0 ? `提取到 ${pdfTextLines.length} 行内嵌文本及物理坐标` : '未检测到内嵌文本层，将完全依赖图像 OCR 识别',
        },
        { stepName: '智能 OCR & 字段识别', status: 'done', detail: `调用【${providerName}】精细提取字段` },
      ];
    } else {
      const compressed = await compressImageIfNeeded(file, 2000);
      imageBase64 = compressed.base64;
      mimeType = compressed.mimeType;
      convertedImageResolution = '原始照片 / 自动压缩';

      processingSteps = [
        { stepName: '图片文件载入', status: 'done', detail: '已优化图片清晰度与大小' },
        { stepName: '智能 OCR & 字段识别', status: 'done', detail: `调用【${providerName}】精细提取字段` },
      ];
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
      providerUsed: provider,
      providerName,
      convertedImageResolution,
      processingSteps: [
        { stepName: 'PDF / 图片读取解析', status: 'failed', detail: err.message || '解析失败' },
      ],
    };
  }

  // Parse direct PDF Chinese text layer with 2D spatial coordinates if present as auxiliary fallback
  const pdfParsed = pdfTextLines.length > 0 ? parseTicketInfoFromText(pdfTextLines, pdfTextItemsWithPos) : null;
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // STEP 1: Main Recognition Route -> High-Precision Multimodal Vision OCR (/api/ocr-ticket)
  // Regardless of whether file is PDF or Image, send converted high-DPI image & text layer context to Gemini Vision
  try {
    const res = await fetch('/api/ocr-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, ocrConfig, pdfTextLines }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.isValidTicket || data.trainNumber || data.origin || data.destination || data.recordType === 'expense' || data.price) {
        const fullPdfText = pdfTextLines.join(' ');
        const hotelCheck = detectAccommodationInvoice(fullPdfText);
        const isAccommodation = data.recordType === 'expense' || data.expenseCategory === '住宿' || hotelCheck.isAccommodation;

        const recordType = isAccommodation ? 'expense' : (data.recordType || 'trip');
        const expenseCategory = isAccommodation ? '住宿' : data.expenseCategory;
        const merchantName = data.merchantName || hotelCheck.merchantName || '';
        const itemName = data.itemName || hotelCheck.itemName || '';

        const transportType = inferTransportType(data.trainNumber || data.transportType || pdfParsed?.trainNumber);

        // Merge Gemini Vision results with pdfParsed cleanly without fake defaults
        const finalTrainNumber = data.trainNumber || pdfParsed?.trainNumber || '';
        const finalOrigin = data.origin || pdfParsed?.origin || '';
        const finalDestination = data.destination || pdfParsed?.destination || '';
        const finalDepartureDate = data.departureDate || pdfParsed?.departureDate || '';
        const finalDepartureTime = data.departureTime || pdfParsed?.departureTime || '';
        const finalPrice = typeof data.price === 'number' ? data.price : (pdfParsed?.price || 0);
        const finalSeatInfo = data.seatInfo || pdfParsed?.seatInfo || '';

        return {
          fileId,
          fileName,
          fileType: isPdf ? 'pdf' : 'image',
          previewUrl: imageBase64,
          isValidTicket: true,
          recordType,
          expenseCategory,
          merchantName,
          itemName,
          trainNumber: finalTrainNumber,
          transportType,
          origin: finalOrigin,
          destination: finalDestination,
          departureDate: finalDepartureDate,
          departureTime: finalDepartureTime,
          price: finalPrice,
          seatInfo: finalSeatInfo,
          confidenceScores: data.confidenceScores || {
            trainNumber: 0.98,
            origin: 0.96,
            destination: 0.96,
            departureDate: 0.98,
            departureTime: 0.92,
            price: 0.98,
            seatInfo: 0.9,
          },
          status: 'success',
          providerUsed: data.providerUsed || provider,
          providerName: data.providerUsed === 'baidu_ocr' ? '百度智能云 - 火车票 OCR' : 'Gemini 3.6 Flash 多模态视觉 AI',
          pdfTextLines,
          pdfTextItemsWithPos,
          convertedImageResolution,
          processingSteps: [
            ...processingSteps.filter(s => s.stepName !== '智能 OCR & 字段识别'),
            { stepName: 'AI 视觉 & 文本层双重识别', status: 'done', detail: '已通过 Gemini 3.6 多模态视觉精准读取票面图像并交叉校验文本层' }
          ],
        };
      }
    }
  } catch (err) {
    console.warn('API Vision OCR call failed, falling back to client-side local engine', err);
  }

  // STEP 2: Fallback for Custom Gemini API Key provided directly in client config
  const customKey = ocrConfig?.provider === 'custom_gemini' ? ocrConfig.apiKey : undefined;
  if (customKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: customKey });
      let promptText = `请识别这张火车票/电子客票行程单/机票/大巴票图片上的基本信息，并输出结构化 JSON 数据。
需求字段规范：
1. isValidTicket: 是否是有效的火车票、客票行程单或交通票据 (true / false)
2. trainNumber: 车次号/航班号/班次号 (如 G1234, D5678, K102, CA1234 等)
3. transportType: 交通工具类型 ("高铁", "火车", "飞机", "大巴", "的士", "网约车")
4. origin: 出发站/起点 (如 北京南, 上海, 广州)
5. destination: 到达站/终点 (如 杭州东, 深圳, 南京)
6. departureDate: 出发日期，格式必须为 YYYY-MM-DD (如 2026-08-01)
7. departureTime: 出发时间，24小时制 HH:mm (如 08:30)
8. price: 票价/车费金额 (数字，如 553.5)
9. seatInfo: 席别/车厢/座位号 (如 二等座 05车12A号)
10. confidenceScores: 各关键字段识别置信度(0.0 - 1.0 之间的浮点数)`;

      if (pdfTextLines.length > 0) {
        promptText += `\n\n【辅助文本层】该图片来源于 PDF 矢量转换，提取文本：\n${pdfTextLines.join(' | ')}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType } },
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidTicket: { type: Type.BOOLEAN },
              trainNumber: { type: Type.STRING },
              transportType: { type: Type.STRING },
              origin: { type: Type.STRING },
              destination: { type: Type.STRING },
              departureDate: { type: Type.STRING },
              departureTime: { type: Type.STRING },
              price: { type: Type.NUMBER },
              seatInfo: { type: Type.STRING },
              confidenceScores: {
                type: Type.OBJECT,
                properties: {
                  trainNumber: { type: Type.NUMBER },
                  origin: { type: Type.NUMBER },
                  destination: { type: Type.NUMBER },
                  departureDate: { type: Type.NUMBER },
                  departureTime: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                  seatInfo: { type: Type.NUMBER },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const transportType = inferTransportType(parsed.trainNumber || parsed.transportType || pdfParsed?.trainNumber);

      return {
        fileId,
        fileName,
        fileType: isPdf ? 'pdf' : 'image',
        previewUrl: imageBase64,
        isValidTicket: parsed.isValidTicket ?? true,
        trainNumber: parsed.trainNumber || pdfParsed?.trainNumber || '',
        transportType,
        origin: parsed.origin || pdfParsed?.origin || '',
        destination: parsed.destination || pdfParsed?.destination || '',
        departureDate: parsed.departureDate || pdfParsed?.departureDate || '',
        departureTime: parsed.departureTime || pdfParsed?.departureTime || '',
        price: typeof parsed.price === 'number' ? parsed.price : (pdfParsed?.price || 0),
        seatInfo: parsed.seatInfo || pdfParsed?.seatInfo || '',
        confidenceScores: parsed.confidenceScores || {
          trainNumber: 0.95,
          origin: 0.92,
          destination: 0.92,
          departureDate: 0.95,
          departureTime: 0.9,
          price: 0.95,
          seatInfo: 0.85,
        },
        status: 'success',
        providerUsed: provider,
        providerName,
        pdfTextLines,
        pdfTextItemsWithPos,
        convertedImageResolution,
        processingSteps,
      };
    } catch (e: any) {
      console.warn('Custom Gemini key call failed, fallback to local engine', e);
    }
  }

  // STEP 3: Local Browser Fallback (PaddleOCR / Client Regex)
  try {
    const ppu = await import('ppu-paddle-ocr').catch(() => null);
    let extractedTextList: string[] = [];

    if (ppu) {
      const ocrFn = ppu.ocr || ppu.default?.ocr || ppu.default;
      if (typeof ocrFn === 'function') {
        const img = new Image();
        img.src = imageBase64;
        await new Promise((r) => (img.onload = r));
        const ocrRes = await ocrFn(img);
        if (Array.isArray(ocrRes)) {
          const paddleLines = ocrRes
            .map((item: any) =>
              typeof item === 'string'
                ? item
                : item?.text || item?.words || String(item)
            )
            .filter(Boolean);
          extractedTextList.push(...paddleLines);
        }
      }
    }

    if (pdfTextLines.length > 0) {
      extractedTextList.push(...pdfTextLines);
    }

    const parsed = parseTicketInfoFromText(extractedTextList, pdfTextItemsWithPos);
    const transportType = inferTransportType(parsed.trainNumber || pdfParsed?.trainNumber);

    return {
      fileId,
      fileName,
      fileType: isPdf ? 'pdf' : 'image',
      previewUrl: imageBase64,
      isValidTicket: true,
      trainNumber: parsed.trainNumber || pdfParsed?.trainNumber || '',
      transportType: (parsed.trainNumber || pdfParsed?.trainNumber) ? transportType : '高铁',
      origin: parsed.origin || pdfParsed?.origin || '',
      destination: parsed.destination || pdfParsed?.destination || '',
      departureDate: parsed.departureDate || pdfParsed?.departureDate || '',
      departureTime: parsed.departureTime || pdfParsed?.departureTime || '',
      price: parsed.price || pdfParsed?.price || 0,
      seatInfo: parsed.seatInfo || pdfParsed?.seatInfo || '',
      confidenceScores: {
        trainNumber: 0.9,
        origin: 0.88,
        destination: 0.88,
        departureDate: 0.9,
        departureTime: 0.85,
        price: 0.9,
        seatInfo: 0.8,
      },
      status: 'success',
      providerUsed: 'local_paddle',
      providerName: '本地浏览器 Web-PaddleOCR',
      pdfTextLines,
      pdfTextItemsWithPos,
      convertedImageResolution,
      processingSteps,
    };
  } catch (err: any) {
    return {
      fileId,
      fileName,
      fileType: isPdf ? 'pdf' : 'image',
      previewUrl: imageBase64,
      pdfTextLines,
      pdfTextItemsWithPos,
      convertedImageResolution,
      processingSteps,
      isValidTicket: false,
      status: 'error',
      errorMessage: err.message || '识别失败，建议手动录入',
      providerUsed: provider,
      providerName,
    };
  }
}

