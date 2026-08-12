import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with large payload for base64 ticket images/PDFs
  app.use(express.json({ limit: '30mb' }));

  // Initialize Gemini AI client server-side
  const defaultAi = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasDefaultKey: !!process.env.GEMINI_API_KEY });
  });

  // OCR Ticket Endpoint
  app.post('/api/ocr-ticket', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', ocrConfig, customApiKey, pdfTextLines } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: '请提供有效的图片或 PDF 图像 Base64 数据' });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const provider = ocrConfig?.provider || 'system_gemini';
      const apiKey = ocrConfig?.apiKey || customApiKey;
      const apiSecret = ocrConfig?.apiSecret;

      // 1. If user selected Baidu Cloud OCR and provided API Key + Secret Key
      if (provider === 'baidu_ocr' && apiKey && apiSecret) {
        try {
          // Step A: Get Baidu OAuth Token
          const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(
            apiKey
          )}&client_secret=${encodeURIComponent(apiSecret)}`;
          const tokenRes = await fetch(tokenUrl, { method: 'POST' });
          const tokenData = await tokenRes.json();

          if (!tokenData.access_token) {
            throw new Error(tokenData.error_description || '百度云 Token 获取失败，请检查 Key/Secret');
          }

          // Step B: Call Baidu Train Ticket OCR API
          const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/train_ticket?access_token=${tokenData.access_token}`;
          const params = new URLSearchParams();
          params.append('image', cleanBase64);

          const ocrRes = await fetch(ocrUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });

          const ocrData = await ocrRes.json();
          if (ocrData.error_code) {
            throw new Error(ocrData.error_msg || `百度 OCR 识别失败 (${ocrData.error_code})`);
          }

          const wr = ocrData.words_result || {};
          // Helper to normalize Baidu date "2026年08月01日" -> "2026-08-01"
          let rawDate = wr.date || wr.departure_date || '';
          let departureDate = '';
          if (rawDate) {
            const dateMatch = rawDate.match(/(\d{4})[年.-/](\d{1,2})[月.-/](\d{1,2})/);
            if (dateMatch) {
              departureDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            }
          }

          // Parse price "553.5元" -> 553.5
          let rawPrice = wr.ticket_rates || wr.price || '0';
          let priceNum = parseFloat(String(rawPrice).replace(/[^\d.]/g, '')) || 0;

          return res.json({
            isValidTicket: true,
            trainNumber: wr.train_num || wr.ticket_num || '',
            transportType: '火车',
            origin: wr.start_station || '',
            destination: wr.destination_station || '',
            departureDate,
            departureTime: wr.time || wr.departure_time || '',
            price: priceNum,
            seatInfo: wr.seat_category || wr.seat_num || '',
            confidenceScores: {
              trainNumber: 0.98,
              origin: 0.98,
              destination: 0.98,
              departureDate: 0.95,
              departureTime: 0.92,
              price: 0.98,
              seatInfo: 0.9,
            },
            providerUsed: 'baidu_ocr',
          });
        } catch (baiduErr: any) {
          console.warn('Baidu OCR error, falling back to Gemini AI Vision:', baiduErr.message);
          // If Baidu fails, we fall through to Gemini AI vision so the user request isn't blocked
        }
      }

      // 2. Default or Custom Gemini AI Vision Processing
      const clientAi = (provider === 'custom_gemini' && apiKey)
        ? new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          })
        : defaultAi;

      if (!clientAi) {
        return res.status(500).json({
          error: '服务端未配置 GEMINI_API_KEY，且未提供有效的 API Key。请在系统设置中配置 OCR 服务密钥。',
        });
      }

      let promptText = `你是一个精通中国交通票据/行程单以及各类报销发票（如住宿费/酒店发票、打车/出行/交通发票）的 AI 多模态视觉 OCR 识别专家。
请仔细查看这张票据/发票图片，精准提取票面上打印的关键行程或发票信息，并按 JSON 格式输出。

提取规则与核心字段要求：
1. recordType: 单据类型。
   - "trip": 交通客票行程单 (火车票、飞机票行程单、大巴票等)
   - "expense": 日常报销发票 (住宿发票、餐饮发票、交通发票等)
   【核心判定法则】：
   - 规则 A (住宿发票)：当发票的销售方名称/购买方/商户名称包含 "酒店"、"宾馆"、"客栈"、"饭店"、"民宿"、"大酒店"、"旅馆"，且货物或应税劳务/服务项目名称包含 "住宿"、"住宿费"、"房费"、"客房"、"*住宿服务*" 时，务必将 recordType 设为 "expense"，并将 expenseCategory 设为 "住宿"！
   - 规则 B (交通发票)：当发票名称/商户名/开票单位名称包含 "滴滴" 或 "出行"，或者货物/服务项目名称包含 "交通运输" 或 "客运服务" 时，务必将 recordType 设为 "expense"，并将 expenseCategory 设为 "交通"！
2. expenseCategory: 如果 recordType 为 "expense"，填写费用类型，如 "交通"、"住宿"、"餐饮"、"门票" 等。
3. merchantName: 商户/开票单位/酒店/出行公司名称 (如 "滴滴出行"、"亚朵酒店")。
4. itemName: 货物或服务项目名称 (如 "*交通运输服务*客运服务费"、"*住宿服务*住宿费")。
5. origin (起点/始发站): 交通票据的出发站名 (切记去除末尾"站"或"机场")。
6. destination (终点/到达站): 交通票据的到达站名 (切记去除末尾"站"或"机场")。
7. trainNumber (车次/航班号): 如 G1234, D5678, K102, CA1831 等。
8. transportType: "高铁", "火车", "飞机", "大巴", "的士", "网约车" 等。
9. departureDate: 乘车日期/发票开票或入住日期，格式统一为 YYYY-MM-DD (如 2026-07-16)。
10. departureTime: 出发时间，24小时制 HH:mm (如 08:30)。
11. price: 票价/发票总金额 (纯数字，如 358.0)。
12. seatInfo: 座位席别/车厢号/座位号。
13. confidenceScores: 各关键字段识别置信度 (0.0 - 1.0 的浮点数)。`;

      if (pdfTextLines && Array.isArray(pdfTextLines) && pdfTextLines.length > 0) {
        promptText += `\n\n【辅助验证文本层数据】该文件来源于 PDF 矢量转换，以下是从其矢量文本层提取的原始字符串（供辅助比对校对，注意以图片视觉呈现为最高准则）：\n${pdfTextLines.slice(0, 35).join(' | ')}`;
      }

      const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let lastError: any = null;
      let responseText = '';

      for (const modelName of candidateModels) {
        try {
          const response = await clientAi.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType,
                  },
                },
                { text: promptText },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isValidTicket: { type: Type.BOOLEAN },
                  recordType: { type: Type.STRING },
                  expenseCategory: { type: Type.STRING },
                  merchantName: { type: Type.STRING },
                  itemName: { type: Type.STRING },
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

          if (response.text) {
            responseText = response.text;
            break; // Success!
          }
        } catch (mErr: any) {
          lastError = mErr;
          console.warn(`Model ${modelName} call failed, trying next fallback...`, mErr?.message || mErr);
        }
      }

      if (responseText) {
        let parsedData;
        try {
          parsedData = JSON.parse(responseText);
        } catch {
          parsedData = { isValidTicket: false };
        }
        parsedData.providerUsed = provider === 'custom_gemini' ? 'custom_gemini' : 'system_gemini';
        return res.json(parsedData);
      }

      // If all Gemini AI models failed (e.g. 429 RESOURCE_EXHAUSTED quota limits)
      console.warn('All Gemini AI models failed/exhausted quota, triggering smart rule fallback parser');

      const isStationNoise = (str: string) => {
        if (!str) return true;
        const s = str.trim().replace(/站$/, '').replace(/机场$/, '');
        if (s.length < 2 || s.length > 8) return true;
        return /中国|铁路|国家|税务|总局|电子|客票|行程单|发票|开票|填开|报销|凭证|乘车|出发|到达|离港|改签|退票|身份证|号码|姓名|专用|章|复核|有限|责任|公司|人民币|二等|一等|商务|特等|硬座|硬卧|软卧|无座|联|存|款|即|元|车票|打印|票价|序号|金额|复核|项目|日期|时间|票号|席别|车厢|座位|舱位|座位号|检票|窗口|单价|校验|存根/i.test(
          s
        );
      };

      const extractDateFromRaw = (rawText: string) => {
        if (!rawText) return '';
        const text = rawText.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
        const fullMatch = text.match(/(\d{4})\s*(?:年|[\.\-\/])\s*(\d{1,2})\s*(?:月|[\.\-\/])\s*(\d{1,2})\s*日?/);
        if (fullMatch) {
          const y = parseInt(fullMatch[1], 10);
          const m = parseInt(fullMatch[2], 10);
          const d = parseInt(fullMatch[3], 10);
          if (y >= 2020 && y <= 2040 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
        }
        const spaceMatch = text.match(/\b(20\d{2})\s+(\d{1,2})\s+(\d{1,2})\b/);
        if (spaceMatch) {
          const y = parseInt(spaceMatch[1], 10);
          const m = parseInt(spaceMatch[2], 10);
          const d = parseInt(spaceMatch[3], 10);
          if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
        }
        return '';
      };

      const extractTimeFromRaw = (rawText: string) => {
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
      };
      
      let fallbackData: any = {
        isValidTicket: true,
        trainNumber: '',
        origin: '',
        destination: '',
        departureDate: '',
        departureTime: '',
        price: 0,
        seatInfo: '',
        confidenceScores: {
          trainNumber: 0.8,
          origin: 0.8,
          destination: 0.8,
          departureDate: 0.8,
          departureTime: 0.8,
          price: 0.8,
          seatInfo: 0.7,
        },
        providerUsed: 'rule_fallback',
        quotaExceededNotice: 'API 调用已达免费配额上限，已启用规则降级提取，请核对并调整字段',
      };

      if (pdfTextLines && Array.isArray(pdfTextLines) && pdfTextLines.length > 0) {
        const fullText = pdfTextLines.join(' ');
        const trainMatch = fullText.match(/\b([GDCKTZ]\d{1,4}|[A-Z0-9]{2}\d{3,4})\b/i);
        if (trainMatch) fallbackData.trainNumber = trainMatch[1].toUpperCase();

        // Departure Date: Filter out lines containing 开票, 填开, 发票, 打印
        const nonInvoiceLines: string[] = [];
        for (const line of pdfTextLines) {
          if (/开票|填开|发票|打印日期/i.test(line)) break;
          nonInvoiceLines.push(line);
        }
        
        fallbackData.departureDate = extractDateFromRaw(nonInvoiceLines.join(' ')) || extractDateFromRaw(fullText);
        fallbackData.departureTime = extractTimeFromRaw(nonInvoiceLines.join(' ')) || extractTimeFromRaw(fullText);

        const priceMatch = fullText.match(/(?:￥|¥|人民币|票价|金额|元)?\s*(\d+\.\d{1,2})\s*元?/);
        if (priceMatch) {
          const p = parseFloat(priceMatch[1]);
          if (p) fallbackData.price = p;
        }

        // Stations: route match or clean station words across non-invoice lines
        const headerJoined = nonInvoiceLines.join(' ');
        const routeMatch = headerJoined.match(
          /([\u4e00-\u9fa5]{2,6}(?:站|机场)?)\s*(?:至|->|—|—→|–|到|-|\s+)\s*([\u4e00-\u9fa5]{2,6}(?:站|机场)?)/
        );
        if (routeMatch) {
          const orig = routeMatch[1].replace(/站$/, '').replace(/机场$/, '').trim();
          const dest = routeMatch[2].replace(/站$/, '').replace(/机场$/, '').trim();
          if (!isStationNoise(orig)) fallbackData.origin = orig;
          if (!isStationNoise(dest) && dest !== fallbackData.origin) fallbackData.destination = dest;
        }

        if (!fallbackData.origin || !fallbackData.destination) {
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
          if (!fallbackData.origin && cleanStations[0]) {
            fallbackData.origin = cleanStations[0];
          }
          if (!fallbackData.destination) {
            const destCand = cleanStations.find((s) => s !== fallbackData.origin);
            if (destCand) fallbackData.destination = destCand;
          }
        }
      }

      return res.json(fallbackData);
    } catch (err: any) {
      console.error('OCR Ticket processing catch fallback:', err);
      return res.json({
        isValidTicket: true,
        trainNumber: '',
        origin: '',
        destination: '',
        departureDate: '',
        departureTime: '',
        price: 0,
        seatInfo: '',
        confidenceScores: {
          trainNumber: 0.7,
          origin: 0.7,
          destination: 0.7,
          departureDate: 0.7,
          departureTime: 0.7,
          price: 0.7,
          seatInfo: 0.7,
        },
        providerUsed: 'client_fallback',
        quotaExceededNotice: '处理发生异常，已保留草稿，请补充填写',
      });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
