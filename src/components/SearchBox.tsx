// ========================================
// src/components/SearchBox.tsx
// 検索ボックスコンポーネント
// ========================================

import React from 'react';
import { Search, X } from 'lucide-react';

// Props の型定義
type SearchBoxProps = {
  value: string;                                  // 検索クエリ
  onChange: (value: string) => void;              // 変更ハンドラー
  onClear: () => void;                            // クリアハンドラー
  placeholder?: string;                           // プレースホルダー
};

const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  onClear,
  placeholder = '銘柄コードまたは銘柄名で検索',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="max-w-md relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full text-sm px-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="検索をクリア"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBox;
