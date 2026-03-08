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

### 4. その他
- npm run devなどのコマンドで行うサーバー立ち上げは自動で行わないでください。ユーザーが別ターミナルで手動で行います。サーバー立ち上げを自動でキミにおこなってもらうと「サーバーを停止して/開始して」などの指示を伝える必要があり、会話の手間が増えるため好ましくありません。

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
- **特徴**: 会員登録制・完全無料
- **デプロイ**: Vercel（GitHubと連携、mainブランチへのpushで自動デプロイ）

### 主な機能
- テクニカル指標による株価スクリーニング（移動平均線、RSI、MACD）
- ターンバックパターン検出（ローソク足が移動平均線を突き抜ける）
- クロスVパターン検出（短期移動平均線が中長期移動平均線の下にある）
- 銘柄ステータス管理：観察銘柄・検討銘柄・保有銘柄（Neon DB保存、排他制御）
- 銘柄ごとのメモ機能（500文字まで、Neon DB保存）
- 検索機能（銘柄コード・銘柄名）- 全ページで利用可能
- ページネーション（32件/ページ、キーボード操作対応）
- JWT認証（ユーザー登録・ログイン・ログアウト）
- 管理者用手動株価更新（Lambda非同期呼び出し）

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| 言語 | TypeScript |
| UI | React 19, Tailwind CSS |
| チャート | ECharts, echarts-for-react |
| アイコン | Lucide React |
| CSV解析 | PapaParse |
| データベース | Neon (サーバーレスPostgreSQL) |
| DB接続 | @neondatabase/serverless |
| 認証 | jose (JWT) + bcryptjs (パスワードハッシュ) |
| バッチ処理 | AWS Lambda + EventBridge |
| Lambda呼び出し | @aws-sdk/client-lambda |
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
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts      # ログインAPI（JWT発行）
│   │   │   │   ├── logout/route.ts     # ログアウトAPI（Cookie削除）
│   │   │   │   └── register/route.ts   # 新規登録API
│   │   │   ├── memos/[code]/route.ts   # メモCRUD API
│   │   │   ├── revalidate/route.ts     # キャッシュ破棄API（Lambda→Vercel）
│   │   │   ├── stock-status/route.ts   # 銘柄ステータス変更API（排他制御）
│   │   │   ├── stocks/
│   │   │   │   ├── route.ts            # 全銘柄データ一括取得API
│   │   │   │   ├── [code]/route.ts     # 個別銘柄データ取得API
│   │   │   │   └── refresh/route.ts    # 管理者用手動更新API（Lambda呼び出し）
│   │   │   └── user-data/route.ts      # ユーザーデータ一括取得API
│   │   │
│   │   ├── page.tsx         # トップページ（銘柄一覧）
│   │   ├── layout.tsx       # 全体レイアウト（Server Component、JWT検証→AuthProvider）
│   │   ├── globals.css      # グローバルCSS
│   │   ├── error.tsx        # エラーページ
│   │   ├── not-found.tsx    # 404ページ
│   │   │
│   │   ├── login/           # ログインページ
│   │   ├── register/        # ユーザー登録ページ
│   │   ├── stock/[code]/    # 個別銘柄ページ（全銘柄）
│   │   ├── favorites/       # 観察銘柄ページ
│   │   ├── holdings/        # 保有銘柄ページ
│   │   ├── considering/     # 検討銘柄ページ
│   │   ├── turn_back/       # ターンバック銘柄ページ
│   │   ├── cross_v/         # クロスV銘柄ページ
│   │   ├── setting/         # 設定ページ（管理者用手動更新ボタン含む）
│   │   ├── privacy/         # プライバシーポリシー
│   │   └── terms/           # 利用規約
│   │
│   ├── components/          # 共通コンポーネント
│   │   ├── Header.tsx       # ヘッダー（認証状態表示・ログアウト）
│   │   ├── AuthProvider.tsx # 認証コンテキスト（Server→Client間のユーザー情報受け渡し）
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
│   │   ├── useJPX400Stocks.ts      # JPX400銘柄リスト取得（CSV）
│   │   ├── useStockDataStorage.ts  # 株価データ取得（API）+ 銘柄ステータス管理（API）
│   │   ├── useStockMemo.ts         # 銘柄メモ管理（API + デバウンス）
│   │   ├── useStockScreening.ts    # スクリーニング条件判定
│   │   └── usePagination.ts        # ページネーション機能
│   │
│   ├── lib/                 # ユーティリティ
│   │   ├── auth.ts          # JWT認証ユーティリティ（sign/verify/cookie管理）
│   │   ├── db.ts            # Neon DB接続ユーティリティ
│   │   └── userDataCache.ts # ユーザーデータ共有キャッシュ（API重複防止）
│   │
│   ├── types/
│   │   └── stockData.ts     # 型定義（DailyData, StoredStock等）
│   │
│   └── proxy.ts             # JWT認証プロキシ（Next.js 16のmiddleware）
│
├── lambda/                  # AWS Lambda関数（株価自動更新バッチ）
│   ├── index.ts             # エントリーポイント（handler）
│   ├── fetchYahooFinance.ts # Yahoo Finance APIリクエスト + リトライ
│   ├── convertData.ts       # データ変換（DailyData/StoredStock）
│   ├── database.ts          # Neon DB接続 + UPSERT処理
│   ├── jpx400.csv           # 銘柄リスト（Lambda用同梱）
│   ├── package.json
│   └── tsconfig.json
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
- **データソース**: Yahoo Finance API（非公式）→ Lambda関数で毎日6時に自動取得
- **保存先**: Neon DB（`stock_data`テーブル、JSONB形式）
- **フロントへの配信**: `GET /api/stocks` で全銘柄データを一括取得（`revalidateTag`によるキャッシュ付き）
- **データ範囲**: 過去7ヶ月の日足データ（75日移動平均線の計算に必要）

