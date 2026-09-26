# Current State

Base version: `0.3.8`

Last verified: 2026-09-26 — interaction lifecycle, state, and imported-Ruby safety maintenance

## Implemented

- Repository-local KiNoTch Base v0.3.8 and Project Overlay
- `web-app` Surface declaration
- Existing static HTML, CSS, and JavaScript game implementation retained
- Pair data can use the bundled `pair.txt` or an external `.txt` / `.csv` file
- Default/external pair loading uses generation guards so stale asynchronous loads do not overwrite the active source
- Pair-source lifecycle is visible through the Start control: pending loads are disabled as `読み込み中...`, external-file mode waits as `ファイルを選択`, and Start becomes available only after valid pair data is ready
- External pair-file read error/abort returns to a retryable file-selection state with visible feedback and clears the failed picker value for same-path retry
- One reachable settings panel provides save/import/export controls
- Primary `Show Ruby` and timer controls feed the game settings they label
- New-round setup clears transient card-revert state and active timers
- Matching the final pair enters an explicit completed round state, stops the active timer, and records visible completion in the game log
- Game cards use native `button` semantics while retaining the existing card click/match behavior, so standard keyboard activation/focus is available
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
