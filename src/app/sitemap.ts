// ========================================
// src/app/sitemap.ts
// サイトマップ自動生成
// ========================================

import { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mitsukabu.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // 個別銘柄ページ（DBから銘柄コード一覧を取得）
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT stock_code FROM stock_data ORDER BY stock_code ASC
    `;

    const stockPages: MetadataRoute.Sitemap = rows.map(row => ({
      url: `${BASE_URL}/stock/${row.stock_code}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...stockPages];
  } catch {
    // DB接続エラー時は静的ページのみ返す
    return staticPages;
  }
}
