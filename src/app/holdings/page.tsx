// ========================================
// src/app/holdings/page.tsx
// 保有銘柄ページ
// ========================================

'use client';

import { Suspense } from 'react';
import { useStockDataStorage } from '@/hooks/useStockDataStorage';
import { usePagination } from '@/hooks/usePagination';
import StockCard from '@/components/StockCard';
import Pagination from '@/components/Pagination';
import SearchBox from '@/components/SearchBox';
import FloatingPageNav from '@/components/FloatingPageNav';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Wallet, Search } from 'lucide-react';

// ローディングコンポーネント
const HoldingsLoading = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
      <h2 className="text-xl font-bold mb-2">読み込み中...</h2>
      <p>株価データを読み込んでいます。</p>
    </div>
  </div>
);

const HoldingsContent = () => {
  const router = useRouter();
  
  // localStorage管理
  const {
    loading,
    error,
    isDataAvailable,
    dataAge,
    getHoldingStocks,
    holdingsCount
  } = useStockDataStorage();

  // 保有銘柄を取得
  const holdingStocks = getHoldingStocks();

  // 検索機能用のstate
  const [searchQuery, setSearchQuery] = useState('');

  // 検索結果をメモ化（パフォーマンス最適化）
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) {
      return holdingStocks;
    }

    const query = searchQuery.trim().toLowerCase();
    return holdingStocks.filter(stock => {
      // 銘柄コードと銘柄名の両方で検索
      const codeMatch = stock.code.toLowerCase().includes(query);
      const nameMatch = stock.name.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [holdingStocks, searchQuery]);

  // ページネーション機能（カスタムHook）
  const pagination = usePagination({
    items: filteredStocks,
    searchQuery: searchQuery,
  });

  // 表示する銘柄をslice
  const displayStocks = filteredStocks.slice(pagination.startIndex, pagination.endIndex);

  // 検索が有効かどうかを判定
  const isSearchActive = searchQuery.trim().length > 0;

  // 検索クリアハンドラー
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // ローディング中
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">データ読み込み中...</h2>
          <p>株価データを読み込んでいます。</p>
        </div>
      </div>
    );
  }

  // エラー時
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
          <p>{error}</p>
          <button
            onClick={() => router.push('/setting')}
            className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            設定ページへ
          </button>
        </div>
      </div>
    );
  }

  // データがない場合
  if (!isDataAvailable) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">株価データがありません</h2>
          <p>設定ページで株価データを取得してください。</p>
          <div className="mt-4 space-x-3">
            <button
              onClick={() => router.push('/setting')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              設定ページへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 保有銘柄がない場合
  if (holdingsCount === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Wallet className="w-6 h-6 mr-2 text-red-400" />
            保有銘柄
          </h2>
        </div>
        
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-8 rounded-lg text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2">保有銘柄がありません</h3>
          <p className="mb-4">銘柄一覧ページでアイコンをクリックして、保有銘柄を追加してください。</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            銘柄一覧を見る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Wallet className="w-6 h-6 mr-2 text-red-400 fill-current" />
          保有銘柄
        </h2>
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-gray-500">
            <p className='mb-3'>最終更新：{dataAge}</p>
            <p>
              {isSearchActive ? (
                <>
                  検索結果：{pagination.startIndex + 1}〜{pagination.endIndex}銘柄 / {pagination.totalItems}銘柄
                  <span className="ml-2 text-blue-600">（全{holdingsCount}銘柄中）</span>
                </>
              ) : (
                `${pagination.startIndex + 1}〜${pagination.endIndex}銘柄 / ${pagination.totalItems}銘柄`
              )}
            </p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
            >
              画面更新
            </button>
          </div>
        </div>
      </div>

      {/* 検索ボックス */}
      <div className="mb-6">
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={handleClearSearch}
        />
      </div>

      {/* 検索結果がない場合の表示 */}
      {isSearchActive && pagination.totalItems === 0 ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-8 rounded-lg text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2">検索結果が見つかりません</h3>
          <p className="mb-4">「{searchQuery}」に該当する銘柄がありません。</p>
          <div className="text-sm text-gray-600 mb-4">
            <p>・銘柄コードは4桁の数字で入力してください（例：7203）</p>
            <p>・銘柄名は一部だけでも検索できます（例：トヨタ）</p>
          </div>
          <button
            onClick={handleClearSearch}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            検索をクリア
          </button>
        </div>
      ) : (
        <>
          {/* ページネーション（上部） */}
          <div className="mb-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.handlePageChange}
              getPageNumbers={pagination.getPageNumbers}
            />
          </div>

          {/* 銘柄カード一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayStocks.map((stock) => (
              <StockCard key={stock.code} stock={stock} linkPrefix="holdings" />
            ))}
          </div>

          {/* ページネーション（下部） */}
          <div className="mt-8">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.handlePageChange}
              getPageNumbers={pagination.getPageNumbers}
            />
          </div>

          {/* フローティングページナビ（PC専用） */}
          <FloatingPageNav
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
          />
        </>
      )}
    </div>
  );
};

// Suspenseでラップしたページコンポーネント
const HoldingsPage = () => {
  return (
    <Suspense fallback={<HoldingsLoading />}>
      <HoldingsContent />
    </Suspense>
  );
};

export default HoldingsPage;