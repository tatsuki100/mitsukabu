// ========================================
// src/app/privacy/page.tsx
// プライバシーポリシーページ
// ========================================

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

      <div className="prose max-w-none">
        <p className="mb-6">
          みつかぶ（以下「当サービス」）は、ユーザーの個人情報の保護に努めております。本プライバシーポリシーでは、当サービスにおける個人情報の取り扱いについて説明いたします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. 収集する情報</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">1.1 アカウント情報</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>ユーザー名</li>
          <li>メールアドレス（パスワード再設定用）</li>
          <li>パスワード（ハッシュ化して保存）</li>
        </ul>

        <h3 className="text-xl font-medium mt-6 mb-3">1.2 ユーザーデータ</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>観察銘柄・検討銘柄・保有銘柄の情報</li>
          <li>銘柄メモの内容</li>
        </ul>

        <h3 className="text-xl font-medium mt-6 mb-3">1.3 アクセス情報</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>IPアドレス</li>
          <li>ブラウザの種類とバージョン</li>
          <li>アクセス日時</li>
          <li>閲覧ページ</li>
          <li>リファラー情報</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Google Analyticsの使用</h2>
        <p className="mb-4">
          当サービスでは、Googleが提供するアクセス解析ツール「Google Analytics」を使用する場合があります。Google Analyticsは、トラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. 情報の利用目的</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>サービスの提供・運営のため</li>
          <li>パスワード再設定メールの送信のため</li>
          <li>サービスの改善・最適化のため</li>
          <li>不正利用の防止のため</li>
          <li>統計データの作成のため</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. 情報の第三者提供</h2>
        <p className="mb-4">
          当サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. データの保存</h2>
        <p className="mb-4">
          ユーザーのアカウント情報および銘柄データ（観察銘柄・検討銘柄・保有銘柄・メモ）は、サーバー上のデータベースに保存されます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. 免責事項</h2>
         <ul className="list-disc pl-6 mb-4">
          <li>当サービスの利用により生じた投資判断の結果について、当サービス運営者は一切の責任を負いません</li>
          <li>当サービスの利用により生じた損害について、当サービス運営者は一切の責任を負いません</li>
          <li>当サービスは投資助言や投資勧誘を目的とするものではありません</li>
          <li>投資の判断は必ずご自身の責任で行ってください</li>
          <li>当サービスで表示される移動平均線、RSI、MACD等のテクニカル指標は参考情報であり、投資成果を保証するものではありません</li>
          <li>株価データの配信遅延や誤表示により生じた損失について、当サービス運営者は一切の責任を負いません</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. プライバシーポリシーの変更</h2>
        <p className="mb-4">
          当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、当サービス上に掲載したときから効力を生じるものとします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. お問い合わせ</h2>
        <p className="mb-4">
          本プライバシーポリシーに関するお問い合わせは、下記までご連絡ください。
        </p>
        <p className="mb-4">
          <a href="https://forms.gle/iVTN7imV4KvjNCzr8" target="_blank" className="underline text-blue-500">https://forms.gle/iVTN7imV4KvjNCzr8</a>
        </p>

        <p className="mt-14 text-sm text-right text-gray-600">
          制定日：2025/7/29<br />
          最終更新日：2026/3/7
        </p>
      </div>
    </div>
  )
}
