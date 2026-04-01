# Copy URL Shortcut

`Cmd+Shift+C` で現在のタブのURLをクリップボードにコピーするChrome拡張機能。

ストア非公開・ローカルビルド運用。

## セットアップ

```bash
npm install
npm run build
```

## Chromeへのインストール

1. `chrome://extensions` を開く
2. 「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」→ `.output/chrome-mv3/` を選択

## ショートカットの変更

`Cmd+Shift+C` が DevTools と競合する場合は `chrome://extensions/shortcuts` から変更できる。

## 技術スタック

- [WXT](https://wxt.dev/) (Manifest V3)
- TypeScript

## License

MIT
