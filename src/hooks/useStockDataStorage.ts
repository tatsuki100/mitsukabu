// ========================================
// src/hooks/useStockDataStorage.ts
// SSR対応版 - localStorage容量制限対策
// ========================================

import { useState, useEffect } from 'react';
import { DailyData } from '@/types/stockData';
import pako from 'pako';

// 個別銘柄データの型
export type StoredStock = {
  code: string;
  name: string;
  closePrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClosePrice: number;
  lastUpdated: string;
};

// localStorage保存用のデータ型（StoredStockDataに改名）
export type StoredStockData = {
  stocks: StoredStock[];
  dailyDataMap: Record<string, DailyData[]>;
  lastUpdate: string;
  version: string;
  totalStocks: number;
  isCompressed?: boolean;
  nullDataWarning?: {
    hasNullData: boolean;
    totalStocksWithNullData: number;
    totalNullDays: number;
    lastOccurrence: string;
    summary: string;
  };
};

// お気に入り管理用の型
type FavoritesData = {
  favorites: string[]; // 銘柄コードの配列
  lastUpdate: string;
  version: string;
};

// 保有銘柄管理用の型
type HoldingsData = {
  holdings: string[]; // 銘柄コードの配列
  lastUpdate: string;
  version: string;
};

// Hookの戻り値型
type UseStockDataStorageReturn = {
  // データ読み込み
  storedData: StoredStockData | null;
  loading: boolean;
  error: string | null;

  // データ操作
  saveStockData: (
    stocks: StoredStock[],
    dailyDataMap: Record<string, DailyData[]>,
    nullDataSummary?: {
      totalStocksWithNullData: number;
      totalNullDays: number;
      affectedStocks: Array<{
        code: string;
        name: string;
        nullDates: string[];
      }>;
    }
  ) => void;
  clearStoredData: () => void;
  getStoredStock: (stockCode: string) => { stock: StoredStock; dailyData: DailyData[] } | null;

  // ステータス
  isDataAvailable: boolean;
  dataAge: string | null; // データの経過時間
  storageUsage: string;   // ストレージ使用量

  // お気に入り機能
  favorites: string[];
  addFavorite: (stockCode: string) => void;
  removeFavorite: (stockCode: string) => void;
  isFavorite: (stockCode: string) => boolean;
  toggleFavorite: (stockCode: string) => void;
  getFavoriteStocks: () => StoredStock[];
  favoritesCount: number;

  // 保有銘柄機能
  holdings: string[];
  addHolding: (stockCode: string) => void;
  removeHolding: (stockCode: string) => void;
  isHolding: (stockCode: string) => boolean;
  toggleHolding: (stockCode: string) => void;
  getHoldingStocks: () => StoredStock[];
  holdingsCount: number;
};

// localStorage keys
const STORAGE_KEYS = {
  STOCK_DATA: 'jpx400_stock_data_v1',
  FAVORITES: 'jpx400_favorites_v1',
  HOLDINGS: 'jpx400_holdings_v1',
} as const;

// データバージョン（nullデータ警告対応版）
const DATA_VERSION = '1.2.0';
const FAVORITES_VERSION = '1.0.0';
const HOLDINGS_VERSION = '1.0.0';

// 圧縮閾値（5MB）
const COMPRESSION_THRESHOLD = 5 * 1024 * 1024;

