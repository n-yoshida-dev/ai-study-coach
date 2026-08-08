# AI Study Coach

[![CI](https://github.com/n-yoshida-dev/ai-study-coach/actions/workflows/ci.yml/badge.svg)](https://github.com/n-yoshida-dev/ai-study-coach/actions/workflows/ci.yml)

学習記録を管理する Web アプリ。React 19 + TypeScript + Vite で構築。

AIコーディングエージェント協働開発を実践する学習プロジェクトの題材アプリです。

## 本番環境

https://ai-study-coach-alpha.vercel.app/

main へのマージをトリガーに Vercel が自動デプロイします。プルリクエストごとにプレビュー環境も作られます。

## 開発

```bash
npm install
npm run dev     # 開発サーバー
npm run test    # テスト（Vitest + React Testing Library）
npm run lint    # Lint（Oxlint）
npm run build   # 本番ビルド
```
