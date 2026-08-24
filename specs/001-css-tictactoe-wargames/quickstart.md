# Quickstart: CSS-Only Tic-Tac-Toe vs. WOPR

## Play the game

1. Open `index.html` in a modern browser (Chrome/Edge 105+, Safari 15.4+, Firefox 121+).
2. Wait for the WOPR boot/intro sequence to finish.
3. You are **X** and move first. Click any empty cell.
4. WOPR replies automatically (its O blinks in after a short "thinking" delay).
5. Play continues until WOPR wins, you draw, or (impossible against perfect play) you win.
6. At game end, press the on-screen reset control to start a new game.

## Regenerate the artifact

Requires Node.js (no npm packages).

```sh
node generator/generate.mjs
```

This rewrites `index.html` and prints build stats plus self-test results.

## Verify the AI never loses (exhaustive self-test)

```sh
node generator/generate.mjs --selftest
```

Expected: `HUMAN_WIN terminals reachable: 0` and all leaves are `AI_WIN` or `DRAW`.

## Get a sample playthrough path

```sh
node generator/generate.mjs --paths
```

Prints one drawing line and one losing line as cell sequences (0–8, row-major) for manual or scripted verification.

## Manual verification checklist

- [ ] Intro sequence plays once on load, then board is interactive.
- [ ] Clicking an empty cell places your X; WOPR's O appears ~0.7s later.
- [ ] Occupied cells and non-offered cells are not clickable.
- [ ] Drawing line ends with the "A STRANGE GAME…" quote.
- [ ] Losing line ends with WOPR win message.
- [ ] Reset returns to the fresh board in one press.
- [ ] DevTools network panel shows zero requests after load; zero `<script>` elements in source.
