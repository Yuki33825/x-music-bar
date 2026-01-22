# Firebase セットアップ手順

## 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: x-music-bar）
4. Google Analytics は任意（不要なら無効化でOK）

## 2. Web アプリの追加

1. プロジェクトダッシュボードで「</>」（Webアプリを追加）をクリック
2. アプリのニックネームを入力
3. 「Firebase Hosting も設定する」はチェック不要
4. 「アプリを登録」をクリック
5. 表示される設定値をメモ

## 3. Realtime Database の有効化

1. 左メニュー「構築」→「Realtime Database」
2. 「データベースを作成」をクリック
3. ロケーションを選択（asia-southeast1 推奨）
4. セキュリティルールは「テストモードで開始」を選択（開発用）

## 4. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を設定:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 5. Vercel へのデプロイ

Vercel にデプロイする場合、環境変数を Vercel ダッシュボードで設定:

1. Vercel プロジェクトの「Settings」→「Environment Variables」
2. 上記の各変数を追加

## セキュリティルール（本番用）

テストモードのルールは30日で期限切れになります。本番環境では以下のルールを設定:

```json
{
  "rules": {
    "sabit": {
      ".read": true,
      ".write": true
    }
  }
}
```
