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
      const { imageBase64, mimeType = 'image/jpeg', ocrConfig, customApiKey } = req.body;

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
            const dateMatch = rawDate.match(/(\d{4})[年.-](\d{1,2})[月.-](\d{1,2})/);
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
              trainNumber: 0.95,
              origin: 0.95,
              destination: 0.95,
              departureDate: 0.9,
              departureTime: 0.85,
              price: 0.95,
              seatInfo: 0.85,
            },
            providerUsed: 'baidu_ocr',
          });
        } catch (baiduErr: any) {
          console.warn('Baidu OCR error, falling back to Gemini AI:', baiduErr.message);
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

      const promptText = `请识别这张火车票/电子客票行程单/机票/大巴票图片上的基本信息，并输出结构化 JSON 数据。
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
10. confidenceScores: 各关键字段识别置信度(0.0 - 1.0 之间的浮点数)，包括 trainNumber, origin, destination, departureDate, departureTime, price, seatInfo`;

      const response = await clientAi.models.generateContent({
        model: 'gemini-3.6-flash',
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

      const jsonText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch {
        parsedData = { isValidTicket: false };
      }

      parsedData.providerUsed = provider === 'custom_gemini' ? 'custom_gemini' : 'system_gemini';

      return res.json(parsedData);
    } catch (err: any) {
      console.error('OCR Ticket processing error:', err);
      return res.status(500).json({
        error: err.message || '票据识别失败，建议手动录入行程信息',
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
