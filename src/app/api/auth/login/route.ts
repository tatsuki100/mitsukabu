// ========================================
// src/app/api/auth/login/route.ts
// ログインAPI（JWT発行 + Cookie設定）
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setTokenCookie } from '@/lib/auth';

// DBから取得するユーザー行の型
type UserRow = {
  id: number;
  user_name: string;
  password_hash: string;
  role: string;
};

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, password } = body;

    // バリデーション
    if (!userName || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // ユーザー検索（ユーザー名またはメールアドレスで照合）
    const loginId = userName.toLowerCase();
    const rows = await sql`
      SELECT id, user_name, password_hash, role
      FROM users
      WHERE user_name = ${userName} OR email = ${loginId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    const user = rows[0] as unknown as UserRow;

    // パスワード照合
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // JWT発行
    const token = await signToken({
      userId: user.id,
      userName: user.user_name,
      role: user.role,
    });

    // httpOnly Cookieに設定
    await setTokenCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        userName: user.user_name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('POST /api/auth/login エラー:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
