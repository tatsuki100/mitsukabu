// ========================================
// src/app/api/stocks/refresh/route.ts
// 管理者用手動更新API（AWS Lambda非同期呼び出し）
// ========================================

import { NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { getCurrentUser } from '@/lib/auth';

// ビルド時の静的生成を防止
export const dynamic = 'force-dynamic';

// POST /api/stocks/refresh
export async function POST() {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 管理者権限チェック
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // 環境変数の確認
    const functionName = process.env.LAMBDA_FUNCTION_NAME;
    const region = process.env.AWS_REGION;

    if (!functionName || !region) {
      return NextResponse.json(
        { error: 'Lambda関数の設定が不足しています' },
        { status: 500 }
      );
    }

    // AWS Lambda クライアントを作成
    const lambdaClient = new LambdaClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Lambda関数を非同期呼び出し（InvocationType: 'Event'）
    // Vercelのタイムアウト（10秒）を回避するため、Lambdaの完了を待たない
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event',
      Payload: JSON.stringify({ source: 'manual-refresh', triggeredBy: user.userName }),
    });

    await lambdaClient.send(command);

    console.log(`手動更新開始: ${user.userName}が実行`);

    return NextResponse.json({
      success: true,
      message: '株価データの更新を開始しました。完了まで数分かかります。',
    });

  } catch (error) {
    console.error('POST /api/stocks/refresh エラー:', error);
    return NextResponse.json(
      { error: '更新の開始に失敗しました' },
      { status: 500 }
    );
  }
}
