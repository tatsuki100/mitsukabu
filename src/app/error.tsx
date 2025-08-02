// ========================================
// src/app/error.tsx
// エラーページ
// ========================================

'use client'

import { useEffect } from 'react'
import { ChartCandlestick, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログに出力（本番環境では外部サービスに送信することも可能）
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-12.5rem)]">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <ChartCandlestick className="w-12 h-12 mx-auto text-red-500 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            申し訳ございませんが、予期しないエラーが発生しました。
            <br />
            しばらく時間をおいてから再度お試しください。
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            もう一度試す
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center justify-center w-full bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            TOPページに戻る
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              開発者向け情報:
            </h3>
            <pre className="text-xs text-red-700 overflow-auto max-h-20">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}