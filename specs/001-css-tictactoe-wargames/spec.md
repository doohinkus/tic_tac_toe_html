# Feature Specification: CSS-Only Tic-Tac-Toe vs. WOPR

**Feature Branch**: `001-css-tictactoe-wargames`
**Created**: 2026-08-24
**Status**: Draft
**Input**: User description: "100% HTML / CSS NO JAVASCRIPT Tic Tac Toe Game that uses a statemachine to mimic an ai player. The game should feel like playing against the AI in War Games."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play Tic-Tac-Toe Against an AI Opponent (Priority: P1)

A player opens the game in a browser and plays tic-tac-toe against an AI opponent (WOPR). The player is X and moves first. After each player move, the AI responds automatically with its own move. The game detects wins, losses, and draws and announces the outcome. The player can start a new game after the current one ends. No JavaScript executes anywhere in the delivered game.

**Why this priority**: This is the entire product. Without the playable game loop there is nothing.

**Independent Test**: Open the page, make moves by clicking cells, observe the AI replying after every move, play to any terminal outcome, restart.

**Acceptance Scenarios**:

1. **Given** a fresh game, **When** the player clicks an empty cell, **Then** the player's X appears in that cell and the AI's O appears in an empty cell.
2. **Given** any board state, **When** the player completes three X's in a row, **Then** the game announces the player won (unreachable against perfect play, but handled).
3. **Given** any board state, **When** the AI completes three O's in a row, **Then** the game announces WOPR wins and stops offering moves.
4. **Given** a full board with no three-in-a-row, **When** the last move is made, **Then** the game announces a draw.
5. **Given** a finished game, **When** the player activates the restart control, **Then** the board returns to the fresh-game state.
6. **Given** a finished or in-progress game, **When** the player clicks an occupied cell or a cell not offered, **Then** nothing changes.

### User Story 2 - AI Plays Perfectly, Like a Machine (Priority: P1)

The AI never loses. It wins whenever the player makes a mistake and otherwise forces a draw. Its responses feel deliberate — a brief "thinking" pause before its mark appears — evoking WOPR from WarGames.

**Why this priority**: The state-machine AI is the defining requirement; "the only winning move is not to play" is the thematic core.

**Independent Test**: Play any losing line (e.g., give the AI two threats) and confirm it wins; play optimally and confirm the best achievable result is a draw.

**Acceptance Scenarios**:

1. **Given** the AI can win in one move, **When** it responds, **Then** it takes the winning cell.
2. **Given** the player threatens three-in-a-row, **When** the AI responds and cannot win immediately, **Then** it blocks.
3. **Given** perfect play by the player, **When** the game ends, **Then** the result is a draw.

### User Story 3 - WarGames Atmosphere (Priority: P2)

The page looks and feels like a WarGames terminal: CRT phosphor-green monospace text, scanlines, glow/flicker, a boot/intro sequence ("GREETINGS PROFESSOR FALKEN" / "SHALL WE PLAY A GAME?"), and end-of-game quotes such as "A STRANGE GAME. THE ONLY WINNING MOVE IS NOT TO PLAY."

**Why this priority**: Essential to the requested experience but decorative relative to the game loop.

**Independent Test**: Load the page and observe the intro sequence, CRT styling, and themed end-game messages.

**Acceptance Scenarios**:

1. **Given** a fresh page load, **When** the page loads, **Then** an intro sequence plays and then the board becomes ready.
2. **Given** a draw, **When** the outcome is shown, **Then** the "strange game" quote is displayed.

### Edge Cases

- Player clicks rapidly during the AI "thinking" delay: only the chosen move applies; no double moves.
- Player uses browser back/forward or reloads: the game resets to a fresh state (no persistence required).
- Player restarts mid-game is not offered; restart is only available once the game ends.
- Reduced-motion preference: animations should degrade gracefully (media query).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The delivered game MUST be a single HTML file containing only HTML and CSS — zero JavaScript, zero external resources.
- **FR-002**: The game MUST implement tic-tac-toe rules: 3x3 board, player X first, alternating turns, win = three identical marks in a row/column/diagonal, draw = full board without a win.
- **FR-003**: The AI opponent MUST be encoded as a deterministic state machine over game states; every legal player move MUST transition to a state in which the AI's reply is already applied.
- **FR-004**: The AI MUST play perfectly: it never loses; it wins when possible; it draws otherwise.
- **FR-005**: The game MUST prevent interaction with cells that are occupied or not part of the current state.
- **FR-006**: The game MUST show a clear outcome (player win / AI win / draw) and a restart control at game end.
- **FR-007**: The page MUST present a WarGames/WOPR theme: terminal typography, CRT effects, intro sequence, themed status and outcome messages.
- **FR-008**: Restart MUST return the game to the initial state without reloading the page.
- **FR-009**: The AI's reply MUST be presented with a short visible delay ("thinking") after the player's move.
- **FR-010**: The game MUST be playable with mouse/touch; cells must be large click targets; the page MUST work offline.

### Key Entities

- **Game State**: a reachable board configuration at which the player is to move (or a terminal outcome), identified by a unique id; attributes: board occupancy, legal player moves, AI reply embedded in child states, terminal type.
- **Move**: a labeled transition from one game state to another via a player-chosen cell.
- **Outcome**: terminal classification — AI win, draw, or (unreachable) player win — with its themed message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of game-tree paths end in AI-win or draw; 0 paths end in player-win (verified by exhaustive generator self-test).
- **SC-002**: The delivered file contains zero `<script>` elements and zero external requests (verified by inspection and network panel).
- **SC-003**: A scripted playthrough of a drawing line ends in the draw outcome, and a scripted playthrough of a losing line ends in the AI-win outcome.
- **SC-004**: The page loads and is playable in Chrome, Safari, and Firefox current versions (all support `:has()`).
- **SC-005**: Restart returns to the fresh state in one interaction.

## Assumptions

- The player is X and always moves first.
- Modern browser baseline: any browser supporting CSS `:has()` (Chrome/Edge 105+, Safari 15.4+, Firefox 121+).
- A dev-time generator script (Node.js) may be used to produce the HTML file; the delivered artifact itself contains no JavaScript and no build step.
- No score persistence across restarts or page loads.
- Single-player only; no hot-seat mode.
