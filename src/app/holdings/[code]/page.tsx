// ========================================
// src/app/holdings/[code]/page.tsx
// 保有銘柄専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';
import { useAuth } from '@/components/AuthProvider';
import AuthRequiredPage from '@/components/AuthRequiredPage';

const HoldingStockDetailPage = () => {
  const user = useAuth();
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  if (!user) {
    return <AuthRequiredPage pageName="保有銘柄" />;
  }

  return (
    <StockDetailPage
      stockCode={stockCode}
      navigationMode="holdings" //保有銘柄のみ
    />
  );
};

export default HoldingStockDetailPage;