### 2. チャート表示
- **ライブラリ**: ECharts (echarts-for-react)
- **表示内容**:
  - ローソク足（日足）
  - 移動平均線（5日・25日・75日）
  - RSI（9日）
  - MACD
  - 出来高

### 3. スクリーニング機能
| 条件名 | 判定ロジック |
|--------|-------------|
| ターンバック | 株価（高値・安値）が移動平均線（MA25またはMA75）を突き抜ける |
| クロスV | 5日線が25日線または75日線を下回る |

### 4. ユーザーデータ管理（Neon DB）
- **銘柄ステータス**: ロータリー式ボタンで3つのステータスを切り替え（排他制御：1銘柄につき1つのみ）
  - **観察銘柄**: 長期的に観察したい銘柄
  - **検討銘柄**: 短期的に購入を検討中の銘柄（「明日買おうかな」）
  - **保有銘柄**: 実際に保有している銘柄
- **メモ**: 銘柄ごとに500文字までのメモを保存（500msデバウンスでAPI保存）
- **楽観的更新**: ステータス変更・メモ保存はローカルstate即座更新→バックグラウンドでAPI呼び出し

### 5. 認証
- **方式**: JWT（jose）+ httpOnly Cookie（`mitsukabu_token`）
- **パスワード**: bcryptjs でハッシュ化
- **有効期限**: 30日
- **Server→Client受け渡し**: layout.tsx（Server Component）→ AuthProvider（React Context）→ useAuth()

---

## 🖥 コマンド

```bash
# 開発
npm run dev              # 開発サーバー起動（localhost:3000）

# デプロイ（git push後、CI/CDが自動ビルド＆デプロイ）
git status               # 変更されたファイルを確認
git add .                # 変更をステージング
git commit -m "update"   # コミット
git push origin main     # GitHubにプッシュ

# その他
npm run build            # 本番用ビルド
npm run lint             # ESLint実行

# Lambda関数（lambda/ディレクトリ内で実行）
npm run build            # esbuildでバンドル
npm run package          # zip生成（AWSにアップロード用）
```

