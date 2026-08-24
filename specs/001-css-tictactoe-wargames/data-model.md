# Phase 1 Data Model: CSS-Only Tic-Tac-Toe vs. WOPR

Entities exist at two layers: the **generator domain model** (Node, in-memory) and its **DOM projection** (the emitted HTML/CSS contract).

## Generator Domain Model

### GameState

A node in the game tree — a board configuration at which it is the human's turn to move, or a terminal outcome.

| Field | Type | Description / Validation |
|---|---|---|
| `id` | string | Unique node id `s{N}` (sequential). Becomes the radio input id. |
| `board` | int[9] | Cell occupancy: `0` empty, `1` human (X), `2` AI (O). Invariant: `count(O) == count(X)` (human-to-move states) and never two winning lines for one side. |
| `parent` | GameState? | Predecessor node (`null` for root). |
| `lastHumanCell` | int? | Cell of the human move that led here (0–8); `null` for root. |
| `lastAiCell` | int? | Cell of the AI reply baked into this state (0–8); `null` for root and terminals reached by draw exhaustion. |
| `terminal` | enum? | `null` (in progress) \| `AI_WIN` \| `DRAW` \| `HUMAN_WIN` (unreachable from root; kept for totality). |
| `moves` | Move[] | Legal human moves; empty when `terminal != null`. |

### Move

A labeled edge from a state to its child state.

| Field | Type | Description / Validation |
|---|---|---|
| `cell` | int | Human-chosen cell (0–8); must be empty in parent board. |
| `from` | GameState | Source state. |
| `to` | GameState | Destination state (AI reply already applied to its board). |

### AI Policy (minimax)

- Score from AI perspective: win = `10 - depth`, loss = `depth - 10`, draw = `0`.
- Chosen move = max score; deterministic tie-break order: `4`, then `0,2,6,8`, then `1,3,5,7`.
- Invariants: policy never selects an occupied cell; under the policy, no reachable state has `terminal == HUMAN_WIN`.

## State Transitions

```text
ROOT (empty board, human to move)
  │  human clicks cell c (label -> child radio)
  ▼
apply human move c
  ├─ human completes 3-in-a-row ──> HUMAN_WIN terminal (unreachable under AI policy)
  └─ otherwise AI policy selects reply r
       ├─ AI completes 3-in-a-row ──> AI_WIN terminal
       ├─ board full ────────────────> DRAW terminal
       └─ otherwise ─────────────────> next GameState (human to move)
```

Terminal states have no outgoing moves; their panels show the outcome message and a reset control.

## DOM Projection

| Domain concept | DOM representation |
|---|---|
| GameState | `<input type="radio" name="g" id="s{N}">` + immediately following `<section class="st">` panel |
| Root state | Radio carries `checked` attribute |
| Move | `<label class="mv p{cell}" for="s{child}">` inside parent panel, positioned over the target cell |
| Board cell marks (stable) | Shared `.board`; grouped rules `body:has(:is(…ids):checked) .cell:nth-child({c+1})::after { content:"X"|"O" }` |
| Newest AI mark | `<span class="ai-mk …">` inside the destination panel, delayed blink-in animation |
| Terminal outcome | Panel with `.end` class, outcome text, `<button type="reset">` |
| Restart | Form reset returns all radios to unchecked; root radio's `checked` attribute restores initial state |

## Validation Rules (generator self-test)

1. Every non-terminal state has exactly `emptyCells(board)` moves.
2. Every move target board equals parent board + human mark + AI reply mark (or terminal).
3. Zero reachable `HUMAN_WIN` terminals from root.
4. All terminal leaves are `AI_WIN` or `DRAW`.
5. Every radio id referenced by a label exists exactly once.
