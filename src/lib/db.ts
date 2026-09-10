// ========================================
// src/lib/db.ts
// Neon DB接続ユーティリティ
// ========================================

import { neon } from '@neondatabase/serverless';

// NeonのサーバーレスドライバーでSQL関数を生成
// 全てのAPIルートからこのファイルをimportしてDB操作を行う
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
}

// TIMESTAMP型（タイムゾーンなし）カラムの値をUTCとして解釈しISO文字列に変換
// NeonのセッションタイムゾーンはUTCのため、CURRENT_TIMESTAMPの実体はUTC時刻だが
// タイムゾーン情報を持たない文字列で返ってくる（そのままDate化するとブラウザのローカルタイムゾーンとして誤解釈される）
export function toIsoStringUtc(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value + '+00:00').toISOString();
}
