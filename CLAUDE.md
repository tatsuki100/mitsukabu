# CLAUDE.md

このファイルは、このリポジトリ内のコードを操作する際に Claude Code (claude.ai/code) にガイダンスを提供します。

---

## 🚨 最重要ルール（必ず守ること）

### 1. イエスマンにならない

- ユーザーの意見に無条件に合わせて「その通りです！」と言わない
- 正しくない意見や提案は、理由を添えて指摘する
- 忖度せず、平等な視点で正しい思考をする
- ユーザーの意見を承認することは嬉しいが、間違った意見まで正しいかのように錯覚させない
- 無理やりユーザーの意見に合わせる必要は全くない

### 2. 正確性を最優先

- **正確な情報が分からない時は「分からない」と明言する**
- 不確実な情報をあたかも本当の情報のように回答しない
- 憶測する場合は「これは憶測ですが」と明示する
- 「分からない」とハッキリ言う方が、不確実な情報を生成するよりも遥かに好ましい
- 生成のスピードよりも正確性・クオリティを重視する

### 3. ソースコード修正時の必須プロセス

**必ず以下の順序で進める:**

```
Step 1: 問題の原因を100%明確にする
    ↓
Step 2: 既存コードを100%完璧に読み込む
    ↓
Step 3: ソースコードを生成する
    ↓
Step 4: 既存機能が消えていないか確認する
```

#### Step 1: 問題の原因を100%明確にする（最優先）
- 問題の解明が曖昧なまま、やたらめったらソースコードを生成しない
- まず「問題の原因を100%明確にすること」からスタート
- 原因が明確になってから、初めてソースコードの生成に進む
- 原因が不明な場合は、ユーザーに確認を求める

#### Step 2: 既存コードを100%完璧に読み込む
- 新しい機能を追加する場合、必ず既存コードを完全に読み込んでから実装を開始
- 既存コードを100%完璧に正確に読み込めない場合は、**直ちにユーザーに伝える**
- ユーザーがファイルを提供するので、それを正として使用
- この手間を煩わしいと思わない。先祖返りを起こすより1億倍マシ

#### Step 3: ソースコードを生成する
- 生成のスピードよりも正確性を優先
- 既存コードの構造を尊重して追加する

#### Step 4: 既存機能が消えていないか確認する
- `git diff` で変更内容を確認
- 意図しない削除がないかチェック
- 既存の機能が消えていないことを必ず確認

---

## ⛔ 先祖返り（デグレーション）の絶対防止

**これは最も重要なルールです。絶対に100%確実に守ってください。**

### 先祖返りとは
既存のコードに新しい機能を追加した際、既存の機能の一部が消えてしまうこと。

### 絶対ルール
- **先祖返り（デグレーション）は絶対に起こさない**
- 何か特別な指示がない限り、既存の機能を修正したり削除したりしない
- 新しい機能を実装する場合、既存の機能は100%そのまま残す
- 既存の機能が消えないよう、細心の注意を払う
- **繰り返しになるが、先祖帰りは絶対に起こさない**

### ⚠️ 既存メソッドを参考にしてコードを書く場合の絶対ルール

既存機能の改修（追加・複製・編集、どのような形であっても）を行う場合、以下を**絶対に**守ること。
「コードの複製だから見落としました」「追加だから漏れました」などの言い訳は一切許されない。

1. **参考にするメソッドを最初から最後まで120%完璧に読み込む**
   - 「この辺りまで分かればいいだろう」という判断は絶対にしない
   - 成功時の後処理、エラー時の後処理、finally句、すべてを完全に把握する
   - 特に成功時に呼ばれている他のメソッド（例：`saveStockData()`）を見落とさない

2. **参考メソッドの各処理がなぜ存在するのか、意図を100%理解する**
   - 理解できない処理がある場合は、ユーザーに確認する
   - 「たぶん不要だろう」と勝手に判断して省略することは絶対にしない

