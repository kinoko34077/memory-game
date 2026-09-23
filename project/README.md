# memory-game Project Overlay

このファイルは既存 `memory-game` に追加したKiNoTch Project Overlayの入口です。ゲームのHTML、CSS、JavaScriptはrootに残します。

## 概要

`memory-game` は、ブラウザで動作する静的な記憶ゲームです。

- 個別情報・仕様・実装: project/
- 個別プロジェクト定義: project/project.json
- 個別仕様索引: project/docs/INDEX.md
- 現在状態: project/docs/CURRENT_STATE.md
- 共通操作: .kinotch/README_BASE.md

## 所有境界

- ゲームルール、画面、状態、ブラウザ動作はProject側の既存実装を正本とします。
- KiNoTch Baseはrepository構造、診断、verify入口を提供します。
- 既存Web実装と競合するSurface helperは追加しません。

## 最短利用方法

```powershell
.\knt.cmd doctor
.\knt.cmd base-check
.\knt.cmd verify
```

既存の利用方法はrootのHTMLとJavaScriptを参照してください。
