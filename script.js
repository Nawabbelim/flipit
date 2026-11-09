const N = 20;
const $ = (s) => document.querySelector(s);
const boardEl = $("#board"),
  layer = $("#layer"),
  msg = $("#msg");
let photos = Array(N).fill(null),
  tiles = [],
  score = 0,
  best = 0,
  topLv = 1;
let locked = false,
  queued = null,
  undoState = null,
  won = false,
  started = false;
try {
  best = +localStorage.getItem("flipit-best") || 0;
} catch (e) {}

/* background cells */
for (let i = 0; i < 16; i++)
  $(".cells").appendChild(document.createElement("i"));

/* ---------- sample faces (only used if you press "Fill empty with samples") ---------- */
function face(i) {
  const age = Math.round(1 + i * 4.7),
    baby = age < 4,
    kid = age < 14;
  const hair = age < 50 ? "#3b2a20" : age < 65 ? "#8d8d8d" : "#ececec";
  const ry = baby ? 33 : 30,
    rx = baby ? 32 : 27,
    cy = baby ? 52 : 50,
    eye = baby ? 5 : kid ? 4 : 3,
    ey = cy - 2;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${20 + i * 14},70%,86%)"/>`;
  s += `<ellipse cx="50" cy="104" rx="${baby ? 24 : 34}" ry="26" fill="hsl(${200 + i * 9},55%,55%)"/>`;
  if (age <= 70)
    s += `<ellipse cx="50" cy="${cy - ry + 8}" rx="${rx + 3}" ry="${baby ? 7 : 14}" fill="${hair}"/>`;
  s += `<ellipse cx="50" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f3c19c"/>`;
  if (age > 70)
    s += `<ellipse cx="${53 - rx}" cy="${cy}" rx="5" ry="10" fill="${hair}"/><ellipse cx="${47 + rx}" cy="${cy}" rx="5" ry="10" fill="${hair}"/>`;
  else
    s += `<path d="M${50 - rx} ${cy - 6} Q50 ${cy - ry - 6} ${50 + rx} ${cy - 6} Q50 ${cy - ry + 10} ${50 - rx} ${cy - 6}Z" fill="${hair}"/>`;
  s += `<circle cx="39" cy="${ey}" r="${eye}" fill="#2b1b12"/><circle cx="61" cy="${ey}" r="${eye}" fill="#2b1b12"/>`;
  s += `<path d="M42 ${cy + 14} Q50 ${cy + (baby ? 22 : 20)} 58 ${cy + 14}" stroke="#a04040" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  for (let k = 0; k < Math.max(0, Math.floor((age - 30) / 10)); k++)
    s += `<path d="M30 ${cy - 14 + k * 3.2} q20 -4 40 0" stroke="#00000030" fill="none"/>`;
  if (age >= 45)
    s += `<g stroke="#333" stroke-width="1.8" fill="none"><circle cx="39" cy="${ey}" r="7"/><circle cx="61" cy="${ey}" r="7"/><path d="M46 ${ey}h8"/></g>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(s + "</svg>");
}

/* ---------- photo manager (upload) ---------- */
function renderSlots() {
  const slots = $("#slots");
  slots.innerHTML = "";
  photos.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "slot" + (p ? " filled" : "");
    b.innerHTML = (p ? `<img src="${p}" alt="">` : "+") + `<b>${i + 1}</b>`;
    b.onclick = () => {
      $("#one").dataset.i = i;
      $("#one").click();
    };
    slots.appendChild(b);
  });
  $("#count").textContent =
    photos.filter(Boolean).length + " / " + N + " added";
  $("#play").disabled = photos.some((x) => !x);
  $("#play").textContent = started ? "✔ Done" : "▶ Play";
}
function setPhoto(i, file) {
  if (photos[i] && photos[i].startsWith("blob:"))
    URL.revokeObjectURL(photos[i]);
  photos[i] = URL.createObjectURL(file);
}
$("#one").onchange = (e) => {
  const f = e.target.files[0];
  if (f) setPhoto(+e.target.dataset.i, f);
  e.target.value = "";
  renderSlots();
};
$("#multi").onclick = () => $("#many").click();
$("#many").onchange = (e) => {
  [...e.target.files]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .slice(0, N)
    .forEach((f, i) => setPhoto(i, f));
  e.target.value = "";
  renderSlots();
};
$("#sample").onclick = () => {
  photos = photos.map((p, i) => p || face(i));
  renderSlots();
};
$("#clear").onclick = () => {
  photos = Array(N).fill(null);
  renderSlots();
};
$("#photosBtn").onclick = () => {
  renderSlots();
  $("#modal").classList.add("show");
};
$("#play").onclick = () => {
  $("#modal").classList.remove("show");
  if (!started) {
    started = true;
    newGame();
  } else tiles.forEach(paint);
};