3. **コード作成後、参考メソッドと新メソッドを1行ずつ突き合わせて確認する**
   - 意図的に省略した部分以外に差分がないことを確認
   - 差分がある場合、その理由を明確に説明できなければならない

4. **「追加」「複製」「編集」という作業の種類は言い訳にならない**
   - どのような作業であっても、結果として既存機能が壊れたら先祖返りである
   - 作業の種類に関係なく、既存機能を120%維持することに全身全霊を挙げて取り組む

### 過去の失敗事例（絶対に繰り返さないこと）

> **事例**: 既存メソッドAを参考にメソッドB,C,D,Eを修正した際、メソッドAの成功時処理の最後で呼ばれていた「別メソッドXへの呼び出し」を見落とした
> 
> **原因**: 参考メソッドAの処理を途中までしか読まず、最後まで確認しなかった
> 
> **結果**: メソッドXが担当していたDBテーブルへの保存が行われなくなり、画面を再オープンしたときにデータが表示されなくなる致命的な不具合が発生
> 
> **教訓**: **参考にするメソッドは、必ず最初の1行目から最後の1行目まで完全に読み込むこと**

---

## 🔄 コード生成が上手くいかなかった場合の対応

ユーザーが「それだと上手くいかなかった」と言った場合で、コードに間違いはないはずだと思った場合:

1. まず**要件の確認**を行う
2. 以下のように伝える：
   > 「コードで不具合のあるところや辻褄の合わない部分は無いはずですが、それでも上手くいかないということは要件を再確認させてもらえますか？」
3. 以下の2つのどちらが原因かを明確にする：
   - 「ユーザーの頭の中の理想像」と「Claude Codeが理解していること」の内容が違う
   - コード自体が間違っている

---

## 📋 プロジェクト概要

**みつかぶ** - JPX400銘柄スクリーニングツール

**みつかぶ**は、JPX400銘柄の株価をローソク足チャートで一覧表示する日本語の株式スクリーニングWebアプリケーションです。

- **本番URL**: https://www.mitsukabu.com/
- **目的**: 「明日は何の銘柄を買おうかな」と1日1回考えるための投資支援ツール
- **特徴**: 会員登録不要・完全無料
- **デプロイ**: Vercel（GitHubと連携、mainブランチへのpushで自動デプロイ）

### 主な機能
- テクニカル指標による株価スクリーニング（移動平均線、RSI、MACD）
- ターンバックパターン検出（ローソク足が移動平均線を突き抜ける）
- クロスVパターン検出（短期移動平均線が中長期移動平均線の下にある）
- 銘柄ステータス管理：観察銘柄・検討銘柄・保有銘柄（localStorage使用、排他制御）
- 銘柄ごとのメモ機能（500文字まで）
- 検索機能（銘柄コード・銘柄名）- 全ページで利用可能
- ページネーション（32件/ページ、キーボード操作対応）
- キーボード操作（←→Home Endキーでページ切り替え）
- EmailJSによるメールバックアップ機能
- 個人利用向けのBasic認証

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| UI | React 19, Tailwind CSS |
| チャート | ECharts, echarts-for-react |
| アイコン | Lucide React |
| データ圧縮 | pako |
| CSV解析 | PapaParse |
| HTTP | axios |
| メールバックアップ | EmailJS |
| デプロイ | Vercel |
| ドメイン | お名前.com |

---

## 📁 ディレクトリ構造

