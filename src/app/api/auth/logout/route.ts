// ========================================
// src/app/api/auth/logout/route.ts
// ログアウトAPI（Cookie削除）
// ========================================

import { NextResponse } from 'next/server';
import { deleteTokenCookie } from '@/lib/auth';

// POST /api/auth/logout
export async function POST() {
  try {
    await deleteTokenCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/auth/logout エラー:', error);
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    );
  }
}
