#!/usr/bin/env node
// Dev-time generator for the 100% HTML/CSS WarGames tic-tac-toe game.
// Enumerates the full game tree with a perfect (never-loses) minimax AI and
// emits a single self-contained index.html. The emitted file contains NO
// JavaScript: the state machine is encoded as radio inputs whose checked state
// drives visibility via simple sibling selectors (input:checked + .st). Each
// panel is self-contained (static board marks), so no :has() is needed.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, '..', 'index.html');
const PATHS_OUT = join(ROOT, 'paths.json');

const EMPTY = 0;
const X = 1; // human, moves first
const O = 2; // WOPR

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// Deterministic preference order used to break minimax ties:
// center, then corners, then edges.
const TIE_BREAK = [4, 0, 2, 6, 8, 1, 3, 5, 7];

function winner(b) {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] !== EMPTY && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return EMPTY;
}

function emptyCells(b) {
  const out = [];
  for (let i = 0; i < 9; i++) if (b[i] === EMPTY) out.push(i);
  return out;
}

function isFull(b) {
  return b.every((v) => v !== EMPTY);
}

// Minimax from WOPR's (O) perspective. Positive = good for O.
function minimax(b, player, depth) {
  const w = winner(b);
  if (w === O) return 10 - depth;
  if (w === X) return depth - 10;
  if (isFull(b)) return 0;
  const toO = player === O;
  let best = toO ? -Infinity : Infinity;
  for (const c of emptyCells(b)) {
    b[c] = player;
    const s = minimax(b, player === O ? X : O, depth + 1);
    b[c] = EMPTY;
    best = toO ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

// Best reply for WOPR (O to move). Iterates TIE_BREAK with strict >
// so equal scores keep the earlier (preferred) cell.
function bestMove(b) {
  let bestScore = -Infinity;
  let bestCell = -1;
  for (const c of TIE_BREAK) {
    if (b[c] !== EMPTY) continue;
    b[c] = O;
    const s = minimax(b, X, 1);
    b[c] = EMPTY;
    if (s > bestScore) {
      bestScore = s;
      bestCell = c;
    }
  }
  return bestCell;
}

// Human helpers used only to derive sample playthrough paths.
function humanBest(b) {
  let bestScore = Infinity;
  let bestCell = -1;
  for (const c of TIE_BREAK) {
    if (b[c] !== EMPTY) continue;
    b[c] = X;
    const s = minimax(b, O, 1);
    b[c] = EMPTY;
    if (s < bestScore) {
      bestScore = s;
      bestCell = c;
    }
  }
  return bestCell;
}

function humanWorst(b) {
  let bestScore = -Infinity;
  let bestCell = -1;
  for (const c of TIE_BREAK) {
    if (b[c] !== EMPTY) continue;
    b[c] = X;
    const s = minimax(b, O, 1);
    b[c] = EMPTY;
    if (s > bestScore) {
      bestScore = s;
      bestCell = c;
    }
  }
  return bestCell;
}

// ---------------------------------------------------------------------------
// Game tree construction
// ---------------------------------------------------------------------------

const states = [];

function newState(board, lastAiCell, terminal, parent, humanCell) {
  const s = {
    id: 's' + states.length,
    board: board.slice(),
    lastAiCell,
    terminal,
    parent,
    humanCell,
    moves: [],
  };
  states.push(s);
  return s;
}

function expand(state) {
  if (state.terminal) return;
  for (const c of emptyCells(state.board)) {
    const b = state.board.slice();
    b[c] = X;
    let terminal = null;
    let lastAi = null;
    if (winner(b) === X) {
      terminal = 'HUMAN_WIN'; // unreachable against perfect WOPR
    } else if (isFull(b)) {
      terminal = 'DRAW';
    } else {
      const ai = bestMove(b);
      b[ai] = O;
      lastAi = ai;
      if (winner(b) === O) terminal = 'AI_WIN';
    }
    const child = newState(b, lastAi, terminal, state, c);
    state.moves.push({ cell: c, to: child });
    expand(child);
  }
}

function buildTree() {
  states.length = 0;
  const root = newState(Array(9).fill(EMPTY), null, null, null, null);
  expand(root);
  mergeDuplicateStates();
  return root;
}

// Merge states with an identical board into one canonical state.
// Labels pointing to non-canonical states are rewired to the canonical one.
// (Keyed by board alone, NOT lastAiCell, so two states that differ only in
// which O was played last collapse into a single panel. This is the maximum
// dedupe that stays visually correct: a panel with board B is shared by every
// path that reaches B, and its labels always lead to B + one X.)
function mergeDuplicateStates() {
  const canonMap = new Map(); // boardKey -> canonical state
  const toRemove = new Set();

  for (const s of states) {
    const key = boardKey(s.board);
    if (canonMap.has(key)) {
      const canon = canonMap.get(key);
      toRemove.add(s.id);
      // Rewire all label targets that point to s -> canon
      for (const p of states) {
        for (const m of p.moves) {
          if (m.to.id === s.id) m.to = canon;
        }
      }
    } else {
      canonMap.set(key, s);
    }
  }

  // Rebuild states array without removed states, re-assign compact IDs
  const surviving = states.filter((s) => !toRemove.has(s.id));
  const idMap = new Map();
  for (let i = 0; i < surviving.length; i++) {
    idMap.set(surviving[i].id, 's' + i);
    surviving[i].id = 's' + i;
  }
  states.length = 0;
  for (const s of surviving) states.push(s);
}

// ---------------------------------------------------------------------------
// Self-test (invariants from data-model.md)
// ---------------------------------------------------------------------------

function selfTest() {
  const errors = [];
  let leaves = { AI_WIN: 0, DRAW: 0, HUMAN_WIN: 0 };
  const ids = new Set();

  for (const s of states) {
    ids.add(s.id);
    if (s.terminal) {
      leaves[s.terminal]++;
      if (s.moves.length !== 0) errors.push(`${s.id}: terminal has moves`);
    } else {
      const empties = emptyCells(s.board).length;
      if (s.moves.length !== empties) {
        errors.push(`${s.id}: moves ${s.moves.length} != empty ${empties}`);
      }
    }
    for (const m of s.moves) {
      // Child board must equal s.board + X at m.cell, plus exactly one new O
      // (WOPR's reply). Board-only merging makes the newest O ambiguous, so
      // verify cell-wise instead: base == parent+X; child must match base
      // everywhere except it adds exactly one O (or zero for HUMAN_WIN).
      const base = s.board.slice();
      base[m.cell] = X;
      const child = m.to.board;
      let same = true, extraO = 0;
      for (let i = 0; i < 9; i++) {
        if (base[i] === child[i]) continue;
        if (base[i] === EMPTY && child[i] === O && extraO === 0) { extraO++; continue; }
        same = false;
      }
      // WOPR adds an O reply unless the game ends on the human's own move
      // (DRAW = board full, HUMAN_WIN = X wins). Non-terminal children and
      // AI_WIN terminals all carry one extra O.
      const wantO = m.to.terminal === 'DRAW' || m.to.terminal === 'HUMAN_WIN' ? 0 : 1;
      if (!same || extraO !== wantO) {
        errors.push(`${s.id}->${m.to.id}: board delta mismatch`);
      }
    }
  }

  for (const m of states.flatMap((s) => s.moves)) {
    if (!ids.has(m.to.id)) errors.push(`dangling label target ${m.to.id}`);
  }

  if (leaves.HUMAN_WIN !== 0) {
    errors.push(`reachable HUMAN_WIN terminals: ${leaves.HUMAN_WIN}`);
  }

  return { errors, leaves, stateCount: states.length };
}

// ---------------------------------------------------------------------------
// Sample playthrough paths
// ---------------------------------------------------------------------------

function simulate(humanPick) {
  const b = Array(9).fill(EMPTY);
  const humanCells = [];
  let result = null;
  for (;;) {
    const hc = humanPick(b);
    b[hc] = X;
    humanCells.push(hc);
    if (winner(b) === X) { result = 'HUMAN_WIN'; break; }
    if (isFull(b)) { result = 'DRAW'; break; }
    const ac = bestMove(b);
    b[ac] = O;
    if (winner(b) === O) { result = 'AI_WIN'; break; }
  }
  return { humanCells, result };
}

// ---------------------------------------------------------------------------
// HTML / CSS emission
// ---------------------------------------------------------------------------

const CELL = 100 / 3;

function posClass(c) {
  const row = Math.floor(c / 3);
  const col = c % 3;
  return `.p${c}{top:${(row * CELL).toFixed(4)}%;left:${(col * CELL).toFixed(4)}%}`;
}

function boardKey(board) {
  return board.join(',');
}

// Render a board's fixed marks as sibling elements flagged with a helper class
// (e.g. "///X///" for an X at index 1): 00000XOO0 style. Each char maps to a cell
// - no ::after/:has() needed. No board-class fingerprinting required.
function markCells(board, lastAi) {
  const out = [];
  for (let c = 0; c < 9; c++) {
    const v = board[c];
    if (v === EMPTY) continue;
    if (c === lastAi) continue; // newest O is rendered separately with blink (.ai-mk)
    out.push(`<i class="${v === X ? 'x' : 'o'} p${c}">${v === X ? 'X' : 'O'}</i>`);
  }
  return out.join('');
}

function panelFor(s) {
  const p = [];
  // Static per-panel board: grid is drawn as a CSS background on .grid, so the
  // panel only carries its fixed marks and the click overlays. Zero :has() /
  // board-class selectors - visibility is just input:checked+.st.
  p.push(`<section class="st${s.terminal ? ' end' : ''}" id="p-${s.id}"><div class="grid">`);
  p.push(markCells(s.board, s.lastAiCell));
  if (s.lastAiCell != null) p.push(`<i class="ai-mk p${s.lastAiCell}">O</i>`);
  for (const m of s.moves) p.push(`<label class="mv p${m.cell}" for="${m.to.id}"></label>`);
  p.push('</div>');
  if (s.terminal === 'AI_WIN') {
    p.push('<p class="say tw"><span class="tw1"></span><br><span class="tw2"></span></p><button type="reset" class="again"></button>');
  } else if (s.terminal === 'DRAW') {
    p.push('<p class="say td"><span class="td1"></span><br><span class="td2"></span></p><button type="reset" class="again"></button>');
  } else if (s.terminal === 'HUMAN_WIN') {
    p.push('<p class="say th"><span class="th1"></span><br><span class="th2"></span></p><button type="reset" class="again"></button>');
  } else if (s.parent == null) {
    p.push('<p class="say">YOU ARE X. MAKE YOUR MOVE.</p>');
  } else {
    p.push('<p class="say"><span class="an">WOPR ANALYZING\u2026</span><span class="ym">YOUR MOVE.</span></p>');
  }
  p.push('</section>');
  return p.join('');
}

function buildBody() {
  const parts = [];
  for (const s of states) {
    const checked = s.parent == null ? ' checked' : '';
    parts.push(`<input type="radio" name="g" id="${s.id}"${checked}>${panelFor(s)}`);
  }
  return parts.join('');
}

const INTRO_LINES = [
  'LOGON: FALKEN, DAVID',
  'PASSWORD: JOSHUA',
  'ACCESS GRANTED',
  'GREETINGS PROFESSOR FALKEN',
  'SHALL WE PLAY A GAME?',
];

function buildIntro() {
  const rate = 0.02; // seconds per char
  const gap = 0.15;
  let t = 0.2;
  const spans = [];
  let totalEnd = 0;
  for (const line of INTRO_LINES) {
    const dur = line.length * rate;
    spans.push(
      `<span class="ln" style="--w:${line.length}ch;animation:type ${dur.toFixed(2)}s steps(${line.length}) ${t.toFixed(2)}s forwards">${line}</span>`
    );
    t += dur + gap;
    totalEnd = t;
  }
  return { html: `<div class="intro">${spans.join('')}</div>`, hideAt: (totalEnd + 1.2).toFixed(2) };
}

function buildCss(introHideAt) {
  const posRules = [];
  for (let c = 0; c < 9; c++) posRules.push(posClass(c));
  return `:root{--phos:#39ff6e;--x:#39ff6e;--o:#b8ffd9;--bg:#030805;--dim:rgba(57,255,110,.35);--bw:clamp(220px,min(80vw,calc(95vh*320/620)),320px);--pad:calc(var(--bw)*30/320);--top:calc(var(--bw)*90/320);--t:calc(var(--bw)/3);--tt:calc(var(--bw)*2/3);--gap:calc(var(--bw)*6/320)}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{background:var(--bg);color:var(--phos);font-family:"Courier New",ui-monospace,monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:clamp(8px,2vw,16px)}
#wopr{position:relative;width:calc(var(--bw)*380/320);height:calc(var(--bw)*620/320)}
input[name="g"]{position:absolute;opacity:0;pointer-events:none}
.masthead{position:absolute;top:0;left:0;right:0;text-align:center;letter-spacing:.2em;font-size:clamp(12px,3.5vw,14px);text-shadow:0 0 8px var(--dim)}
.masthead small{display:block;font-size:clamp(8px,2.5vw,10px);opacity:.6;letter-spacing:.35em;margin-top:4px}
.st{position:absolute;top:var(--top);left:var(--pad);width:var(--bw);height:calc(var(--bw)*430/320);display:none}
input[name="g"]:checked+.st{display:block}
.grid{position:absolute;top:0;left:0;width:var(--bw);height:var(--bw);border:1px solid var(--dim);border-radius:8px;background:
linear-gradient(90deg,transparent 0 calc(var(--t) - 1px),var(--dim) calc(var(--t) - 1px) calc(var(--t) + 1px),transparent calc(var(--t) + 1px) calc(var(--tt) - 1px),var(--dim) calc(var(--tt) - 1px) calc(var(--tt) + 1px),transparent calc(var(--tt) + 1px) 100%),
linear-gradient(0deg,transparent 0 calc(var(--t) - 1px),var(--dim) calc(var(--t) - 1px) calc(var(--t) + 1px),transparent calc(var(--t) + 1px) calc(var(--tt) - 1px),var(--dim) calc(var(--tt) - 1px) calc(var(--tt) + 1px),transparent calc(var(--tt) + 1px) 100%),
rgba(57,255,110,.04)}
.x,.o{position:absolute;width:${CELL.toFixed(4)}%;height:${CELL.toFixed(4)}%;display:flex;align-items:center;justify-content:center;font-size:clamp(38px,15vw,60px);font-weight:700;text-shadow:0 0 12px currentColor;z-index:2}
.x{color:var(--x)}.o{color:var(--o)}
.mv{position:absolute;width:${CELL.toFixed(4)}%;height:${CELL.toFixed(4)}%;cursor:pointer;display:block;z-index:3}
.mv:hover::after{content:"X";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(38px,15vw,60px);font-weight:700;color:var(--x);opacity:.28;text-shadow:0 0 12px currentColor}
.ai-mk{position:absolute;width:${CELL.toFixed(4)}%;height:${CELL.toFixed(4)}%;display:flex;align-items:center;justify-content:center;font-size:clamp(38px,15vw,60px);font-weight:700;color:var(--o);text-shadow:0 0 12px currentColor;opacity:0;animation:aiIn .45s .05s both;z-index:2}
@keyframes aiIn{0%,40%{opacity:0}55%{opacity:1}68%{opacity:.15}82%,100%{opacity:1}}
.say{position:absolute;top:calc(var(--bw)*336/320);left:0;width:var(--bw);text-align:center;font-size:clamp(12px,3.5vw,14px);line-height:1.5;letter-spacing:.08em;margin:0;min-height:calc(var(--bw)*44/320)}
.say .an{display:block;animation:fadeOut .25s .35s both}
.say .ym{display:block;opacity:0;animation:fadeIn .25s .45s both;margin-top:-42px}
@keyframes fadeOut{to{opacity:0}}@keyframes fadeIn{to{opacity:1}}
.end .say{font-size:clamp(13px,3.8vw,15px)}
.tw1::before{content:"WOPR WINS."}.tw2::before{content:"BETTER LUCK NEXT TIME, PROFESSOR."}
.td1::before{content:"DRAW."}.td2::before{content:"A STRANGE GAME. THE ONLY WINNING MOVE IS NOT TO PLAY."}
.th1::before{content:"YOU WIN."}.th2::before{content:"THAT SHOULD NOT BE POSSIBLE."}
.again{position:absolute;top:calc(var(--bw)*420/320);left:50%;transform:translateX(-50%);background:transparent;color:var(--phos);border:1px solid var(--phos);padding:calc(var(--bw)*8/320) calc(var(--bw)*18/320);font-family:inherit;font-size:clamp(11px,3.2vw,13px);letter-spacing:.2em;cursor:pointer;text-shadow:0 0 8px var(--dim)}
.again::after{content:"PLAY AGAIN"}.again:hover{background:rgba(57,255,110,.12)}
.intro{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 calc(var(--bw)*40/320);z-index:40;pointer-events:none;background:var(--bg);animation:introHide .2s ${introHideAt}s both}
.intro .ln{display:block;overflow:hidden;white-space:nowrap;width:0;font-size:clamp(12px,4vw,16px);letter-spacing:.1em;margin:6px 0;text-shadow:0 0 8px var(--dim)}
@keyframes type{to{width:var(--w)}}@keyframes introHide{to{opacity:0;visibility:hidden}}
.crt{position:fixed;inset:0;pointer-events:none;z-index:60;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px)}
.crt::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.5) 100%)}
@keyframes flick{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.86}94%{opacity:1}}
#wopr{animation:flick 5s infinite}
@media(prefers-reduced-motion:reduce){#wopr,.ai-mk,.intro,.say .an,.say .ym,.intro .ln{animation:none!important}.intro{opacity:0;visibility:hidden}.ai-mk{opacity:1}.say .ym{opacity:1;margin-top:0}.say .an{display:none}}
${posRules.join('')}`.trim();
}

function buildHtml() {
  const intro = buildIntro();
  const css = buildCss(intro.hideAt);
  const body = buildBody();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>WOPR // TIC-TAC-TOE</title><style>${css}</style></head><body><form id="wopr"><div class="masthead">W O P R<small>GLOBAL THERMONUCLEAR WAR &mdash; TIC-TAC-TOE</small></div>${body}${intro.html}</form><div class="crt"></div></body></html>`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

buildTree();
const { errors, leaves, stateCount } = selfTest();

if (args.includes('--selftest')) {
  console.log(`states: ${stateCount}`);
  console.log(`leaves: AI_WIN=${leaves.AI_WIN} DRAW=${leaves.DRAW} HUMAN_WIN=${leaves.HUMAN_WIN}`);
  console.log(`HUMAN_WIN terminals reachable: ${leaves.HUMAN_WIN}`);
  if (errors.length) {
    console.error('SELF-TEST FAILED:');
    for (const e of errors) console.error('  ' + e);
    process.exit(1);
  }
  console.log('SELF-TEST PASSED');
  process.exit(0);
}

const drawLine = simulate(humanBest);
const loseLine = simulate(humanWorst);

if (args.includes('--paths')) {
  console.log(JSON.stringify({ draw: drawLine, lose: loseLine }, null, 2));
  process.exit(0);
}

const html = buildHtml();
writeFileSync(OUT, html, 'utf8');
writeFileSync(PATHS_OUT, JSON.stringify({ draw: drawLine, lose: loseLine }, null, 2), 'utf8');

console.log(`states: ${stateCount}`);
console.log(`leaves: AI_WIN=${leaves.AI_WIN} DRAW=${leaves.DRAW} HUMAN_WIN=${leaves.HUMAN_WIN}`);
if (errors.length) {
  console.error('SELF-TEST FAILED:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log(`self-test: PASSED`);
console.log(`draw line:  ${drawLine.humanCells.join(' ')} -> ${drawLine.result}`);
console.log(`lose line:  ${loseLine.humanCells.join(' ')} -> ${loseLine.result}`);
console.log(`wrote ${OUT} (${(html.length / 1024).toFixed(1)} KB)`);