```
mitsukabu/
├── public/
│   ├── jpx400.csv          # JPX400銘柄リスト（銘柄コード・銘柄名）
│   ├── favicon.ico
│   ├── og-image.jpg
│   └── robots.txt
│
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/
│   │   │   └── stock/[code]/route.ts   # Yahoo Finance APIプロキシ
│   │   │
│   │   ├── page.tsx         # トップページ（銘柄一覧）
│   │   ├── layout.tsx       # 全体レイアウト
│   │   ├── globals.css      # グローバルCSS
│   │   ├── error.tsx        # エラーページ
│   │   ├── not-found.tsx    # 404ページ
│   │   │
│   │   ├── stock/[code]/    # 個別銘柄ページ（全銘柄）
│   │   ├── favorites/       # 観察銘柄ページ
│   │   │   ├── page.tsx     # 一覧
│   │   │   └── [code]/      # 個別
│   │   ├── holdings/        # 保有銘柄ページ
│   │   │   ├── page.tsx
│   │   │   └── [code]/
│   │   ├── considering/     # 検討銘柄ページ
│   │   │   ├── page.tsx
│   │   │   └── [code]/
│   │   ├── turn_back/       # ターンバック銘柄ページ
│   │   │   ├── page.tsx
│   │   │   └── [code]/
│   │   ├── cross_v/         # クロスV銘柄ページ
│   │   │   ├── page.tsx
│   │   │   └── [code]/
│   │   │
│   │   ├── setting/         # 設定ページ（株価データ取得）
│   │   ├── privacy/         # プライバシーポリシー
│   │   └── terms/           # 利用規約
│   │
│   ├── components/          # 共通コンポーネント
│   │   ├── Header.tsx       # ヘッダー
│   │   ├── Footer.tsx       # フッター（現在未使用）
│   │   ├── StockList.tsx    # 銘柄一覧（検索・ページネーション）
│   │   ├── StockCard.tsx    # 銘柄カード（チャート・メモ・ボタン）
│   │   ├── StockChart.tsx   # ローソク足チャート（ECharts）
│   │   ├── StockDetailPage.tsx  # 個別銘柄詳細（共通）
│   │   ├── Pagination.tsx   # ページネーションUIコンポーネント
│   │   ├── SearchBox.tsx    # 検索ボックスコンポーネント
│   │   └── StockStatusButton.tsx  # 銘柄ステータス選択ボタン（ロータリー式）
│   │
│   ├── hooks/               # カスタムフック
│   │   ├── useJPX400Stocks.ts      # JPX400銘柄リスト取得
│   │   ├── useYahooFinanceAPI.ts   # Yahoo Finance API通信
│   │   ├── useStockDataStorage.ts  # localStorage管理（圧縮対応）
│   │   ├── useStockMemo.ts         # 銘柄メモ管理
│   │   ├── useStockScreening.ts    # スクリーニング条件判定
│   │   ├── useEmailBackup.ts       # メールバックアップ
│   │   └── usePagination.ts        # ページネーション機能
│   │
│   ├── types/
│   │   └── stockData.ts     # 型定義（DailyData, StoredStock等）
│   │
│   └── middleware.ts        # Basic認証ミドルウェア
│
├── db/
│   └── schema.sql           # PostgreSQLスキーマ（将来計画用、現在未使用）
│
├── .env.local               # 環境変数
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── eslint.config.mjs
```

---

## 🔧 主要機能の詳細

### 1. 株価データ取得・表示
- **データソース**: Yahoo Finance API（非公式）
- **取得方法**: `/api/stock/[code]/route.ts` でプロキシ
- **レート制限対策**: 1秒あたり2リクエスト（約3分半で400銘柄取得）
- **データ範囲**: 過去7ヶ月の日足データ

### 2. チャート表示
- **ライブラリ**: ECharts (echarts-for-react)
- **表示内容**:
  - ローソク足（日足）
  - 移動平均線（5日・25日・75日）
  - RSI（9日）
  - MACD
  - 出来高

### 3. localStorage管理
- **保存キー**:
  - `jpx400_stock_data_v1`: 株価データ（バージョン1.2.0）
  - `jpx400_favorites_v1`: 観察銘柄（バージョン1.0.0）
  - `jpx400_holdings_v1`: 保有銘柄（バージョン1.0.0）
  - `jpx400_considering_v1`: 検討銘柄（バージョン1.0.0）
  - `jpx400_stock_memos_v1`: メモ
