# UED - 余実ノ隘の愛

「彼女」に対する罪と愛と復讐を描く、ホラーテイストのビジュアルノベルゲーム。

## 概要

主人公は、婚約者である沖野美咲をパワハラによる自殺で失う。彼女の死の真相を探り、加害者たちへの復讐を果たしながら、美咲の亡霊に導かれ——あるいは囚われ——ていく。

## ルート構成

| ルート | テーマ | ファイル |
|--------|------|--------|
| 序章 | 美咲の死、復讐の始まり | `index.html` |
| 論理ルート | 証拠とデータで追い詰める、冷徹な復讐 | `route_logic.html` |
| 感情ルート | 美咲への愛と贖罪、心の斜めを辻る | `route_emotion.html` |
| 恐怖ルート | 亡霊の美咲に支配される恐怖 | `route_fear.html` |
| 復讐ルート | 容赦なき制裁、血の復讐劇 | `route_revenge.html` |
| クライマックス | 全ルート合流、真の結末へ | `climax.html` |
| 特別ルート | 美咲の秘密、ループ | `secret_misaki.html`, `secret_loop.html` |

## ファイル構成

```
UED/
├── index.html            # タイトル画面・序章
├── route_logic.html      # 論理ルート
├── route_emotion.html    # 感情ルート
├── route_fear.html       # 恐怖ルート
├── route_revenge.html    # 復讐ルート
├── climax.html           # クライマックス・結末
├── secret_loop.html      # 特別：ループ
├── secret_misaki.html    # 特別：美咲の視点
├── sound_test.html       # サウンドテスト
├── audio.js              # オーディオエンジン (Web Audio API + MP3)
├── images/               # 背景・イベントCG
│   ├── bg_*.jpg          # 背景画像
│   └── cg_*.png          # イベントCG
├── audio/                # BGM (MP3)
│   ├── opening.mp3
│   ├── flashback.mp3
│   ├── confession.mp3
│   └── ending.mp3
└── scripts/
    └── convert.py        # 画像変換ツール (GUI)
```

## 実行方法

ローカルで実行する場合は、簡易サーバーを起動してください：

```bash
# Python 3
python -m http.server 8000

# ブラウザで開く
http://localhost:8000/
```

## 操作方法

- **選択肢をクリック**: ストーリーが分岐
- **Ctrl + Shift + R**: セーブデータをクリア（隠しコマンド）
- **タイトル画面**: 音量警告後、ゲージアニメーションで起動

## オーディオシステム

`audio.js` は Web Audio API によるシンセサイザーと HTML5 Audio による MP3 再生のハイブリッド構成。

### 主なBGM
- `opening.mp3` - タイトル・序章
- `flashback.mp3` - 回想シーン
- `confession.mp3` - 告白のテーマ
- `ending.mp3` - エンディング

### シンセサイザー音源
- アンビエント: office, rain, tinnitus, abyss
- BGM: mystery, horror, chase
- SE: ping, glitch, heartbeat, slam, shredder, execution, stamp, impact

## 開発ツール

### 画像変換ツール
`scripts/convert.py` は素材ファイルをゲーム用に変換するGUIツール。

```bash
python scripts/convert.py
```

- 背景: 1280x720 JPG
- CG: 1280x720 PNG (透過保持)

## 注意事項

- ヘッドホン推奨（音量注意の警告が出ます）
- ダークなテーマを含むため、苦手な方はご注意ください
