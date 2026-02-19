# 📱 iPhone用アイコン設定ガイド

このドキュメントでは、ローン計算アプリをiPhoneのホーム画面に追加する際にアイコンが表示されるよう、アイコンファイルをセットアップする方法を説明します。

## 問題

iPhoneのSafariで「ホーム画面に追加」を選択しても、アイコンが表示されない場合があります。

## 原因

ブラウザがアイコンファイルを見つけられない、またはファイル形式が適切でない可能性があります。

## 解決方法

### 方法1: クイック生成ツール（推奨）

最も簡単な方法です。

1. **ブラウザで以下のファイルを開く:**
   ```
   assets/quick-icon-generator.html
   ```

2. **各ボタンをクリック:**
   - 「180×180 アイコンを生成」をクリック
   - 「152×152 アイコンを生成」をクリック
   - 「167×167 アイコンを生成」をクリック
   - 「192×192 アイコンを生成」をクリック

3. **ファイルを保存:**
   ダウンロードされたファイルを `assets/` フォルダに保存してください。
   ```
   assets/icon-180.png
   assets/icon-152.png
   assets/icon-167.png
   assets/icon-192.png
   ```

### 方法2: SVG変換ツール

SVGファイルから PNG形式に変換します。

1. **以下のファイルをブラウザで開く:**
   ```
   assets/generate-icons.html
   ```

2. **「すべてのアイコンを生成」をクリック**
   複数サイズのアイコンが自動的にダウンロードされます。

3. **ファイルを `assets/` フォルダに保存**

### 方法3: 手動でアイコンを配置

既存の画像ファイルがある場合は、以下の手順で配置できます。

1. 画像を `assets/` フォルダにコピー
2. ファイル名を以下のように設定:
   ```
   icon-180.png (最も重要)
   icon-152.png (iPad用)
   icon-167.png (iPad Pro 11用)
   icon-192.png (Android/その他)
   ```

## 必要なファイル

```
ローン計算アプリ/
├── index.html              (既存)
├── manifest.json           (新規)
├── css/
│   └── style.css           (既存)
├── js/
│   ├── app.js              (既存)
│   ├── calculator.js       (既存)
│   └── analyzer.js         (既存)
└── assets/
    ├── icon.svg            (既存)
    ├── icon-180.png        ← 必須
    ├── icon-152.png        ← 推奨
    ├── icon-167.png        ← 推奨
    ├── icon-192.png        ← 推奨
    ├── quick-icon-generator.html  (新規)
    └── generate-icons.html (新規)
```

## iPhoneでのセットアップ手順

アイコンをセットアップした後、以下の手順でホーム画面に追加してください：

### iOS 15以降

1. **Safari でアプリを開く**
2. **下の共有ボタン（四角から矢印） を押す**
3. **「ホーム画面に追加」を選択**
4. **名前を確認して「追加」をタップ**

### アイコンが表示されない場合の確認事項

- [ ] アイコンファイルが `assets/icon-180.png` に存在するか
- [ ] ブラウザをリロード (Ctrl+R または Cmd+R)
- [ ] Safari キャッシュをクリア (設定 > Safari > 履歴と Webサイトデータを消去)
- [ ] ホーム画面から既存のアプリを削除して、再度追加

## アイコンサイズの説明

| サイズ | デバイス | 用途 |
|--------|---------|------|
| 180×180 | iPhone | iOS 15.1以降の標準 |
| 152×152 | iPad | iPad 第4世代以降 |
| 167×167 | iPad Pro 11 | iPad Pro 11インチ用 |
| 192×192 | その他 | PWA対応、Android等 |

## トラブルシューティング

### アイコンが反映されない

1. キャッシュをクリア：
   - Safari で同じページを長押し
   - 「ホーム画面から削除」
   - ページをリロード
   - 再度「ホーム画面に追加」

2. ファイルの確認：
   - `assets/icon-180.png` が存在する
   - ファイルサイズが0KBでない
   - ファイル形式が PNG である

### 古いアイコンが表示される

ブラウザがキャッシュを保持している可能性があります。

- Safari キャッシュをクリア
- ブラウザを完全に終了
- iPhoneを再起動

## PWA対応について

`manifest.json` を配置することで、以下の機能が有効になります：

- ✅ フルスクリーンモード対応
- ✅ ステータスバーのカスタマイズ
- ✅ アプリとしての認識

## 技術情報

### HTML メタタグ

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ローン計算">
```

### apple-touch-icon リンク

```html
<link rel="apple-touch-icon" href="assets/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/icon-180.png">
```

## サポート

問題が発生した場合は、以下を確認してください：

1. すべてのアイコンファイルが PNG 形式か
2. ファイル名に誤字がないか
3. ブラウザ開発者ツール (F12) でエラーを確認
4. iPhoneのSafari設定で JavaScriptが有効か

---

**最終確認:**
- アイコンファイルが正しく配置されている
- index.html でメタタグが正しく設定されている
- ブラウザキャッシュがクリアされている

これでiPhoneのホーム画面にアイコン付きでアプリが追加できるようになります！
