/* Theme: icons, mascot, accent colour, background, fireflies. */
/* Small leaf icon used on the login screen and the staff top bar. */
const leafIcon = (low) =>
  `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 6C16 20 12 52 40 74c28-22 24-54 0-68z" fill="#8fcfb0" stroke="#2a6b58" stroke-width="3"/><path d="M40 20v50" stroke="#2a6b58" stroke-width="2" opacity=".4"/><circle cx="32" cy="42" r="3" fill="#1d2b25"/><circle cx="48" cy="42" r="3" fill="#1d2b25"/><path d="${low ? "M33 54q7 -3 14 0" : "M32 52q8 8 16 0"}" stroke="#1d2b25" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const IC = { flower: "🌸", bow: "🎀", star: "⭐", bolt: "⚡", cloud: "☁️", heart: "💜", leaf: "🍀" };
const ICN = () => IC[me && me.ic] || "🌸";
/* data-t on <body>: staff get their own look, everyone else the calm theme. */
const th = () => (me && me.role !== "student" ? "warden" : "neutral");
/* Which buddy: students pick one in Profile (butterfly "b" or ferret "f"). */
const mk = () => (me && me.role === "student" ? me.mp || "b" : "b");
const pfx = { b: ["🌸", "✨", "💖", "🦋"], f: ["⭐", "💙", "☁️", "✨"] },
  says = {
    b: ["Hehe, that tickles!", "You are doing well today.", "Small steps count.", "In through the nose, out slowly."],
    f: ["Easy does it.", "Nice and steady.", "I am right here.", "Calm mind, strong day."],
  };
const mascot = (px) =>
  `<div class="mw" style="width:${px}px;height:${px}px;position:relative;filter:${glow(px)}">${acc(px)}${mk() === "b" ? BF : FR}</div>`;
document.addEventListener("click", (e) => {
  const m = e.target.closest(".mas");
  if (!m) return;
  const k = m.dataset.k,
    r = m.getBoundingClientRect();
  for (let i = 0; i < 4; i++) {
    const s = document.createElement("span");
    s.className = "fl";
    s.textContent = pfx[k][i];
    s.style.left = r.left + r.width / 2 + (Math.random() * 70 - 35) + "px";
    s.style.top = r.top + 10 + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
  const b = document.querySelector(".bubble");
  if (b) b.textContent = says[k][(Math.random() * 4) | 0];
});

/* ----- Accent colour: keeps white text readable on any colour the student picks ----- */
const rgbOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  },
  mixW = (c, p) => c.map((v) => Math.round(v + (255 - v) * p)),
  css3 = (c) => `rgb(${c.join(",")})`;
function applyTheme() {
  const s = document.body.style;
  if (me && me.role === "student" && /^#[0-9a-f]{6}$/i.test(me.ac || "")) {
    let c = rgbOf(me.ac);
    while (1.05 / (lum(c) + 0.05) < 4.6 && c.some((v) => v > 0)) c = c.map((v) => Math.floor(v * 0.92));
    s.setProperty("--ac", css3(c));
    s.setProperty("--acl", css3(mixW(c, 0.88)));
    s.setProperty("--bd", css3(mixW(c, 0.72)));
    s.setProperty("--sun", css3(mixW(c, 0.6)));
  } else ["--ac", "--acl", "--bd", "--sun"].forEach((k) => s.removeProperty(k));
}
const SW = [
  ["Mist", "#4a6f8a"],
  ["Lavender", "#6a4bc2"],
  ["Rose", "#a8255b"],
  ["Ocean", "#1f5f99"],
  ["Teal", "#1f7a6d"],
  ["Amber", "#b45309"],
  ["Slate", "#475569"],
];

/* ----- Background photo + stickers ----- */
const SP = [
  [2, 20],
  [90, 14],
  [92, 56],
  [3, 72],
  [88, 86],
];
let bgKey = "";
function bgSet() {
  applyTheme();
  let d = $("bgl");
  if (!d) {
    d = document.createElement("div");
    d.id = "bgl";
    document.body.prepend(d);
  }
  let u = "";
  if (me && me.role === "student") u = me.bgu || (me.bgx == null ? BG[0] : me.bgx >= 0 ? BG[me.bgx] : "");
  const deco = u && me.deco !== 0,
    key = u.length + ":" + deco;
  if (key === bgKey) return;
  bgKey = key;
  d.innerHTML = u
    ? `<div class="bgi" style="background-image:url('${E(u)}')"></div><div class="veil"></div>${deco ? STICKERS.map((s, i) => `<img class="stk" src="${s}" alt="" style="left:${SP[i][0]}%;top:${SP[i][1]}%">`).join("") : ""}`
    : "";
}
function bgup(el) {
  const fl = el.files[0];
  if (!fl) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1100 / Math.max(im.width, im.height)),
        c = document.createElement("canvas");
      c.width = im.width * k;
      c.height = im.height * k;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      setBg(null, c.toDataURL("image/jpeg", 0.6));
    };
    im.src = r.result;
  };
  r.readAsDataURL(fl);
}
function setBg(i, u) {
  me.bgx = i;
  me.bgu = u || "";
  saveUser(me);
  render();
}

/* ----- Fireflies ----- */
function flies() {
  let f = $("flies");
  if (!me || me.role !== "student") {
    if (f) f.remove();
    return;
  }
  if (f) return;
  f = document.createElement("div");
  f.id = "flies";
  f.innerHTML = [...Array(8)]
    .map(
      (_, i) =>
        `<i style="left:${(i * 37 + 8) % 92}%;top:${(i * 53 + 10) % 80}%;--dx:${((i % 3) - 1) * 40 + 20}px;--dy:${-30 - (i % 4) * 18}px;animation-delay:${-i * 2.3}s,${-i * 1.1}s;animation-duration:${14 + (i % 4) * 3}s,${3 + (i % 3)}s"></i>`,
    )
    .join("");
  document.body.appendChild(f);
}
