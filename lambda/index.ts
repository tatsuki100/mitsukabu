// ========================================
// lambda/index.ts
// Lambda関数エントリーポイント（handler）
// EventBridgeから毎日16時(JST)にトリガーされる
// ========================================

import * as fs from 'fs';
import Papa from 'papaparse';
import { fetchSingleStock, StockFetchResult } from './fetchYahooFinance';
import { saveAllStocksToDb, callRevalidateEndpoint, SuccessfulStockResult } from './database';
import { DailyData } from './convertData';

// CSV行の型
type StockListRow = {
  'ｺｰﾄﾞ': string;
  '市場': string;
  '銘柄': string;
};

// Lambda handler
export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  const startTime = Date.now();
  console.log('=== 株価データ取得バッチ処理開始 ===');

  try {
    // 1. CSV読み込み（BOM除去対応）
    const csvContent = fs.readFileSync('./jpx400.csv', 'utf-8').replace(/^\uFEFF/, '');
    const parseResult = Papa.parse<StockListRow>(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    const stockList = parseResult.data.map(row => ({
      code: row['ｺｰﾄﾞ'],
      name: row['銘柄']
    })).filter(stock => stock.code && stock.name);

    console.log(`銘柄リスト読み込み完了: ${stockList.length}銘柄`);

    // ローカルテスト用: 環境変数で取得銘柄数を制限
    const testLimit = process.env.TEST_LIMIT ? parseInt(process.env.TEST_LIMIT) : stockList.length;
    const targetStocks = stockList.slice(0, testLimit);
    if (testLimit < stockList.length) {
      console.log(`テストモード: ${testLimit}銘柄のみ取得`);
    }

    // 2. 銘柄をループで取得（500ms間隔）
    const allResults: StockFetchResult[] = [];

    for (let i = 0; i < targetStocks.length; i++) {
      const { code, name } = targetStocks[i];
      const result = await fetchSingleStock(code, name);
      allResults.push(result);

      // 最後の銘柄以外は500ms待機（レート制限対策）
      if (i < targetStocks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 3. 結果の集計
    const successResults: SuccessfulStockResult[] = allResults
      .filter((r): r is StockFetchResult & { dailyData: DailyData[] } =>
        r.success && r.dailyData !== undefined
      )
      .map(r => ({
        stockCode: r.stockCode,
        stockName: r.stockName,
        dailyData: r.dailyData
      }));

    const failedResults = allResults.filter(r => !r.success);
    const nullDataCount = allResults.filter(r => r.nullWarning?.hasNullData).length;

    console.log(`取得完了: 成功 ${successResults.length}件, 失敗 ${failedResults.length}件, nullデータあり ${nullDataCount}件`);

    if (failedResults.length > 0) {
      console.log('失敗銘柄:', failedResults.map(r => `${r.stockCode}(${r.error})`).join(', '));
    }

    // 4. 一括DB保存（トランザクション）
    if (successResults.length > 0) {
      await saveAllStocksToDb(successResults);

      // 5. DB更新成功後、Vercelのキャッシュを破棄（イベント駆動）
      try {
        await callRevalidateEndpoint();
      } catch (revalidateError) {
        // キャッシュ破棄の失敗はDB保存には影響しない
        console.error('キャッシュ破棄エラー（DB保存は成功済み）:', revalidateError);
      }
    } else {
      console.log('成功した銘柄がないため、DB保存をスキップ');
    }

    // 6. 結果ログ出力
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary = {
      totalStocks: targetStocks.length,
      success: successResults.length,
      failed: failedResults.length,
      nullDataStocks: nullDataCount,
      elapsedSeconds: parseFloat(elapsedTime)
    };

    console.log(`=== 処理完了 (${elapsedTime}秒) ===`);
    console.log(JSON.stringify(summary, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    console.error('バッチ処理エラー:', errorMessage);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};

// ローカル実行用（LOCAL_EXEC=1 npx tsx index.ts で直接実行可能）
// Lambda上では LOCAL_EXEC は設定しないこと
if (process.env.LOCAL_EXEC) {
  // DailyData型のimport（filter用の型ガードで参照されるため）
  import('./convertData').then(() => {
    handler().then(result => {
      console.log('Lambda result:', JSON.stringify(result, null, 2));
      process.exit(result.statusCode === 200 ? 0 : 1);
    });
  });
}
