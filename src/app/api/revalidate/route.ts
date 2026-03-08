// ========================================
// src/app/api/revalidate/route.ts
// キャッシュ破棄API（Lambda DB更新成功後に呼ばれる）
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

// POST /api/revalidate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    // シークレットキーの検証
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // GET /api/stocks のキャッシュを破棄
    // unstable_cache の tags: ['stocks'] に対応するキャッシュを即時無効化
    // { expire: 0 } はプロファイルなし（即時無効化）と同じ挙動
    revalidateTag('stocks', { expire: 0 });

    console.log('キャッシュ破棄完了: stocks タグ');

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST /api/revalidate エラー:', error);
    return NextResponse.json(
      { error: 'キャッシュ破棄に失敗しました' },
      { status: 500 }
    );
  }
}
