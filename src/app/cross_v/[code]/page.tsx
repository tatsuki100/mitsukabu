// ========================================
// src/app/cross_v/[code]/page.tsx
// クロスV専用の個別銘柄画面
// ========================================

'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';
import { StockLoading } from '@/components/StockStatusMessages';

// トレンド確認期間のデフォルト値（営業日）
const DEFAULT_TREND_WINDOW = 30;

const CrossVStockDetailContent = () => {
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  // 一覧ページから引き継いだトレンド確認期間を取得（未指定・不正値はデフォルトを使用）
  const searchParams = useSearchParams();
  const trendWindowParam = searchParams.get('trendWindow');
  const parsedTrendWindow = trendWindowParam ? parseInt(trendWindowParam, 10) : NaN;
  const crossVTrendWindow =
    Number.isInteger(parsedTrendWindow) && parsedTrendWindow >= 1
      ? parsedTrendWindow
      : DEFAULT_TREND_WINDOW;

  return (
    <StockDetailPage
      stockCode={stockCode}
      navigationMode="cross_v"
      screeningCondition="クロスV"
      crossVTrendWindow={crossVTrendWindow}
    />
  );
};

// Suspenseでラップしたページコンポーネント（useSearchParams利用のため）
const CrossVStockDetailPage = () => {
  return (
    <Suspense fallback={<StockLoading />}>
      <CrossVStockDetailContent />
    </Suspense>
  );
};

export default CrossVStockDetailPage;
