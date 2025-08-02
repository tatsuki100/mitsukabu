// ========================================
// src/app/page.tsx
// TOP画面(銘柄一覧画面)
// ========================================

import StockList from "@/components/StockList";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <StockList />
    </main>
  )
}