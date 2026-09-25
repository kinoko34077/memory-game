# Project Specification

Status: active — static browser game with Project-owned behavior verification

## Purpose

`memory-game` is a static browser memory game. The existing game rules, pair-data
format, state, presentation, and browser interaction remain the Project's
implementation.

## Acceptance

1. Existing game rules and pair-matching model remain Project-owned.
2. Bundled pair data and external `.txt` / `.csv` pair imports remain operable.
3. Existing primary controls and settings import/export are reachable and affect the game state they label.
4. Starting a new round does not inherit transient card/timer state from the previous round.
5. External pair values are treated as text; Ruby-enabled rendering may emit only the controlled `<ruby>` / `<rt>` markup required by the existing Ruby notation.
6. `knt test` and `knt verify` run the Project-owned behavior and rendering regression suites.
7. `knt doctor` validates the local Project Overlay and Base.
8. `knt base-check` detects changes to common Base files.
9. No Domain file is moved merely to satisfy the Base structure.

## Ownership boundary

- Game rules, pair loading, browser state, UI, and release behavior remain in the existing repository root.
- Ruby notation and its safe rendering remain Project-owned browser behavior.
- Project-owned regression checks live under `project/tests/`.
- KiNoTch Base files and repository operations live under `.kinotch/`.
- The Project Manifest, contracts, and adoption state live under `project/`.
- No generated Surface or Tool helper is added without a concrete Project need.

## Commands

- `knt test` -> Node built-in tests for `project/tests/memory-game-behavior.test.mjs` and `project/tests/ruby-rendering.test.mjs`
- `knt verify` -> the same Project-owned regression suites
- no Project-owned setup, build, or deploy command is registered

The suites use Node built-ins only; they do not add a package manager or browser-test dependency.

## Constraints

The Base does not impose a framework, PWA structure, data model, or browser
storage format on this Project. Existing implementation boundaries remain
authoritative. External pair text is not an HTML extension surface. The Node
behavior harness covers maintained DOM/event/state/rendering paths but does not
replace interactive browser compatibility testing when such testing is specifically required.
