// ========================================
// src/components/NullDataWarning.tsx
// nullデータ警告表示コンポーネント（完全版）
// ========================================

import React from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

type NullDataWarningProps = {
  nullDataSummary: {
    totalStocksWithNullData: number;
    totalNullDays: number;
    affectedStocks: Array<{
      code: string;
      name: string;
      nullDates: string[];
    }>;
  } | null;
  onClose: () => void;
};

export const NullDataWarning: React.FC<NullDataWarningProps> = ({ 
  nullDataSummary, 
  onClose 
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false);

  // nullデータがない場合は表示しない
  if (!nullDataSummary || nullDataSummary.totalStocksWithNullData === 0) {
    return null;
  }

  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            データ取得に関する注意
          </h3>
          
          <div className="text-sm text-red-700 mb-3">
            <p className="mb-2">
              <span className="font-medium">{nullDataSummary.totalStocksWithNullData}銘柄</span>で
              合計<span className="font-medium">{nullDataSummary.totalNullDays}日分</span>のデータが
              Yahoo Finance APIから正常に取得できませんでした。
            </p>
            <p className="mb-3">
              これらの日付はチャートから除外されています（祝日や土日のように非表示になります）。
            </p>
          </div>
          
          {/* 影響を受けた銘柄の詳細（折りたたみ式） */}
          <div className="text-sm">
            <button
              onClick={toggleDetails}
              className="flex items-center w-full text-left cursor-pointer text-red-700 font-medium hover:text-red-800 transition-colors p-2 rounded hover:bg-red-100"
            >
              <span className="flex-1">
                影響を受けた銘柄の詳細 ({nullDataSummary.totalStocksWithNullData}銘柄)
              </span>
              {isDetailsExpanded ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </button>
            
            {isDetailsExpanded && (
              <div className="mt-3 max-h-48 overflow-y-auto border border-red-200 rounded">
                <div className="space-y-0">
                  {nullDataSummary.affectedStocks.map((stock, index) => (
                    <div 
                      key={`${stock.code}-${index}`}
                      className={`p-3 ${index > 0 ? 'border-t border-red-200' : ''} bg-white`}
                    >
                      <div className="font-medium text-red-900 mb-1">
                        {stock.code} - {stock.name}
                      </div>
                      <div className="text-red-600 text-xs">
                        欠損日: {stock.nullDates.join(', ')} ({stock.nullDates.length}日)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 閉じるボタン */}
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={onClose}
            className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition ease-in-out duration-150 p-1 rounded hover:bg-red-100"
            aria-label="警告を閉じる"
            title="警告を閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NullDataWarning;