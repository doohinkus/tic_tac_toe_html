# WOPR // TIC-TAC-TOE

**A 100% HTML/CSS, zero-JavaScript tic-tac-toe game where the AI opponent is a deterministic finite state machine encoded entirely in markup — styled like the WOPR terminal from *WarGames*.**

> *"A strange game. The only winning move is not to play."*

---

## Features

- **Zero JavaScript** — Single self-contained `index.html`, no scripts, no external resources
- **Perfect AI opponent** — Never loses; wins when you slip up; forces a draw otherwise
- **CSS state machine** — Game logic encoded via radio inputs + CSS `:has()` selectors
- **WarGames aesthetic** — CRT phosphor-green, scanlines, flicker, boot sequence, themed quotes
- **Offline-capable** — Works completely offline, no network requests
- **Instant restarts** — `<form reset>` returns to fresh state without reload

---

## Play

```bash
open index.html
```

Or double-click `index.html` in your file manager. Requires a modern browser with CSS `:has()` support.

---

## How It Works

Each reachable game state is a hidden `<input type="radio" name="g">`. The currently checked radio determines which panel (`<section class="st">`) is visible via:

```css
input[name="g"]:checked + .st { display: block }
```

Player moves are `<label for="nextStateId">` elements over empty cells. Clicking a label checks its radio, hiding the current panel and revealing the next — where the AI's reply is already baked into the board.

The AI's "thinking" delay is a pure-CSS animation on its mark:

```css
.ai-mk { animation: aiIn 1.1s .15s both }
```

The full game tree (~1,300–2,300 nodes) with depth-weighted minimax AI is generated at dev-time by `generator/generate.mjs`.

---

## Browser Support

| Browser | Minimum Version | `:has()` Support |
|---------|----------------|------------------|
| Chrome / Edge | 105+ | ✅ |
| Safari | 15.4+ | ✅ |
| Firefox | 121+ | ✅ |

> **Note:** Reduced-motion preference (`prefers-reduced-motion: reduce`) disables animations gracefully.

---

## Development

### Regenerate `index.html`

```bash
node generator/generate.mjs
```

Outputs a fresh `index.html` at the repository root.

### Generator

- **Runtime**: Node.js (tested on v26, any recent version works)
- **Dependencies**: None (stdlib only)
- **Output**: Single static `index.html` — no build step, no bundler

### Project Structure

```
.
├── index.html              # Generated deliverable (committed)
├── generator/
│   ├── generate.mjs        # Dev-time generator: game tree + minimax → index.html
│   └── paths.json          # Generator-internal state IDs
└── specs/
    └── 001-css-tictactoe-wargames/
        ├── spec.md         # Feature specification
        ├── plan.md         # Implementation plan
        ├── data-model.md   # Game state / move / outcome models
        ├── contracts/
        │   └── ui-contract.md  # DOM/CSS contract
        ├── quickstart.md   # Quickstart guide
        ├── research.md     # Phase 0 research
        └── tasks.md        # Implementation tasks
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Inspired by WOPR from **WarGames** (1983). "SHALL WE PLAY A GAME?"*