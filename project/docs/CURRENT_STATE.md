# Current State

## P3シャッフルの一様性修正

- [Owner #22](https://github.com/kinoko34077/memory-game/issues/22) で、ランダムペア選択とボードのカード配置に、配列のコピー上でのFisher–Yatesシャッフルを採用する。乱数を`Array.sort`の比較関数に用いる非推移的な比較を廃止する。
- 昇順モードは元データの先頭Nペアを引き続き選択し、その後のカード位置のみシャッフル。ランダムモードはシャッフルしたペアからNペアを選択する。元データ配列、ペアの識別子、カード操作・一致判定の仕様を変えない。
- 合成ペアと固定乱数のProject回帰で、長さ1/複数、昇順再選択、元データの非破壊性、各カードのペアID、データ未読込み時の開始拒否を検証。`Math.random` は暗号用途や強い乱数品質を保証しない。本修正は分布偏りを生むsortコンパレータの除去が目的。

## P3追加修正（例外診断と回帰の範囲）

- 保存設定のJSON解析失敗および既定ペア取得失敗の開発者向け警告から例外オブジェクトの出力を除き、固定の失敗文言を維持。保存済み設定そのものや、正常・失敗時のUI/フォールバック動作は変更しない。
- 合成値によるProjectテストが、INIインポート後の保存・自動保存・開始・設定JSON解析失敗と、既定ペア取得失敗の警告を確認し、各値がconsoleへ出ないことを判定する。
- ProjectテストはNodeの`.mjs`からルート`.js` ES moduleを読み込むため、Nodeのmodule-syntax detectionに依存する。実行互換の下限はNode 22.7.0以降（Node 20系なら20.19.0以降）。現行のHosted Verify runnerの具体版とは区別する。
- **別件**: この診断修正とペア／カードのランダムsort比較関数による分布偏りは別Owner [Issue #22](https://github.com/kinoko34077/memory-game/issues/22)で扱う。

## 2026-11-23 P2プライバシー修正：受入済み

- [Owner #17](https://github.com/kinoko34077/memory-game/issues/17)／[PR #18](https://github.com/kinoko34077/memory-game/pull/18) をmainへsquash統合（`7d0527329b4e765c9968fb239ae219e3c6380068`）。ローカルのDEBUG consoleへ入力したペア全文／配列、INI設定の値、設定オブジェクトを出力せず、静的な状態名と件数のみを保持。ゲームロジック、読み込み検証、保存形式、UI挙動は変更しない。
- 合成されたペア／INIの固有値を実読み込み経路で投入してconsole漏洩を拒否するProject回帰テストを追加。Projectのtest/verifyから現在Nodeで使えない `--experimental-default-type=module` フラグを削除。PR exact-head `d4f24f976dd43d54b541b16123ed81dde3ad0bd7` の [Verify #45070110113](https://github.com/kinoko34077/memory-game/actions/runs/45070110113) はSUCCESS（23/23テスト）、独立Formal Reviewはnative COMMENTED・阻害P0〜P2なし。mainの4対象ファイルは統合後に実再取得して確認。
- **検証境界:** PR上のVerify成功はsource main統合後のCIと同義ではない。mainのpush後ワークフロー結果はこの時点で未独立確認。実ブラウザ／外部公開を検証済みとはしない。
- **P2受入当時の別件:** JSON.parse／fetch例外のP3、保存/自動保存/開始の追試、Node下限の明示、random-sort P3は旧受入時点では未対応だった。現在のP3追補の到達範囲は上段に示す。random-sortは独立Issue #22で別差分として修正する。

Base version: `0.3.8`

Previous verification: 2026-10-03 — Issue #15 / PR #16 duplicate-first-card input repair verified at exact head `3a5f194c3da93e79d158617f7aa8a736a250b8a0`; Verify `37109568875` succeeded

## Implemented

- Repository-local KiNoTch Base v0.3.8 and Project Overlay
- `web-app` Surface declaration
- Existing static HTML, CSS, and JavaScript game implementation retained
- Pair data can use the bundled `pair.txt` or an external `.txt` / `.csv` file
- External pair files use a strict two-column CSV-compatible parser: quoted commas and doubled quotes are preserved, LF/CRLF are accepted, and malformed/ambiguous rows fail with row-level feedback without replacing the last accepted pair set
- Default/external pair loading uses generation guards so stale asynchronous loads do not overwrite the active source
- Pair-source lifecycle is visible through the Start control: pending loads are disabled as `読み込み中...`, external-file mode waits as `ファイルを選択`, and Start becomes available only after valid pair data is ready
- External pair-file read error/abort returns to a retryable file-selection state with visible feedback and clears the failed picker value for same-path retry
- One reachable settings panel provides save/import/export controls
- Primary `Show Ruby` and timer controls feed the game settings they label
- New-round setup clears transient card-revert state and active timers
- Matching the final pair enters an explicit completed round state, stops the active timer, and records visible completion in the game log
- Game cards use native `button` semantics while retaining the existing card click/match behavior, so standard keyboard activation/focus is available
- Re-activating the already-selected first card is a no-op: it remains flipped/selected, no mismatch rollback is scheduled, and distinct pair/mismatch behavior is unchanged
- Board column count is recomputed on browser resize without rebuilding the current cards or resetting match/round state
- Pair identity is assigned per selected source row rather than by concatenating card text
- Ruby-enabled pair rendering escapes imported text/body/reading content and only emits controlled `<ruby>` / `<rt>` markup
- Project-owned behavior, Ruby-rendering, and interaction-lifecycle regression verification is registered for `knt test` / `knt verify`

## Default state

- `web-app`: `OVERRIDE` — existing browser game implementation is authoritative

## Known constraints

- Game rules, browser state, presentation, and pair-data format remain Project-owned.
- External pair data is treated as text; arbitrary HTML in pair values is not an executable extension mechanism.
- The behavior suite uses Node built-ins and a minimal DOM/event harness; it verifies the maintained interaction/state boundaries but is not a full browser compatibility suite.
- Native browser focus appearance, orientation/device behavior, and perceived layout remain browser-smoke concerns beyond the deterministic Node harness.
- This repository still has no Project-owned build or deploy command.
- No PWA or framework Default is inferred from the static files alone.

## Next work

1. Preserve the existing browser game and pair-file format as the Project override.
2. Extend the regression suite only when a concrete regression or browser interaction requires coverage.
3. Treat framework/PWA/build-system changes as explicit future work rather than maintenance inference.

## Verification

- `knt doctor`
- `knt base-check`
- `knt test`
- `knt verify`
- Project command executes `project/tests/memory-game-behavior.test.mjs`, `project/tests/ruby-rendering.test.mjs`, and `project/tests/interaction-lifecycle.test.mjs` from repository root
- Issue #7 TDD evidence includes RED runs `36231140347`, `36231260486`, `36231393909`, `36231574656`, `36231820412` and final GREEN run `36231884072`
- Issue #9 / PR #12 exact reviewed head: `21f709e8278c2d1639fa7acaa677dead01ce34c3`
- Issue #9 direct repository suite: 21/21 PASS
- PR #12 Verify #65: PASS
- PR #12 exact-head Formal Review: blocking findings none
- PR #12 merged to main `fc45bc086246660a59f970c19f114514fe5381eb` at 2026-09-28T12:00:23Z
- Post-main Verify #66 / run `36419067005`: SUCCESS on `fc45bc086246660a59f970c19f114514fe5381eb`
- Issue #15 / PR #16 exact implementation head `3a5f194c3da93e79d158617f7aa8a736a250b8a0`: full Project Verify `37109568875` SUCCESS; regression covers duplicate same-card activation, normal distinct matching, and normal distinct mismatch rollback
