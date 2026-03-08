// ========================================
// src/app/login/page.tsx
// ログインページ
// ========================================

'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChartCandlestick, Eye, EyeOff } from 'lucide-react';

const LoginContent = () => {
  const searchParams = useSearchParams();
  // fromパラメータからリダイレクト先を取得（セキュリティ: 相対パスのみ許可）
  const fromParam = searchParams.get('from');
  const redirectTo = (fromParam && fromParam.startsWith('/')) ? fromParam : '/';

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'ログインに失敗しました');
        return;
      }

      // フルリロードでServer Componentが新しいCookieを読み取る
      window.location.href = redirectTo;

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

        {/* ログインフォーム */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-6 text-center">ログイン</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                ユーザー名 または メールアドレス
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ユーザー名 または メールアドレス"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="パスワードを入力"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
              パスワードを忘れた方はこちら
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            アカウントをお持ちでない方は
            <Link href="/register" className="text-blue-600 hover:underline ml-1">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