- **圧縮**: 4.7MB超過時にpako（gzip）で自動圧縮
- **バージョン管理**: 互換性のないデータは自動削除

### 4. スクリーニング機能
| 条件名 | 判定ロジック |
|--------|-------------|
| ターンバック | 株価（高値・安値）が移動平均線（MA25またはMA75）を突き抜ける |
| クロスV | 5日線が25日線または75日線を下回る |

### 5. ユーザー機能
- **銘柄ステータス**: ロータリー式ボタンで3つのステータスを切り替え（排他制御：1銘柄につき1つのみ）
  - **観察銘柄**: 長期的に観察したい銘柄
  - **検討銘柄**: 短期的に購入を検討中の銘柄（「明日買おうかな」）
  - **保有銘柄**: 実際に保有している銘柄
- **メモ**: 銘柄ごとに500文字までのメモを保存
- **検索**: 銘柄コード・銘柄名で検索（全ページで利用可能）
- **ページネーション**: 32件/ページで表示、省略表示対応（1 ... 3 4 5 ... 10）
- **キーボード操作**: ←→Home Endキーでページ切り替え

### 6. バックアップ
- **EmailJS**: 観察銘柄・検討銘柄・メモをメール送信でバックアップ可能
- 検討銘柄はメモ付きで送信される

---

## 🖥 コマンド

```bash
# 開発
npm run dev              # 開発サーバー起動（localhost:3000）

#デプロイ（git push後、CI/CDが自動ビルド＆デプロイ）
git status               # 変更されたファイルを確認
git add .                # 変更をステージング
git commit -m "update"   # コミット
git push origin main    # GitHubにプッシュ

# その他：ビルド関連
npm run build            # 本番用ビルド
npm start                # 本番サーバー起動

# その他：Lint
npm run lint             # ESLint実行
```

---

## 🏗 アーキテクチャ

### データフロー

1. **株価データソース**: Yahoo Finance API（`/src/app/api/stock/[code]/route.ts`経由でアクセス）
2. **データ保存**: クライアント側のlocalStorageにpako圧縮で保存（4.7MB以上の場合）
3. **銘柄リスト**: `/public/jpx400.csv`から読み込み（銘柄コード、名前、市場の400銘柄）

### コアHooks

| Hook | ファイル | 役割 |
|------|----------|------|
| `useStockDataStorage` | `/src/hooks/useStockDataStorage.ts` | localStorage管理。自動圧縮、バージョン管理、nullデータ警告。観察・検討・保有銘柄の永続化。`getStockStatus`/`setStockStatus`で排他制御 |
| `useYahooFinanceAPI` | `/src/hooks/useYahooFinanceAPI.ts` | Yahoo Finance APIから株価データ取得、DailyData形式に変換 |
| `useJPX400Stocks` | `/src/hooks/useJPX400Stocks.ts` | CSVからJPX400銘柄リスト読み込み。開発10銘柄、本番400銘柄 |
| `useStockScreening` | `/src/hooks/useStockScreening.ts` | テクニカル分析（ターンバック・クロスV判定） |
| `useStockMemo` | `/src/hooks/useStockMemo.ts` | 銘柄ごとのメモ管理 |
| `useEmailBackup` | `/src/hooks/useEmailBackup.ts` | EmailJSで観察銘柄・検討銘柄・メモをメール送信 |
| `usePagination` | `/src/hooks/usePagination.ts` | ページネーション機能。ページ状態管理、キーボード操作、ページ番号生成 |

### ページネーション機能

ページネーション機能は、カスタムHook（`usePagination`）とUIコンポーネント（`Pagination`、`SearchBox`）に分離された設計になっています。

**設計パターン**:
- **ロジック**: `usePagination` でページ状態管理、キーボード操作、ページ番号計算を実装
- **UI**: `Pagination` でページネーションボタンのみを表示（プレゼンテーション層）
- **検索**: `SearchBox` で検索入力UIを提供

