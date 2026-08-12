import { create } from 'zustand';
import { format } from 'date-fns';
import { TripItem, ExpenseItem, CustomCategory, ViewMode, BackupData, OcrConfig, DraftTrip } from '../types';
import { CityStationRecord, RailwayStation, DEFAULT_CITY_STATION_RECORDS } from '../data/defaultCityStations';
import * as db from '../services/db';
import { processTicketOcr } from '../utils/ticketOcr';

interface AppState {
  // Data State
  trips: TripItem[];
  expenses: ExpenseItem[];
  customCategories: CustomCategory[];
  cityStations: CityStationRecord[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  ocrConfig: OcrConfig;

  // Background OCR State
  ocrDrafts: DraftTrip[];
  isOcrProcessing: boolean;
  ocrProgressText: string;
  ocrTotalFiles: number;
  ocrCompletedFiles: number;

  // View Controls
  activeTab: 'calendar' | 'list' | 'map' | 'report' | 'settings';
  currentViewMode: ViewMode;
  selectedDate: string; // YYYY-MM-DD
  calendarFocusDate: Date; // date object driving month/week/day view

  // Modals & Editors
  dateDetailOpen: boolean;
  tripModalOpen: boolean;
  expenseModalOpen: boolean;
  ocrModalOpen: boolean;
  editingTrip: TripItem | null;
  editingExpense: ExpenseItem | null;

  // Feedback Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Actions
  init: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: 'calendar' | 'list' | 'map' | 'report' | 'settings') => void;
  setCurrentViewMode: (mode: ViewMode) => void;
  setSelectedDate: (dateStr: string) => void;
  setCalendarFocusDate: (date: Date) => void;

  // City Station DB Actions
  addCityStation: (record: Omit<CityStationRecord, 'id'>) => Promise<void>;
  updateCityStation: (id: string, record: Partial<CityStationRecord>) => Promise<void>;
  deleteCityStation: (id: string) => Promise<void>;
  addStationToCity: (cityId: string, station: Omit<RailwayStation, 'id'>) => Promise<void>;
  deleteStationFromCity: (cityId: string, stationId: string) => Promise<void>;
  resetCityStationsToDefault: () => Promise<void>;
  
  // Date Detail Panel
  openDateDetail: (dateStr: string) => void;
  closeDateDetail: () => void;

  // Trip Actions
  openTripModal: (trip?: TripItem, dateStr?: string) => void;
  closeTripModal: () => void;
  addOrUpdateTrip: (trip: TripItem) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;

  // Expense Actions
  openExpenseModal: (expense?: ExpenseItem, dateStr?: string) => void;
  closeExpenseModal: () => void;
  addOrUpdateExpense: (expense: ExpenseItem) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Custom Category Actions
  addCustomCategory: (name: string, type: 'transport' | 'expense') => Promise<void>;
  deleteCustomCategory: (id: string) => Promise<void>;

  // Import / Export / Backup
  exportData: () => Promise<BackupData>;
  importData: (data: BackupData, mode: 'override' | 'merge') => Promise<void>;
  clearAllData: () => Promise<void>;
  seedDemoData: () => Promise<void>;

  // OCR Actions
  openOcrModal: () => void;
  closeOcrModal: () => void;
  saveOcrConfig: (config: OcrConfig) => Promise<void>;
  batchAddTrips: (newTrips: TripItem[]) => Promise<void>;
  batchAddExpenses: (newExpenses: ExpenseItem[]) => Promise<void>;
  processOcrFiles: (files: FileList | File[]) => Promise<void>;
  setOcrDrafts: (drafts: DraftTrip[] | ((prev: DraftTrip[]) => DraftTrip[])) => void;
  clearOcrDrafts: () => void;

  // Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  trips: [],
  expenses: [],
  customCategories: [],
  cityStations: DEFAULT_CITY_STATION_RECORDS,
  theme: 'light',
  isLoading: true,
  ocrConfig: { provider: 'local_paddle' },

