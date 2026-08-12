import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { TripItem, ExpenseItem, CustomCategory, AppSettings, BackupData } from '../types';
import { CityStationRecord, DEFAULT_CITY_STATION_RECORDS } from '../data/defaultCityStations';

interface TravelExpenseDBSchema extends DBSchema {
  trips: {
    key: string;
    value: TripItem;
    indexes: { 'by-date': string };
  };
  expenses: {
    key: string;
    value: ExpenseItem;
    indexes: { 'by-date': string };
  };
  customCategories: {
    key: string;
    value: CustomCategory;
    indexes: { 'by-type': string };
  };
  settings: {
    key: string;
    value: { key: string; value: any };
  };
}

const DB_NAME = 'BusinessTravelExpenseDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TravelExpenseDBSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TravelExpenseDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Trips store
        if (!db.objectStoreNames.contains('trips')) {
          const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
          tripStore.createIndex('by-date', 'date');
        }

        // Expenses store
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('by-date', 'date');
        }

        // Custom Categories store
        if (!db.objectStoreNames.contains('customCategories')) {
          const catStore = db.createObjectStore('customCategories', { keyPath: 'id' });
          catStore.createIndex('by-type', 'type');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// Initial default categories
export const DEFAULT_TRANSPORT_CATEGORIES: CustomCategory[] = [
  { id: 'trans-1', name: '的士', type: 'transport', isDefault: true },
  { id: 'trans-2', name: '网约车', type: 'transport', isDefault: true },
  { id: 'trans-3', name: '大巴', type: 'transport', isDefault: true },
  { id: 'trans-4', name: '火车', type: 'transport', isDefault: true },
  { id: 'trans-5', name: '飞机', type: 'transport', isDefault: true },
];

export const DEFAULT_EXPENSE_CATEGORIES: CustomCategory[] = [
  { id: 'exp-1', name: '餐饮', type: 'expense', isDefault: true },
  { id: 'exp-2', name: '住宿', type: 'expense', isDefault: true },
  { id: 'exp-3', name: '物品', type: 'expense', isDefault: true },
  { id: 'exp-4', name: '饮品', type: 'expense', isDefault: true },
  { id: 'exp-5', name: '水果', type: 'expense', isDefault: true },
  { id: 'exp-6', name: '通讯', type: 'expense', isDefault: true },
  { id: 'exp-7', name: '门票', type: 'expense', isDefault: true },
  { id: 'exp-8', name: '娱乐', type: 'expense', isDefault: true },
];

// Seed initial default categories if empty
export async function initDefaultData() {
  const db = await getDB();
  const existingCats = await db.getAll('customCategories');
  if (existingCats.length === 0) {
    const tx = db.transaction('customCategories', 'readwrite');
    for (const cat of [...DEFAULT_TRANSPORT_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]) {
      await tx.store.put(cat);
    }
    await tx.done;
  }
}

// Trips DB Operations
export async function getAllTrips(): Promise<TripItem[]> {
  const db = await getDB();
  return db.getAll('trips');
}

export async function saveTrip(trip: TripItem): Promise<void> {
  const db = await getDB();
  await db.put('trips', trip);
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('trips', id);
}

// Expenses DB Operations
export async function getAllExpenses(): Promise<ExpenseItem[]> {
  const db = await getDB();
  return db.getAll('expenses');
}

export async function saveExpense(expense: ExpenseItem): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
}

// Custom Categories DB Operations
export async function getAllCustomCategories(): Promise<CustomCategory[]> {
  const db = await getDB();
  return db.getAll('customCategories');
}

export async function saveCustomCategory(category: CustomCategory): Promise<void> {
  const db = await getDB();
  await db.put('customCategories', category);
}

export async function deleteCustomCategory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('customCategories', id);
}

// Settings DB Operations
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const entry = await db.get('settings', key);
  return entry ? (entry.value as T) : defaultValue;
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

// City Stations DB Operations
export async function getCityStations(): Promise<CityStationRecord[]> {
  return getSetting<CityStationRecord[]>('cityStations', DEFAULT_CITY_STATION_RECORDS);
}

export async function saveCityStations(records: CityStationRecord[]): Promise<void> {
  return saveSetting<CityStationRecord[]>('cityStations', records);
}

// Import / Export Operations
export async function exportBackupData(): Promise<BackupData> {
  const db = await getDB();
  const trips = await db.getAll('trips');
  const expenses = await db.getAll('expenses');
  const customCategories = await db.getAll('customCategories');
  const theme = await getSetting<'light' | 'dark'>('theme', 'light');

  return {
    version: '1.0',
    exportTime: new Date().toISOString(),
    trips,
    expenses,
    customCategories,
    settings: {
      theme,
      currencySymbol: '¥',
    },
  };
}

export async function importBackupData(
  data: BackupData,
  mode: 'override' | 'merge'
): Promise<{ tripsImported: number; expensesImported: number }> {
  const db = await getDB();

  if (mode === 'override') {
    // Clear all existing stores
    const tx = db.transaction(['trips', 'expenses', 'customCategories'], 'readwrite');
    await tx.objectStore('trips').clear();
    await tx.objectStore('expenses').clear();
    await tx.objectStore('customCategories').clear();
    await tx.done;
  }

  const tx = db.transaction(['trips', 'expenses', 'customCategories'], 'readwrite');
  let tripsCount = 0;
  let expensesCount = 0;

  if (data.trips && Array.isArray(data.trips)) {
    for (const trip of data.trips) {
      if (trip.id && trip.date && typeof trip.amount === 'number') {
        await tx.objectStore('trips').put(trip);
        tripsCount++;
      }
    }
  }

  if (data.expenses && Array.isArray(data.expenses)) {
    for (const exp of data.expenses) {
      if (exp.id && exp.date && typeof exp.amount === 'number') {
        await tx.objectStore('expenses').put(exp);
        expensesCount++;
      }
    }
  }

  if (data.customCategories && Array.isArray(data.customCategories)) {
    for (const cat of data.customCategories) {
      if (cat.id && cat.name && cat.type) {
        await tx.objectStore('customCategories').put(cat);
      }
    }
  }

  await tx.done;

  if (data.settings?.theme) {
    await saveSetting('theme', data.settings.theme);
  }

  return { tripsImported: tripsCount, expensesImported: expensesCount };
}
