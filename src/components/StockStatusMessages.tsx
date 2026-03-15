// ========================================
// src/components/StockStatusMessages.tsx
// 株価データの読み込み中・エラー・データなし表示の共通コンポーネント
// ========================================

'use client';

// ローソク足データ（高さはpx）
const CANDLES = [
  { upperWick: 8,  body: 28, lowerWick: 12, bullish: true },
  { upperWick: 12, body: 20, lowerWick: 6,  bullish: false },
  { upperWick: 6,  body: 32, lowerWick: 10, bullish: true },
  { upperWick: 10, body: 16, lowerWick: 14, bullish: false },
  { upperWick: 14, body: 24, lowerWick: 8,  bullish: true },
  { upperWick: 8,  body: 18, lowerWick: 10, bullish: false },
];

// 読み込み中 Start
export const StockLoading = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="flex flex-col items-center justify-center py-16 pt-32">
      {/* ローソク足アニメーション */}
      <div className="flex items-end gap-3 h-20 mb-8">
        {CANDLES.map((candle, i) => (
          <div
            key={i}
            className="flex flex-col items-center animate-candlestick-grow"
            style={{
              animationDelay: `${i * 0.15}s`,
              transformOrigin: 'bottom',
            }}
          >
            {/* 上ヒゲ */}
            <div
              className={candle.bullish ? 'bg-green-500' : 'bg-red-500'}
              style={{ width: '2px', height: `${candle.upperWick}px` }}
            />
            {/* 実体 */}
            <div
              className={`rounded-sm ${candle.bullish ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: '12px', height: `${candle.body}px` }}
            />
            {/* 下ヒゲ */}
            <div
              className={candle.bullish ? 'bg-green-500' : 'bg-red-500'}
              style={{ width: '2px', height: `${candle.lowerWick}px` }}
            />
          </div>
        ))}
      </div>

      {/* テキスト */}
      <p className="text-gray-600 font-bold text-lg">データ読み込み中...</p>
      <p className="text-gray-400 text-sm mt-1">株価データを読み込んでいます</p>
    </div>
  </div>
);
// 読み込み中 End

// エラー時 Start
export const StockError = ({ error }: { error: string }) => (
  <div className="container mx-auto px-4 py-8">
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
      <p>{error}</p>
      <p className="mt-2">通信環境を確認していただくか、改善されない場合は、以下から管理者にお問い合わせください。</p>
      <p><a href="https://forms.gle/iVTN7imV4KvjNCzr8" target="_blank" className="underline text-blue-500">https://forms.gle/iVTN7imV4KvjNCzr8</a></p>
    </div>
  </div>
);
// エラー時 End

// データがない場合 Start
export const StockNoData = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
      <h2 className="text-xl font-bold mb-2">株価データがありません</h2>
      <p>通信環境を確認していただくか、改善されない場合は、以下から管理者にお問い合わせください。</p>
      <p><a href="https://forms.gle/iVTN7imV4KvjNCzr8" target="_blank" className="underline text-blue-500">https://forms.gle/iVTN7imV4KvjNCzr8</a></p>
    </div>
  </div>
);
// データがない場合 End