  ocrDrafts: [],
  isOcrProcessing: false,
  ocrProgressText: '',
  ocrTotalFiles: 0,
  ocrCompletedFiles: 0,

  activeTab: 'calendar',
  currentViewMode: 'month',
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  calendarFocusDate: new Date(),

  dateDetailOpen: false,
  tripModalOpen: false,
  expenseModalOpen: false,
  ocrModalOpen: false,
  editingTrip: null,
  editingExpense: null,

  toast: null,

  init: async () => {
    set({ isLoading: true });
    try {
      await db.initDefaultData();
      const trips = await db.getAllTrips();
      const expenses = await db.getAllExpenses();
      const customCategories = await db.getAllCustomCategories();
      const storedCityStations = await db.getCityStations();
      const storedTheme = await db.getSetting<'light' | 'dark'>('theme', 'light');
      const storedOcrConfig = await db.getSetting<OcrConfig>('ocrConfig', { provider: 'local_paddle' });

      // Apply theme to document element
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      set({
        trips,
        expenses,
        customCategories,
        cityStations: storedCityStations,
        theme: storedTheme,
        ocrConfig: storedOcrConfig,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to initialize IndexedDB:', err);
      set({ isLoading: false });
      get().showToast('数据库初始化失败，请检查浏览器设置', 'error');
    }
  },

  // City Station DB Actions
  addCityStation: async (recordData) => {
    const newRecord: CityStationRecord = {
      ...recordData,
      id: `city-${Date.now()}`,
    };
    const updated = [newRecord, ...get().cityStations];
    set({ cityStations: updated });
    await db.saveCityStations(updated);
    get().showToast(`已新增城市「${newRecord.cityName}」映射记录`, 'success');
  },

  updateCityStation: async (id, partialRecord) => {
    const updated = get().cityStations.map((item) =>
      item.id === id ? { ...item, ...partialRecord } : item
    );
    set({ cityStations: updated });
    await db.saveCityStations(updated);
    get().showToast('已更新城市与火车站数据', 'success');
  },

  deleteCityStation: async (id) => {
    const target = get().cityStations.find((item) => item.id === id);
    const updated = get().cityStations.filter((item) => item.id !== id);
    set({ cityStations: updated });
    await db.saveCityStations(updated);
    get().showToast(`已删除城市「${target?.cityName || ''}」及其火车站数据`, 'info');
  },

  addStationToCity: async (cityId, stationData) => {
    const newStation: RailwayStation = {
      ...stationData,
      id: `st-${Date.now()}`,
    };
    const updated = get().cityStations.map((city) => {
      if (city.id === cityId) {
        return {
          ...city,
          stations: [...city.stations, newStation],
        };
      }
      return city;
    });
    set({ cityStations: updated });
    await db.saveCityStations(updated);
    get().showToast(`已添加火车站「${newStation.name}」`, 'success');
  },

  deleteStationFromCity: async (cityId, stationId) => {
    const updated = get().cityStations.map((city) => {
      if (city.id === cityId) {
        return {
          ...city,
          stations: city.stations.filter((st) => st.id !== stationId),
        };
      }
      return city;
    });
    set({ cityStations: updated });
    await db.saveCityStations(updated);
    get().showToast('已移除该火车站', 'info');
  },

  resetCityStationsToDefault: async () => {
    set({ cityStations: DEFAULT_CITY_STATION_RECORDS });
    await db.saveCityStations(DEFAULT_CITY_STATION_RECORDS);
    get().showToast('已恢复预设城市火车站数据库', 'success');
  },

  openOcrModal: () => set({ ocrModalOpen: true }),
  closeOcrModal: () => set({ ocrModalOpen: false }),

  setOcrDrafts: (draftsOrFn) => {
    if (typeof draftsOrFn === 'function') {
      set((state) => ({ ocrDrafts: draftsOrFn(state.ocrDrafts) }));
    } else {
      set({ ocrDrafts: draftsOrFn });
    }
  },

  clearOcrDrafts: () => set({ ocrDrafts: [] }),

  processOcrFiles: async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];

    fileArray.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && allowedExts.includes(ext)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      get().showToast('仅支持上传 .pdf, .jpg, .jpeg, .png 格式的票据文件', 'error');
      return;
    }

