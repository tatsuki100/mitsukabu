// ========================================
// src/app/page.tsx
// TOP画面(銘柄一覧画面)
// ========================================

import { Suspense } from "react";
import StockList from "@/components/StockList";

// ローディングコンポーネント
const StockListLoading = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
      <h2 className="text-xl font-bold mb-2">読み込み中...</h2>
      <p>株価データを読み込んでいます。</p>
    </div>
  </div>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<StockListLoading />}>
        <StockList />
      </Suspense>
    </main>
  )
}