/* ---------- tiles ---------- */
function place(t) {
  t.el.style.setProperty("--r", t.r);
  t.el.style.setProperty("--c", t.c);
}
function paint(t) {
  t.el.style.setProperty("--v", t.v);
  t.el.querySelector("img").src = photos[t.v - 1] || face(t.v - 1);
  t.el.querySelector(".lv").textContent = t.v;
}
function mk(v, r, c, cls) {
  const el = document.createElement("div");
  el.className = "tile";
  el.innerHTML = '<div class="in"><img alt=""><span class="lv"></span></div>';
  if (cls) el.firstChild.classList.add(cls);
  const t = { v, r, c, el };
  paint(t);
  place(t);
  layer.appendChild(el);
  tiles.push(t);
  return t;
}
function addRandom() {
  const used = new Set(tiles.map((t) => t.r + "," + t.c)),
    free = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) if (!used.has(r + "," + c)) free.push([r, c]);
  if (!free.length) return;
  const [r, c] = free[Math.floor(Math.random() * free.length)];
  mk(Math.random() < 0.9 ? 1 : 2, r, c, "spawn");
}
function burst(t) {
  const ring = document.createElement("span");
  ring.className = "ring";
  t.el.appendChild(ring);
  setTimeout(() => ring.remove(), 600);
  for (let i = 0; i < 10; i++) {
    const s = document.createElement("span"),
      a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    s.className = "spark";
    s.style.setProperty("--dx", (Math.cos(a) * 0.75).toFixed(2));
    s.style.setProperty("--dy", (Math.sin(a) * 0.75).toFixed(2));
    t.el.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}

/* ---------- game ---------- */
function newGame() {
  layer.innerHTML = "";
  tiles = [];
  score = 0;
  topLv = 1;
  won = false;
  undoState = null;
  locked = false;
  queued = null;
  msg.classList.remove("show");
  addRandom();
  addRandom();
  hud();
}
function snapshot() {
  return { score, lv: topLv, t: tiles.map((t) => [t.v, t.r, t.c]) };
}
function undo() {
  if (!undoState || locked) return;
  layer.innerHTML = "";
  tiles = [];
  score = undoState.score;
  topLv = undoState.lv;
  undoState.t.forEach(([v, r, c]) => mk(v, r, c));
  undoState = null;
  msg.classList.remove("show");
  hud();
}
function hud() {
  if (score > best) {
    best = score;
    try {
      localStorage.setItem("flipit-best", best);
    } catch (e) {}
  }
  $("#score").textContent = score;
  $("#best").textContent = best;
  $("#top").textContent = topLv;
  $("#undo").disabled = !undoState;
}
function move(d) {
  // 0 left, 1 up, 2 right, 3 down
  if (
    !started ||
    $("#modal").classList.contains("show") ||
    msg.classList.contains("show")
  )
    return;
  if (locked) {
    queued = d;
    return;
  }
  const g = {};
  tiles.forEach((t) => (g[t.r + "," + t.c] = t));
  const snap = snapshot(),
    merges = [];
  let moved = false;
  for (let k = 0; k < 4; k++) {
    const cs = [0, 1, 2, 3].map((j) =>
      d == 0 ? [k, j] : d == 2 ? [k, 3 - j] : d == 1 ? [j, k] : [3 - j, k],
    );
    const line = cs.map(([r, c]) => g[r + "," + c]).filter(Boolean);
    let o = 0;
    for (let i = 0; i < line.length; i++) {
      const a = line[i],
        b = line[i + 1],
        [r, c] = cs[o++];
      if (b && a.v === b.v && a.v < N) {
        [a, b].forEach((t) => {
          if (t.r !== r || t.c !== c) moved = true;
          t.r = r;
          t.c = c;
        });
        b.el.classList.add("top");
        merges.push([a, b, r, c]);
        i++;
      } else {
        if (a.r !== r || a.c !== c) moved = true;
        a.r = r;
        a.c = c;
      }
    }
  }
  if (!moved) return;
  undoState = snap;
  locked = true;
  tiles.forEach(place);
  setTimeout(() => {
    merges.forEach(([a, b, r, c]) => {
      a.el.remove();
      b.el.remove();
      tiles = tiles.filter((t) => t !== a && t !== b);
      const t = mk(a.v + 1, r, c, "merge");
      t.el.classList.add("top");
      score += Math.pow(2, t.v);
      topLv = Math.max(topLv, t.v);
      burst(t);
      if (t.v === N && !won) {
        won = true;
        show("🎉 Fully grown!", "Keep playing");
      }
    });
    addRandom();
    hud();
    boardEl.classList.remove("bump");
    void boardEl.offsetWidth;
    boardEl.classList.add("bump");
    locked = false;
    if (isOver()) show("Game over", "Try again", true);
    else if (queued !== null) {
      const q = queued;
      queued = null;
      move(q);
    }
  }, 160);
}
function isOver() {
  if (tiles.length < 16) return false;
  const g = {};
  tiles.forEach((t) => (g[t.r + "," + t.c] = t.v));
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (
        g[r + "," + c] === g[r + "," + (c + 1)] ||
        g[r + "," + c] === g[r + 1 + "," + c]
      )
        return false;
  return true;
}
function show(title, btn, restart) {
  $("#msgTitle").textContent = title;
  $("#msgBtn").textContent = btn;
  $("#msgBtn").onclick = restart ? newGame : () => msg.classList.remove("show");
  msg.classList.add("show");
}

/* ---------- controls ---------- */
addEventListener("keydown", (e) => {
  const m = {
    ArrowLeft: 0,
    a: 0,
    ArrowUp: 1,
    w: 1,
    ArrowRight: 2,
    d: 2,
    ArrowDown: 3,
    s: 3,
  }[e.key];
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
$("#restart").onclick = () => started && newGame();
$("#undo").onclick = undo;
$("#close").onclick = () => $("#modal").classList.remove("show");
/* game starts right away with sample faces; open "Photos" to upload your own */
photos = Array.from({ length: N }, (_, i) => face(i));
started = true;
renderSlots();
newGame();
