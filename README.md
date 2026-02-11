# AI Video App (Replicate + Vercel)

初心者向けに、**Text → Video** 生成アプリを最短で公開できる構成です。  
フロントは `index.html` 単体、バックエンドは `api/generate.js`（Vercel Serverless Functions）です。

## 構成

```
ai-video-app/
 ├ index.html
 ├ api/
 │   └ generate.js
 ├ package.json
 ├ vercel.json
 └ README.md
```

## 1) 事前準備

- GitHub アカウント
- Vercel アカウント（GitHub 連携できる状態）
- Replicate アカウント + API トークン

## 2) ローカルで動作確認

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

> API を叩くには、Vercel 環境変数 `REPLICATE_API_TOKEN` が必要です。ローカル開発時は `vercel env add` で設定できます。

## 3) GitHub リポジトリ作成と push

```bash
git init
git add .
git commit -m "feat: initial ai video app"
git branch -M main
git remote add origin https://github.com/<YOUR_NAME>/<YOUR_REPO>.git
git push -u origin main
```

## 4) Vercel 連携（自動デプロイ）

1. Vercel ダッシュボードで **Add New Project**
2. GitHub のこのリポジトリを選択
3. Framework Preset は **Other** でOK
4. Deploy を実行

以後、`main` ブランチに push するたびに自動デプロイされます。

## 5) 環境変数設定

Vercel プロジェクトの **Settings → Environment Variables** で以下を設定:

- `REPLICATE_API_TOKEN` = Replicate の API トークン

設定後、再デプロイしてください。

## 6) API 仕様

### `POST /api/generate`

リクエスト例:

```json
{
  "prompt": "cinematic drone shot of neon Tokyo street in rainy night",
  "resolution": "768x432",
  "seconds": 3,
  "seed": 12345
}
```

レスポンス例:

```json
{
  "videoUrl": "https://...mp4",
  "predictionId": "..."
}
```

処理内容:
1. `POST https://api.replicate.com/v1/predictions` で予測を作成
2. `GET https://api.replicate.com/v1/predictions/{id}` でポーリング
3. 完了後 output の動画 URL を返却

## 7) 更新運用

普段の更新はこれだけです。

```bash
git add .
git commit -m "feat: update ui"
git push
```

`git push` すると Vercel が自動でビルド・公開し、新しい URL が発行されます（Production へ反映）。

## 注意

- API トークンは必ずサーバ側（Vercel 環境変数）だけで管理する
- フロントに直接書かない
- 生成時間はモデル・混雑状況で前後します
