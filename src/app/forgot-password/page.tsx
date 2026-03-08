// ========================================
// src/app/forgot-password/page.tsx
// パスワードリセットメール送信ページ
// ========================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChartCandlestick } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'エラーが発生しました');
        return;
      }

      // 成功 → メッセージ表示（メールの有無に関わらず同じ）
      setSuccess(true);

    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center text-2xl font-bold mb-2">
            <ChartCandlestick className="mr-2" />
            みつかぶ
          </div>
          <p className="text-gray-500 text-sm">JPX400株式スクリーニングツール</p>
        </div>

        {/* フォーム */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-6 text-center">パスワード再設定</h1>

          {success ? (
            // 送信完了メッセージ
            <div>
              <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 text-sm mb-6">
                再設定用のリンクを送信しました。メールをご確認ください。
              </div>
              <div className="text-center text-sm text-gray-600">
                <Link href="/login" className="text-blue-600 hover:underline">
                  ログインページに戻る
                </Link>
              </div>
            </div>
          ) : (
            // 入力フォーム
            <div>
              <p className="text-sm text-gray-600 mb-4">
                登録したメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example@email.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? '送信中...' : 'リセットリンクを送信'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                <Link href="/login" className="text-blue-600 hover:underline">
                  ログインページに戻る
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
