// ========================================
// src/hooks/useJPX400Stocks.ts
// jpx400.csvファイルを読み込むカスタムHook
// ========================================

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// 型定義
export type JPX400Stock = {
  code: string;      // 銘柄コード（例: "7203"）
  market: string;    // 市場（例: "東証プライム"）
  name: string;      // 銘柄名（例: "トヨタ自動車"）
};

type UseJPX400StocksReturn = {
  stocks: JPX400Stock[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getStockNameMap: () => Record<string, string>; // 銘柄コード → 日本語名のマッピング
  getTopStocks: (count: number) => JPX400Stock[]; // 開発用：最初のN件取得
};

// 環境設定
const CONFIG = {
  development: {
    maxStocks: 10,
    autoFetch: false,
    showDebugButton: true
  },
  production: {
    maxStocks: 400,
    autoFetch: true,
    showDebugButton: false
  }
};

// 現在の環境判定（簡易版 - 後で改善可能）
const isDevelopment = process.env.NODE_ENV === 'development';
const currentConfig = isDevelopment ? CONFIG.development : CONFIG.production;

// エンコーディング自動判定対応のCSV読み込み関数
const loadCSV = async (filename: string): Promise<string> => {
  try {
    const response = await fetch(`/${filename}`);
    if (!response.ok) {
      throw new Error(`ファイルが見つかりません: ${filename} (${response.status})`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // まずUTF-8として試行
    try {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
      const csvText = utf8Decoder.decode(arrayBuffer);
      console.log('CSVファイルをUTF-8として読み込みました');
      return csvText;
    } catch {
      console.log('UTF-8での読み込みに失敗、Shift-JISを試行中...');
      
      // UTF-8が失敗した場合、Shift-JISを試行
      try {
        const shiftJisDecoder = new TextDecoder('shift-jis');
        const csvText = shiftJisDecoder.decode(arrayBuffer);
        console.log('CSVファイルをShift-JISとして読み込みました');
        return csvText;
      } catch {
        // どちらも失敗した場合、UTF-8をデフォルトとして使用
        console.warn('エンコーディング判定に失敗、UTF-8をデフォルトとして使用します');
        const fallbackDecoder = new TextDecoder('utf-8', { fatal: false });
        return fallbackDecoder.decode(arrayBuffer);
      }
    }
  } catch (error) {
    throw new Error(`CSVファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};

// CSVデータをパースして型付きオブジェクトに変換
const parseStockCSV = (csvText: string): JPX400Stock[] => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // 全て文字列として扱う
    delimitersToGuess: [',', '\t', '|', ';']
  });

  if (parsed.errors.length > 0) {
    console.warn('CSV parsing warnings:', parsed.errors);
  }

  // デバッグ用：CSVのヘッダーを確認
  if (parsed.meta.fields) {
    console.log('CSV ヘッダー:', parsed.meta.fields);
  }

  return (parsed.data as Record<string, unknown>[])
    .map((row: Record<string, unknown>) => {
      // 複数の可能なヘッダー名に対応
      const getFieldValue = (possibleNames: string[]): string => {
        for (const name of possibleNames) {
          const value = row[name];
          if (value !== undefined && value !== null) {
            return String(value).trim();
          }
        }
        return '';
      };

      return {
        code: getFieldValue(['ｺｰﾄﾞ', 'コード', 'code', 'Code', 'CODE']),
        market: getFieldValue(['市場', 'market', 'Market', 'MARKET']),
        name: getFieldValue(['銘柄', '銘柄名', 'name', 'Name', 'NAME', '会社名'])
      };
    })
    .filter((stock: JPX400Stock) => 
      stock.code && stock.name // 必須フィールドが存在するもののみ
    );
};

// メインのカスタムHook
export const useJPX400Stocks = (): UseJPX400StocksReturn => {
  const [stocks, setStocks] = useState<JPX400Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStocks = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('JPX400銘柄データの読み込みを開始...');
      
      // 1. CSVファイルを読み込み（エンコーディング自動判定）
      const csvText = await loadCSV('jpx400.csv');
      
      // 2. CSVをパースして型付きデータに変換
      const stockData = parseStockCSV(csvText);
      
      console.log(`JPX400銘柄データの読み込み完了: ${stockData.length}銘柄`);
      
      // デバッグ用：最初の数件を表示
      if (stockData.length > 0) {
        console.log('読み込まれたデータの例:', stockData.slice(0, 3));
      }
      
      setStocks(stockData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      console.error('JPX400銘柄データの読み込みエラー:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadStocks();
  }, []);

  // 再取得用の関数
  const refetch = () => {
    loadStocks();
  };

  // 銘柄コード → 日本語名のマッピングを作成
  const getStockNameMap = (): Record<string, string> => {
    const nameMap: Record<string, string> = {};
    stocks.forEach(stock => {
      nameMap[stock.code] = stock.name;
    });
    return nameMap;
  };

  // 開発用：最初のN件を取得
  const getTopStocks = (count: number): JPX400Stock[] => {
    return stocks.slice(0, count);
  };

  return {
    stocks,
    loading,
    error,
    refetch,
    getStockNameMap,
    getTopStocks
  };
};

// 便利な検索・フィルタ用のユーティリティ関数も提供
export const useJPX400StocksWithUtils = () => {
  const { stocks, loading, error, refetch, getStockNameMap, getTopStocks } = useJPX400Stocks();

  // 銘柄コードで検索
  const findByCode = (code: string): JPX400Stock | undefined => {
    return stocks.find(stock => stock.code === code);
  };

  // 銘柄名で部分一致検索
  const searchByName = (searchTerm: string): JPX400Stock[] => {
    return stocks.filter(stock => 
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 銘柄コードの配列を取得
  const getAllCodes = (): string[] => {
    return stocks.map(stock => stock.code);
  };

  // 開発環境用の銘柄コード配列を取得
  const getDevelopmentCodes = (): string[] => {
    const topStocks = getTopStocks(currentConfig.maxStocks);
    return topStocks.map(stock => stock.code);
  };

  return {
    stocks,
    loading,
    error,
    refetch,
    getStockNameMap,
    getTopStocks,
    findByCode,
    searchByName,
    getAllCodes,
    getDevelopmentCodes,
    config: currentConfig
  };
};