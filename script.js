/* ---------- 1. THE PHOTOS ----------
   20 stages, youngest -> oldest. These are generated placeholder faces.
   To use real photos replace the next line with your own list, e.g.
   const IMAGES = ['img/1.jpg','img/2.jpg', ... 20 files];            */
function face(i) {
  const age = Math.round(1 + i * 4.7);
  const skin = ["#f6c9a5", "#f1be98"][i % 2];
  const hairC = age < 50 ? "#3b2a20" : age < 65 ? "#8d8d8d" : "#ececec";
  const bg = `hsl(${20 + i * 14},70%,${age > 60 ? 82 : 88}%)`;
  const baby = age < 4,
    kid = age < 14;
  const ry = baby ? 33 : 30,
    rx = baby ? 32 : 27,
    cy = baby ? 52 : 50;
  const eye = baby ? 5 : kid ? 4 : 3,
    eyeY = cy - 2;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/>`;
  s += `<ellipse cx="50" cy="104" rx="${baby ? 24 : 34}" ry="26" fill="hsl(${200 + i * 9},55%,55%)"/>`;
  if (age <= 70)
    s += `<ellipse cx="50" cy="${cy - ry + 8}" rx="${rx + 3}" ry="${baby ? 7 : 14}" fill="${hairC}"/>`;
  s += `<ellipse cx="50" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}"/>`;
  if (age <= 70)
    s += `<path d="M${50 - rx} ${cy - 6} Q50 ${cy - ry - 6} ${50 + rx} ${cy - 6} Q50 ${cy - ry + 10} ${50 - rx} ${cy - 6}Z" fill="${hairC}"/>`;
  else
    s += `<ellipse cx="${50 - rx + 3}" cy="${cy}" rx="5" ry="10" fill="${hairC}"/><ellipse cx="${50 + rx - 3}" cy="${cy}" rx="5" ry="10" fill="${hairC}"/>`;
  if (age >= 14 && age < 50 && i % 2)
    s += `<path d="M${50 - rx} ${cy} Q${50 - rx - 6} ${cy + 22} ${50 - rx + 8} ${cy + 22}" stroke="${hairC}" stroke-width="7" fill="none"/>`;
  s += `<circle cx="${50 - 11}" cy="${eyeY}" r="${eye}" fill="#2b1b12"/><circle cx="${50 + 11}" cy="${eyeY}" r="${eye}" fill="#2b1b12"/>`;
  s += `<ellipse cx="${50 - 17}" cy="${cy + 8}" rx="4" ry="2.5" fill="#f08a8a" opacity=".5"/><ellipse cx="${50 + 17}" cy="${cy + 8}" rx="4" ry="2.5" fill="#f08a8a" opacity=".5"/>`;
  s += `<path d="M${50 - 8} ${cy + 14} Q50 ${cy + (baby ? 22 : 20)} ${50 + 8} ${cy + 14}" stroke="#a04040" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  const w = Math.max(0, Math.floor((age - 30) / 10));
  for (let k = 0; k < w; k++) {
    const y = cy - 14 - k * 0;
    s += `<path d="M${50 - 20} ${cy - 14 + k * 3.2} q20 -4 40 0" stroke="#00000030" stroke-width="1" fill="none"/>`;
  }
  if (age >= 45)
    s += `<g stroke="#333" stroke-width="1.8" fill="none"><circle cx="39" cy="${eyeY}" r="7"/><circle cx="61" cy="${eyeY}" r="7"/><path d="M46 ${eyeY}h8"/></g>`;
  if (age >= 75)
    s += `<path d="M${50 - 14} ${cy + 22} Q50 ${cy + 34} ${50 + 14} ${cy + 22}" fill="#ececec"/>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(s + "</svg>");
}
const N = 20;
const IMAGES = [
  "img/1.jpg",
  "img/2.jpg",
  "img/3.jpg",
  "img/4.jpg",
  "img/5.jpg",
  "img/6.jpg",
  "img/7.jpg",
  "img/8.jpg",
  "img/9.jpg",
  "img/10.jpg",
  "img/11.jpg",
  "img/12.jpg",
  "img/13.jpg",
  "img/14.jpg",
  "img/15.jpg",
  "img/16.jpg",
  "img/17.jpg",
  "img/18.jpg",
  "img/19.jpg",
  "img/20.jpg",
];
const AGES = Array.from({ length: N }, (_, i) => Math.round(1 + i * 4.7));

