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

### State Machine

Every reachable game position is a hidden radio input:

```html
<input type="radio" name="g" id="s42" class="b17">
```

Only one radio is checked at a time (the root `s0` is checked by default). Each radio is immediately followed by its visible panel:

```css
input[name="g"]:checked + .st { display: block }
```

### Making a Move

Inside each panel, clickable labels sit over empty cells and point to the next state:

```html
<label class="mv p3" for="s99"></label>  <!-- click cell 3 → go to state s99 -->
```

Clicking checks radio `s99`, hiding the current panel and revealing `s99`'s panel — where the AI's reply mark is already baked into the board. No JavaScript runs; the browser's native radio-group behavior handles the transition.

### Rendering Marks

Marks (X and O) on the shared 3×3 grid are driven by CSS `:has()` selectors. Each radio input carries a board-fingerprint class (`.b0`, `.b1`, …) that identifies its board configuration. Grouped rules like:

```css
body:has(:is(.b1,.b2,.b3,...):checked) .cell:nth-child(1)::after { content: "X"; color: var(--x) }
```

tell the browser: "when any state with X in cell 1 is checked, render X there." States sharing the same board share the same class, keeping the CSS compact (~13KB for 18 rules).

### AI Response Animation

The AI's most recent O-mark is rendered as a `<span class="ai-mk">` inside the panel (not via CSS rules), with a blinking fade-in animation:

```css
.ai-mk { animation: aiIn 1.1s .15s both }
```

This gives the "WOPR thinking" effect without any JavaScript timers.

### Terminal States

Win/draw panels show a message and a "PLAY AGAIN" button. The button uses `<button type="reset">` on the parent `<form>` to uncheck all radios and restore the root state — no reload needed.

### Generation

The full game tree is generated at dev-time by `generator/generate.mjs`. It enumerates all reachable states, applies minimax to pick optimal AI replies, then merges duplicate board configurations and emits a single self-contained `index.html` (~100KB, 280 states, no JavaScript).

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
├── index.html              # Generated deliverable (committed, ~100KB)
├── generator/
│   ├── generate.mjs        # Dev-time generator: game tree + minimax → index.html
│   └── paths.json          # Sample draw/lose playthrough paths
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