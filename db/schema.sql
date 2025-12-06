/* ===========================================
 * データベース名: mitsukabu_db
 * 作成日: 2025/10/13
 * 更新日: 2025/10/13
 * =========================================== */
DROP DATABASE IF EXISTS mitsukabu_db; --データベースが既に存在する場合は削除
CREATE DATABASE mitsukabu_db --データベースの作成
  WITH
  ENCODING = 'UTF8' --文字エンコード
  LC_COLLATE = 'ja_JP.UTF-8' --文字エンコード
  LC_CTYPE = 'ja_JP.UTF-8'; --文字エンコード
\c mitsukabu_db; --データベースへ接続


/* ===========================================
 * テーブル物理名: users
 * テーブル論理名: ユーザー情報
 * テーブルの役割: ユーザーの情報を管理するテーブル
 * テーブル属性: 親テーブル
 * ========================================== */
CREATE TABLE users (
  id SERIAL PRIMARY KEY, --管理用ID（自動採番）
  user_name VARCHAR(255) UNIQUE NOT NULL, --ユーザー名
  password_hash VARCHAR(255) NOT NULL, --ハッシュ化されたパスワード
  role VARCHAR(30) NOT NULL --"admin" or "user"
);


/* ===========================================
 * テーブル物理名: stock_data
 * テーブル論理名: 株データ
 * テーブルの役割: 株価データを管理するテーブル
 * テーブル属性: 親テーブル
 * ========================================== */
CREATE TABLE stock_data (
  id SERIAL PRIMARY KEY, --管理用ID（自動採番）
  stock_code VARCHAR(10) UNIQUE NOT NULL, --銘柄コード
  stock_name VARCHAR(255) NOT NULL, --銘柄名
  daily_data JSONB NOT NULL, --日足データの配列
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP --取得日（取得する度に上書き）
);


-- 以下から子テーブル


/* ------------------------------------------
 * テーブル物理名: favorites
 * テーブル論理名: 観察銘柄
 * テーブルの役割: 観察銘柄を管理するテーブル
 * テーブル属性: 子テーブル
 * ------------------------------------------ */
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY, --管理用ID（自動採番）
  user_name VARCHAR(255) NOT NULL, --ユーザー名（外部キー）
  stock_code VARCHAR(10) NOT NULL, --銘柄コード（外部キー）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, --作成日時
  FOREIGN KEY (user_name) REFERENCES users(user_name) ON DELETE CASCADE, --外部キー制約
  FOREIGN KEY (stock_code) REFERENCES stock_data(stock_code) ON DELETE CASCADE, --外部キー制約
  UNIQUE(user_name, stock_code) --ユニーク制約（重複登録防止）
);


/* ------------------------------------------
 * テーブル物理名: holdings
 * テーブル論理名: 保有銘柄
 * テーブルの役割: 保有銘柄を管理するテーブル
 * テーブル属性: 子テーブル
 * ------------------------------------------ */
CREATE TABLE holdings (
  id SERIAL PRIMARY KEY, --管理用ID（自動採番）
  user_name VARCHAR(255) NOT NULL, --ユーザー名（外部キー）
  stock_code VARCHAR(10) NOT NULL, --銘柄コード（外部キー）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, --作成日時
  FOREIGN KEY (user_name) REFERENCES users(user_name) ON DELETE CASCADE, --外部キー制約
  FOREIGN KEY (stock_code) REFERENCES stock_data(stock_code) ON DELETE CASCADE, --外部キー制約
  UNIQUE(user_name, stock_code) --ユニーク制約（重複登録防止）
);


/* ------------------------------------------
 * テーブル物理名: memos
 * テーブル論理名: 売買メモ
 * テーブルの役割: 売買メモを管理するテーブル
 * テーブル属性: 子テーブル
 * ------------------------------------------ */
CREATE TABLE memos (
  id SERIAL PRIMARY KEY, --管理用ID（自動採番）
  user_name VARCHAR(255) NOT NULL, --ユーザー名（外部キー）
  stock_code VARCHAR(10) NOT NULL, --銘柄コード（外部キー）
  memo TEXT NOT NULL, --メモ内容
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, --作成日時
  FOREIGN KEY (user_name) REFERENCES users(user_name) ON DELETE CASCADE, --外部キー制約
  FOREIGN KEY (stock_code) REFERENCES stock_data(stock_code) ON DELETE CASCADE, --外部キー制約
  UNIQUE(user_name, stock_code) --ユニーク制約（重複登録防止）
);