export const useStockDataStorage = (): UseStockDataStorageReturn => {
  const [storedData, setStoredData] = useState<StoredStockData | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [holdings, setHoldings] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // nullデータサマリーから保存用の警告情報を生成
  const generateNullWarningInfo = (nullDataSummary?: {
    totalStocksWithNullData: number;
    totalNullDays: number;
    affectedStocks: Array<{
      code: string;
      name: string;
      nullDates: string[];
    }>;
  }) => {
    if (!nullDataSummary || nullDataSummary.totalStocksWithNullData === 0) {
      return undefined;
    }

    const summary = `${nullDataSummary.totalStocksWithNullData}銘柄で${nullDataSummary.totalNullDays}日分のnullデータを検出`;

    return {
      hasNullData: true,
      totalStocksWithNullData: nullDataSummary.totalStocksWithNullData,
      totalNullDays: nullDataSummary.totalNullDays,
      lastOccurrence: new Date().toISOString(),
      summary
    };
  };

  // データの圧縮
  const compressData = (data: StoredStockData): string => {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = pako.gzip(jsonString);
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
      console.log(`💾 データを圧縮: ${jsonString.length} → ${base64.length} bytes`);
      return base64;
    } catch (error) {
      console.error('データ圧縮エラー:', error);
      throw error;
    }
  };

  // データの展開
  const decompressData = (compressedData: string): StoredStockData => {
    try {
      const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
      const decompressed = pako.ungzip(compressed, { to: 'string' });
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('データ展開エラー:', error);
      throw error;
    }
  };

  // 株価データの保存（nullデータ警告情報対応）
  const saveStockData = (
    stocks: StoredStock[],
    dailyDataMap: Record<string, DailyData[]>,
    nullDataSummary?: {
      totalStocksWithNullData: number;
      totalNullDays: number;
      affectedStocks: Array<{
        code: string;
        name: string;
        nullDates: string[];
      }>;
    }
  ) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const now = new Date().toISOString();
      const nullWarning = generateNullWarningInfo(nullDataSummary);

      const dataToSave: StoredStockData = {
        stocks,
        dailyDataMap,
        lastUpdate: now,
        version: DATA_VERSION,
        totalStocks: stocks.length,
        nullDataWarning: nullWarning
      };

      const jsonString = JSON.stringify(dataToSave);
      const sizeInBytes = new Blob([jsonString]).size;

      console.log(`💾 保存するデータサイズ: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);

      if (nullWarning) {
        console.log(`⚠️ nullデータ警告情報を保存: ${nullWarning.summary}`);
      }

      if (sizeInBytes > COMPRESSION_THRESHOLD) {
        console.log('🗜️ データが5MBを超えたため圧縮します...');
        dataToSave.isCompressed = true;
        const compressed = compressData(dataToSave);
        localStorage.setItem(STORAGE_KEYS.STOCK_DATA, compressed);
      } else {
        localStorage.setItem(STORAGE_KEYS.STOCK_DATA, jsonString);
      }

      setStoredData(dataToSave);
      setError(null);

      console.log(`✅ 株価データ保存完了: ${stocks.length}銘柄`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存エラー';
      console.error('💾 株価データ保存エラー:', errorMessage);
      setError(`データ保存に失敗しました: ${errorMessage}`);
    }
  };

  // 株価データの読み込み（SSR対応）
  const loadStockData = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const stored = localStorage.getItem(STORAGE_KEYS.STOCK_DATA);
      if (!stored) {
        console.log('📭 保存された株価データがありません');
        setStoredData(null);
        return;
      }

      let data: StoredStockData;

      try {
        // まず通常のJSONとして試行
        data = JSON.parse(stored);
        if (data.isCompressed) {
          throw new Error('圧縮データです');
        }
      } catch {
        // 圧縮データとして展開を試行
        console.log('🗜️ 圧縮データを展開中...');
        data = decompressData(stored);
      }

      // バージョンチェック
      if (!data.version || data.version !== DATA_VERSION) {
        console.warn(`⚠️ データバージョンが古いです: ${data.version} → ${DATA_VERSION}`);
        // 古いバージョンの場合、nullDataWarningが存在しない可能性がある
        if (!data.nullDataWarning) {
          data.nullDataWarning = {
            hasNullData: false,
            totalStocksWithNullData: 0,
            totalNullDays: 0,
            lastOccurrence: '',
            summary: ''
          };
        }
      }

      setStoredData(data);
      console.log(`📊 株価データ読み込み完了: ${data.totalStocks}銘柄`);

      if (data.nullDataWarning?.hasNullData) {
        console.log(`⚠️ 前回のnullデータ警告: ${data.nullDataWarning.summary}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '読み込みエラー';
      console.error('📊 株価データ読み込みエラー:', errorMessage);
      setError(`データ読み込みに失敗しました: ${errorMessage}`);
      setStoredData(null);
    } finally {
      setLoading(false);
    }
  };

  // データの削除（SSR対応）
  const clearStoredData = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEYS.STOCK_DATA);
      setStoredData(null);
      setError(null);
      console.log('🗑️ 株価データを削除しました');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '削除エラー';
      setError(`データ削除に失敗しました: ${errorMessage}`);
    }
  };

  // 特定銘柄のデータ取得
  const getStoredStock = (stockCode: string): { stock: StoredStock; dailyData: DailyData[] } | null => {
    if (!storedData) return null;

    const stock = storedData.stocks.find(s => s.code === stockCode);
    const dailyData = storedData.dailyDataMap[stockCode];

    if (!stock || !dailyData) return null;

    return { stock, dailyData };
  };

  // お気に入り機能の実装（SSR対応）
  const loadFavorites = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (stored) {
        const data: FavoritesData = JSON.parse(stored);
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error('お気に入り読み込みエラー:', err);
    }
  };

  const saveFavorites = (newFavorites: string[]) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const data: FavoritesData = {
        favorites: newFavorites,
        lastUpdate: new Date().toISOString(),
        version: FAVORITES_VERSION
      };
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data));
      setFavorites(newFavorites);
    } catch (err) {
      console.error('お気に入り保存エラー:', err);
    }
  };

  // 保有銘柄機能の実装（SSR対応）
  const loadHoldings = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (stored) {
        const data: HoldingsData = JSON.parse(stored);
        setHoldings(data.holdings || []);
      }
    } catch (err) {
      console.error('保有銘柄読み込みエラー:', err);
    }
  };

  const saveHoldings = (newHoldings: string[]) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const data: HoldingsData = {
        holdings: newHoldings,
        lastUpdate: new Date().toISOString(),
        version: HOLDINGS_VERSION
      };
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(data));
      setHoldings(newHoldings);
    } catch (err) {
      console.error('保有銘柄保存エラー:', err);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadStockData();
    loadFavorites();
    loadHoldings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 計算プロパティ
  const isDataAvailable = storedData !== null && storedData.stocks.length > 0;

  const dataAge = storedData ? (() => {
    const lastUpdate = new Date(storedData.lastUpdate);
    const year = lastUpdate.getFullYear();
    const month = String(lastUpdate.getMonth() + 1).padStart(2, '0');
    const day = String(lastUpdate.getDate()).padStart(2, '0');
    const hour = String(lastUpdate.getHours()).padStart(2, '0');
    const minute = String(lastUpdate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  })() : null;

  const storageUsage = (() => {
    // サーバーサイドでは0を返す
    if (typeof window === 'undefined') return '0B';

    let totalSize = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += new Blob([item]).size;
      }
    }
    return totalSize < 1024 ? `${totalSize}B` :
      totalSize < 1024 * 1024 ? `${(totalSize / 1024).toFixed(1)}KB` :
        `${(totalSize / 1024 / 1024).toFixed(1)}MB`;
  })();

  // お気に入り関連の関数
  const addFavorite = (stockCode: string) => {
    if (!favorites.includes(stockCode)) {
      saveFavorites([...favorites, stockCode]);
    }
  };

  const removeFavorite = (stockCode: string) => {
    saveFavorites(favorites.filter(code => code !== stockCode));
  };

  const isFavorite = (stockCode: string) => favorites.includes(stockCode);

  const toggleFavorite = (stockCode: string) => {
    if (isFavorite(stockCode)) {
      removeFavorite(stockCode);
    } else {
      addFavorite(stockCode);
    }
  };

  const getFavoriteStocks = (): StoredStock[] => {
    if (!storedData) return [];
    return storedData.stocks.filter(stock => favorites.includes(stock.code));
  };

  // 保有銘柄関連の関数
  const addHolding = (stockCode: string) => {
    if (!holdings.includes(stockCode)) {
      saveHoldings([...holdings, stockCode]);
    }
  };

  const removeHolding = (stockCode: string) => {
    saveHoldings(holdings.filter(code => code !== stockCode));
  };

  const isHolding = (stockCode: string) => holdings.includes(stockCode);

  const toggleHolding = (stockCode: string) => {
    if (isHolding(stockCode)) {
      removeHolding(stockCode);
    } else {
      addHolding(stockCode);
    }
  };

  const getHoldingStocks = (): StoredStock[] => {
    if (!storedData) return [];
    return storedData.stocks.filter(stock => holdings.includes(stock.code));
  };

  return {
    // データ読み込み
    storedData,
    loading,
    error,

    // データ操作
    saveStockData,
    clearStoredData,
    getStoredStock,

    // ステータス
    isDataAvailable,
    dataAge,
    storageUsage,

    // お気に入り機能
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    getFavoriteStocks,
    favoritesCount: favorites.length,

    // 保有銘柄機能
    holdings,
    addHolding,
    removeHolding,
    isHolding,
    toggleHolding,
    getHoldingStocks,
    holdingsCount: holdings.length
  };
};