**主な機能**:
- 32件/ページで表示
- キーボード操作（←→前後ページ、Home最初のページ、End最後のページ）
- ページ番号の省略表示（例：1 ... 3 4 5 ... 10）
- 検索クエリまたはアイテム数変更時に自動的にページ1にリセット
- useRefを使用した最適化（無限ループ防止）

**使用箇所**:
- 全銘柄一覧（`StockList.tsx`）
- 観察銘柄（`favorites/page.tsx`）
- 検討銘柄（`considering/page.tsx`）
- 保有銘柄（`holdings/page.tsx`）
- ターンバック銘柄（`turn_back/page.tsx`）
- クロスV銘柄（`cross_v/page.tsx`）

### 主要コンポーネント

| コンポーネント | ファイル | 役割 |
|---------------|----------|------|
| `StockList` | `/src/components/StockList.tsx` | メイン一覧画面。usePagination/SearchBoxを使用した検索・ページネーション |
| `StockCard` | `/src/components/StockCard.tsx` | 個別銘柄カード。ミニチャート・メモ・ボタン表示 |
| `StockChart` | `/src/components/StockChart.tsx` | EChartsベースのローソク足チャート。移動平均線とRSI表示 |
| `StockDetailPage` | `/src/components/StockDetailPage.tsx` | 銘柄詳細ページ。100日間のチャート表示 |
| `Header` | `/src/components/Header.tsx` | ナビゲーションヘッダー。銘柄数バッジ表示 |
| `Pagination` | `/src/components/Pagination.tsx` | ページネーションUIコンポーネント。前後移動・ページ番号表示 |
| `SearchBox` | `/src/components/SearchBox.tsx` | 検索入力コンポーネント。銘柄コード・銘柄名で検索 |
| `StockStatusButton` | `/src/components/StockStatusButton.tsx` | 銘柄ステータス選択ボタン。ロータリー式で観察→検討→保有→なしと切り替え |

### ルート構成

```
/                           # 銘柄一覧（トップページ）
/stock/[code]               # 個別銘柄詳細
/favorites                  # お気に入り一覧
/favorites/[code]           # お気に入り銘柄詳細
/holdings                   # 保有銘柄一覧
/holdings/[code]            # 保有銘柄詳細
/considering                # 検討銘柄一覧
/considering/[code]         # 検討銘柄詳細
/turn_back                  # ターンバックパターンスクリーニング結果
/turn_back/[code]           # ターンバック銘柄詳細
/cross_v                    # クロスVパターンスクリーニング結果
/cross_v/[code]             # クロスV銘柄詳細
/setting                    # 設定ページ（株価データ取得）
/privacy                    # プライバシーポリシー
/terms                      # 利用規約
/api/stock/[code]           # Yahoo Finance APIプロキシ
```

---

## ⚙️ 設定

### TypeScript
- **エイリアス**: `@/*` は `./src/*` にマップ

### テクニカル指標（`/src/types/stockData.ts`で定義）

| 指標 | 設定値 |
|------|--------|
| 移動平均線（短期） | 5日 |
| 移動平均線（中期） | 25日 |
| 移動平均線（長期） | 75日 |
| RSI期間 | 9日 |
| チャート表示（一覧） | 45日 |
| チャート表示（詳細） | 100日 |

### 認証

`/src/middleware.ts`でBasic認証を実装：
- 環境変数から認証情報取得（`BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`）
- 全ルートに適用（`matcher: '/:path*'`）
- SEOブロック用noindexヘッダー含む

---

## 🔐 環境変数

`.env.local`に必要：
```bash
NEXT_PUBLIC_BASE_URL=        # サイトURL
BASIC_AUTH_USER=             # Basic認証ユーザー名
BASIC_AUTH_PASSWORD=         # Basic認証パスワード
EMAILJS_SERVICE_ID=          # EmailJSサービスID
EMAILJS_TEMPLATE_ID=         # EmailJSテンプレートID
EMAILJS_PUBLIC_KEY=          # EmailJS公開鍵
```

---

