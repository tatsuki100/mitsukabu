// ========================================
// src/components/StockList.tsx
// 銘柄一覧のコンポーネント
// ========================================

'use client';

import { useStockDataStorage } from '@/hooks/useStockDataStorage';
import { usePagination } from '@/hooks/usePagination';
import StockCard from './StockCard';
import Pagination from './Pagination';
import SearchBox from './SearchBox';
import FloatingPageNav from './FloatingPageNav';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { StockLoading, StockError, StockNoData } from '@/components/StockStatusMessages';

const StockList = () => {
  
  // localStorage管理
  const {
    storedData,
    loading,
    error,
    isDataAvailable,
    dataAge
  } = useStockDataStorage();

  // 検索機能用のstate
  const [searchQuery, setSearchQuery] = useState('');

  // 検索結果をメモ化（パフォーマンス最適化）
  const filteredStocks = useMemo(() => {
    if (!storedData || !searchQuery.trim()) {
      return storedData?.stocks || [];
    }

    const query = searchQuery.trim().toLowerCase();
    return storedData.stocks.filter(stock => {
      // 銘柄コードと銘柄名の両方で検索
      const codeMatch = stock.code.toLowerCase().includes(query);
      const nameMatch = stock.name.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [storedData, searchQuery]);

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

  // テスト用で強制的にローディング中にする場合は以下のコメントアウトを外す
  // if (true || loading) return <StockLoading />;

  // テスト用で強制的にローディング中にする場合は以下にコメントアウトをかける
  if (loading) return <StockLoading />;

  // エラー時
  if (error) return <StockError error={error} />;

  // データがない場合
  if (!isDataAvailable) return <StockNoData />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー Start */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">JPX400 銘柄一覧</h2>
        <div className="md:flex justify-between items-center mt-2">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            <p className='mb-1'>最終更新：{dataAge}</p>
            <p>
              {isSearchActive ? (
                <>
                  検索結果：{pagination.startIndex + 1}〜{pagination.endIndex}銘柄 / {pagination.totalItems}銘柄
                  <span className="ml-2 text-blue-600">（全{storedData?.stocks.length || 0}銘柄中）</span>
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
      {/* ヘッダー End */}

      {/* 検索ボックス Start */}
      <div className="mb-6">
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={handleClearSearch}
        />
      </div>
      {/* 検索ボックス End */}

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
              <StockCard key={stock.code} stock={stock} />
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

export default StockList;