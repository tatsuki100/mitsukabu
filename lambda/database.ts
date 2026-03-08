// ========================================
// lambda/database.ts
// Neon DB接続 + トランザクションUPSERT + revalidate呼び出し
// ========================================

import { neon } from '@neondatabase/serverless';
import { DailyData } from './convertData';

// 成功した銘柄のデータ型
export type SuccessfulStockResult = {
  stockCode: string;
  stockName: string;
  dailyData: DailyData[];
};

// 全銘柄データを一括トランザクションUPSERT
export const saveAllStocksToDb = async (
  results: SuccessfulStockResult[]
): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = neon(databaseUrl);

  console.log(`DB保存開始: ${results.length}銘柄をトランザクションでUPSERT`);

  // sql.transaction() で全銘柄を一括トランザクションUPSERT
  // 全てのUPSERTが成功した場合のみCOMMITされ、エラー時は自動ROLLBACK
  await sql.transaction(
    results.map(result =>
      sql`INSERT INTO stock_data (stock_code, stock_name, daily_data, last_update)
      VALUES (${result.stockCode}, ${result.stockName}, ${JSON.stringify(result.dailyData)}, CURRENT_TIMESTAMP)
      ON CONFLICT (stock_code)
      DO UPDATE SET
        stock_name = EXCLUDED.stock_name,
        daily_data = EXCLUDED.daily_data,
        last_update = CURRENT_TIMESTAMP`
    )
  );

  console.log(`DB保存完了: ${results.length}銘柄`);
};

// Vercelのキャッシュを破棄（Lambda DB更新成功後に呼ぶ）
export const callRevalidateEndpoint = async (): Promise<void> => {
  const revalidateUrl = process.env.REVALIDATE_URL;
  const revalidateSecret = process.env.REVALIDATE_SECRET;

  if (!revalidateUrl || !revalidateSecret) {
    console.log('REVALIDATE_URL or REVALIDATE_SECRET が未設定のため、キャッシュ破棄をスキップ');
    return;
  }

  console.log(`キャッシュ破棄リクエスト: ${revalidateUrl}`);

  const response = await fetch(revalidateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: revalidateSecret }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`キャッシュ破棄失敗: ${response.status} ${body}`);
  }

  const result = await response.json();
  console.log('キャッシュ破棄完了:', result);
};
