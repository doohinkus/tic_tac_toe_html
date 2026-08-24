# UI Contract: Generator Output <-> CSS

The generator emits a single `index.html`. This contract defines the DOM structure and CSS hooks the styles depend on. Any change to either side must update this contract.

## Document skeleton

```text
<body>
  <form id="wopr">
    <!-- per state, interleaved: -->
    <input type="radio" name="g" id="s{N}" [checked]>
    <section class="st [end]">…panel…</section>

    <div class="screen">
      <header class="masthead">WOPR // TIC-TAC-TOE</header>
      <div class="board">
        <div class="cell"></div> × 9   <!-- nth-child 1..9 = cells 0..8 -->
      </div>
      <div class="status" aria-live="polite"></div>  <!-- decorative; per-state text lives in panels -->
    </div>

    <div class="intro">…boot sequence lines…</div>
  </form>
  <div class="crt"></div>  <!-- scanline/vignette overlay, pointer-events:none -->
</body>
```

## Rules

1. **Radio/panel adjacency**: every `<section class="st">` MUST be the immediate next sibling of its radio input. Visibility rule: `input[name="g"]:checked + .st { display:block }`. All other `.st` are `display:none`.
2. **Panel content**:
   - zero or one `<span class="ai-mk p{cell}">O</span>` (the AI reply for this state; animated with delay);
   - zero or more `<label class="mv p{cell}" for="s{child}">` (legal human moves, positioned over empty cells);
   - one `<p class="say">` status line (human-turn states: "ANALYZING/YOUR MOVE" cross-fade pair; terminals: outcome text);
   - terminal panels only: `<button type="reset" class="again">` and themed quote.
3. **Position classes**: `p0`…`p8` map to grid cells 0–8 (row = floor(n/3), col = n mod 3), used by both `.mv` labels and `.ai-mk` marks.
4. **Stable marks**: rendered on the shared board via grouped selectors; the generator MUST exclude each state's newest AI mark from those groups (it is rendered by rule 2 instead).
5. **Ids**: radio ids are `s{N}`, unique, contiguous from `s0`. Labels' `for` MUST reference an existing radio id.
6. **No scripts, no external URLs**: the document MUST contain zero `<script>` elements and zero `http(s)://`/`//` resource references.
7. **Reset safety**: all radios except `s0` MUST be unchecked in the initial markup; `s0` carries `checked`.
8. **Intro**: `.intro` overlay animates on load and MUST end with `visibility:hidden; pointer-events:none` (via `animation-fill-mode: both`) so it never blocks play.
9. **Accessibility floor**: labels are keyboard-focusable via the underlying radios (`:focus-visible` ring on the focused radio's label is rendered through `input:focus-visible + .st .mv` styling); `prefers-reduced-motion: reduce` MUST disable flicker/typing animations.
