// ========================================
// src/app/api/admin/users/route.ts
// ユーザー一覧取得 & 権限変更API（admin専用）
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// DBから取得するユーザー行の型
type UserRow = {
  id: number;
  user_name: string;
  email: string | null;
  role: string;
  created_at: string;
};

// admin権限チェック
const requireAdmin = async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
};

// GET /api/admin/users - ユーザー一覧取得
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, user_name, email, role, created_at
      FROM users
      ORDER BY id ASC
    `;

    const users = (rows as unknown as UserRow[]).map(row => ({
      id: row.id,
      userName: row.user_name,
      email: row.email,
      role: row.role,
      createdAt: new Date(row.created_at + '+00:00').toISOString(),
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/admin/users エラー:', error);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}

// PATCH /api/admin/users - ユーザー権限変更
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, role } = body;

    // バリデーション
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: '権限はadminまたはuserを指定してください' }, { status: 400 });
    }

    // 自分自身の権限は変更不可（誤操作防止）
    if (userId === admin.userId) {
      return NextResponse.json({ error: '自分自身の権限は変更できません' }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      UPDATE users SET role = ${role} WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/users エラー:', error);
    return NextResponse.json({ error: '権限の変更に失敗しました' }, { status: 500 });
  }
}