    set({
      isOcrProcessing: true,
      ocrTotalFiles: validFiles.length,
      ocrCompletedFiles: 0,
      ocrProgressText: `准备识别 ${validFiles.length} 张票据...`,
    });

    const newDrafts: DraftTrip[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      set({
        ocrCompletedFiles: i,
        ocrProgressText: `正在处理第 ${i + 1}/${validFiles.length} 张: ${file.name}`,
      });

      const result = await processTicketOcr(file, get().ocrConfig);

      const existingTrips = get().trips;
      const existingExpenses = get().expenses;

      const isExpenseDraft = result.recordType === 'expense' || result.expenseCategory === '住宿';

      const isDup = isExpenseDraft
        ? existingExpenses.some((existing) => {
            const sameCategory = existing.category === (result.expenseCategory || '住宿');
            const sameDate = existing.date === result.departureDate;
            const sameAmount = Math.abs(existing.amount - (result.price || 0)) < 0.01;
            return sameCategory && sameDate && sameAmount;
          })
        : existingTrips.some((existing) => {
            const sameTrain = (result.trainNumber || '').trim().toLowerCase() === (existing.trainNumber || '').trim().toLowerCase();
            const sameDate = (result.departureDate || '') === existing.date;
            const sameOrigin = (result.origin || '').trim().toLowerCase() === (existing.origin || '').trim().toLowerCase();
            const sameDest = (result.destination || '').trim().toLowerCase() === (existing.destination || '').trim().toLowerCase();
            const sameAmount = Math.abs((result.price || 0) - existing.amount) < 0.01;
            return sameTrain && sameDate && sameOrigin && sameDest && sameAmount;
          });

      const draft: DraftTrip = {
        ...result,
        editedRecordType: isExpenseDraft ? 'expense' : (result.recordType || 'trip'),
        editedCategory: (result.expenseCategory as any) || '住宿',
        editedMerchantName: result.merchantName || '',
        editedTrainNumber: result.trainNumber || '',
        editedTransport: result.transportType || '火车',
        editedOrigin: result.origin || '',
        editedDestination: result.destination || '',
        editedDate: result.departureDate || new Date().toISOString().split('T')[0],
        editedStartTime: result.departureTime || '',
        editedAmount: result.price || 0,
        editedRemarks: result.merchantName
          ? `商户/酒店: ${result.merchantName}${result.itemName ? ` (${result.itemName})` : ''}`
          : result.seatInfo
          ? `席别: ${result.seatInfo}`
          : '',
        isDuplicate: isDup,
      };

      newDrafts.push(draft);
    }

    const successCount = newDrafts.filter((d) => d.status === 'success').length;
    const dupCount = newDrafts.filter((d) => d.isDuplicate).length;

    set((state) => ({
      ocrDrafts: [...state.ocrDrafts, ...newDrafts],
      isOcrProcessing: false,
      ocrProgressText: '',
      ocrCompletedFiles: validFiles.length,
      ocrModalOpen: true, // Auto pop-up review/save modal when completed!
    }));

