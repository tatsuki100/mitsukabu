// ========================================
// src/app/holdings/page.tsx
// 保有銘柄ページ
// ========================================

'use client';

import { useStockDataStorage } from '@/hooks/useStockDataStorage';
import StockCard from '@/components/StockCard';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Wallet } from 'lucide-react';

const HoldingsPage = () => {
  const router = useRouter();
  
  // localStorage管理
  const { 
    // storedData, 
    loading, 
    error, 
    isDataAvailable,
    dataAge,
    getHoldingStocks,
    holdingsCount
  } = useStockDataStorage();

  // ページネーション用のstate
  const [currentPage, setCurrentPage] = useState(0); // 現在のページ（0ベース）
  const itemsPerPage = 32; // 1ページあたりの表示数（固定）

  // 保有銘柄を取得
  const holdingStocks = getHoldingStocks();

  // データが変わった時にページをリセット
  useEffect(() => {
    setCurrentPage(0);
  }, [holdingStocks]);

  // ページネーション計算
  const totalItems = holdingStocks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const displayStocks = holdingStocks.slice(startIndex, endIndex);

  // ページ変更ハンドラー
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      // ページ変更時にトップにスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // キーボード操作のハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 入力フィールドにフォーカスがある場合は無視
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (currentPage > 0) {
          handlePageChange(currentPage - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentPage < totalPages - 1) {
          handlePageChange(currentPage + 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        handlePageChange(0);
        break;
      case 'End':
        event.preventDefault();
        handlePageChange(totalPages - 1);
        break;
    }
  }, [currentPage, totalPages, handlePageChange]);

  // キーボードイベントリスナーの設定
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // ページ番号の配列を生成（...省略対応）
  const getPageNumbers = (): (number | string)[] => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 7; // 表示する最大ページ数

    if (totalPages <= maxVisiblePages) {
      // 全ページ表示
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 省略表示
      if (currentPage <= 3) {
        // 最初の方のページ
        for (let i = 0; i < 5; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      } else if (currentPage >= totalPages - 4) {
        // 最後の方のページ
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = totalPages - 5; i < totalPages; i++) pageNumbers.push(i);
      } else {
        // 中間のページ
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      }
    }

    return pageNumbers;
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
            <p>{startIndex + 1}〜{endIndex}銘柄 / {totalItems}銘柄</p>
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

      {/* ページネーション（上部） */}
      {totalPages > 1 && (
        <div className="mb-6 flex justify-center">
          <nav className="flex items-center space-x-1">
            {/* 最初のページ */}
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className={`p-2 rounded ${
                currentPage === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="最初のページ（Homeキー）"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* 前のページ */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className={`p-2 rounded ${
                currentPage === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="前のページ（←キー）"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* ページ番号 */}
            {getPageNumbers().map((pageNum, index) => (
              <button
                key={index}
                onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : undefined}
                disabled={pageNum === '...'}
                className={`px-3 py-2 rounded text-sm ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white font-bold'
                    : pageNum === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                {typeof pageNum === 'number' ? pageNum + 1 : pageNum}
              </button>
            ))}

            {/* 次のページ */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded ${
                currentPage === totalPages - 1
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="次のページ（→キー）"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* 最後のページ */}
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded ${
                currentPage === totalPages - 1
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="最後のページ（Endキー）"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      )}

      {/* 銘柄カード一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStocks.map((stock) => (
          <StockCard key={stock.code} stock={stock} linkPrefix="holdings" />
        ))}
      </div>

      {/* ページネーション（下部） */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-1">
            {/* 最初のページ */}
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className={`p-2 rounded ${
                currentPage === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="最初のページ（Homeキー）"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* 前のページ */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className={`p-2 rounded ${
                currentPage === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="前のページ（←キー）"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* ページ番号 */}
            {getPageNumbers().map((pageNum, index) => (
              <button
                key={index}
                onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : undefined}
                disabled={pageNum === '...'}
                className={`px-3 py-2 rounded text-sm ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white font-bold'
                    : pageNum === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                {typeof pageNum === 'number' ? pageNum + 1 : pageNum}
              </button>
            ))}

            {/* 次のページ */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded ${
                currentPage === totalPages - 1
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="次のページ（→キー）"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* 最後のページ */}
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded ${
                currentPage === totalPages - 1
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="最後のページ（Endキー）"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default HoldingsPage;