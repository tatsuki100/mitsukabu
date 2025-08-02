// ========================================
// src/hooks/useYahooFinanceAPI.ts
// Yahoo Finance APIから株価データを取得・変換するカスタムHook
// ========================================

import { useState } from 'react';
import { DailyData, YahooStock } from '@/types/stockData';

// 既存のStock型
export type Stock = YahooStock;

// Yahoo Finance APIのレスポンス型定義
type YahooFinanceResponse = {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        longName: string;
        shortName: string;
      };
      timestamp: number[];
      indicators: {
        quote: [{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }];
      };
    }> | null;
    error: string | null;
  };
};

// エラー情報の型
type StockDataResult = {
  success: boolean;
  stock?: Stock;
  dailyData?: DailyData[];
  error?: string;
};

// Hook の戻り値の型
type UseYahooFinanceAPIReturn = {
  fetchStockData: (stockCode: string, stockName: string) => Promise<StockDataResult>;
  fetchMultipleStocks: (stockList: { code: string; name: string }[]) => Promise<StockDataResult[]>;
  loading: boolean;
  error: string | null;
};

// Yahoo Finance APIのURL生成（内部API Route経由）
const generateYahooFinanceURL = (stockCode: string): string => {
  return `/api/stock/${stockCode}`;
};

// Yahoo APIレスポンス → DailyData配列に変換
const convertYahooToDailyData = (yahooResponse: YahooFinanceResponse): DailyData[] => {
  const result = yahooResponse.chart.result![0];
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  
  return timestamps.map((timestamp, index) => ({
    date: new Date(timestamp * 1000).toISOString().split('T')[0],
    open: quote.open[index],
    close: quote.close[index],
    high: quote.high[index],
    low: quote.low[index],
    volume: quote.volume[index]
  }));
};

// Yahoo APIレスポンス
const convertYahooToStock = (yahooResponse: YahooFinanceResponse, stockName: string): Stock => {
  const result = yahooResponse.chart.result![0];
  const meta = result.meta;
  const quote = result.indicators.quote[0];
  
  // 最新の価格データ（配列の最後）
  const lastIndex = quote.close.length - 1;
  const currentPrice = quote.close[lastIndex];
  
  // 配列の最後から2番目が前営業日の終値
  const previousPrice = lastIndex > 0 ? quote.close[lastIndex - 1] : currentPrice;
  
  return {
    code: meta.symbol.replace('.T', ''), // "7203.T" → "7203"
    name: stockName, // JPX400 CSVから取得した日本語名
    closePrice: currentPrice,
    openPrice: quote.open[lastIndex],
    highPrice: quote.high[lastIndex],
    lowPrice: quote.low[lastIndex],
    previousClosePrice: previousPrice, // 🔥 修正: 前営業日の終値を使用
    lastUpdated: new Date(result.timestamp[lastIndex] * 1000).toISOString().split('T')[0],
    movingAverageLine: {
      shortTerm: null, // フロントエンドで計算
      midTerm: null,   // フロントエンドで計算
      longTerm: null   // フロントエンドで計算
    },
    rsi: {
      value: null,     // フロントエンドで計算
      period: 14
    }
  };
};

// 単一銘柄のデータ取得（リトライ機能付き）
const fetchSingleStockWithRetry = async (
  stockCode: string, 
  stockName: string, 
  maxRetries: number = 3
): Promise<StockDataResult> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${stockCode} (${stockName}): 取得試行 ${attempt}/${maxRetries}`);
      
      const url = generateYahooFinanceURL(stockCode);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const apiResponse = await response.json();
      
      // API Route のエラーレスポンスチェック
      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'APIエラーが発生しました');
      }
      
      // Yahoo Finance データを取得
      const data: YahooFinanceResponse = apiResponse.data;
      
      // 配列として適切にチェック
      if (!data.chart.result || data.chart.result.length === 0) {
        throw new Error('データが見つかりません');
      }
      
      // データ変換
      const stock = convertYahooToStock(data, stockName);
      const dailyData = convertYahooToDailyData(data);
      
      console.log(`${stockCode} (${stockName}): 取得成功 - ${dailyData.length}日分のデータ`);
      
      return {
        success: true,
        stock,
        dailyData
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      console.warn(`${stockCode} (${stockName}): 試行 ${attempt} 失敗 - ${errorMessage}`);
      
      if (attempt === maxRetries) {
        console.error(`${stockCode} (${stockName}): 最終的に失敗`);
        return {
          success: false,
          error: errorMessage
        };
      }
      
      // リトライ前に少し待機（2秒）
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return {
    success: false,
    error: '最大試行回数に達しました'
  };
};

// メインのカスタムHook
export const useYahooFinanceAPI = (): UseYahooFinanceAPIReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 単一銘柄のデータ取得
  const fetchStockData = async (stockCode: string, stockName: string): Promise<StockDataResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchSingleStockWithRetry(stockCode, stockName);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // 複数銘柄の一括取得（リクエスト制限対応：1秒間に2件）
  const fetchMultipleStocks = async (
    stockList: { code: string; name: string }[]
  ): Promise<StockDataResult[]> => {
    setLoading(true);
    setError(null);
    
    const results: StockDataResult[] = [];
    
    try {
      console.log(`📊 ${stockList.length}銘柄の株価データ取得を開始...`);
      
      for (let i = 0; i < stockList.length; i++) {
        const { code, name } = stockList[i];
        
        // データ取得
        const result = await fetchSingleStockWithRetry(code, name);
        results.push(result);
        
        // 最後の銘柄以外は500ms待機（1秒間に2件制限）
        if (i < stockList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      console.log(`📊 取得完了: 成功 ${successCount}件, 失敗 ${failureCount}件`);
      
      return results;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      console.error('複数銘柄取得エラー:', errorMessage);
      setError(errorMessage);
      return results; // 途中まで取得できた結果を返す
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchStockData,
    fetchMultipleStocks,
    loading,
    error
  };
};