    if (dupCount > 0) {
      get().showToast(
        `处理完成 ${validFiles.length} 张票据/发票，其中检测到 ${dupCount} 张与现有数据重复`,
        'info'
      );
    } else if (successCount > 0) {
      get().showToast(`已成功识别 ${successCount} 张票据/发票，为您弹出一键核对保存界面！`, 'success');
    } else {
      get().showToast('票据处理完毕，请在弹窗中进行核对', 'info');
    }
  },

  saveOcrConfig: async (config: OcrConfig) => {
    await db.saveSetting('ocrConfig', config);
    set({ ocrConfig: config });
    get().showToast('OCR 服务配置已保存至本地', 'success');
  },

  batchAddTrips: async (newTrips: TripItem[]) => {
    const existingTrips = get().trips;
    const uniqueTrips: TripItem[] = [];
    let skippedDuplicates = 0;

    for (const trip of newTrips) {
      const isDup = existingTrips.some((existing) => {
        const sameTrain = (trip.trainNumber || '').trim().toLowerCase() === (existing.trainNumber || '').trim().toLowerCase();
        const sameDate = trip.date === existing.date;
        const sameOrigin = (trip.origin || '').trim().toLowerCase() === (existing.origin || '').trim().toLowerCase();
        const sameDest = (trip.destination || '').trim().toLowerCase() === (existing.destination || '').trim().toLowerCase();
        const sameAmount = Math.abs(trip.amount - existing.amount) < 0.01;
        return sameTrain && sameDate && sameOrigin && sameDest && sameAmount;
      });

      if (isDup) {
        skippedDuplicates++;
      } else {
        uniqueTrips.push(trip);
      }
    }

    if (uniqueTrips.length > 0) {
      for (const trip of uniqueTrips) {
        await db.saveTrip(trip);
      }
      const trips = await db.getAllTrips();
      set({ trips, ocrModalOpen: false, ocrDrafts: [] });

      if (skippedDuplicates > 0) {
        get().showToast(
          `成功导入 ${uniqueTrips.length} 条行程记录（跳过 ${skippedDuplicates} 条在【车次、日期、起点、终点、费用】维度均相同的重复数据）`,
          'info'
        );
      } else {
        get().showToast(`已批量保存 ${uniqueTrips.length} 条行程记录`, 'success');
      }
    } else {
      set({ ocrModalOpen: false, ocrDrafts: [] });
      get().showToast(
        `检测到 ${newTrips.length} 条识别数据与现有数据在【车次、日期、起点、终点、费用】维度完全一致，未重复导入！`,
        'info'
      );
    }
  },

  batchAddExpenses: async (newExpenses: ExpenseItem[]) => {
    const existingExpenses = get().expenses;
    const uniqueExpenses: ExpenseItem[] = [];
    let skippedDuplicates = 0;

    for (const exp of newExpenses) {
      const isDup = existingExpenses.some((existing) => {
        const sameCategory = exp.category === existing.category;
        const sameDate = exp.date === existing.date;
        const sameAmount = Math.abs(exp.amount - existing.amount) < 0.01;
        const sameDesc = (exp.description || '').trim() === (existing.description || '').trim();
        return sameCategory && sameDate && sameAmount && sameDesc;
      });

      if (isDup) {
        skippedDuplicates++;
      } else {
        uniqueExpenses.push(exp);
      }
    }

    if (uniqueExpenses.length > 0) {
      for (const exp of uniqueExpenses) {
        await db.saveExpense(exp);
      }
      const expenses = await db.getAllExpenses();
      set({ expenses, ocrModalOpen: false, ocrDrafts: [] });

      if (skippedDuplicates > 0) {
        get().showToast(
          `成功导入 ${uniqueExpenses.length} 条费用记录（跳过 ${skippedDuplicates} 条重复费用数据）`,
          'info'
        );
      } else {
        get().showToast(`已批量保存 ${uniqueExpenses.length} 条费用记录`, 'success');
      }
    } else {
      set({ ocrModalOpen: false, ocrDrafts: [] });
      get().showToast(
        `检测到 ${newExpenses.length} 条费用识别数据与现有数据完全一致，未重复导入！`,
        'info'
      );
    }
  },

  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    db.saveSetting('theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentViewMode: (mode) => set({ currentViewMode: mode }),
  setSelectedDate: (dateStr) => {
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const focusDate = new Date(y, m, d);
          set({ selectedDate: dateStr, calendarFocusDate: focusDate });
          return;
        }
      }
    }
    set({ selectedDate: dateStr });
  },
  setCalendarFocusDate: (date) => set({ calendarFocusDate: date }),

  openDateDetail: (dateStr) => set({ selectedDate: dateStr, dateDetailOpen: true }),
  closeDateDetail: () => set({ dateDetailOpen: false }),

  openTripModal: (trip, dateStr) => {
    set({
      editingTrip: trip || null,
      selectedDate: dateStr || trip?.date || get().selectedDate,
      tripModalOpen: true,
    });
  },
  closeTripModal: () => set({ tripModalOpen: false, editingTrip: null }),

  addOrUpdateTrip: async (trip) => {
    await db.saveTrip(trip);
    const trips = await db.getAllTrips();
    set({ trips, tripModalOpen: false, editingTrip: null });
    get().showToast(trip.id ? '行程记录已更新' : '已成功添加行程', 'success');
  },

  deleteTrip: async (id) => {
    await db.deleteTrip(id);
    const trips = await db.getAllTrips();
    set({ trips });
    get().showToast('行程已删除', 'info');
  },

  openExpenseModal: (expense, dateStr) => {
    set({
      editingExpense: expense || null,
      selectedDate: dateStr || expense?.date || get().selectedDate,
      expenseModalOpen: true,
    });
  },
  closeExpenseModal: () => set({ expenseModalOpen: false, editingExpense: null }),

  addOrUpdateExpense: async (expense) => {
    await db.saveExpense(expense);
    const expenses = await db.getAllExpenses();
    set({ expenses, expenseModalOpen: false, editingExpense: null });
    get().showToast(expense.id ? '费用记录已更新' : '已成功添加费用', 'success');
  },

  deleteExpense: async (id) => {
    await db.deleteExpense(id);
    const expenses = await db.getAllExpenses();
    set({ expenses });
    get().showToast('费用已删除', 'info');
  },

  addCustomCategory: async (name, type) => {
    const newCat: CustomCategory = {
      id: `custom-${Date.now()}`,
      name,
      type,
      isDefault: false,
    };
    await db.saveCustomCategory(newCat);
    const customCategories = await db.getAllCustomCategories();
    set({ customCategories });
    get().showToast(`已成功新增${type === 'transport' ? '交通工具' : '费用类别'}: ${name}`, 'success');
  },

  deleteCustomCategory: async (id) => {
    await db.deleteCustomCategory(id);
    const customCategories = await db.getAllCustomCategories();
    set({ customCategories });
    get().showToast('已删除分类', 'info');
  },

  exportData: async () => {
    return db.exportBackupData();
  },

  importData: async (data, mode) => {
    set({ isLoading: true });
    try {
      const res = await db.importBackupData(data, mode);
      const trips = await db.getAllTrips();
      const expenses = await db.getAllExpenses();
      const customCategories = await db.getAllCustomCategories();
      const storedTheme = await db.getSetting<'light' | 'dark'>('theme', 'light');

      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      set({
        trips,
        expenses,
        customCategories,
        theme: storedTheme,
        isLoading: false,
      });
      get().showToast(`数据导入成功！导入 ${res.tripsImported} 条行程和 ${res.expensesImported} 条费用`, 'success');
    } catch (err) {
      console.error('Import failed:', err);
      set({ isLoading: false });
      get().showToast('数据导入失败，请检查文件格式', 'error');
    }
  },

  clearAllData: async () => {
    set({ isLoading: true });
    try {
      const dbInstance = await db.getDB();
      const tx = dbInstance.transaction(['trips', 'expenses'], 'readwrite');
      await tx.objectStore('trips').clear();
      await tx.objectStore('expenses').clear();
      await tx.done;

      set({ trips: [], expenses: [], isLoading: false });
      get().showToast('所有行程和费用记录已清空', 'info');
    } catch (err) {
      set({ isLoading: false });
      get().showToast('清空数据失败', 'error');
    }
  },

  seedDemoData: async () => {
    set({ isLoading: true });
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');

      const demoTrips: TripItem[] = [
        {
          id: 'demo-t1',
          date: `${yyyy}-${mm}-05`,
          transport: '飞机',
          origin: '北京首都国际机场 T3',
          destination: '上海虹桥国际机场 T2',
          startTime: '08:30',
          endTime: '11:00',
          amount: 850,
          remarks: 'MU5108 航班 / 客户拜访',
          createdAt: Date.now() - 86400000 * 10,
        },
        {
          id: 'demo-t2',
          date: `${yyyy}-${mm}-05`,
          transport: '网约车',
          origin: '上海虹桥机场',
          destination: '静安区陆家嘴金融中心',
          startTime: '11:20',
          endTime: '12:05',
          amount: 78,
          remarks: '打车前往客户办公室',
          createdAt: Date.now() - 86400000 * 10,
        },
        {
          id: 'demo-t3',
          date: `${yyyy}-${mm}-08`,
          transport: '火车',
          origin: '上海虹桥站',
          destination: '杭州东站',
          startTime: '14:00',
          endTime: '14:48',
          amount: 73,
          remarks: 'G7335 高铁二等座',
          createdAt: Date.now() - 86400000 * 7,
        },
        {
          id: 'demo-t4',
          date: `${yyyy}-${mm}-12`,
          transport: '的士',
          origin: '杭州酒店',
          destination: '西湖科技园',
          startTime: '09:00',
          endTime: '09:25',
          amount: 35,
          remarks: '参展往返交通',
          createdAt: Date.now() - 86400000 * 3,
        },
      ];

      const demoExpenses: ExpenseItem[] = [
        {
          id: 'demo-e1',
          date: `${yyyy}-${mm}-05`,
          category: '餐饮',
          amount: 168,
          description: '与客户商务午餐',
          createdAt: Date.now() - 86400000 * 10,
        },
        {
          id: 'demo-e2',
          date: `${yyyy}-${mm}-05`,
          category: '住宿',
          amount: 580,
          description: '静安大酒店 (1晚)',
          createdAt: Date.now() - 86400000 * 10,
        },
        {
          id: 'demo-e3',
          date: `${yyyy}-${mm}-06`,
          category: '饮品',
          amount: 38,
          description: '星巴克工作咖啡',
          createdAt: Date.now() - 86400000 * 9,
        },
        {
          id: 'demo-e4',
          date: `${yyyy}-${mm}-08`,
          category: '餐饮',
          amount: 120,
          description: '高特晚餐',
          createdAt: Date.now() - 86400000 * 7,
        },
        {
          id: 'demo-e5',
          date: `${yyyy}-${mm}-08`,
          category: '住宿',
          amount: 460,
          description: '杭州全季酒店',
          createdAt: Date.now() - 86400000 * 7,
        },
        {
          id: 'demo-e6',
          date: `${yyyy}-${mm}-12`,
          category: '门票',
          amount: 150,
          description: '科技展会门票',
          createdAt: Date.now() - 86400000 * 3,
        },
      ];

      for (const t of demoTrips) await db.saveTrip(t);
      for (const e of demoExpenses) await db.saveExpense(e);

      const trips = await db.getAllTrips();
      const expenses = await db.getAllExpenses();

      set({ trips, expenses, isLoading: false });
      get().showToast('示例演示数据加载成功！', 'success');
    } catch (err) {
      set({ isLoading: false });
      get().showToast('加载演示数据失败', 'error');
    }
  },

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      if (get().toast?.message === message) {
        set({ toast: null });
      }
    }, 3500);
  },

  clearToast: () => set({ toast: null }),
}));
