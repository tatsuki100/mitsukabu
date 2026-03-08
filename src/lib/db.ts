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
