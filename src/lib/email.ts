// ========================================
// src/lib/email.ts
// Resendメール送信ユーティリティ
// ========================================

import { Resend } from 'resend';

// Resendクライアント取得
const getResendClient = (): Resend => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
};

// 送信元アドレス
const FROM_ADDRESS = 'みつかぶ <noreply@mitsukabu.com>';

// パスワードリセットメール送信
export const sendPasswordResetEmail = async (
  toEmail: string,
  resetUrl: string
): Promise<void> => {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: '【みつかぶ】パスワード再設定',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>パスワード再設定</h2>
        <p>以下のリンクをクリックして、新しいパスワードを設定してください。</p>
        <p>
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            パスワードを再設定する
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          このリンクは1時間有効です。<br />
          心当たりのない場合は、このメールを無視してください。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          みつかぶ - JPX400株式スクリーニングツール
        </p>
      </div>
    `,
  });
};
