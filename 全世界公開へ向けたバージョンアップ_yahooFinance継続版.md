# 全世界公開へ向けたバージョンアップ対応

> **作成日**: 2026年2月18日
> **最終更新**: 2026年3月7日
> **ステータス**: 課題①は設計完了・開発着手可能 / 課題②は認証ライブラリ未決定

---

## 目次

1. [最大の目的](#1-最大の目的)
2. [現状のアーキテクチャ](#2-現状のアーキテクチャ)
3. [実現させたいこと（2つの課題）](#3-実現させたいこと2つの課題)
4. [技術選定と決定事項一覧](#4-技術選定と決定事項一覧)
5. [新アーキテクチャ（移行後の全体像）](#5-新アーキテクチャ移行後の全体像)
6. [DBスキーマ（修正版）](#6-dbスキーマ修正版)
7. [API設計](#7-api設計)
8. [課題①の詳細設計：毎日16時自動更新](#8-課題の詳細設計毎日16時自動更新)
9. [課題②の詳細設計：会員登録機能](#9-課題の詳細設計会員登録機能)
10. [ファイル別の変更計画](#10-ファイル別の変更計画)
11. [開発手順（ステップバイステップ）](#11-開発手順ステップバイステップ)
12. [コスト見積もり](#12-コスト見積もり)
13. [更新履歴](#13-更新履歴)

---

## 1. 最大の目的

現状は開発者1人だけが使えるサービス（独自ドメインにBasic認証をかけた個人利用）だが、これを**全世界に公開して誰でも使えるようにしたい**。

### なぜ今全世界で公開できていないか

| 理由 | 詳細 |
|------|------|
| **株価更新が手動** | 現状はブラウザ上で「株価更新」ボタンをクリックして手動更新。全ユーザーが利用するサービスとしては自動更新が必要 |
| **ユーザー管理がない** | お気に入り・保有銘柄・メモ等がlocalStorageに保存されており、ブラウザ/端末に依存。会員登録機能がなくユーザーごとのデータ管理ができない |

---

## 2. 現状のアーキテクチャ

### 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| UI | React 19, Tailwind CSS |
| チャート | ECharts, echarts-for-react |
| データ圧縮 | pako |
| CSV解析 | PapaParse |
| HTTP | axios |
| メールバックアップ | EmailJS |
| デプロイ | Vercel |
| ドメイン | お名前.com (mitsukabu.com) |

### 現在のデータフロー

```
[ユーザー] → /setting で「株価更新」ボタンをクリック
    ↓
[フロントエンド] → 400銘柄をループで /api/stock/[code] に500ms間隔でリクエスト
    ↓
[Next.js APIルート] → Yahoo Finance API にプロキシリクエスト
  (src/app/api/stock/[code]/route.ts)
    ↓
[Yahoo Finance API] → レスポンス返却
  (https://query1.finance.yahoo.com/v8/finance/chart/{code}.T?interval=1d&range=7mo)
    ↓
[フロントエンド] → Yahoo固有のレスポンス形式を DailyData[] + StoredStock に変換
  (src/hooks/useYahooFinanceAPI.ts)
    ↓
[localStorage] → 全銘柄データを保存（4.7MB超で自動pako圧縮）
  (src/hooks/useStockDataStorage.ts)
    ↓
[各ページ] → localStorage から読み出してチャート表示
```

### localStorageのデータ構造（現在）

| キー名 | 用途 | データの性質 |
|--------|------|------------|
| `jpx400_stock_data_v1` | 株価データ本体 | **全ユーザー共通**（共有データ） |
| `jpx400_favorites_v1` | 観察銘柄 | **ユーザー固有** |
| `jpx400_holdings_v1` | 保有銘柄 | **ユーザー固有** |
| `jpx400_considering_v1` | 検討銘柄 | **ユーザー固有** |
| `jpx400_stock_memos_v1` | メモ | **ユーザー固有** |

---

## 3. 実現させたいこと（2つの課題）

| # | 課題 | 概要 |
|---|------|------|
| ① | 毎日16時自動更新 | 手動ボタン更新をやめ、サーバーサイドのバッチ処理で毎日16時に自動取得する |
| ② | 会員登録機能 | localStorageベースからDB + ユーザーアカウントベースのデータ管理に移行する |

### 2つの課題の依存関係と進行順序

```
課題① 毎日16時自動更新（バッチ処理 + DB導入）
  │
  │  DBが入らないとユーザーデータのDB移行ができない
  ↓
課題② 会員登録機能
```

**① → ② の順番で進める。** ①でDBを導入する時点で「株価データ」をDBに入れるので、そのタイミングで全テーブルを作成しておけば②がスムーズになる。

---

## 4. 技術選定と決定事項一覧

### 技術選定

| # | 項目 | 決定 | 選定理由 |
|---|------|------|---------|
| 1 | バッチ処理基盤 | **AWS Lambda + EventBridge** | Lambdaの15分上限に対して処理は最大5〜6分で余裕あり。EventBridgeで毎日16時JSTにトリガー可能。Vercel Cron Jobsは無料プラン10秒制限で不適。 |
| 2 | データベース | **Neon（サーバーレスPostgreSQL）** | 無料枠で十分（512MBストレージ、190時間コンピュート）。Vercel公式統合ありで接続設定が簡単。AWS RDSは月$15〜20+接続プーリング問題あり、個人プロジェクトにはコスト過大。 |
| 3 | 認証ライブラリ | **未決定（課題②着手前に決定）** | 当初Auth.js v5を予定していたが、Next.js 16とのpeer dependency不一致（[GitHub Issue #13302](https://github.com/nextauthjs/next-auth/issues/13302)）およびmiddleware→proxyリネーム問題が判明。選択肢: (A) Auth.js v5 + `--legacy-peer-deps`, (B) Better Auth, (C) 自前実装（jose + bcrypt）。要件がシンプル（ユーザー名+パスワードのみ）のため自前実装が有力候補。 |
| 4 | パスワードハッシュ | **bcrypt** | 認証ライブラリに関わらず使用。パスワードハッシュ化の標準ライブラリ。 |
| 5 | セッション管理 | **JWT** | DBセッションよりシンプル。Neonのサーバーレス特性とも相性が良い。 |
| 6 | DB接続 | **@neondatabase/serverless** | NeonのHTTP接続対応ドライバー。LambdaからもVercelからも接続プーリング問題なし。 |

### 設計上の決定事項

| # | 項目 | 決定 | 理由 |
|---|------|------|------|
| 7 | フロントの株価データ取得方式 | **方式A：初回に全件一括取得** | スクリーニング（並べ替え・フィルタ）は全銘柄データが必要。ページ移動のたびに通信待ちが入るとテンポが悪い。初回読み込みは2〜4秒で許容範囲。 |
| 8 | バッチ処理のロジック | **既存`useYahooFinanceAPI.ts`のコアロジックを参考にして再構成** | filterNullData、convertYahooToDailyData、convertYahooToStockなどのテスト済みロジックを活用し、ReactのHook構造だけLambda用に書き換える。 |
| 9 | 管理者用手動更新ボタン | **残す（`users.role = 'admin'`で判定）。`POST /api/stocks/refresh`からAWS SDK v3でLambda非同期呼び出し** | 既存schema.sqlの`role`カラムをそのまま活用。`@aws-sdk/client-lambda`の`InvokeCommand`で`InvocationType: 'Event'`（非同期）呼び出し。Vercelタイムアウト（10秒）を回避しつつLambdaのロジックを再利用。即座に「更新を開始しました」をレスポンス返却し、Lambda完了は待たない。 |
| 10 | DBの外部キー | **`user_name`ベース → `user_id`（数値）ベースに修正** | ユーザー名変更時の連鎖更新問題を回避。数値の方がJOINが高速。DB設計のセオリー。現時点ではDBにデータがないため変更コストゼロ。 |
| 11 | `considering`テーブル | **`favorites`/`holdings`と同じ構造で新規作成** | — |
| 12 | 排他制御（銘柄ステータス） | **サーバー側でトランザクション処理** | フロントからDELETE→POSTの連続呼び出しだと、途中でネットワークエラーが起きた場合に中途半端な状態になるリスクがある。 |
| 13 | `useEmailBackup.ts` | **廃止** | DBにデータが保存されるためバックアップ不要。全世界公開時にGitHubからも秘匿情報（EmailJS設定）を削除する。 |
| 14 | 移行戦略 | **一気に切り替え** | 現在は開発者1人しか使っておらず、既存localStorage上のデータも消えて問題ない。 |
| 15 | pako圧縮ロジック | **廃止** | localStorage容量制限対策だったため、DB移行後は不要。 |
| 16 | `GET /api/stocks`のキャッシュ戦略 | **イベント駆動方式（`revalidateTag`）** | 株価データは1日1回しか変わらないため、Lambda DB更新成功後に`POST /api/revalidate`でキャッシュを明示的に破棄する。TTL方式（定期的にキャッシュ破棄）ではなく、データ変更をトリガーにする。これにより、DBクエリは1日1回のみで済み、Neonのコンピュート時間を最小化できる。 |
| 17 | Lambda実行失敗時の通知 | **サイト上の最終更新日で確認する運用** | 管理者がサイトの最終更新日を目視確認し、更新されていない場合は手動更新ボタン（`POST /api/stocks/refresh`）で対処する。CloudWatch Alarm等の自動通知は導入しない。 |

---

## 5. 新アーキテクチャ（移行後の全体像）

### 新しいデータフロー

```
【株価データの自動更新】
[EventBridge] → 毎日16時(JST)にトリガー
    ↓
[AWS Lambda] → Yahoo Finance API に400銘柄分リクエスト（500ms間隔）
    ↓
[Yahoo Finance API] → レスポンス返却
    ↓
[Lambda] → nullフィルタリング + DailyData/StoredStock変換 → メモリ上に蓄積
    ↓
[Lambda] → 全銘柄取得完了後、トランザクションで一括UPSERT
    ↓
[Neon PostgreSQL] → stock_data テーブルが一斉に最新データに切り替わる
    ↓
[Lambda] → POST /api/revalidate でVercelのキャッシュを破棄（イベント駆動）
    ↓
[Vercel CDN] → 次のユーザーアクセス時にDBから最新データを取得してキャッシュ再作成


【ユーザーの通常利用】
[ユーザー] → mitsukabu.com にアクセス
    ↓
[Vercel (Next.js)] → JWT認証チェック（認証ライブラリは課題②で決定）
    ↓
[Vercel CDN] → キャッシュあり → そのまま返す（DBに行かない）
               キャッシュなし → GET /api/stocks でNeon DBから全銘柄データ取得 → キャッシュ保存
    ↓
[フロントエンド] → メモリ上にデータ保持 → チャート表示・スクリーニング
    ↓
[ユーザー操作] → お気に入り追加/メモ保存 etc.
    ↓
[Next.js APIルート] → POST /api/favorites etc. → Neon DBに保存


【管理者の手動更新（緊急時用）】
[管理者] → /setting ページで「株価更新」ボタンをクリック
    ↓
[Next.js APIルート] → POST /api/stocks/refresh
    ↓
[Vercel] → AWS SDK v3（@aws-sdk/client-lambda）で Lambda関数を非同期呼び出し（InvocationType: 'Event'）
    ↓
[APIルート] → 即座に「更新を開始しました」をレスポンス返却（Lambda完了は待たない）
    ↓
[Lambda] → バックグラウンドで400銘柄取得 → Neon DBに一括UPSERT
```

### 新しい技術スタック

| カテゴリ | 技術 | 変更 |
|---------|------|------|
| フレームワーク | Next.js 16 (App Router) | 変更なし |
| 言語 | TypeScript | 変更なし |
| UI | React 19, Tailwind CSS | 変更なし |
| チャート | ECharts, echarts-for-react | 変更なし |
| CSV解析 | PapaParse | 変更なし |
| データベース | **Neon (PostgreSQL)** | 🆕 新規追加 |
| DB接続 | **@neondatabase/serverless** | 🆕 新規追加 |
| 認証 | **未決定（課題②着手前に決定）** | 🆕 新規追加 |
| パスワード | **bcrypt** | 🆕 新規追加 |
| バッチ処理 | **AWS Lambda + EventBridge** | 🆕 新規追加 |
| Lambda呼び出し（管理者用） | **@aws-sdk/client-lambda** | 🆕 新規追加 |
| デプロイ | Vercel | 変更なし |
| ドメイン | お名前.com (mitsukabu.com) | 変更なし |
| ~~データ圧縮~~ | ~~pako~~ | 🗑️ 廃止 |
| ~~HTTP~~ | ~~axios~~ | 🗑️ 廃止（fetch APIに統一） |
| ~~メールバックアップ~~ | ~~EmailJS~~ | 🗑️ 廃止 |

---

## 6. DBスキーマ（修正版）

旧`db/schema.sql`からの修正点：
- 全子テーブルの外部キーを`user_name` → `user_id`に変更
- `considering`テーブルを新規追加
- 認証ライブラリは未決定。Auth.js採用の場合は関連テーブルが自動生成される。自前実装の場合は追加テーブル不要

```sql
/* ===========================================
 * データベース名: mitsukabu_db (Neon上に作成)
 * 更新日: 2026/02/18
 * =========================================== */


/* ===========================================
 * テーブル: users
 * 役割: ユーザーの情報を管理するテーブル
 * 属性: 親テーブル
 * ========================================== */
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 注: 認証ライブラリは未決定（課題②着手前に決定）。
-- Auth.jsを採用する場合、Auth.jsが使用するテーブル（accounts, sessions等）は自動生成される。
-- 自前実装（jose + bcrypt）の場合、追加テーブルは不要。
-- いずれの場合もusersテーブルは自前管理。


/* ===========================================
 * テーブル: stock_data
 * 役割: 株価データを管理するテーブル（全ユーザー共通）
 * 属性: 親テーブル
 * ========================================== */
CREATE TABLE stock_data (
  id SERIAL PRIMARY KEY,
  stock_code VARCHAR(10) UNIQUE NOT NULL,
  stock_name VARCHAR(255) NOT NULL,
  daily_data JSONB NOT NULL,
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* ===========================================
 * テーブル: favorites
 * 役割: 観察銘柄を管理するテーブル
 * 属性: 子テーブル（users, stock_dataの子）
 * ========================================== */
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  stock_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stock_code) REFERENCES stock_data(stock_code) ON DELETE CASCADE,
  UNIQUE(user_id, stock_code)
);


/* ===========================================
 * テーブル: holdings
 * 役割: 保有銘柄を管理するテーブル
 * 属性: 子テーブル（users, stock_dataの子）
 * ========================================== */
CREATE TABLE holdings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  stock_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stock_code) REFERENCES stock_data(stock_code) ON DELETE CASCADE,
  UNIQUE(user_id, stock_code)
);


/* ===========================================
 * テーブル: considering
 * 役割: 検討銘柄を管理するテーブル
 * 属性: 子テーブル（users, stock_dataの子）
 * ========================================== */
CREATE TABLE considering (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  stock_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stock_code) REFERENCES stock_data(stock_code) ON DELETE CASCADE,
  UNIQUE(user_id, stock_code)
);


/* ===========================================
 * テーブル: memos
 * 役割: 売買メモを管理するテーブル
 * 属性: 子テーブル（users, stock_dataの子）
 * ========================================== */
CREATE TABLE memos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  stock_code VARCHAR(10) NOT NULL,
  memo TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stock_code) REFERENCES stock_data(stock_code) ON DELETE CASCADE,
  UNIQUE(user_id, stock_code)
);
```

---

## 7. API設計

### 株価データ系

| メソッド | エンドポイント | 用途 | 認証 |
|---------|-------------|------|------|
| GET | `/api/stocks` | 全銘柄の株価データ一括取得。`revalidateTag`によるキャッシュ付き（イベント駆動で破棄） | 不要（公開データ） |
| GET | `/api/stocks/[code]` | 個別銘柄の株価データ取得 | 不要（公開データ） |
| POST | `/api/stocks/refresh` | 管理者用：AWS SDK v3でLambda関数を非同期呼び出し（`InvocationType: 'Event'`）。即座にレスポンス返却 | 必要（admin限定） |
| POST | `/api/revalidate` | キャッシュ破棄。Lambda DB更新成功後に呼ばれる。`REVALIDATE_SECRET`で認証 | シークレットキー認証 |

#### `GET /api/stocks` レスポンス

フロントエンドの初回読み込みで使用。現在のlocalStorageの`StoredStockData`と同等の構造を返す。

```json
{
  "stocks": [
    {
      "code": "7203",
      "name": "トヨタ自動車",
      "closePrice": 2500,
      "openPrice": 2480,
      "highPrice": 2520,
      "lowPrice": 2470,
      "previousClosePrice": 2490,
      "lastUpdated": "2026-02-18"
    }
  ],
  "dailyDataMap": {
    "7203": [
      {
        "date": "2025-09-18",
        "open": 2300,
        "close": 2320,
        "high": 2340,
        "low": 2290,
        "volume": 5000000
      }
    ]
  },
  "lastUpdate": "2026-02-18T08:00:00.000Z",
  "totalStocks": 396
}
```

※DBには7ヶ月分のデータを保存し、APIレスポンスでも7ヶ月分を返す。チャート画面の表示期間は一覧画面で約2ヶ月、個別画面で約5ヶ月だが、75日移動平均線の計算に7ヶ月分のデータが必要なため（表示期間 + 75営業日分の計算用データ）。

### 認証系

| メソッド | エンドポイント | 用途 | 備考 |
|---------|-------------|------|------|
| POST | `/api/auth/register` | 新規ユーザー登録 | 自前実装。bcryptでパスワードハッシュ化してusersテーブルにINSERT |
| POST | `/api/auth/login` | ログイン（JWT発行） | 認証ライブラリにより構成が変わる（課題②で決定）。Auth.jsの場合は`/api/auth/[...nextauth]`に変更 |

#### `POST /api/auth/register` リクエスト/レスポンス

```json
// リクエスト
{ "userName": "tatsuki", "password": "mypassword123" }

// レスポンス（成功）
{ "success": true, "message": "登録完了" }

// レスポンス（失敗：ユーザー名重複）
{ "success": false, "error": "このユーザー名は既に使用されています" }
```

### ユーザー固有データ系

全て**認証必須**（JWTトークンが必要）。user_idはJWTから取得するため、リクエストに含める必要はない。

| メソッド | エンドポイント | 用途 | リクエスト | レスポンス |
|---------|-------------|------|----------|----------|
| GET | `/api/favorites` | 観察銘柄一覧取得 | — | `{ favorites: string[] }` |
| POST | `/api/favorites` | 観察銘柄追加 | `{ stockCode: "7203" }` | `{ success: true }` |
| DELETE | `/api/favorites` | 観察銘柄削除 | `{ stockCode: "7203" }` | `{ success: true }` |
| GET | `/api/holdings` | 保有銘柄一覧取得 | — | `{ holdings: string[] }` |
| POST | `/api/holdings` | 保有銘柄追加 | `{ stockCode: "7203" }` | `{ success: true }` |
| DELETE | `/api/holdings` | 保有銘柄削除 | `{ stockCode: "7203" }` | `{ success: true }` |
| GET | `/api/considering` | 検討銘柄一覧取得 | — | `{ considering: string[] }` |
| POST | `/api/considering` | 検討銘柄追加 | `{ stockCode: "7203" }` | `{ success: true }` |
| DELETE | `/api/considering` | 検討銘柄削除 | `{ stockCode: "7203" }` | `{ success: true }` |
| GET | `/api/memos` | 全メモ取得 | — | `{ memos: { [stockCode]: string } }` |
| GET | `/api/memos/[code]` | 個別メモ取得 | — | `{ memo: string }` |
| PUT | `/api/memos/[code]` | メモ保存（新規/更新） | `{ memo: "買い時かも" }` | `{ success: true }` |
| DELETE | `/api/memos/[code]` | メモ削除 | — | `{ success: true }` |

### 銘柄ステータス統合API（排他制御付き）

| メソッド | エンドポイント | 用途 | 認証 |
|---------|-------------|------|------|
| PUT | `/api/stock-status` | 銘柄ステータスの一括変更 | 必要 |

1つの銘柄は「観察（watching）」「検討（considering）」「保有（holding）」のいずれか1つにしか属せない。この排他制御をDBトランザクションで保証する。

```json
// リクエスト
{ "stockCode": "7203", "status": "watching" }
// statusの値: "watching" | "considering" | "holding" | "none"

// サーバー側の処理:
// BEGIN TRANSACTION
//   DELETE FROM favorites WHERE user_id = ? AND stock_code = ?
//   DELETE FROM holdings WHERE user_id = ? AND stock_code = ?
//   DELETE FROM considering WHERE user_id = ? AND stock_code = ?
//   INSERT INTO favorites (user_id, stock_code) VALUES (?, ?)  -- statusに応じたテーブル
// COMMIT
```

---

## 8. 課題①の詳細設計：毎日16時自動更新

### 概要

現在はフロントエンド（ブラウザ）で行っている「Yahoo Finance APIへの400銘柄リクエスト → データ変換 → 保存」を、AWS Lambda上のバッチ処理に移行する。

### Lambda関数の処理フロー

```
1. EventBridgeから起動（毎日16:00 JST = 07:00 UTC）
2. jpx400.csvから銘柄リストを取得（Lambda zipに同梱。`fs.readFileSync('./jpx400.csv', 'utf-8')`で読み込み）
3. 400銘柄をループで処理（500ms間隔、リトライ最大3回）
    a. Yahoo Finance API にリクエスト
    b. レスポンスをバリデーション
    c. nullデータをフィルタリング（filterNullDataロジック流用）
    d. DailyData[] と StoredStock に変換（convertYahooToDailyData/convertYahooToStockロジック流用）
    e. 変換結果をメモリ上の配列に蓄積（この時点ではDBに書き込まない）
4. 全銘柄の取得完了後、トランザクションで一括UPSERT
    - BEGIN TRANSACTION
    - 全銘柄分のUPSERTを実行
    - COMMIT
5. 処理結果のログ出力（成功数、失敗数、nullデータ件数）
6. POST /api/revalidate を呼んでVercelのキャッシュを破棄（イベント駆動）
   - DB更新が成功した場合のみ実行
   - REVALIDATE_SECRETで認証
   - これにより次のユーザーアクセス時にDBから最新データが取得される
```

#### なぜ「1銘柄ずつDB保存」ではなく「全銘柄取得後に一括保存」なのか

データの整合性を保証するため。1銘柄ずつDB保存する方式だと、Lambda実行中（約3分間）にユーザーがページを開いた場合に「更新済みの銘柄と未更新の銘柄が混在する」事態が発生する。これはフロントエンドに表示している「最終更新日」の信頼性を損なう。全銘柄取得完了後にトランザクションで一括COMMITすることで、DBの状態が「全て旧データ」→「全て新データ」に一瞬で切り替わり、混在状態が発生しない。

途中でLambdaがエラーで停止した場合は、DBは一切更新されない（旧データのまま）。これは意図した動作であり、中途半端にDBが更新されるよりも安全。

### 既存コードからの流用対象

`src/hooks/useYahooFinanceAPI.ts`から以下のピュアロジックを抜き出してLambda用に再構成する：

| 関数名 | 役割 | 流用方法 |
|--------|------|---------|
| `filterNullData()` | nullデータの検出とフィルタリング | ほぼそのまま流用可能 |
| `convertYahooToDailyData()` | Yahoo APIレスポンス → DailyData[]変換 | ほぼそのまま流用可能 |
| `convertYahooToStock()` | Yahoo APIレスポンス → StoredStock変換 | ほぼそのまま流用可能 |
| `fetchSingleStockWithRetry()` | リトライ付き取得 | Hook依存部分（useState）を除去して流用 |

ReactのuseState/useEffectは除去し、プレーンなTypeScript関数として書き直す。

### Lambda関数の構成

```
lambda/
├── index.ts                 # エントリーポイント（handler関数）
├── fetchYahooFinance.ts     # Yahoo Finance APIリクエスト + リトライ
├── convertData.ts           # データ変換（filterNullData, convertYahoo*）
├── database.ts              # Neon DB接続 + UPSERT処理
├── jpx400.csv               # 銘柄リスト（同梱）
├── package.json
└── tsconfig.json
```

### ビルド・デプロイ方法

**esbuildでバンドル → zip → AWSコンソールから手動アップロード**

Lambda関数が1つだけの個人プロジェクトのため、SAMやServerless Frameworkは使用せず、シンプルな手動デプロイを採用。

`lambda/package.json`のスクリプト:

```json
{
  "scripts": {
    "build": "esbuild index.ts --bundle --platform=node --target=node20 --outfile=dist/index.js",
    "package": "npm run build && cp jpx400.csv dist/ && cd dist && zip -r function.zip index.js jpx400.csv",
    "deploy": "echo 'dist/function.zip を AWSコンソール → Lambda → コードソースからアップロード'"
  }
}
```

デプロイ手順:

1. `cd lambda && npm run package` でzipファイルを生成
2. AWSコンソール → Lambda → `mitsukabu-stock-updater` → 「コードソース」→ 「.zipファイルをアップロード」
3. `dist/function.zip` をアップロード

※将来的にデプロイ自動化が必要になった場合はGitHub ActionsやAWS SAMに移行可能。

### EventBridge設定

- ルール名: `mitsukabu-daily-stock-update`
- スケジュール式: `cron(0 7 ? * MON-FRI *)` ※UTC 07:00 = JST 16:00、平日のみ
- ターゲット: Lambda関数 `mitsukabu-stock-updater`

### DB保存時のUPSERTクエリ（一括トランザクション）

全銘柄の取得が完了した後、1つのトランザクション内で全銘柄分のUPSERTを実行する。

```sql
BEGIN;

-- 396銘柄分を1件ずつUPSERT（ループで実行）
INSERT INTO stock_data (stock_code, stock_name, daily_data, last_update)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
ON CONFLICT (stock_code)
DO UPDATE SET
  stock_name = EXCLUDED.stock_name,
  daily_data = EXCLUDED.daily_data,
  last_update = CURRENT_TIMESTAMP;

-- ... (全銘柄分繰り返す)

COMMIT;
```

`daily_data`カラムにはDailyData[]をJSONBとして保存する。トランザクション内で実行するため、COMMIT前にエラーが発生した場合は全て自動でROLLBACKされ、DBは更新前の状態に戻る。

---

## 9. 課題②の詳細設計：会員登録機能

> ⚠️ **注意**: 認証ライブラリは未決定（課題②着手前に決定）。以下の設計はAuth.js v5ベースで記載しているが、自前実装（jose + bcrypt）に変更する可能性がある。方針決定後にこのセクション全体を更新すること。
>
> **Next.js 16の変更点**: `middleware.ts`は`proxy.ts`にリネームされた。以下の設計で「middleware.ts」と記載している箇所は「proxy.ts」に読み替えること。

### 認証フロー

```
【新規登録】
ユーザー → /register ページでユーザー名+パスワード入力
    ↓
POST /api/auth/register → bcryptでハッシュ化 → usersテーブルにINSERT
    ↓
登録成功 → ログインページにリダイレクト

【ログイン】
ユーザー → /login ページでユーザー名+パスワード入力
    ↓
Auth.js Credentials Provider → usersテーブルからuser_name検索 → bcrypt.compare
    ↓
認証成功 → JWTトークン発行 → Cookieに保存 → トップページにリダイレクト

【ログアウト】
ユーザー → ヘッダーの「ログアウト」ボタンクリック
    ↓
Auth.js signOut() → Cookieからトークン削除 → ログインページにリダイレクト

【認証チェック（全ページ）】
middleware.ts → Auth.jsのgetToken()でJWT検証
    ↓
有効 → ページ表示
無効 → /login にリダイレクト
```

### Auth.js設定ファイルの構成

```
src/
├── auth.ts              # Auth.js設定（providers, callbacks, pages）
├── middleware.ts         # JWT検証（Basic認証から置き換え）
└── app/
    ├── api/
    │   └── auth/
    │       ├── register/
    │       │   └── route.ts    # 新規登録API
    │       └── [...nextauth]/
    │           └── route.ts    # Auth.jsハンドラー
    ├── login/
    │   └── page.tsx            # ログインページ
    └── register/
        └── page.tsx            # 新規登録ページ
```

### JWTに含めるユーザー情報

Auth.jsのcallbacksで以下の情報をJWTに含める：

```typescript
// auth.ts の callbacks設定
callbacks: {
  jwt({ token, user }) {
    if (user) {
      token.id = user.id;        // user_id（DB操作に使用）
      token.role = user.role;     // "admin" or "user"
      token.userName = user.userName;
    }
    return token;
  },
  session({ session, token }) {
    session.user.id = token.id;
    session.user.role = token.role;
    session.user.userName = token.userName;
    return session;
  }
}
```

---

## 10. ファイル別の変更計画

### 新規作成するファイル

| ファイル | 用途 |
|---------|------|
| `src/auth.ts` | 認証設定ファイル（認証ライブラリにより内容が変わる。課題②着手前に決定） |
| `src/lib/db.ts` | Neon DB接続ユーティリティ |
| `src/app/api/auth/register/route.ts` | 新規登録API |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.jsハンドラー（自前実装の場合は`/api/auth/login/route.ts`に変更） |
| `src/app/api/stocks/route.ts` | 全銘柄データ一括取得API |
| `src/app/api/stocks/[code]/route.ts` | 個別銘柄データ取得API（既存のYahooプロキシを置き換え） |
| `src/app/api/stocks/refresh/route.ts` | 管理者用手動更新API（AWS SDK v3でLambda非同期呼び出し） |
| `src/app/api/revalidate/route.ts` | キャッシュ破棄API（Lambda DB更新成功後に呼ばれる。`revalidateTag('stocks')`を実行） |
| `src/app/api/favorites/route.ts` | 観察銘柄CRUD API |
| `src/app/api/holdings/route.ts` | 保有銘柄CRUD API |
| `src/app/api/considering/route.ts` | 検討銘柄CRUD API |
| `src/app/api/memos/route.ts` | メモ一括取得API |
| `src/app/api/memos/[code]/route.ts` | 個別メモCRUD API |
| `src/app/api/stock-status/route.ts` | 銘柄ステータス排他制御API |
| `src/app/login/page.tsx` | ログインページ |
| `src/app/register/page.tsx` | 新規登録ページ |
| `lambda/` ディレクトリ一式 | Lambda関数（バッチ処理） |

### 大幅改修するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/hooks/useStockDataStorage.ts` | localStorage読み書き → API経由でDB読み書きに全面改修。pako圧縮/解凍ロジック削除。お気に入り・保有・検討のCRUDをAPI呼び出しに変更。 |
| `src/hooks/useStockMemo.ts` | localStorage読み書き → API経由でDB読み書きに全面改修。 |
| `src/middleware.ts` → `src/proxy.ts` | Basic認証 → JWT検証に完全置き換え。Next.js 16では`middleware.ts`が`proxy.ts`にリネーム。認証ライブラリは課題②で決定。 |
| `src/app/setting/page.tsx` | 株価更新ボタンを管理者限定に変更。`useYahooFinanceAPI`の呼び出しを削除。進捗表示UIの管理者用調整。 |
| `src/components/Header.tsx` | ログイン状態の表示、ユーザー名表示、ログアウトボタンの追加。 |
| `db/schema.sql` | 外部キーの`user_name` → `user_id`修正、`considering`テーブル追加。 |

### 削除するファイル

| ファイル | 理由 |
|---------|------|
| `src/hooks/useYahooFinanceAPI.ts` | バッチ処理（Lambda）に移行するため、フロント側からは廃止 |
| `src/hooks/useEmailBackup.ts` | DB移行によりバックアップ不要。秘匿情報（EmailJS設定）も除去 |
| `src/app/api/stock/[code]/route.ts` | Yahoo APIプロキシの役割が不要に。`/api/stocks/[code]`に置き換え |

### 変更なし（影響を受けない）ファイル

| ファイル | 理由 |
|---------|------|
| `src/components/StockChart.tsx` | `DailyData[]`を受け取るだけ。データ取得元がlocalStorage→APIに変わっても影響なし |
| `src/components/StockCard.tsx` | 同上 |
| `src/components/StockDetailPage.tsx` | 同上 |
| `src/components/StockList.tsx` | 同上 |
| `src/hooks/useStockScreening.ts` | スクリーニングロジックはAPI非依存 |
| `src/hooks/useJPX400Stocks.ts` | CSVからの銘柄リスト読み込みは変更なし |
| `src/types/stockData.ts` | `DailyData`/`StoredStock`型は汎用的に設計されておりそのまま使える |

### 不要になるパッケージ（削除）

| パッケージ | 理由 |
|-----------|------|
| `pako` / `@types/pako` | localStorage圧縮が不要に |
| `@emailjs/browser` | メールバックアップ廃止 |
| `axios` | fetch APIに統一（axiosを使っている箇所が残っていないか最終確認は必要） |
| `aws-sdk` | 現在package.jsonにあるが未使用。Lambda側で別途使用するため、フロントからは削除 |

### 追加するパッケージ（インストール）

| パッケージ | 用途 | 追加時期 |
|-----------|------|---------|
| `@neondatabase/serverless` | Neon DB接続ドライバー | フェーズ1 |
| `@aws-sdk/client-lambda` | 管理者手動更新でLambda非同期呼び出し | フェーズ2 |
| `bcrypt` / `@types/bcrypt` | パスワードハッシュ化 | フェーズ4 |
| 認証ライブラリ（未決定） | `next-auth` or `jose`（課題②着手前に決定） | フェーズ4 |

---

## 11. 開発手順（ステップバイステップ）

### 開発フローの全体方針

#### なぜローカルでテストできるのか

Neonはクラウド上のDBだが、**localhostからもVercelからも同じ接続文字列でアクセスできる**。`.env.local`に`DATABASE_URL`を設定すれば、`npm run dev`で起動したローカルサーバーからNeonに接続できるため、APIルートの動作確認は通常のローカル開発と同じ手順で行える。Lambda関数もNode.jsスクリプトとしてローカルで直接実行可能。

#### 各フェーズのテスト方針

| フェーズ | 主な作業 | ローカルテスト | テスト方法 |
|---------|---------|-------------|----------|
| 0 | Neonアカウント作成・テーブル作成 | — | Neonダッシュボードで手作業 |
| 1 | DB接続 + APIルート作成 | **できる** | `npm run dev` → `curl http://localhost:3000/api/stocks` でレスポンス確認 |
| 2 | Lambda関数作成 | **できる** | `npx tsx index.ts` でNode.jsスクリプトとして直接実行 → Neon DBにデータが入ることを確認 |
| 2（デプロイ） | AWS Lambda + EventBridge | **できない** | AWSコンソールの「テスト」ボタンで実行 → 翌16時にEventBridge自動実行を確認 |
| 3 | フロントエンドのDB移行 | **できる** | `npm run dev` → ブラウザでチャート表示・検索・ページネーション等を確認 |

#### ローカルでテストできないもの（デプロイ後に1回確認するだけ）

以下は「コード」ではなく「インフラの配線」の確認であり、デプロイ後に1回確認すれば済む。

| 項目 | 確認タイミング |
|------|-------------|
| EventBridgeが16時にLambdaを起動するか | フェーズ2デプロイ後の翌営業日16時 |
| VercelのCDNキャッシュが正しく動作するか | フェーズ3完了後のVercelデプロイ後 |
| Lambda完了後のキャッシュ破棄（`POST /api/revalidate`）が本番で動くか | 上記と同時に確認 |

#### 開発の具体的な流れ

```
【フェーズ0: 事前準備】
  Neonアカウント作成 → テーブル作成 → .env.local設定 → npm install

【フェーズ1: DB接続 + APIルート】 ← ローカルで完結
  src/lib/db.ts 作成
    → ローカルテスト: npm run dev → DBに接続できるか確認
  GET /api/stocks 作成
    → ローカルテスト: curl で叩いてレスポンス確認（テスト用データを手動INSERT）
  GET /api/stocks/[code] 作成
    → ローカルテスト: curl で叩いて個別銘柄レスポンス確認
  POST /api/revalidate 作成
    → ローカルテスト: curl -X POST で叩いてキャッシュ破棄が動くか確認

【フェーズ2: Lambda関数】 ← ローカル → AWSの2段階
  lambda/ ディレクトリ作成、コード実装
    → ローカルテスト: npx tsx index.ts で10銘柄テスト → Neon DBにデータが入るか確認
    → ローカルテスト: 全銘柄テスト → 処理時間とエラー件数確認
  AWSにデプロイ
    → AWSテスト: コンソールの「テスト」ボタンで実行 → DBにデータが入るか確認
  EventBridge設定
    → AWSテスト: 翌営業日16時に自動実行されるか確認（翌日まで待つ）

【フェーズ3: フロントエンド改修】 ← ローカルで完結
  useStockDataStorage.ts 改修（localStorage → API）
    → ローカルテスト: npm run dev → チャート表示・スクリーニング・ページネーション確認
  不要ファイル・パッケージ削除
    → ローカルテスト: npm run build でビルドエラーがないか確認

【デプロイ】
  git push → Vercel自動デプロイ
    → 本番テスト: CDNキャッシュ動作確認、Lambda→revalidate→最新データ反映の確認
```

---

### フェーズ0：事前準備

#### Step 0-1：Neonのアカウント作成とDB構築

1. [Neon](https://neon.tech/)にアクセスしてアカウント作成（GitHubアカウントで登録可能）
2. 新しいプロジェクトを作成（プロジェクト名: `mitsukabu`）
3. リージョンは `Asia Pacific (Tokyo)` を選択（日本からのレイテンシ最小化）
4. 作成後に表示される接続文字列（`DATABASE_URL`）を控える
   - 形式: `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/mitsukabu_db?sslmode=require`
5. Neonのダッシュボード → SQL Editorで、[セクション6](#6-dbスキーマ修正版)のSQLを実行してテーブルを作成

#### Step 0-2：Vercel + Neon統合の設定

1. Vercelのプロジェクト設定 → Integrations → Neonを検索して接続
2. または手動で環境変数を設定:
   - `DATABASE_URL` = Neonの接続文字列

#### Step 0-3：ローカル開発環境の準備

1. `.env.local`に環境変数を追加（フェーズごとに段階的に追加）:
   ```
   # === 既存（維持） ===
   NEXT_PUBLIC_BASE_URL=https://www.mitsukabu.com/
   BASIC_AUTH_USER=（フェーズ6で削除するまで維持）
   BASIC_AUTH_PASSWORD=（フェーズ6で削除するまで維持）

   # === フェーズ1で追加: Neon DB接続 ===
   DATABASE_URL=postgresql://user:password@ep-xxx.../mitsukabu_db?sslmode=require

   # === フェーズ1で追加: キャッシュ破棄用シークレット ===
   REVALIDATE_SECRET=（`openssl rand -base64 32`で生成）

   # === フェーズ2で追加: AWS Lambda呼び出し（管理者手動更新用） ===
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=ap-northeast-1
   LAMBDA_FUNCTION_NAME=mitsukabu-stock-updater

   # === フェーズ4で追加: 認証用 ===
   AUTH_SECRET=（`openssl rand -base64 32`で生成）
   ```
2. 新規パッケージのインストール（課題①に必要な分のみ。残りは各フェーズで追加）:
   ```bash
   npm install @neondatabase/serverless
   ```
   ※ `@aws-sdk/client-lambda`はフェーズ2で追加。`bcrypt`と認証ライブラリは課題②（フェーズ4）で追加。
3. 不要パッケージの削除（フェーズ3完了後にまとめて実施）:
   ```bash
   npm uninstall pako @types/pako @emailjs/browser axios aws-sdk
   ```

---

### フェーズ1：DB接続基盤の構築

#### Step 1-1：DB接続ユーティリティの作成

`src/lib/db.ts`を作成。Neonのサーバーレスドライバーを使ってDBに接続するユーティリティ。全てのAPIルートからこのファイルをimportしてDB操作を行う。

#### Step 1-2：`GET /api/stocks`の作成と動作確認（キャッシュ付き）

1. `src/app/api/stocks/route.ts`を作成
2. Neon DBの`stock_data`テーブルから全銘柄データを取得して返すAPIを実装
3. `revalidateTag`によるキャッシュを設定（`tags: ['stocks']`）。これによりDBクエリはキャッシュ破棄時のみ実行される
3. ※この時点ではDBにデータがないので、テスト用に1〜2銘柄のデータを手動でINSERTして動作確認

#### Step 1-3：`GET /api/stocks/[code]`の作成

1. `src/app/api/stocks/[code]/route.ts`を作成
2. 個別銘柄のデータを返すAPI
3. 既存の`src/app/api/stock/[code]/route.ts`（Yahoo APIプロキシ）とは別ファイルとして作成（パスが`stock`→`stocks`に変わる）

#### Step 1-4：`POST /api/revalidate`の作成

1. `src/app/api/revalidate/route.ts`を作成
2. リクエストボディの`secret`と環境変数`REVALIDATE_SECRET`を照合して認証
3. `revalidateTag('stocks')`を呼んで`GET /api/stocks`のキャッシュを破棄
4. Lambda DB更新成功後にこのエンドポイントが呼ばれる

---

### フェーズ2：Lambda関数（バッチ処理）の構築

#### Step 2-1：Lambda関数のプロジェクト作成

1. リポジトリ内に`lambda/`ディレクトリを作成
2. `package.json`, `tsconfig.json`を作成
3. 必要パッケージ: `@neondatabase/serverless`, `papaparse`（CSV解析）
4. 開発用パッケージ: `esbuild`, `typescript`, `@types/node`, `@types/papaparse`
5. ※Node.js 20ランタイムには`fetch`が組み込まれているため`node-fetch`は不要

#### Step 2-2：コアロジックの移植

1. `lambda/convertData.ts` — `filterNullData()`, `convertYahooToDailyData()`, `convertYahooToStock()`を移植
2. `lambda/fetchYahooFinance.ts` — リトライ付きの単一銘柄取得関数を移植（useStateを除去）
3. `lambda/database.ts` — Neon接続 + UPSERTクエリ

#### Step 2-3：Lambda handler実装

1. `lambda/index.ts` — メインのhandler関数
2. `jpx400.csv`を読み込み、400銘柄をループ処理
3. 500ms間隔でYahoo Finance APIにリクエスト → 変換 → **メモリ上の配列に蓄積**
4. 全銘柄取得完了後、トランザクションで一括UPSERT

#### Step 2-4：ローカルでの動作テスト

1. Lambda関数をローカルで実行して、Neon DBにデータが正しく保存されることを確認
2. テスト用に10銘柄程度で試す
3. 全396銘柄で実行して、処理時間とエラー件数を確認

#### Step 2-5：AWSへのデプロイ

1. Lambda関数のビルド・パッケージング:
   ```bash
   cd lambda
   npm install
   npm run package   # esbuild でバンドル → jpx400.csv同梱 → zip生成
   ```
2. AWS Lambdaにデプロイ（AWSコンソールから手動アップロード）:
   - 関数名: `mitsukabu-stock-updater`
   - ランタイム: Node.js 20
   - ハンドラー: `index.handler`
   - タイムアウト: 600秒（10分）
   - メモリ: 256MB
   - 環境変数:
     - `DATABASE_URL`（Neonの接続文字列）
     - `REVALIDATE_URL`（`https://www.mitsukabu.com/api/revalidate`）
     - `REVALIDATE_SECRET`（`.env.local`と同じ値）
   - コードソース: `dist/function.zip` をアップロード
3. EventBridgeルールを作成:
   - ルール名: `mitsukabu-daily-stock-update`
   - スケジュール式: `cron(0 7 ? * MON-FRI *)`（UTC 07:00 = JST 16:00、平日のみ）
   - ターゲット: Lambda関数 `mitsukabu-stock-updater`
4. IAMユーザーの作成（管理者手動更新用）:
   - ユーザー名: `mitsukabu-lambda-invoker`
   - ポリシー: `lambda:InvokeFunction`（対象ARN: `mitsukabu-stock-updater`のみ）
   - アクセスキーを発行 → `.env.local`とVercel環境変数に`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`を設定
5. テスト実行して、DBに正しくデータが保存されることを確認

#### Step 2-6：`GET /api/stocks`の再テスト

Lambda実行後、`GET /api/stocks`が全銘柄データを正しく返すことを確認。

---

### フェーズ3：フロントエンドのDB移行

#### Step 3-1：`useStockDataStorage.ts`の改修

最も影響が大きい変更。段階的に進める：

1. **株価データの読み込み部分**：`loadStoredData()`をlocalStorage読み込みから`GET /api/stocks`呼び出しに変更
2. **株価データの保存部分**：`saveStockData()`はフロント側では不要になるため削除（バッチ処理が担当）
3. **pako圧縮/解凍ロジック**：全て削除
4. **お気に入り・保有・検討のCRUD**：localStorage操作をAPI呼び出しに変更（ただしフェーズ4の認証完了後に行うため、この段階では一旦保留）

※この段階では認証がまだないため、お気に入り等のユーザー固有データは一旦localStorageのまま残す。フェーズ4で認証を入れた後にAPI化する。

#### Step 3-2：`useYahooFinanceAPI.ts`の削除

1. `src/hooks/useYahooFinanceAPI.ts`を削除
2. このファイルをimportしている箇所（`src/app/setting/page.tsx`）の参照を修正

#### Step 3-3：`src/app/api/stock/[code]/route.ts`の削除

1. 旧Yahoo APIプロキシルートを削除
2. 新しい`/api/stocks/[code]`が代わりの役割を担う

#### Step 3-4：不要パッケージの削除

```bash
npm uninstall pako @types/pako @emailjs/browser axios aws-sdk
```

#### Step 3-5：動作確認

1. `npm run build`でビルドエラーがないことを確認
2. ローカルで`npm run dev`で起動して、チャート表示・スクリーニングが正常に動作することを確認
3. ページネーション、検索、並べ替えなど既存機能が壊れていないことを確認

---

### フェーズ4：認証機能の構築

#### Step 4-1：認証ライブラリのセットアップ

> ⚠️ 認証ライブラリは課題②着手前に決定する。以下はAuth.js v5ベースの記述だが、自前実装（jose + bcrypt）に変更する場合はこのステップの内容が変わる。

1. `src/auth.ts`を作成（認証設定ファイル）
   - Auth.jsの場合: Credentials Providerの設定、JWTコールバック
   - 自前実装の場合: JWT発行・検証関数（joseライブラリ使用）
   - いずれの場合もJWTにuser_id, role, userNameを含める
2. Auth.jsの場合: `src/app/api/auth/[...nextauth]/route.ts`を作成
   自前実装の場合: `src/app/api/auth/login/route.ts`を作成

#### Step 4-2：新規登録APIの作成

1. `src/app/api/auth/register/route.ts`を作成
2. ユーザー名のバリデーション、重複チェック
3. bcryptでパスワードハッシュ化
4. usersテーブルにINSERT

#### Step 4-3：ログイン/新規登録ページの作成

1. `src/app/login/page.tsx`を作成
2. `src/app/register/page.tsx`を作成
3. 認証ライブラリに応じたsignIn/signOut処理を実装

#### Step 4-4：proxy.ts（旧middleware.ts）の置き換え

Next.js 16では`middleware.ts`が`proxy.ts`にリネームされた。

1. `src/middleware.ts`を`src/proxy.ts`にリネーム
2. Basic認証ロジックを全て削除
3. JWT検証に置き換え（認証ライブラリにより実装方法が変わる）
4. 未認証ユーザーは`/login`にリダイレクト
5. `/login`と`/register`は認証不要（matcher設定で除外）

#### Step 4-5：Header.tsxの改修

1. ログイン状態の表示（ユーザー名）
2. ログアウトボタンの追加
3. セッション情報の取得方法は認証ライブラリにより異なる

#### Step 4-6：動作確認

1. 新規登録 → ログイン → ページ表示 → ログアウトのフロー確認
2. 未認証でアクセスした時に/loginにリダイレクトされることを確認
3. ログイン後にチャート表示やスクリーニングが正常に動作することを確認

---

### フェーズ5：ユーザー固有データのDB移行

#### Step 5-1：ユーザー固有データAPIの作成

以下のAPIルートを全て作成する：

1. `src/app/api/favorites/route.ts`（GET / POST / DELETE）
2. `src/app/api/holdings/route.ts`（GET / POST / DELETE）
3. `src/app/api/considering/route.ts`（GET / POST / DELETE）
4. `src/app/api/memos/route.ts`（GET: 全メモ取得）
5. `src/app/api/memos/[code]/route.ts`（GET / PUT / DELETE）
6. `src/app/api/stock-status/route.ts`（PUT: 排他制御付きステータス変更）

各APIは以下の共通パターンで実装：
- JWTからuser_idを取得
- SQLクエリでNeon DBにCRUD操作
- エラーハンドリング

#### Step 5-2：`useStockDataStorage.ts`のCRUD操作をAPI化

フェーズ3で保留していた部分を完了させる：

1. `saveFavorites()` / `loadFavorites()` → `POST /api/favorites` / `GET /api/favorites`に変更
2. `saveHoldings()` / `loadHoldings()` → 同様にAPI化
3. `saveConsidering()` / `loadConsidering()` → 同様にAPI化
4. `setStockStatus()` → `PUT /api/stock-status`に変更
5. localStorageの`STORAGE_KEYS.FAVORITES`, `HOLDINGS`, `CONSIDERING`は全て不要に

#### Step 5-3：`useStockMemo.ts`のAPI化

1. `saveMemo()` → `PUT /api/memos/[code]`
2. `getMemo()` / `getAllMemos()` → `GET /api/memos` / `GET /api/memos/[code]`
3. `deleteMemo()` → `DELETE /api/memos/[code]`
4. localStorageの`jpx400_stock_memos_v1`は不要に

#### Step 5-4：`useEmailBackup.ts`の削除

1. `src/hooks/useEmailBackup.ts`を削除
2. このファイルをimportしている箇所（`src/app/setting/page.tsx`）の参照を削除
3. setting/page.tsxから「バックアップ」セクションのUI全体を削除

#### Step 5-5：setting/page.tsxの管理者用対応

1. 株価更新ボタンをrole判定で管理者のみ表示に変更
2. `useYahooFinanceAPI`関連の参照が残っていないことを確認
3. `useEmailBackup`関連の参照が残っていないことを確認
4. 管理者が手動更新する場合は`POST /api/stocks/refresh`を呼ぶ形に変更（AWS SDK v3でLambda非同期呼び出し）

#### Step 5-6：動作確認

1. ログインして観察銘柄の追加/削除が正常に動作することを確認
2. 保有銘柄、検討銘柄、メモのCRUDが全て動作することを確認
3. 銘柄ステータスの排他制御（同時に1つだけ）が正しく動作することを確認
4. 別のブラウザ/端末からログインして同じデータが見えることを確認（DB移行の本来の目的）

---

### フェーズ6：仕上げ

#### Step 6-1：Basic認証関連のクリーンアップ

1. `.env.local`から`BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`を削除
2. Vercelの環境変数からも削除

#### Step 6-2：SEO設定の見直し

1. 現在のproxy.ts（旧middleware.ts）にある`X-Robots-Tag: noindex`を削除
2. `robots.txt`の内容を確認・更新（全世界公開用に変更）
3. meta descriptionなどの基本SEO設定

#### Step 6-3：セキュリティチェック

1. GitHubリポジトリにEmailJSの秘匿情報が残っていないことを確認
2. `DATABASE_URL`が`.env.local`/.gitignoreで適切に管理されていることを確認
3. 認証用の`AUTH_SECRET`が設定されていることを確認

#### Step 6-4：最終テスト

1. Vercelにデプロイ
2. 新規登録 → ログイン → 全機能テスト
3. Lambda自動実行（16時）後にデータが更新されることを確認
4. 複数ユーザーでのテスト（ユーザーごとにデータが分離されていることの確認）

---

## 12. コスト見積もり

### 月額コスト（概算）

| サービス | プラン | 月額 | 備考 |
|---------|------|------|------|
| **Neon** | Free Tier | **$0** | 512MBストレージ、190時間コンピュート。mitsukabuの規模なら十分 |
| **AWS Lambda** | 従量課金 | **$0** | 月100万リクエスト/400,000GB秒まで無料。毎日1回の実行は余裕で無料枠内 |
| **AWS EventBridge** | 従量課金 | **$0** | 月1,400万イベントまで無料 |
| **Vercel** | Hobby (無料) | **$0** | 個人プロジェクトは無料枠で十分 |
| **お名前.com** | ドメイン | **約¥1,500/年** | 既存のmitsukabu.comの維持費のみ |

### 合計: 月額 $0 + ドメイン年額約¥1,500

※Neonの無料枠を超えた場合はLaunch Plan ($19/月) へのアップグレードが必要になるが、ユーザー数が大幅に増えない限り無料枠で収まる見込み。

---

## 13. 更新履歴

| 日付 | 内容 |
|------|------|
| 2026.02.18 | 初版作成。2つの課題の整理、影響範囲の分析、依存関係の整理 |
| 2026.02.18 | 技術選定完了（Neon, Lambda, Auth.js）。API設計、DBスキーマ修正版、開発手順の全ステップを追記。設計フェーズ完了 |
| 2026.02.18 | Lambdaのデータ保存方式を「1銘柄ずつDB保存」→「全銘柄取得後に一括トランザクションでUPSERT」に修正（データ整合性の保証）。APIレスポンスのdaily_data期間の記述を修正（5ヶ月→7ヶ月、75日移動平均線の計算に必要なため） |
| 2026.03.07 | Next.js 16対応を反映（middleware.ts→proxy.tsリネーム）。認証ライブラリをAuth.js v5から未決定に変更（Next.js 16互換性問題のため、自前実装が有力候補）。管理者手動更新をAWS SDK v3によるLambda非同期呼び出しに確定。Lambdaデプロイ方法をesbuild→zip→手動アップロードに確定。jpx400.csvをLambda zip内に同梱に確定。環境変数一覧をフェーズ別に整備。パッケージ追加時期をフェーズ別に整理。`GET /api/stocks`のキャッシュ戦略をイベント駆動方式（`revalidateTag`）に決定。Lambda DB更新成功後に`POST /api/revalidate`でキャッシュ破棄。Lambda失敗時の運用方針を「サイト上の最終更新日で確認→手動更新」に決定。開発フローの全体方針を追加（各フェーズのローカルテスト可否・テスト方法・具体的な開発の流れ） |