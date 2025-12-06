// ========================================
// src/components/Pagination.tsx
// ページネーションUIコンポーネント
// ========================================

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Props の型定義
type PaginationProps = {
  currentPage: number;                          // 現在のページ（0ベース）
  totalPages: number;                           // 総ページ数
  onPageChange: (newPage: number) => void;      // ページ変更ハンドラー
  getPageNumbers: () => (number | string)[];    // ページ番号配列取得関数
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  getPageNumbers,
}) => {
  // ページが1ページ以下の場合は表示しない
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <nav className="flex items-center space-x-1">
        {/* 最初のページ */}
        <button
          onClick={() => onPageChange(0)}
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
          onClick={() => onPageChange(currentPage - 1)}
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
            onClick={() => typeof pageNum === 'number' ? onPageChange(pageNum) : undefined}
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
          onClick={() => onPageChange(currentPage + 1)}
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
          onClick={() => onPageChange(totalPages - 1)}
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
  );
};

export default Pagination;
