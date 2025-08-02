// ========================================
// src/app/not-found.tsx
// 404エラーページ
// ========================================

import Link from 'next/link'
import { ChartCandlestick, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-12.5rem)]">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <ChartCandlestick className="w-12 h-12 mx-auto text-blue-500 mb-3" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Oh... 404 Not Found</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            ページが見つかりません
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            お探しのページは存在しないか、移動した可能性があります。
            <br />
            URLを確認するか、TOPページからお探しください。
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            TOPぺージに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}