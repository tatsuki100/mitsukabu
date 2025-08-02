// ========================================
// src/hooks/useStockDataStorage.ts
// Yahoo Finance APIから取得した株価データ、お気に入り機能、保有銘柄機能をlocalStorageに保存するカスタムHook
// ========================================

import { useState, useEffect } from 'react';
import { DailyData, StoredStock } from '@/types/stockData';

// Stock型（Yahoo API用に調整）
export type { StoredStock } from '@/types/stockData';

// localStorage保存用のデータ型
type StoredStockData = {
  stocks: StoredStock[];
  dailyDataMap: Record<string, DailyData[]>; // 銘柄コード → DailyData配列
  lastUpdate: string;
  version: string;
  totalStocks: number;
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
  saveStockData: (stocks: StoredStock[], dailyDataMap: Record<string, DailyData[]>) => void;
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

// データバージョン
const DATA_VERSION = '1.0.0';
const FAVORITES_VERSION = '1.0.0';
const HOLDINGS_VERSION = '1.0.0';

export const useStockDataStorage = (): UseStockDataStorageReturn => {
  const [storedData, setStoredData] = useState<StoredStockData | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [holdings, setHoldings] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初回読み込み
  useEffect(() => {
    loadStoredData();
    loadFavorites();
    loadHoldings();
  }, []);

  // localStorageからデータを読み込み
  const loadStoredData = () => {
    try {
      setLoading(true);
      setError(null);

      const rawData = localStorage.getItem(STORAGE_KEYS.STOCK_DATA);

      if (!rawData) {
        console.log('📭 localStorage: データが見つかりません');
        setStoredData(null);
        return;
      }

      const parsedData: StoredStockData = JSON.parse(rawData);

      // データバージョンチェック
      if (parsedData.version !== DATA_VERSION) {
        console.warn(`⚠️ データバージョンが古いため削除: ${parsedData.version} → ${DATA_VERSION}`);
        localStorage.removeItem(STORAGE_KEYS.STOCK_DATA);
        setStoredData(null);
        return;
      }

      console.log(`✅ localStorage: ${parsedData.totalStocks}銘柄のデータを読み込み`);
      console.log(`📅 最終更新: ${parsedData.lastUpdate}`);

      setStoredData(parsedData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ localStorage読み込みエラー:', errorMessage);
      setError(`データ読み込みエラー: ${errorMessage}`);

      // 破損データを削除
      localStorage.removeItem(STORAGE_KEYS.STOCK_DATA);
      setStoredData(null);
    } finally {
      setLoading(false);
    }
  };

  // お気に入りデータを読み込み
  const loadFavorites = () => {
    try {
      const rawFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);

      if (!rawFavorites) {
        console.log('📭 localStorage: お気に入りデータが見つかりません');
        setFavorites([]);
        return;
      }

      const parsedFavorites: FavoritesData = JSON.parse(rawFavorites);

      // バージョンチェック
      if (parsedFavorites.version !== FAVORITES_VERSION) {
        console.warn(`⚠️ お気に入りデータのバージョンが古いため削除: ${parsedFavorites.version} → ${FAVORITES_VERSION}`);
        localStorage.removeItem(STORAGE_KEYS.FAVORITES);
        setFavorites([]);
        return;
      }

      console.log(`✅ localStorage: ${parsedFavorites.favorites.length}件のお気に入りを読み込み`);
      setFavorites(parsedFavorites.favorites);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ お気に入り読み込みエラー:', errorMessage);
      setFavorites([]);

      // 破損データを削除
      localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    }
  };

  // 保有銘柄データを読み込み
  const loadHoldings = () => {
    try {
      const rawHoldings = localStorage.getItem(STORAGE_KEYS.HOLDINGS);

      if (!rawHoldings) {
        console.log('📭 localStorage: 保有銘柄データが見つかりません');
        setHoldings([]);
        return;
      }

      const parsedHoldings: HoldingsData = JSON.parse(rawHoldings);

      // バージョンチェック
      if (parsedHoldings.version !== HOLDINGS_VERSION) {
        console.warn(`⚠️ 保有銘柄データのバージョンが古いため削除: ${parsedHoldings.version} → ${HOLDINGS_VERSION}`);
        localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
        setHoldings([]);
        return;
      }

      console.log(`✅ localStorage: ${parsedHoldings.holdings.length}件の保有銘柄を読み込み`);
      setHoldings(parsedHoldings.holdings);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ 保有銘柄読み込みエラー:', errorMessage);
      setHoldings([]);

      // 破損データを削除
      localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
    }
  };

  // お気に入りデータを保存
  const saveFavorites = (newFavorites: string[]) => {
    try {
      const dataToSave: FavoritesData = {
        favorites: newFavorites,
        lastUpdate: new Date().toISOString(),
        version: FAVORITES_VERSION
      };

      const jsonData = JSON.stringify(dataToSave);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, jsonData);
      setFavorites(newFavorites);

      console.log(`✅ お気に入り保存完了: ${newFavorites.length}件`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ お気に入り保存エラー:', errorMessage);
      setError(`お気に入り保存エラー: ${errorMessage}`);
    }
  };

  // 保有銘柄データを保存
  const saveHoldings = (newHoldings: string[]) => {
    try {
      const dataToSave: HoldingsData = {
        holdings: newHoldings,
        lastUpdate: new Date().toISOString(),
        version: HOLDINGS_VERSION
      };

      const jsonData = JSON.stringify(dataToSave);
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, jsonData);
      setHoldings(newHoldings);

      console.log(`✅ 保有銘柄保存完了: ${newHoldings.length}件`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ 保有銘柄保存エラー:', errorMessage);
      setError(`保有銘柄保存エラー: ${errorMessage}`);
    }
  };

  // localStorageにデータを保存
  const saveStockData = (stocks: StoredStock[], dailyDataMap: Record<string, DailyData[]>) => {
    try {
      console.log(`💾 localStorage: ${stocks.length}銘柄のデータを保存開始...`);

      const dataToSave: StoredStockData = {
        stocks,
        dailyDataMap,
        lastUpdate: new Date().toISOString(),
        version: DATA_VERSION,
        totalStocks: stocks.length
      };

      const jsonData = JSON.stringify(dataToSave);

      // サイズチェック（5MB制限）
      const sizeInMB = (jsonData.length / 1024 / 1024).toFixed(2);
      console.log(`📊 データサイズ: ${sizeInMB}MB`);

      if (jsonData.length > 5 * 1024 * 1024) {
        throw new Error(`データサイズが大きすぎます: ${sizeInMB}MB（上限: 5MB）`);
      }

      localStorage.setItem(STORAGE_KEYS.STOCK_DATA, jsonData);
      setStoredData(dataToSave);
      setError(null);

      console.log(`✅ localStorage: 保存完了 (${sizeInMB}MB)`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ localStorage保存エラー:', errorMessage);
      setError(`データ保存エラー: ${errorMessage}`);
    }
  };

  // localStorageのデータをクリア
  const clearStoredData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.STOCK_DATA);
      setStoredData(null);
      setError(null);
      console.log('🗑️ localStorage: データを削除しました');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ localStorageクリアエラー:', errorMessage);
      setError(`データクリアエラー: ${errorMessage}`);
    }
  };

  // 特定銘柄のデータを取得
  const getStoredStock = (stockCode: string): { stock: StoredStock; dailyData: DailyData[] } | null => {
    if (!storedData) return null;

    const stock = storedData.stocks.find(s => s.code === stockCode);
    const dailyData = storedData.dailyDataMap[stockCode];

    if (!stock || !dailyData) return null;

    return { stock, dailyData };
  };

  // お気に入り追加
  const addFavorite = (stockCode: string) => {
    // localStorage から最新のお気に入りデータを直接読み込む
    let currentFavorites: string[] = [];

    try {
      const rawFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (rawFavorites) {
        const parsedFavorites: FavoritesData = JSON.parse(rawFavorites);
        if (parsedFavorites.version === FAVORITES_VERSION) {
          currentFavorites = parsedFavorites.favorites;
        }
      }
    } catch (err) {
      console.error('❌ お気に入り読み込みエラー:', err);
      currentFavorites = [];
    }

    // 既に登録済みかチェック
    if (currentFavorites.includes(stockCode)) {
      console.log(`⚠️ ${stockCode} は既にお気に入りに登録済みです`);
      return;
    }

    // 新しいお気に入りリストを作成
    const newFavorites = [...currentFavorites, stockCode];
    saveFavorites(newFavorites);
    console.log(`⭐ ${stockCode} をお気に入りに追加しました`);
  };

  // お気に入り削除
  const removeFavorite = (stockCode: string) => {
    // localStorage から最新のお気に入りデータを直接読み込む
    let currentFavorites: string[] = [];

    try {
      const rawFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (rawFavorites) {
        const parsedFavorites: FavoritesData = JSON.parse(rawFavorites);
        if (parsedFavorites.version === FAVORITES_VERSION) {
          currentFavorites = parsedFavorites.favorites;
        }
      }
    } catch (err) {
      console.error('❌ お気に入り読み込みエラー:', err);
      currentFavorites = [];
    }

    // お気に入りから削除
    const newFavorites = currentFavorites.filter(code => code !== stockCode);
    saveFavorites(newFavorites);
    console.log(`🗑️ ${stockCode} をお気に入りから削除しました`);
  };

  // お気に入り状態チェック
  const isFavorite = (stockCode: string): boolean => {
    return favorites.includes(stockCode);
  };

  // お気に入りのトグル（追加/削除の切り替え）
  const toggleFavorite = (stockCode: string) => {
    if (isFavorite(stockCode)) {
      removeFavorite(stockCode);
    } else {
      addFavorite(stockCode);
    }
  };

  // お気に入り銘柄のデータを取得
  const getFavoriteStocks = (): StoredStock[] => {
    if (!storedData) return [];

    return storedData.stocks.filter(stock => favorites.includes(stock.code));
  };

  // 保有銘柄追加
  const addHolding = (stockCode: string) => {
    // localStorage から最新の保有銘柄データを直接読み込む
    let currentHoldings: string[] = [];

    try {
      const rawHoldings = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (rawHoldings) {
        const parsedHoldings: HoldingsData = JSON.parse(rawHoldings);
        if (parsedHoldings.version === HOLDINGS_VERSION) {
          currentHoldings = parsedHoldings.holdings;
        }
      }
    } catch (err) {
      console.error('❌ 保有銘柄読み込みエラー:', err);
      currentHoldings = [];
    }

    // 既に登録済みかチェック
    if (currentHoldings.includes(stockCode)) {
      console.log(`⚠️ ${stockCode} は既に保有銘柄に登録済みです`);
      return;
    }

    // 新しい保有銘柄リストを作成
    const newHoldings = [...currentHoldings, stockCode];
    saveHoldings(newHoldings);
    console.log(`💼 ${stockCode} を保有銘柄に追加しました`);
  };

  // 保有銘柄削除
  const removeHolding = (stockCode: string) => {
    // localStorage から最新の保有銘柄データを直接読み込む
    let currentHoldings: string[] = [];

    try {
      const rawHoldings = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (rawHoldings) {
        const parsedHoldings: HoldingsData = JSON.parse(rawHoldings);
        if (parsedHoldings.version === HOLDINGS_VERSION) {
          currentHoldings = parsedHoldings.holdings;
        }
      }
    } catch (err) {
      console.error('❌ 保有銘柄読み込みエラー:', err);
      currentHoldings = [];
    }

    // 保有銘柄から削除
    const newHoldings = currentHoldings.filter(code => code !== stockCode);
    saveHoldings(newHoldings);
    console.log(`🗑️ ${stockCode} を保有銘柄から削除しました`);
  };

  // 保有銘柄状態チェック
  const isHolding = (stockCode: string): boolean => {
    return holdings.includes(stockCode);
  };

  // 保有銘柄のトグル（追加/削除の切り替え）
  const toggleHolding = (stockCode: string) => {
    if (isHolding(stockCode)) {
      removeHolding(stockCode);
    } else {
      addHolding(stockCode);
    }
  };

  // 保有銘柄のデータを取得
  const getHoldingStocks = (): StoredStock[] => {
    if (!storedData) return [];

    return storedData.stocks.filter(stock => holdings.includes(stock.code));
  };

  // データの存在確認
  const isDataAvailable = storedData !== null && storedData.stocks.length > 0;

  // データの日時を計算（yyyy-mm-dd hh:mm形式）
  const dataAge = storedData ? (() => {
    const lastUpdate = new Date(storedData.lastUpdate);

    // yyyy-mm-dd hh:mm形式にフォーマット
    const year = lastUpdate.getFullYear();
    const month = String(lastUpdate.getMonth() + 1).padStart(2, '0');
    const day = String(lastUpdate.getDate()).padStart(2, '0');
    const hours = String(lastUpdate.getHours()).padStart(2, '0');
    const minutes = String(lastUpdate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  })() : null;

  // ストレージ使用量を計算
  const storageUsage = (() => {
    try {
      const stockData = localStorage.getItem(STORAGE_KEYS.STOCK_DATA);
      const favoritesData = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const holdingsData = localStorage.getItem(STORAGE_KEYS.HOLDINGS);

      const stockDataSize = stockData ? stockData.length : 0;
      const favoritesDataSize = favoritesData ? favoritesData.length : 0;
      const holdingsDataSize = holdingsData ? holdingsData.length : 0;
      const totalSize = stockDataSize + favoritesDataSize + holdingsDataSize;

      const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
      return `${sizeInMB}MB`;
    } catch {
      return '不明';
    }
  })();

  return {
    storedData,
    loading,
    error,
    saveStockData,
    clearStoredData,
    getStoredStock,
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