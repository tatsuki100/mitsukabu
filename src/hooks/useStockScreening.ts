// ========================================
// src/hooks/useStockScreening.ts
// 株価スクリーニング条件の判定を行うカスタムHook
// ========================================

import { useStockDataStorage } from './useStockDataStorage';
import { DailyData, StoredStock } from '@/types/stockData';

// Hookの戻り値型
type UseStockScreeningReturn = {
  turnbackStocks: StoredStock[];
  turnbackCount: number;
  crossVStocks: StoredStock[];
  crossVCount: number;
  loading: boolean;
  error: string | null;
};

export const useStockScreening = (): UseStockScreeningReturn => {
  const { storedData, loading, error } = useStockDataStorage();

  // 移動平均線を計算する関数
  const calculateMA = (closeData: number[], period: number): (number | null)[] => {
    const result: (number | null)[] = [];

    for (let i = 0; i < closeData.length; i++) {
      // 利用可能なデータ数を計算（最大でperiod日分）
      const availableData = Math.min(i + 1, period);

      // 最低2日分のデータがあれば計算する
      if (availableData < 2) {
        result.push(null);
        continue;
      }

      let sum = 0;
      for (let j = 0; j < availableData; j++) {
        sum += closeData[i - j];
      }
      result.push(+(sum / availableData).toFixed(2));
    }

    return result;
  };


  // ターンバック条件の判定 ----------------------------------------------------------------------------
  const isThurnback = (dailyData: DailyData[]): boolean => {
    if (dailyData.length < 76) return false; // 長期移動平均線（75日）計算に必要

    // 全期間の終値データを取得
    const closeData = dailyData.map(item => item.close);
    
    // 移動平均線を計算
    const ma25 = calculateMA(closeData, 25); // 中期移動平均線
    const ma75 = calculateMA(closeData, 75); // 長期移動平均線

    // 最新日のデータを取得
    const latestIndex = dailyData.length - 1;
    const latestCandle = dailyData[latestIndex];
    const latestMA25 = ma25[latestIndex];
    const latestMA75 = ma75[latestIndex];

    // 移動平均線が計算できない場合は除外
    if (latestMA25 === null || latestMA75 === null) return false;

    // ヒゲも含めるため高値と安値で計算
    const highPrice = latestCandle.high; // 高値（始値にする場合は　latestCandle.open）
    const lowPrice = latestCandle.low;   // 安値（終値にする場合は　latestCandle.close）

    // 条件①：ローソク足が移動平均線を上から下に抜ける
    const crossDownMA25 = highPrice > latestMA25 && lowPrice < latestMA25;
    const crossDownMA75 = highPrice > latestMA75 && lowPrice < latestMA75;
    
    // 条件②：ローソク足が移動平均線を下から上に抜ける
    const crossUpMA25 = highPrice < latestMA25 && lowPrice > latestMA25;
    const crossUpMA75 = highPrice < latestMA75 && lowPrice > latestMA75;

    // いずれかの条件に該当すればターンバック
    return crossDownMA25 || crossDownMA75 || crossUpMA25 || crossUpMA75;
  };



  // クロスV条件の判定 ----------------------------------------------------------------------------
  const isCrossV = (dailyData: DailyData[]): boolean => {
    if (dailyData.length < 76) return false; // 長期移動平均線（75日）計算に必要

    // 全期間の終値データを取得
    const closeData = dailyData.map(item => item.close);
    
    // 移動平均線を計算
    const ma5 = calculateMA(closeData, 5);   // 短期移動平均線
    const ma25 = calculateMA(closeData, 25); // 中期移動平均線
    const ma75 = calculateMA(closeData, 75); // 長期移動平均線

    // 最新日のデータを取得
    const latestIndex = dailyData.length - 1;
    const latestMA5 = ma5[latestIndex];
    const latestMA25 = ma25[latestIndex];
    const latestMA75 = ma75[latestIndex];

    // 移動平均線が計算できない場合は除外
    if (latestMA5 === null || latestMA25 === null || latestMA75 === null) return false;

    // 条件：短期移動平均線が、中期移動平均線もしくは長期移動平均線の下にいる
    const belowMA25 = latestMA5 < latestMA25;
    const belowMA75 = latestMA5 < latestMA75;

    // いずれかの条件に該当すればクロスV
    return belowMA25 || belowMA75;
  };



  // ターンバック銘柄を取得
  const getTurnbackStocks = (): StoredStock[] => {
    if (!storedData || loading || error) return [];

    const turnbackStocks: StoredStock[] = [];

    storedData.stocks.forEach(stock => {
      const dailyData = storedData.dailyDataMap[stock.code];
      
      if (dailyData && isThurnback(dailyData)) {
        turnbackStocks.push(stock);
      }
    });

    return turnbackStocks;
  };

  // クロスV銘柄を取得
  const getCrossVStocks = (): StoredStock[] => {
    if (!storedData || loading || error) return [];

    const crossVStocks: StoredStock[] = [];

    storedData.stocks.forEach(stock => {
      const dailyData = storedData.dailyDataMap[stock.code];
      
      if (dailyData && isCrossV(dailyData)) {
        crossVStocks.push(stock);
      }
    });

    return crossVStocks;
  };

  const turnbackStocks = getTurnbackStocks();
  const crossVStocks = getCrossVStocks();

  return {
    turnbackStocks,
    turnbackCount: turnbackStocks.length,
    crossVStocks,
    crossVCount: crossVStocks.length,
    loading,
    error
  };
};