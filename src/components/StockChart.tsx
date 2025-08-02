// ========================================
// src/components/StockChart.tsx
// ローソク足チャートのコンポーネント
// ========================================

'use client';

import ReactECharts from 'echarts-for-react';
import { DailyData, YahooStock, CHART_PERIODS } from '@/types/stockData';

interface StockChartProps {
  dailyData: DailyData[];
  stock: YahooStock;
  fullSize?: boolean;
  displayDays?: number;
  isListView?: boolean; // 一覧ページかどうかのフラグ（true＝一覧ページである）
}

// ECharts の itemStyle color function のパラメータ型定義
interface ColorParams {
  value: number;
  dataIndex: number;
  name: string;
}

// EChartsのツールチップパラメータの型定義
interface TooltipParam {
  seriesType?: string;
  seriesName?: string;
  axisValue?: string;
  data?: number[] | number;
  value?: number | number[];
}

const StockChart = ({
  dailyData,
  // stock,
  fullSize = false,
  displayDays = CHART_PERIODS.LIST_VIEW,
  isListView = false
}: StockChartProps) => {

  // 全データから価格配列を作成
  const allCloseArray = dailyData.map(item => item.close);

  // 移動平均線を計算する関数
  const calculateMA = (closeData: number[], period: number): (number | null)[] => {
    const result: (number | null)[] = [];

    for (let i = 0; i < closeData.length; i++) {
      // 利用可能なデータ数を計算（最大でperiod日分）
      const availableData = Math.min(i + 1, period);

      // 最低2日分のデータがあれば計算する
      if (availableData < 2) {
        result.push(null);  // 最初の1日だけはnull
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

  // RSIを計算する関数
  const calculateRSI = (closeData: number[], period: number = 14): (number | null)[] => {
    if (closeData.length < period + 1) {
      return new Array(closeData.length).fill(null);
    }

    const gains: number[] = [];
    const losses: number[] = [];

    // 価格変動を計算
    for (let i = 1; i < closeData.length; i++) {
      const change = closeData[i] - closeData[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    // 初期の平均利益/損失を計算
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // RSIの結果配列
    const rsiData: (number | null)[] = [];

    // 最初のperiod分はnull
    for (let i = 0; i < period; i++) {
      rsiData.push(null);
    }

    // RSIを計算
    for (let i = period; i < closeData.length; i++) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiData.push(Math.round(rsi)); //整数表示

      // 次の期間の平均を計算（指数移動平均的手法）
      if (i < gains.length) {
        avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      }
    }

    return rsiData;
  };

  // MACDを計算する関数
  const calculateMACD = (closeData: number[]): {
    macd: (number | null)[];
    signal: (number | null)[];
    histogram: (number | null)[];
  } => {
    // 指数移動平均（EMA）を計算する関数
    const calculateEMA = (data: number[], period: number): number[] => {
      const ema: number[] = [];
      const multiplier = 2 / (period + 1);

      // 最初の値は単純移動平均
      let sum = 0;
      for (let i = 0; i < period && i < data.length; i++) {
        sum += data[i];
      }
      ema[period - 1] = sum / period;

      // 以降は指数移動平均
      for (let i = period; i < data.length; i++) {
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
      }

      return ema;
    };

    if (closeData.length < 26) {
      const nullArray = new Array(closeData.length).fill(null);
      return {
        macd: nullArray,
        signal: nullArray,
        histogram: nullArray
      };
    }

    // 12日EMAと26日EMAを計算
    const ema12 = calculateEMA(closeData, 12);
    const ema26 = calculateEMA(closeData, 26);

    // MACDライン = 12日EMA - 26日EMA
    const macdLine: (number | null)[] = new Array(26).fill(null);
    const macdValues: number[] = [];

    for (let i = 25; i < closeData.length; i++) {
      if (ema12[i] !== undefined && ema26[i] !== undefined) {
        const macdValue = ema12[i] - ema26[i];
        macdLine.push(Math.round(macdValue)); // 整数表示
        macdValues.push(macdValue);
      } else {
        macdLine.push(null);
      }
    }

    // シグナルライン = MACDの9日EMA
    const signalEMA = calculateEMA(macdValues, 9);
    const signalLine: (number | null)[] = new Array(34).fill(null); // 26 + 8

    for (let i = 8; i < signalEMA.length; i++) {
      signalLine.push(Math.round(signalEMA[i])); // 整数表示
    }

    // ヒストグラム = MACD - シグナル
    const histogram: (number | null)[] = [];
    for (let i = 0; i < macdLine.length; i++) {
      if (macdLine[i] !== null && signalLine[i] !== null) {
        const histValue = (macdLine[i] as number) - (signalLine[i] as number);
        histogram.push(Math.round(histValue)); // 整数表示
      } else {
        histogram.push(null);
      }
    }

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  };

  // 全データでテクニカル指標を計算
  const allMA5 = calculateMA(allCloseArray, 5);
  const allMA25 = calculateMA(allCloseArray, 25);
  const allMA75 = calculateMA(allCloseArray, 75);
  const allRSI = calculateRSI(allCloseArray, 14);
  const allMACD = calculateMACD(allCloseArray);

  // 表示期間分のデータを切り出し
  const displayData = dailyData.slice(-displayDays);

  // 日付の表示形式を条件分岐
  const dateArray = displayData.map(item => {
    if (isListView) {
      // 一覧ページ: 月日のみ（例: "07-11"）
      const date = new Date(item.date);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}`;
    } else {
      // 個別ページ: 年月日（例: "2025-07-11"）
      return item.date;
    }
  });

  const ma5 = allMA5.slice(-displayDays);
  const ma25 = allMA25.slice(-displayDays);
  const ma75 = allMA75.slice(-displayDays);
  const rsi = allRSI.slice(-displayDays);
  const macd = allMACD.macd.slice(-displayDays);
  const signal = allMACD.signal.slice(-displayDays);
  const histogram = allMACD.histogram.slice(-displayDays);

  const option = {
    // チャートの描画の速さ（デフォルト1000ms）
    animationDuration: 300,

    // ツールチップ（マウスホバー時）の設定
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function (params: TooltipParam[]) {
        const candlestickData = params.find((param) => param.seriesType === 'candlestick');

        if (candlestickData && Array.isArray(candlestickData.data)) {
          const date = candlestickData.axisValue || '';
          const values = candlestickData.data;

          return `${date}<br/>
終値：${Math.round(values[2]).toLocaleString()}<br/>
始値：${Math.round(values[1]).toLocaleString()}<br/>
高値：${Math.round(values[4]).toLocaleString()}<br/>
安値：${Math.round(values[3]).toLocaleString()}<br/>`;
        }

        // RSIやMACDのツールチップ
        let result = '';
        params.forEach((param) => {
          if (param.seriesName && param.value !== null && param.value !== undefined) {
            const value = typeof param.value === 'number' ? Math.round(param.value) : param.value;
            result += `${param.seriesName}: ${value}<br/>`;
          }
        });

        return result || '';
      }
    },

    // チャートのレイアウト設定（3段レイアウト：価格、RSI、MACD）
    grid: [{
      left: '5%',
      right: '3%',
      height: '50%', // メインチャート
      top: '5%'
    }, {
      left: '5%',
      right: '3%',
      height: '15%', // RSIチャート
      top: '55%'
    }, {
      left: '5%',
      right: '3%',
      height: '20%', // MACDチャート
      top: '70%'
    }],

    // X軸の設定
    xAxis: [{
      type: 'category',
      data: dateArray,
      scale: true,
      gridIndex: 0,
      axisLabel: { show: false } // 常に非表示
    }, {
      type: 'category',
      data: dateArray,
      scale: true,
      gridIndex: 1,
      axisLabel: { show: false }
    }, {
      type: 'category',
      data: dateArray,
      scale: true,
      gridIndex: 2,
      axisLabel: {
        show: true, // 常に表示
        fontSize: 10
      }
    }],

    // Y軸の設定
    yAxis: [{ //メインチャート
      type: 'value',
      scale: true,
      splitArea: { show: false },
      position: 'right',
      gridIndex: 0,
      axisLabel: {
        show: isListView ? false : true, // 一覧ページでは非表示、個別ページでは表示
        fontSize: 10,
        formatter: function (value: number) {
          return Math.round(value).toString(); // 整数表示
        }
      },
      // ホバー時のY軸数値は表示（ツールチップとして機能）
      axisPointer: {
        label: {
          formatter: function (params: { value: number }) {
            return Math.round(params.value).toString();
          }
        }
      }
    }, { //RSI
      type: 'value',
      scale: true,
      splitNumber: 2,
      gridIndex: 1,
      min: 0,
      max: 100,
      axisLabel: { show: false }, // 常に非表示
      // RSI軸のホバー時も整数表示
      axisPointer: {
        label: {
          formatter: function (params: { value: number }) {
            return Math.round(params.value).toString();
          }
        }
      }
    }, { //MACD
      type: 'value',
      scale: true,
      splitNumber: 2,
      gridIndex: 2,
      axisLabel: {
        show: isListView ? false : true, // 一覧ページでは非表示、個別ページでは表示
        fontSize: 8,
        formatter: function (value: number) {
          return Math.round(value).toString(); // 整数表示
        }
      },
      // MACD軸のホバー時も整数表示
      axisPointer: {
        label: {
          formatter: function (params: { value: number }) {
            return Math.round(params.value).toString();
          }
        }
      }
    }],

    // チャートのデータ設定
    series: [
      // ローソク足
      {
        name: '日足',
        type: 'candlestick',
        data: displayData.map(item => [
          item.open,  // 始値
          item.close, // 終値
          item.low,   // 安値
          item.high   // 高値
        ]),
        itemStyle: {
          color: '#ffffff',   // 陽線の色
          color0: '#333333',  // 陰線の色
          borderColor: '#333333',  // 陽線の枠線
          borderColor0: '#333333'  // 陰線の枠線
        }
      },

      // 短期移動平均線（5日）
      {
        name: 'MA5',
        type: 'line',
        data: ma5,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          opacity: 0.8,
          width: 1.5,
          color: '#FF3B30' // 赤
        }
      },

      // 中期移動平均線（25日）
      {
        name: 'MA25',
        type: 'line',
        data: ma25,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          opacity: 0.8,
          width: 1.5,
          color: '#34C759' // 緑
        }
      },

      // 長期移動平均線（75日）
      {
        name: 'MA75',
        type: 'line',
        data: ma75,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          opacity: 0.8,
          width: 1.5,
          color: '#007AFF' // 青
        }
      },

      // RSI
      {
        name: 'RSI',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: rsi,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 1.2,
          color: '#007AFF'
        },
        // 通常時のシンボル色
        itemStyle: {
          color: '#FFFFFF',
          borderColor: '#007AFF'
        },
        emphasis: { //ホバー時の色
          itemStyle: {
            color: '#FFFFFF',
            borderColor: '#007AFF'
          }
        },
        select: { //選択時の色
          itemStyle: {
            color: '#007AFF',
            borderColor: '#007AFF'
          }
        },
        markLine: {
          symbol: 'none',
          label: { show: false },
          data: [
            { yAxis: 70, lineStyle: { color: '#82DD99', type: 'dashed' } }, // 売られ過ぎライン
            { yAxis: 30, lineStyle: { color: '#FF948E', type: 'dashed' } }  // 買われ過ぎライン
          ]
        }
      },

      // MACDライン
      {
        name: 'MACD',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macd,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 1.2,
          color: '#FFCB05' // 黄色
        },
        emphasis: { //ホバー時の色
          itemStyle: {
            color: '#FFFFFF',
            borderColor: '#FFCB05'
          }
        }
      },

      // MACDシグナルライン
      {
        name: 'シグナル',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: signal,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 1.2,
          color: '#FF3B30' // 赤
        },
        emphasis: {
          itemStyle: { //ホバー時の色
            color: '#FFFFFF',
            borderColor: '#FF3B30'
          }
        }
      },

      // MACDヒストグラム
      {
        name: 'ヒストグラム',
        type: 'bar',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: histogram,
        itemStyle: {
          color: function (params: ColorParams) {
            return params.value > 0 ? '#FF9999' : '#74D6CE';
          }
        }
      }
    ]
  };

  return (
    <div className={`w-full ${fullSize ? 'h-full' : 'h-64'}`}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default StockChart;