# AI Study Coach

[![CI](https://github.com/n-yoshida-dev/ai-study-coach/actions/workflows/ci.yml/badge.svg)](https://github.com/n-yoshida-dev/ai-study-coach/actions/workflows/ci.yml)

学習記録を管理する Web アプリ。React 19 + TypeScript + Vite で構築。

AIコーディングエージェント協働開発を実践する学習プロジェクトの題材アプリです。

## 本番環境

https://ai-study-coach-alpha.vercel.app/

main へのマージをトリガーに Vercel が自動デプロイします。プルリクエストごとにプレビュー環境も作られます。

## 環境変数

`.env.example` を `.env.local` にコピーし、Supabase の Project Settings > API の値を設定します。

```bash
cp .env.example .env.local
```

| 変数 | 内容 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase の Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key（ブラウザに露出する前提の公開鍵。データ保護は RLS が担う） |

`.env.local` は Git 管理外です（`.gitignore` の `*.local`）。

## 開発

```bash
npm install
npm run dev     # 開発サーバー
npm run test    # テスト（Vitest + React Testing Library）
npm run lint    # Lint（Oxlint）
npm run build   # 本番ビルド
```
