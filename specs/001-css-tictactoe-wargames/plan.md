# Implementation Plan: CSS-Only Tic-Tac-Toe vs. WOPR

**Branch**: `001-css-tictactoe-wargames` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-css-tictactoe-wargames/spec.md`

## Summary

A 100% HTML/CSS, zero-JavaScript tic-tac-toe game where the AI opponent is a deterministic finite state machine encoded entirely in markup: one radio input per game-tree node, with CSS `:has()` selectors driving state transitions, board rendering, and the WarGames/WOPR terminal aesthetic. The AI plays perfectly (never loses), so the best human outcome is a draw — "the only winning move is not to play." The HTML is emitted by a dev-time Node.js generator that enumerates the game tree with a minimax AI; the delivered artifact is a single static `index.html` with no JavaScript.

## Technical Context

**Language/Version**: HTML5 + modern CSS (no JavaScript in deliverable); Node.js v26 for dev-time generator only

**Primary Dependencies**: None at runtime. Dev-time: Node.js (no npm packages)

**Storage**: N/A — game state lives entirely in checked radio inputs

**Testing**: Generator self-test (exhaustive tree invariant checks) + Playwright browser walkthrough of game-tree paths

**Target Platform**: Modern browsers: Chrome/Edge 105+, Safari 15.4+, Firefox 121+ (`:has()` support verified via MDN BCD)

**Project Type**: Single-file static web page

**Performance Goals**: Instant state transitions; page load < 1s locally

**Constraints**: No JS in delivered file; single self-contained `index.html`; offline-capable; no external fonts/resources

**Scale/Scope**: ~1,300–2,300 game-tree nodes; generated file target < 1 MB

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

PASS — `.specify/memory/constitution.md` is the unfilled Specify template (all placeholders), so no principles are enforceable. No violations; Complexity Tracking not needed. Re-checked post-design: still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-css-tictactoe-wargames/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contract.md   # DOM/CSS contract between generator and styles
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
generator/
└── generate.mjs         # Dev-time generator: game tree + minimax AI -> index.html

index.html               # Generated deliverable (committed), 100% HTML/CSS
```

**Structure Decision**: Single-project layout. The deliverable is one generated `index.html` at repo root; the only tooling is `generator/generate.mjs` (dependency-free Node ESM script).

## Architecture

- **State machine encoding**: one `<input type="radio" name="g">` per reachable game-tree node. Human moves only — AI replies are baked into each child state's board. Root node checked by default.
- **Transitions**: each legal human move in state S is a `<label for="childId">` inside S's panel; checking the child radio unchecks S (same radio group) and CSS swaps panels.
- **Panel visibility trick**: each state panel `<section>` immediately follows its radio input, so one rule handles all states: `input[name=g]:checked + .st { display:block }`.
- **Board rendering**: single shared 3x3 grid; cell marks driven by grouped relational selectors, e.g. `body:has(:is(#s12,#s47):checked) .cell:nth-child(5)::after { content:"X" }`. The newest AI O-mark of each state is instead rendered inside that state's panel with a delayed blink-in animation ("WOPR thinking").
- **AI policy**: depth-weighted minimax computed at generation time (win fast, lose never); tie-break center > corner > edge. Terminal nodes show end screens; human-win leaves are unreachable.
- **Restart**: game wrapped in `<form>`; `<button type="reset">` in terminal panels restores initial state without JS or page reload.
- **Anti-cheat**: inactive panels are `display:none`, so their labels can't be clicked; radios are hidden inputs reachable only via visible labels.
- **WarGames theming**: CRT green-phosphor monospace, scanlines (`repeating-linear-gradient`), vignette, flicker/glow keyframes, boot/intro typing sequence (`steps()` animations): LOGON -> "GREETINGS PROFESSOR FALKEN" -> "SHALL WE PLAY A GAME?"; AI mark blinks in with ~0.8s delay; end-game quotes ("A STRANGE GAME. THE ONLY WINNING MOVE IS NOT TO PLAY.").

## Complexity Tracking

> Not needed — no constitution violations.