/* ---------- 2. THE DATA ---------- */
let b,
  score,
  newPos,
  mergedPos,
  best = 0;
const boardEl = document.getElementById("board"),
  overEl = document.getElementById("over");
const cells = [];
for (let i = 0; i < 16; i++) {
  const c = document.createElement("div");
  c.className = "cell";
  boardEl.insertBefore(c, overEl);
  cells.push(c);
}
const ladder = document.getElementById("ladder");
IMAGES.forEach((src) => {
  const im = document.createElement("img");
  im.src = src;
  ladder.appendChild(im);
});
try {
  best = +localStorage.getItem("flipit-best") || 0;
} catch (e) {}

function start() {
  b = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  score = 0;
  newPos = "";
  mergedPos = new Set();
  overEl.classList.remove("show");
  addTile();
  addTile();
  render();
}
function addTile() {
  const free = [];
  b.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) free.push([r, c]);
    }),
  );
  if (!free.length) return;
  const [r, c] = free[Math.floor(Math.random() * free.length)];
  b[r][c] = Math.random() < 0.9 ? 1 : 2;
  newPos = r + "," + c;
}

/* ---------- 3. THE MOVE (same idea as 2048) ---------- */
function move(d) {
  // 0 left, 1 up, 2 right, 3 down
  let moved = false;
  mergedPos = new Set();
  newPos = "";
  for (let k = 0; k < 4; k++) {
    const cs = [0, 1, 2, 3].map((j) =>
      d == 0 ? [k, j] : d == 2 ? [k, 3 - j] : d == 1 ? [j, k] : [3 - j, k],
    );
    const vals = cs.map(([r, c]) => b[r][c]).filter(Boolean),
      out = [];
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1] && vals[i] < N) {
        out.push(vals[i] + 1);
        score += Math.pow(2, vals[i] + 1);
        mergedPos.add(cs[out.length - 1].join());
        i++;
      } else out.push(vals[i]);
    }
    while (out.length < 4) out.push(0);
    cs.forEach(([r, c], j) => {
      if (b[r][c] !== out[j]) moved = true;
      b[r][c] = out[j];
    });
  }
  if (moved) {
    addTile();
    render();
    if (isOver()) overEl.classList.add("show");
  }
}
function isOver() {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (!b[r][c]) return false;
      if (c < 3 && b[r][c] === b[r][c + 1]) return false;
      if (r < 3 && b[r][c] === b[r + 1][c]) return false;
    }
  return true;
}

/* ---------- 4. DRAW ---------- */
function render() {
  const seen = new Set();
  b.forEach((row, r) =>
    row.forEach((v, c) => {
      const el = cells[r * 4 + c],
        key = r + "," + c;
      el.className =
        "cell" +
        (key === newPos ? " new" : "") +
        (mergedPos.has(key) ? " pop" : "");
      el.innerHTML = v
        ? `<img src="${IMAGES[v - 1]}" alt=""><span class="age">${AGES[v - 1]} yr</span>`
        : "";
      if (v) for (let i = 1; i <= v; i++) seen.add(i - 1);
    }),
  );
  [...ladder.children].forEach((im, i) =>
    im.classList.toggle("seen", seen.has(i)),
  );
  document.getElementById("score").textContent = score;
  if (score > best) {
    best = score;
    try {
      localStorage.setItem("flipit-best", best);
    } catch (e) {}
  }
  document.getElementById("best").textContent = best;
}

/* ---------- 5. CONTROLS ---------- */
addEventListener("keydown", (e) => {
  const m = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 }[e.key];
  if (m !== undefined) {
    e.preventDefault();
    move(m);
  }
});
let sx, sy;
boardEl.addEventListener(
  "touchstart",
  (e) => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  },
  { passive: true },
);
boardEl.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - sx,
    dy = e.changedTouches[0].clientY - sy;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : dy > 0 ? 3 : 1);
});
document.getElementById("restart").onclick = start;
document.getElementById("again").onclick = start;
start();
