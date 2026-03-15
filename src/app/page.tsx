// ========================================
// src/app/page.tsx
// TOP画面(銘柄一覧画面)
// ========================================

import { Suspense } from "react";
import StockList from "@/components/StockList";
import { StockLoading } from "@/components/StockStatusMessages";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<StockLoading />}>
        <StockList />
      </Suspense>
    </main>
  )
}
