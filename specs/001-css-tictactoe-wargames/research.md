# Phase 0 Research: CSS-Only Tic-Tac-Toe vs. WOPR

## R1: How to encode a state machine in pure HTML/CSS

- **Decision**: One radio input per game-tree node, all sharing `name="g"`; each node's UI panel is a `<section>` placed immediately after its radio; one CSS rule (`input[name=g]:checked + .st{display:block}`) reveals the active state. Move choices are `<label for="childId">` elements inside the active panel.
- **Rationale**: Checking a radio in a group unchecks the previous one — a hardware-free state register. Labels can toggle radios by `for`/`id` without JS. Sibling-adjacent panel placement avoids one visibility rule per state (~1,800 rules saved).
- **Alternatives considered**:
  - Checkbox-per-cell history encoding: CSS cannot set check state programmatically, so AI moves can't be "applied"; rejected.
  - One radio group per ply with `~` sibling selectors: works but needs per-state wiring rules and larger selector graphs; rejected.
  - `:target`/hash navigation: pollutes history, back button breaks the game; rejected.

## R2: Browser support for `:has()`

- **Decision**: Use `:has()` for board-mark rendering and body-level state queries. Baseline: Chrome/Edge 105+, Safari 15.4+, Firefox 121+.
- **Rationale**: MDN BCD confirms stable, unflagged support across all evergreen browsers since Dec 2023 (verified 2026-08). Grouped `:has(:is(#ids):checked)` selectors keep the shared-board rendering to ~18 rules instead of ~1,800 x 9.
- **Alternatives considered**: Pure sibling-combinator wiring (universally compatible but far more/longer rules); rejected for size and maintainability given the modern-browser baseline in the spec.

## R3: AI strategy without runtime computation

- **Decision**: Precompute a perfect policy at generation time with depth-weighted minimax (win = 10 - depth, loss = depth - 10, draw = 0); deterministic tie-break center(4) > corners(0,2,6,8) > edges(1,3,5,7). Bake each AI reply into the child state's board.
- **Rationale**: Tic-tac-toe is solved; the full game tree is small (< 2,300 nodes with human-only branching). A deterministic policy makes the state machine a pure function of history — exactly what CSS radio wiring requires.
- **Alternatives considered**: Hand-authored heuristic tables (error-prone, hard to prove "never loses"); symmetry-reduced state graphs (complicates wiring for little gain at this scale); both rejected.

## R4: Game-tree size and file size budget

- **Decision**: Enumerate the full tree without transposition merging (each path = unique node). Upper bound 1 + 9 + 63 + 315 + 945 + 945 = 2,278 nodes; early termination (AI wins/draws) reduces this. Target < 1 MB HTML.
- **Rationale**: Merging transpositions would force multiple radios per logical state and explode selector lists; the tree form keeps wiring 1:1. Compact markup (interleaved radios/panels, short ids `s0..sN`, class-based cell positioning) keeps size in budget.
- **Alternatives considered**: Deduplicated state graph; rejected (see above).

## R5: Restart without JavaScript

- **Decision**: Wrap the game in a `<form>`; terminal panels contain `<button type="reset">`.
- **Rationale**: Form reset unchecks all radios except none-checked default; the root radio uses `checked` attribute so reset returns to the initial state. No JS, no reload.
- **Alternatives considered**: Self-link reload (`<a href="?">`): works but flashes/reloads and loses the CRT boot feel; rejected as primary mechanism.

## R6: Simulating AI "thinking" delay

- **Decision**: The newest AI O-mark is rendered inside the destination state's panel (not via the shared-board selectors) with a CSS animation: ~0.7s delay, blink, then solidify (`animation-fill-mode: both`). Status text cross-fades "ANALYZING..." -> "YOUR MOVE" on the same schedule.
- **Rationale**: Pure CSS, per-transition delay without timers. Labels for the next human move appear immediately but the visual pacing reads as WOPR deliberation.
- **Alternatives considered**: Delaying panel visibility itself (disorients, hides the player's own mark); rejected.

## R7: Preventing illegal interaction (anti-cheat)

- **Decision**: Inactive panels `display:none` (labels inside are unclickable); radios are visually hidden inputs; only labels in the active panel are reachable. Same-group radios make "changing a move" within a state harmless (it just selects a different child).
- **Rationale**: CSS hit-testing excludes `display:none` subtrees; no JS validation needed.
- **Alternatives considered**: `pointer-events` juggling; unnecessary.

## R8: WarGames/CRT aesthetic in pure CSS

- **Decision**: System monospace stack (offline constraint — no webfonts); phosphor green on near-black; scanline overlay via `repeating-linear-gradient`; vignette via `radial-gradient`; subtle flicker via opacity keyframes; glow via `text-shadow`; intro sequence via staggered `animation-delay` + `steps()` typing; intro overlay ends with `visibility:hidden` + `pointer-events:none` (forwards fill).
- **Rationale**: All effects are static CSS; no assets, no JS, works offline.
- **Alternatives considered**: Webfont (VT323) — violates offline/no-external-resources constraint; rejected.

## R9: Development workflow

- **Decision**: Dev-time generator `generator/generate.mjs` (Node ESM, zero npm deps) emits `index.html`; generator also runs exhaustive self-tests (invariant: zero reachable player-win terminals) and prints sample draw/loss playthrough paths for use in Playwright verification.
- **Rationale**: ~1,800 nodes are impractical to hand-author; the delivered artifact remains 100% HTML/CSS per spec. User approved this approach explicitly.
- **Alternatives considered**: Hand-written HTML; rejected (user chose generator).