---

## 🏗 アーキテクチャ

### 株価データフロー

```
【自動更新（毎日16時JST）】
EventBridge → Lambda → Yahoo Finance API → Neon DB → POST /api/revalidate → Vercel CDNキャッシュ破棄

【フロント表示】
ユーザー → proxy.ts（JWT検証）→ GET /api/stocks（キャッシュ or DB）→ チャート表示

【管理者手動更新】
設定ページ → POST /api/stocks/refresh → @aws-sdk/client-lambda（非同期呼び出し）→ Lambda実行
```

### ユーザーデータフロー

```
【初回読み込み】
useStockDataStorage / useStockMemo → fetchUserData()（共有キャッシュ）→ GET /api/user-data → 4テーブル並列クエリ

【ステータス変更】
StockStatusButton → setStockStatus() → ローカルstate即座更新 + PUT /api/stock-status（バックグラウンド）

【メモ保存】
StockCard → saveMemo() → ローカルstate即座更新 + 500msデバウンス → PUT /api/memos/[code]
```

### コアHooks

| Hook | ファイル | 役割 |
|------|----------|------|
| `useStockDataStorage` | `/src/hooks/useStockDataStorage.ts` | 株価データ取得（API）。観察・検討・保有銘柄の管理（API + 楽観的更新）。`getStockStatus`/`setStockStatus`で排他制御 |
| `useStockMemo` | `/src/hooks/useStockMemo.ts` | 銘柄ごとのメモ管理（API + 500msデバウンス + 楽観的更新） |
| `useJPX400Stocks` | `/src/hooks/useJPX400Stocks.ts` | CSVからJPX400銘柄リスト読み込み |
| `useStockScreening` | `/src/hooks/useStockScreening.ts` | テクニカル分析（ターンバック・クロスV判定） |
| `usePagination` | `/src/hooks/usePagination.ts` | ページネーション機能。ページ状態管理、キーボード操作、ページ番号生成 |

### 主要コンポーネント

| コンポーネント | ファイル | 役割 |
|---------------|----------|------|
| `Header` | `/src/components/Header.tsx` | ナビゲーション。認証状態表示、ログアウトボタン |
| `AuthProvider` | `/src/components/AuthProvider.tsx` | React Contextでユーザー情報をClient Componentに提供 |
| `StockList` | `/src/components/StockList.tsx` | メイン一覧画面。検索・ページネーション |
| `StockCard` | `/src/components/StockCard.tsx` | 個別銘柄カード。ミニチャート・メモ・ステータスボタン |
| `StockChart` | `/src/components/StockChart.tsx` | EChartsベースのローソク足チャート |
| `StockDetailPage` | `/src/components/StockDetailPage.tsx` | 銘柄詳細ページ。100日間のチャート表示 |
| `StockStatusButton` | `/src/components/StockStatusButton.tsx` | ロータリー式ステータスボタン（観察→検討→保有→なし） |

### APIルート

| メソッド | エンドポイント | 用途 | 認証 |
|---------|-------------|------|------|
| GET | `/api/stocks` | 全銘柄データ一括取得 | 不要 |
| GET | `/api/stocks/[code]` | 個別銘柄データ取得 | 不要 |
| POST | `/api/stocks/refresh` | 管理者用Lambda手動呼び出し | admin限定 |
| POST | `/api/revalidate` | キャッシュ破棄（Lambda→Vercel） | シークレットキー |
| POST | `/api/auth/register` | 新規登録 | 不要 |
| POST | `/api/auth/login` | ログイン（JWT発行） | 不要 |
| POST | `/api/auth/logout` | ログアウト（Cookie削除） | 不要 |
| GET | `/api/user-data` | ユーザーデータ一括取得 | 必要 |
| PUT | `/api/stock-status` | 銘柄ステータス変更（排他制御） | 必要 |
| PUT | `/api/memos/[code]` | メモ保存（UPSERT） | 必要 |
| DELETE | `/api/memos/[code]` | メモ削除 | 必要 |

