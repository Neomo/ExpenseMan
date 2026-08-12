export type TransportType = '高铁' | '的士' | '网约车' | '大巴' | '火车' | '飞机' | string;

export type ExpenseCategoryType = '交通' | '餐饮' | '住宿' | '物品' | '饮品' | '水果' | '礼物' | '补贴' | '其他' | string;

export interface AllowanceConfig {
  homeCity: string;
  allowanceRate: number;
  autoAddAllowance: boolean;
}

export interface TripItem {
  id: string;
  date: string; // YYYY-MM-DD
  transport: TransportType;
  trainNumber?: string; // 车次 / 航班号 (e.g. G1234, MU5108)
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

export interface RegionBox {
  x: number;      // 0 - 100 percentage
  y: number;      // 0 - 100 percentage
  width: number;  // 0 - 100 percentage
  height: number; // 0 - 100 percentage
}

export type TicketFieldKey =
  | 'origin'
  | 'destination'
  | 'departureDate'
  | 'departureTime'
  | 'trainNumber'
  | 'price'
  | 'seatInfo';

export interface TicketTemplateProfile {
  id: string;
  name: string;
  isDefault?: boolean;
  ticketType?: 'train' | 'flight' | 'bus' | 'general';
  regions: Record<TicketFieldKey, RegionBox>;
  createdAt: number;
}

export interface PdfTextItemWithPos {
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

export interface OcrConfig {
  provider: 'local_paddle' | 'system_gemini' | 'custom_gemini' | 'baidu_ocr' | 'tencent_ocr' | 'aliyun_ocr';
  apiKey?: string;
  apiSecret?: string;
  activeTemplateId?: string;
}

export interface TicketOcrResult {
  fileId: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  previewUrl?: string;
  isValidTicket: boolean;
  recordType?: 'trip' | 'expense';
  expenseCategory?: ExpenseCategoryType;
  merchantName?: string;
  itemName?: string;
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
  providerUsed?: string;
  providerName?: string;
  pdfTextLines?: string[];
  pdfTextItemsWithPos?: PdfTextItemWithPos[];
  convertedImageResolution?: string;
  processingSteps?: { stepName: string; status: 'done' | 'processing' | 'failed'; detail?: string }[];
  appliedTemplateName?: string;
  appliedTemplateId?: string;
}

export interface DraftTrip extends TicketOcrResult {
  editedRecordType?: 'trip' | 'expense';
  editedCategory?: ExpenseCategoryType;
  editedMerchantName?: string;
  editedTrainNumber: string;
  editedTransport: TransportType;
  editedOrigin: string;
  editedDestination: string;
  editedDate: string;
  editedStartTime: string;
  editedAmount: number;
  editedRemarks: string;
  isEditing?: boolean;
  isDuplicate?: boolean;
}

export interface TripChain {
  id: string;
  title: string; // e.g. "汉口往返环线"
  startCity: string; // e.g. "汉口"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  legs: TripItem[];
  cities: string[]; // e.g. ["汉口", "随州南", "十堰东", "汉口"]
  totalCost: number;
  totalDays: number;
  themeIndex: number;
}

export type CalendarThemeKey = 'island' | 'sakura' | 'ocean' | 'maple' | 'winter' | 'slate';

export interface CalendarDisplayConfig {
  showExpenses: boolean;          // 是否显示非行程费用项
  showTripTicketCost: boolean;    // 是否显示行程车票金额
  showTripStartTime: boolean;     // 是否显示行程出发时间
  showDailyTotal: boolean;        // 是否显示每日合计费用
  weekdayFormat: 'zh' | 'en';     // 星期格式: 'zh'(周一...) 或 'en'(MON...)
  theme: CalendarThemeKey;        // 日历主题
}

export interface AppSettings {
  theme: 'light' | 'dark';
  currencySymbol: string;
  ocrConfig?: OcrConfig;
  calendarDisplayConfig?: CalendarDisplayConfig;
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