## 📊 データ型定義（主要なもの）

```typescript
// 日足データ
type DailyData = {
  date: string;      // "2025-01-27"
  open: number;      // 始値
  close: number;     // 終値
  high: number;      // 高値
  low: number;       // 安値
  volume: number;    // 出来高
};

// 保存用の株価データ
type StoredStock = {
  code: string;
  name: string;
  closePrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClosePrice: number;
  lastUpdated: string;
};

// localStorage保存データ構造
type StoredStockData = {
  stocks: StoredStock[];
  dailyDataMap: Record<string, DailyData[]>;  // 銘柄コード → DailyData配列
  lastUpdate: string;
  version: string;
  totalStocks: number;
  isCompressed?: boolean;
  nullDataWarning?: {
    hasNullData: boolean;
    totalStocksWithNullData: number;
    totalNullDays: number;
    lastOccurrence: string;
    summary: string;
  };
};
```

---

## 💾 localStorageキー

| キー名 | 用途 | バージョン |
|--------|------|-----------|
| `jpx400_stock_data_v1` | 株価データ（圧縮対応） | 1.2.0 |
| `jpx400_favorites_v1` | 観察銘柄コード | 1.0.0 |
| `jpx400_holdings_v1` | 保有銘柄コード | 1.0.0 |
| `jpx400_considering_v1` | 検討銘柄コード | 1.0.0 |
| `jpx400_stock_memos_v1` | 銘柄メモ | - |

---

## ⚠️ 技術的制約・注意事項

### 技術的制約
- **localStorage容量**: 約5MBの制限あり。4.7MB超で圧縮が有効化される
- **Yahoo Finance API**: 特定日付でnullデータを返す場合あり（警告で対処）
- **テクニカル指標**: パフォーマンスのためクライアント側で計算

### 重要な注意事項
- **Yahoo Finance APIは非公式API**であり、サポートが終了している
- 予告なくサービス停止や不正確なデータ配信の可能性あり
- **投資は自己責任**で行うこと

---

## 📐 データベーススキーマ（将来計画）

`/db/schema.sql`にPostgreSQLスキーマが存在するが、**現在は未使用**。アプリは完全にクライアント側でlocalStorageを使用。

将来のAWS移行を計画中：
- AWS RDS (PostgreSQL)
- AWS Lambda + EventBridge（毎日16時JST自動取得）
- JWT認証

---

## 📝 コーディング規約

### ファイル形式
- **Reactコンポーネント（JSXを含む）**: `.tsx` 拡張子を使用
- **カスタムHooks、型定義、APIルート、middleware**: `.ts` 拡張子を使用
- React コンポーネントは関数コンポーネントで記述

### 命名規則
| 種類 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `StockCard.tsx` |
| カスタムフック | camelCase + `use` | `useStockDataStorage.ts` |
| 型定義 | PascalCase | `StoredStock`, `DailyData` |
| 定数 | UPPER_SNAKE_CASE | `STORAGE_KEYS`, `CHART_PERIODS` |

### ファイルヘッダー
各ファイルの先頭に以下のコメントを記載：
```typescript
// ========================================
// src/[パス]/[ファイル名]
// [ファイルの役割の説明]
// ========================================
```

### 型定義
- 型は `type` を使用（`interface` より `type` 優先）
- 共通の型は `src/types/stockData.ts` に集約
- コンポーネント固有の型はそのファイル内で定義

### コメント
- 日本語でコメントを記述
- 主要なセクションには `// セクション名 Start` `// セクション名 End` を使用

---

## ❓ 困った時は

1. **ファイル内容が不明** → ユーザーにファイルの提供を依頼
2. **要件が不明確** → 作業前に要件を確認
3. **既存機能への影響が心配** → 変更箇所を最小限に留め、差分を確認

**推測でコードを生成するのは禁止。分からないことは「分からない」と伝える。**

---

*このファイルはプロジェクトルートに配置してください。*

*最終更新: 2025年12月10日*