### ルート構成

```
/                           # 銘柄一覧（トップページ）
/stock/[code]               # 個別銘柄詳細
/favorites                  # 観察銘柄一覧
/favorites/[code]           # 観察銘柄詳細
/holdings                   # 保有銘柄一覧
/holdings/[code]            # 保有銘柄詳細
/considering                # 検討銘柄一覧
/considering/[code]         # 検討銘柄詳細
/turn_back                  # ターンバックスクリーニング結果
/turn_back/[code]           # ターンバック銘柄詳細
/cross_v                    # クロスVスクリーニング結果
/cross_v/[code]             # クロスV銘柄詳細
/setting                    # 設定ページ
/login                      # ログインページ
/register                   # ユーザー登録ページ
/privacy                    # プライバシーポリシー
/terms                      # 利用規約
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

### 認証（`/src/proxy.ts`）

- JWT Cookie（`mitsukabu_token`）を検証
- 認証不要パス: `/login`, `/register`, `/api/auth/`, `/api/stocks`, `/api/revalidate`
- 無効なトークン → Cookie削除 → `/login`にリダイレクト

---

## 🔐 環境変数

`.env.local`に必要：
```bash
# サイトURL
NEXT_PUBLIC_BASE_URL=https://www.mitsukabu.com/

# Neon DB接続
DATABASE_URL=postgresql://...

# JWT認証用シークレット
AUTH_SECRET=（openssl rand -base64 32 で生成）

# キャッシュ破棄用シークレット（Lambda→Vercel間）
REVALIDATE_SECRET=（openssl rand -base64 32 で生成）

# AWS Lambda呼び出し（管理者手動更新用）
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-northeast-1
LAMBDA_FUNCTION_NAME=mitsukabu-stock-updater
```

---

## 📐 データベーススキーマ（Neon PostgreSQL）

| テーブル | 役割 | 親/子 |
|---------|------|-------|
| `users` | ユーザー情報（id, user_name, password_hash, role） | 親 |
| `stock_data` | 株価データ（stock_code, stock_name, daily_data JSONB） | 親 |
| `favorites` | 観察銘柄（user_id, stock_code） | 子 |
| `holdings` | 保有銘柄（user_id, stock_code） | 子 |
| `considering` | 検討銘柄（user_id, stock_code） | 子 |
| `memos` | 銘柄メモ（user_id, stock_code, memo） | 子 |

### 主要な型定義

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

// 銘柄サマリー
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

// 認証ユーザー
type AuthUser = {
  userId: number;
  userName: string;
  role: string;       // 'user' | 'admin'
};
```

---

## 📝 コーディング規約

### ファイル形式
- **Reactコンポーネント（JSXを含む）**: `.tsx` 拡張子を使用
- **カスタムHooks、型定義、APIルート、proxy**: `.ts` 拡張子を使用
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

## ⚠️ 技術的制約・注意事項

- **Yahoo Finance APIは非公式API**であり、サポートが終了している。予告なくサービス停止や不正確なデータ配信の可能性あり
- **テクニカル指標**: パフォーマンスのためクライアント側で計算
- **投資は自己責任**で行うこと

---

## ❓ 困った時は

1. **ファイル内容が不明** → ユーザーにファイルの提供を依頼
2. **要件が不明確** → 作業前に要件を確認
3. **既存機能への影響が心配** → 変更箇所を最小限に留め、差分を確認

**推測でコードを生成するのは禁止。分からないことは「分からない」と伝える。**

---

*このファイルはプロジェクトルートに配置してください。*

*最終更新: 2026年3月7日*
