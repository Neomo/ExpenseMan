export type TransportType = '的士' | '网约车' | '大巴' | '火车' | '飞机' | string;

export type ExpenseCategoryType = '物品' | '饮品' | '水果' | '餐饮' | '住宿' | '通讯' | '门票' | '娱乐' | string;

export interface TripItem {
  id: string;
  date: string; // YYYY-MM-DD
  transport: TransportType;
  origin?: string;
  destination?: string;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  amount: number; // RMB
  remarks?: string;
  createdAt: number;
}

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategoryType;
  amount: number; // RMB
  description?: string;
  createdAt: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: 'transport' | 'expense';
  icon?: string;
  isDefault?: boolean;
}

export interface OcrConfig {
  provider: 'system_gemini' | 'custom_gemini' | 'baidu_ocr' | 'tencent_ocr' | 'aliyun_ocr';
  apiKey?: string;
  apiSecret?: string;
}

export interface TicketOcrResult {
  fileId: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  previewUrl?: string;
  isValidTicket: boolean;
  trainNumber?: string;
  transportType?: TransportType;
  origin?: string;
  destination?: string;
  departureDate?: string;
  departureTime?: string;
  price?: number;
  seatInfo?: string;
  confidenceScores?: Record<string, number>;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  isEncryptedPdf?: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  currencySymbol: string;
  ocrConfig?: OcrConfig;
}

export type ViewMode = 'month' | 'week' | 'day';

export type ReportDimension = 'day' | 'week' | 'month' | 'custom';

export interface ReportFilter {
  dimension: ReportDimension;
  selectedDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  showTrips: boolean;
  showExpenses: boolean;
}

export interface BackupData {
  version: string;
  exportTime: string;
  trips: TripItem[];
  expenses: ExpenseItem[];
  customCategories: CustomCategory[];
  settings: AppSettings;
}
