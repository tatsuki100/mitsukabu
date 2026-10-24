// ========================================
// src/hooks/useStockScreening.ts
// 株価スクリーニング条件の判定を行うカスタムHook
// ========================================

import { useStockDataStorage } from './useStockDataStorage';
import { DailyData, StoredStock } from '@/types/stockData';

// Hookのオプション型
type UseStockScreeningOptions = {
  crossVTrendWindow?: number; // クロスV：前提上昇期間（営業日）。未指定時は30
};

// Hookの戻り値型
type UseStockScreeningReturn = {
  turnbackStocks: StoredStock[];
  turnbackCount: number;
  crossVStocks: StoredStock[];
  crossVCount: number;
  loading: boolean;
  error: string | null;
};

export const useStockScreening = (options?: UseStockScreeningOptions): UseStockScreeningReturn => {
  const { storedData, loading, error } = useStockDataStorage();

  // クロスVの前提上昇期間（営業日）。1以上の整数に防御的にクランプ
  const crossVTrendWindow = Math.max(1, Math.floor(options?.crossVTrendWindow ?? 15));

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
    const TREND_WINDOW = crossVTrendWindow; // 前提上昇期間（営業日）
    const LONG_MA_PERIOD = 75; // 長期移動平均線の期間
    const FULL_LONG_MA_INDEX = LONG_MA_PERIOD - 1; // この index 以降でMA75が「75日分フル」になる

    if (dailyData.length < LONG_MA_PERIOD) return false; // 長期移動平均線（75日）計算に必要

    // 全期間の終値データを取得
    const closeData = dailyData.map(item => item.close);

    // 移動平均線を計算
    const ma5 = calculateMA(closeData, 5);   // 短期移動平均線
    const ma25 = calculateMA(closeData, 25); // 中期移動平均線
    const ma75 = calculateMA(closeData, LONG_MA_PERIOD); // 長期移動平均線

    // ある日が条件①（短期線が中期線もしくは長期線の下にいる）を満たすかを判定
    const isBelow = (index: number): boolean | null => {
      const ma5Value = ma5[index];
      const ma25Value = ma25[index];
      const ma75Value = ma75[index];

      if (ma5Value === null || ma25Value === null || ma75Value === null) return null;

      return ma5Value < ma25Value || ma5Value < ma75Value;
    };

    const latestIndex = dailyData.length - 1;

    // 条件①：直近日において、短期移動平均線が中期移動平均線もしくは長期移動平均線の下にいる
    const latestBelow = isBelow(latestIndex);
    if (latestBelow === null || !latestBelow) return false;

    // 条件①を「初めて」満たした日（＝現在の下抜け状態が始まった日）を特定する
    // 前日も条件①を満たしている間は遡り、前日が満たしていない（＝クロスした瞬間）日で止まる
    let streakStartIndex = latestIndex;
    while (streakStartIndex - 1 >= 0) {
      const prevBelow = isBelow(streakStartIndex - 1);
      if (prevBelow === null || !prevBelow) break;
      streakStartIndex--;
    }

    // 条件②：条件①を初めて満たした日からTREND_WINDOW日間、移動平均線の順番が上から短期線・中期線・長期線だったこと
    const trendWindowStart = streakStartIndex - TREND_WINDOW;

    // トレンド確認期間の最初の日点でMA75が「75日分フル」になっていない場合はデータ不足のため除外
    if (trendWindowStart < FULL_LONG_MA_INDEX) return false;

    for (let i = trendWindowStart; i <= streakStartIndex - 1; i++) {
      const trendMA5 = ma5[i];
      const trendMA25 = ma25[i];
      const trendMA75 = ma75[i];

      // 移動平均線が計算できない日があれば除外
      if (trendMA5 === null || trendMA25 === null || trendMA75 === null) return false;

      // 1日でも順序（短期＞中期＞長期）が崩れていれば除外
      if (!(trendMA5 > trendMA25 && trendMA25 > trendMA75)) return false;
    }

    // 条件①・条件②の両方を満たした場合のみクロスV
    return true;
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