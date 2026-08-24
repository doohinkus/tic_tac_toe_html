# Tasks: CSS-Only Tic-Tac-Toe vs. WOPR

**Input**: Design documents from `/specs/001-css-tictactoe-wargames/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create feature branch `001-css-tictactoe-wargames`
- [X] T002 Create spec artifacts (spec.md, plan.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md) in `specs/001-css-tictactoe-wargames/`
- [X] T003 Create `.gitignore` (Node + universal patterns) at repo root
- [X] T004 Update `AGENTS.md` SPECKIT block to reference `specs/001-css-tictactoe-wargames/plan.md`

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T005 Create `generator/generate.mjs` skeleton: CLI flags (`--selftest`, `--paths`), board utilities (win detection, empty cells), minimax AI policy with deterministic tie-break per data-model.md

## Phase 3: Core Generator (game tree -> HTML)

- [X] T006 Implement game-tree enumeration in `generator/generate.mjs`: ROOT expansion, human move application, AI reply baking, terminal classification (AI_WIN / DRAW / unreachable HUMAN_WIN) per data-model.md state transitions
- [X] T007 Implement exhaustive self-test in `generator/generate.mjs`: invariants 1–5 from data-model.md (move counts, board deltas, zero reachable HUMAN_WIN, label/id integrity)
- [X] T008 Implement HTML emission in `generator/generate.mjs`: interleaved radios + `.st` panels, `.mv p{cell}` labels, `.ai-mk` spans, terminal panels with reset button, shared `.board`, intro overlay per contracts/ui-contract.md
- [X] T009 Implement CSS emission in `generator/generate.mjs`: panel visibility rule, grouped `:has()` board-mark selectors (excluding each state's newest AI mark), position classes p0–p8, CRT theme, intro keyframes, AI thinking delay, reduced-motion handling per contracts/ui-contract.md
- [X] T010 Generate `index.html` at repo root via `node generator/generate.mjs` and confirm self-test passes + file size within budget (< 1 MB)

## Phase 4: Integration (Browser Verification)

- [X] T011 Playwright: load `index.html`, verify intro plays and board becomes interactive, verify zero network requests and zero `<script>` elements
- [X] T012 Playwright: play the generator-provided drawing line; verify DRAW outcome with "A STRANGE GAME" quote
- [X] T013 Playwright: play the generator-provided losing line; verify AI_WIN outcome
- [X] T014 Playwright: verify reset returns to fresh state; verify occupied/non-offered cells are not clickable

## Phase 5: Polish & Validation

- [X] T015 Verify theming/animations (scanlines, glow, flicker, thinking delay) and fix visual issues in `generator/generate.mjs`
- [X] T016 Re-run `node generator/generate.mjs --selftest` and quickstart checklist; confirm all tasks complete

## Dependencies & Execution Rules

- T003, T004 may run in parallel [P]
- T005 blocks T006–T009; T006 blocks T007–T009; T008/T009 may run in parallel [P] (same file — implement sequentially to avoid conflicts)
- T010 blocks all Phase 4 tasks
- T011–T014 may run in parallel [P] (independent browser checks on the same static file)
- Phase 5 runs after Phase 4 passes
