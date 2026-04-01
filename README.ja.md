[English](./README.md)

# Your Chrome like Arc or Dia Kit

Chromeは良いブラウザだけど、ArcやDiaのタブ・URL管理のUXには及ばない。この拡張機能は、その足りないピースをChromeに持ち込みます。ストア公開なし、自分でビルドして使うだけ。

**自分でビルドしたローカル拡張が一番安全。** インストール前にすべてのコードを読める。知らない間にアップデートされない。テレメトリなし。許可していないpermissionもなし。

## 機能一覧

### 1. URLをワンキーでコピー

`Cmd+Shift+C` — 現在のタブのURLを即座にクリップボードにコピー。ポップアップなし、右クリック不要。

右上にトースト通知が表示されて、コピー完了を確認できます。

`chrome://` ページでも動作します（offscreen APIによるフォールバック）。

### 2. タブの自動クリーンアップ

**12時間**操作していないタブを自動的に閉じます。ブラウザが常にスッキリ。

安全設計:
- **固定タブ**は閉じない
- **グループ内のタブ**は閉じない
- 1時間ごとにバックグラウンドでチェック

### 3. 直前のタブに戻る

`Ctrl+Shift+Z` — さっきまで見ていたタブにジャンプ。連打するとタブ履歴を遡っていく。注意力のUndoみたいなもの。

タブ履歴はセッションストレージに保存されるため、バックグラウンドのService Workerが再起動しても消えません。Chromeを閉じるとリセットされます。

Chromeに最初からあるべきだった「戻る」機能。

### 4. タブの固定/解除トグル

`Ctrl+Shift+D` — 現在のタブの固定/解除を切り替え。Chromeにはこのショートカットがない。これで解決。

## ショートカット一覧

| ショートカット | 動作 |
|---|---|
| `Cmd+Shift+C` | 現在のURLをコピー |
| `Ctrl+Shift+Z` | タブ履歴を遡る |
| `Ctrl+Shift+D` | タブの固定/解除 |

すべてのショートカットは `chrome://extensions/shortcuts` でカスタマイズ可能。

## インストール（2分）

```bash
git clone https://github.com/TeXmeijin/your-chrome-like-arc-or-dia-kit.git
cd your-chrome-like-arc-or-dia-kit
npm install
npm run build
```

次に:

1. `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」→ `.output/chrome-mv3/` フォルダを選択

完了。

## 技術スタック

- [WXT](https://wxt.dev/) — 次世代ブラウザ拡張フレームワーク
- TypeScript
- Manifest V3

## なぜChrome Web Storeに公開しないのか

- ストアの拡張機能はサイレントにアップデートされ、permissionが追加される可能性がある
- レビュープロセスは万能ではない
- ローカルビルドなら完全にコントロールできる。信頼不要
- これは個人ツール — forkして、改造して、自分のものにしてください

## License

MIT
