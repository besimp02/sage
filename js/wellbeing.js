/* Wellbeing: daily check-in wizard, health score and charts, journal (typed or spoken), Mind tab. */
const score = (c) =>
  Math.round(
    Math.min((c.sleep || 0) / 8, 1) * 30 +
      Math.min((c.water || 0) / 8, 1) * 20 +
      ((c.mood || 0) / 4) * 15 +
      Math.min((c.move || 0) / 30, 1) * 10 +
      Math.min((c.meals || 0) / 3, 1) * 10 +
      ((3 - (c.stress || 2)) / 2) * 10 +
      ((c.screen || 0) <= 5 ? 5 : 0),
  );
const SYM = {
  headache: [
    "Headache",
    "Drink water and rest in a quiet, dim room. If it lasts over a day, or comes with vomiting or a stiff neck, go to the medical room.",
  ],
  fever: [
    "Fever or chills",
    "Rest and drink fluids. Visit the 24/7 medical room today and tell your warden. Do not share utensils.",
  ],
  cold: ["Cold or cough", "Warm fluids, rest and cover your cough. If you have trouble breathing, call 108."],
  stomach: [
    "Stomach upset",
    "Sip water or ORS and eat light food. If vomiting or pain continues for a few hours, go to the medical room.",
  ],
  pain: [
    "Body or period pain",
    "Rest, gentle stretching and a warm compress help. If pain is severe or sudden, visit the medical room.",
  ],
};
const QS = () => [
  ["mood", "How are you feeling today?", MO.map((m, i) => [m[0] + " " + m[1], i])],
  ["sleep", "How many hours did you sleep last night?", [["Under 4 h", 3], ...[4, 5, 6, 7, 8, 9].map((v) => [v + " h", v])]],
  ["water", "Glasses of water so far?", [0, 2, 4, 6, 8].map((v) => [v, v])],
  ["move", "Minutes of movement or exercise?", [0, 10, 20, 30, 45, 60].map((v) => [v, v])],
  ["meals", "Meals eaten today?", [0, 1, 2, 3].map((v) => [v, v])],
  ["screen", "Screen time today?", [1, 3, 5, 7, 9].map((v) => [v + " h", v])],
  [
    "stress",
    "Stress level?",
    [
      ["Low", 1],
      ["Medium", 2],
      ["High", 3],
    ],
  ],
  ["sym", "Any symptoms?", [["None", "none"], ...Object.entries(SYM).map(([k, v]) => [v[0], k])]],
];
const CH = [
  "Noted!",
  "Thanks for being honest.",
  "Got it.",
  "You are doing great.",
  "Almost there.",
  "Nearly done.",
  "Last question.",
];
const wzp = (k, v) => {
    S.wz.d[k] = isNaN(v) ? v : +v;
    S.wz.i++;
    render();
  },
  MS = [3, 7, 14, 30, 60];
function boom() {
  snd("win");
  const i = ICN(),
    R = [i, i, i, "✨"];
  for (let j = 0; j < 12; j++) {
    const s = document.createElement("span");
    s.className = "fl";
    s.textContent = R[j % 4];
    s.style.left = 15 + Math.random() * 70 + "vw";
    s.style.top = 40 + Math.random() * 30 + "vh";
    s.style.fontSize = "30px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}
function bigS(L) {
  const n = streak(),
    nx = MS.find((m) => m > n) || n + 10,
    ic = ICN(),
    days = [...Array(7)]
      .map((_, j) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + j);
        return `<div>${L.some((l) => dk(l.t) === dk(d)) ? ic : "·"}<small>${d.toLocaleDateString("en-IN", { weekday: "short" })}</small></div>`;
      })
      .join("");
  return `<div class="card bigst"><div class="bsn">${n}</div><div class="bsl">day streak</div><div class="bsic">${[...Array(Math.max(1, Math.min(n, 7)))].map((_, i) => `<span style="animation-delay:${i * 0.15}s">${ic}</span>`).join("")}</div><div class="bar0"><div style="width:${(n / nx) * 100}%"></div></div><small>${nx - n} more day${nx - n > 1 ? "s" : ""} to your ${nx}-day milestone</small><div class="days">${days}</div></div>`;
}
/* Check-in tab = wizard or today's summary, then the health section, then the buddy card. */
const checkinMain = () => {
  const L = myLogs("checkin"),
    t = L.find((l) => dk(l.t) === dk(Date.now())),
    q = QS(),
    w = S.wz,
    i = w.i,
    top = bigS(L);
  if (!t && i < q.length) {
    const [k, ti, o] = q[i];
    return `<div class="grid">${top}<div class="card" style="text-align:center"><div class="dots">${[...q, 0].map((_, j) => `<i class="${j <= i ? "d" : ""}"></i>`).join("")}</div><div class="bubble" style="margin:10px 0">${i ? CH[Math.min(i - 1, 6)] : "Let us check in. Just tap."}</div><h2>${ti}</h2><div class="opts">${o.map(([l, v]) => `<button class="btn alt" onclick="wzp('${k}','${v}')">${l}</button>`).join("")}</div>${i ? `<button class="btn sm alt" onclick="S.wz.i--;render()">Back</button>` : ""}</div></div>`;
  }
  if (!t)
    return `<div class="grid">${top}<div class="card" style="text-align:center"><h2>One last thing</h2><p>A small win, or something you are grateful for? (optional)</p><input id="wn" placeholder="e.g. finished my lab record"><button class="btn" onclick="wzs()">Finish check-in</button></div></div>`;
  const tips = [
      t.sleep < 6 && "You slept under 6 hours. Try screens off 30 minutes before bed.",
      t.water < 5 && "Drink a few more glasses of water today.",
      t.meals < 3 && "Do not skip meals. Your brain needs fuel.",
      t.stress >= 3 && "Stress is high. Try the breathing exercise in Calm, or chat with me.",
      t.screen >= 7 && "A lot of screen time. Rest your eyes and take a walk.",
      t.move < 20 && "A 15-minute walk would help.",
    ].filter(Boolean),
    low = t.mood <= 1;
  return `<div class="grid">${top}<div class="card"><h2>Done for today ${ICN()}</h2><div class="stat">${score(t)}/100</div>${zoneHTML(score(t))}<small>Health score · sleep ${t.sleep < 4 ? "under 4" : t.sleep} h · water ${t.water} · movement ${t.move} min · meals ${t.meals} · screen ${t.screen} h</small>${t.win ? `<p>Your win: ${E(t.win)}</p>` : ""}${tips.map((x) => `<div class="warn">${x}</div>`).join("")}${t.sym && t.sym !== "none" ? `<div class="warn r"><b>${SYM[t.sym][0]}:</b> ${SYM[t.sym][1]}</div>` : ""}${low ? `<div class="warn"><b>It is okay to ask for support.</b> Free and confidential:${helplines}</div>` : ""}</div></div>`;
};
V.checkin = () => checkinMain() + V.health() + buddyCard();
let isSubmittingCheckIn = false;
function wzs() {
  if (isSubmittingCheckIn) return;
  isSubmittingCheckIn = true;
  setTimeout(() => { isSubmittingCheckIn = false; }, 2000);
  const sc7 = score(S.wz.d),
    x0 = xp();
  setTimeout(() => {
    const a = lvlOf(x0),
      b = lvlOf(x0 + 20);
    if (b.n > a.n) {
      toast("Level up! Your buddy is now Lv " + b.n + " · " + b.t);
      snd("win");
    }
  }, 700);
  const d = S.wz.d;
  d.win = ($("wn").value || "").trim();
  add("logs", { type: "checkin", uid: me.id, n: me.name, blk: me.blk, ...d });
  S.wz = { i: 0, d: {} };
  boom();
  render();
  setTimeout(() => snd(sc7 < 50 ? "red" : sc7 < 70 ? "warn" : "ok"), 150);
}

/* ----- Score zones ----- */
function zone(s) {
  return s < 50
    ? {
        c: "red",
        e: "🚨",
        h: "Red zone: today was rough",
        m: "Your score is low and that is not something to ignore. Rest, drink water, eat something, and talk to someone you trust or the counsellor.",
      }
    : s < 70
      ? { c: "yel", e: "🟡", h: "Yellow zone", m: "You are in the yellow zone. A few small fixes today can lift it." }
      : s < 80
        ? { c: "grn", e: "🙂", h: "Nice!", m: "A solid day. Keep it going." }
        : { c: "grn", e: "🌟", h: "Very nice!", m: "Very nice! Your buddy is so proud of you." };
}
function zoneHTML(s) {
  const z = zone(s);
  return `<div class="zone ${z.c}" role="alert"><span style="font-size:22px">${z.e}</span> ${z.h}<div style="font-weight:400;margin-top:2px">${z.m}</div>${s < 50 ? helplines : ""}</div>`;
}

/* ----- Health section (targets, weekly chart, symptoms) ----- */
const HM = [
  ["sleep", "Sleep", "hours", 9],
  ["water", "Water", "glasses", 8],
  ["move", "Movement", "minutes", 60],
  ["screen", "Screen", "hours", 10],
  ["mood", "Mood", "", 4],
  ["stress", "Stress", "", 3],
];
const chartK = (L, k, mx) =>
  `<div class="cht">${[...Array(7)]
    .map((_, j) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + j);
      const l = L.find((x) => dk(x.t) === dk(d)),
        v = l ? l[k] : null;
      return `<div class="cc"><small>${v == null ? "" : v}</small><div class="cb"><i style="height:${v == null ? 0 : Math.max(6, Math.min(v / mx, 1) * 100)}%"></i></div><small>${d.toLocaleDateString("en-IN", { weekday: "short" })}</small></div>`;
    })
    .join("")}</div>`;
V.health = () => {
  const L = myLogs("checkin"),
    t = L.find((l) => dk(l.t) === dk(Date.now())),
    n = Math.min(7, L.length),
    m = HM.find((x) => x[0] === S.hm) || HM[0],
    av = (k) =>
      L.slice(0, 7)
        .filter((x) => x[k] != null)
        .reduce((p, x, _, a) => p + x[k] / a.length, 0),
    tg = [
      ["Sleep", "sleep", 8, "h", "7 to 9 h"],
      ["Water", "water", 8, " glasses", "8 glasses"],
      ["Movement", "move", 30, " min", "30 min"],
      ["Meals", "meals", 3, " meals", "3 meals"],
      ["Screen", "screen", 5, " h", "under 5 h", 1],
    ];
  return `<div class="card"><h2>Your health</h2>${
    t
      ? `<div class="tg">${tg
          .map(([l, k, g, u, tx, inv]) => {
            const v = t[k],
              p = v == null ? 0 : inv ? Math.max(0, Math.min((2 * g - v) / g, 1)) : Math.min(v / g, 1);
            return `<div><small>${l} · aim ${tx}</small><div><b>${v == null ? "Not recorded" : v + u}</b></div><div class="bar0"><div style="width:${p * 100}%"></div></div></div>`;
          })
          .join("")}</div><p style="margin-top:10px">Health score today: <b>${score(t)}/100</b></p>`
      : `<p>Finish today’s check-in above to see your targets and score.</p>`
  }
<h3 style="margin-top:14px">This week</h3><div class="chips">${HM.map((x) => `<button class="btn sm ${x[0] === m[0] ? "on" : "alt"}" onclick="S.hm='${x[0]}';render()">${x[1]}</button>`).join("")}</div>${chartK(L, m[0], m[3])}<p class="sm">${n ? `Average of your last ${n} check-in${n > 1 ? "s" : ""}: ${av(m[0]).toFixed(1)} ${m[2]}.` : "Your chart fills in after your first check-ins."}</p>
<details><summary>Feeling unwell? What to do</summary>${Object.values(SYM)
    .map((x) => `<p><b>${x[0]}.</b> ${x[1]}</p>`)
    .join(
      "",
    )}<p>The medical room is open 24/7 with a nurse.</p>${tel(C.wb, "Boys’ warden")}${tel(C.wg, "Girls’ warden")}<a class="btn red sm" href="tel:108">Call 108</a></details></div>`;
};

/* ----- Journal ----- */
V.journal = () => {
  const J = myLogs("journal");
  return `<div class="grid"><div class="card"><h2>Save your mood</h2><p>Type it or say it. Your words are saved with today’s mood.</p><label>Mood</label><div class="chips">${MO.map((m, i) => `<button class="btn sm ${S.jm === i ? "on" : "alt"}" onclick="S.jm=${i};jtKeep();render()">${m[0]} ${m[1]}</button>`).join("")}</div><div class="chips">${[
    ["en-IN", "English"],
    ["hi-IN", "हिन्दी"],
    ["pa-IN", "ਪੰਜਾਬੀ"],
  ]
    .map(
      ([c, n]) =>
        `<button class="btn sm ${S.vl === c ? "on" : "alt"}" onclick="S.vl='${c}';if(rec)rec.stop();jtKeep();render()">${n}</button>`,
    )
    .join(
      "",
    )}</div><button class="btn alt mic ${rec ? "rec" : ""}" id="mic" onclick="mic()">${rec ? "■ Stop recording" : "🎤 Tap to speak your entry"}</button><div id="vint" class="sm" style="min-height:22px">${rec ? "Listening… speak now" : ""}</div><textarea id="jt" oninput="jtv=this.value" placeholder="What is on your mind? One good thing from today also counts.">${E(jtv)}</textarea><button class="btn" onclick="saveJ()">Save entry</button><button class="btn alt" onclick="speakT($('jt').value)">🔊 Listen</button><p class="sm">Pick your language, tap the mic and talk. Voice is turned into text by your browser. Audio is not stored. Works best in Chrome. Hindi and Punjabi voice depend on your phone.</p></div>
<div class="card"><h2>Past entries</h2>${
    J.length
      ? J.slice(0, 12)
          .map(
            (l) =>
              `<div class="row" style="display:block"><b>${MO[l.mood][0]} ${MO[l.mood][1]}</b> <small>${fd(l.t)} ${l.voice ? "· voice" : ""}</small><p style="margin:2px 0 0">${E(l.text)}</p><button class="btn alt sm" data-t="${E(l.text)}" onclick="speakT(this.dataset.t)">🔊 Listen</button></div>`,
          )
          .join("")
      : "<p>No entries yet. Your saved moods appear here, newest first.</p>"
  }</div></div>`;
};
let jtv = "";
const jtKeep = () => {
  if ($("jt")) jtv = $("jt").value;
};
function saveJ() {
  const t = $("jt").value.trim();
  if (!t) return toast("Write or say something first");
  add("logs", { type: "journal", uid: me.id, n: me.name, blk: me.blk, mood: S.jm, text: t, voice: S.voice ? 1 : 0 });
  S.voice = 0;
  jtv = "";
  toast("Saved");
  render();
}
let rec = null;
function speakT(t) {
  try {
    speechSynthesis.cancel();
    if (!t || !t.trim()) return toast("Nothing to read yet");
    const u = new SpeechSynthesisUtterance(t.slice(0, 600));
    u.lang = S.vl || "en-IN";
    u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch (e) {
    toast("Reading aloud is not supported here");
  }
}
function mic() {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return toast("Voice typing is not supported here. Try Chrome.");
  if (rec) {
    rec.stop();
    return;
  }
  rec = new R();
  rec.lang = S.vl || "en-IN";
  rec.continuous = true;
  rec.interimResults = true;
  let base = ($("jt") ? $("jt").value : jtv).trim();
  rec.onresult = (e) => {
    let fin = "",
      it = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) fin += r[0].transcript + " ";
      else it += r[0].transcript;
    }
    if (fin) {
      base = (base + " " + fin).trim();
      jtv = base;
      S.voice = 1;
    }
    const a = $("jt");
    if (a) a.value = (base + " " + it).trim();
    const v = $("vint");
    if (v) v.textContent = it ? "…" + it : "Listening… speak now";
  };
  rec.onerror = (ev) =>
    toast(
      ev.error === "not-allowed"
        ? "Microphone is blocked. Allow it in your browser settings."
        : "Voice stopped. Tap the mic to try again.",
    );
  rec.onend = () => {
    rec = null;
    const a = $("jt");
    if (a) jtv = a.value;
    const b = $("mic");
    if (b) {
      b.textContent = "🎤 Tap to speak your entry";
      b.classList.remove("rec");
    }
    const v = $("vint");
    if (v) v.textContent = "";
  };
  rec.start();
  const b = $("mic");
  if (b) {
    b.textContent = "■ Stop recording";
    b.classList.add("rec");
  }
  const v = $("vint");
  if (v) v.textContent = "Listening… speak now";
  snd("pop");
}

/* ----- Mind tab = journal + calm in three quiet sections ----- */
const QA = [
  [
    "I cannot sleep",
    "Keep the same wake-up time daily. Stop screens 30 minutes before bed. Avoid tea or coffee after 5 pm. If you are awake after 20 minutes, sit in dim light and read until sleepy. If poor sleep lasts over two weeks, see the medical room.",
  ],
  [
    "Exam stress",
    "Pick one topic. Study 25 minutes, rest 5. Sleep before cramming. Study with a friend for one slot. Panic before an exam is common. Breathe out slowly for 6 counts, three times.",
  ],
  [
    "Homesick or lonely",
    "Set a fixed call-home time. Put something familiar in your corner. Join one small activity this week. Sit with someone new at the mess. If it feels heavy for weeks, speak to the counsellor.",
  ],
  [
    "Roommate conflict",
    "Talk about one issue at a time, calmly, not in front of others. Agree on quiet hours and shared space. If it does not improve, tell your warden. That is what they are for.",
  ],
  [
    "I am having a panic attack",
    "Sit down. Breathe in for 4, hold 4, out for 6. Press your feet into the floor. Name 5 things you can see. It peaks and passes in about 10 minutes. Call someone you trust. Call 108 if you have chest pain or cannot breathe.",
  ],
  [
    "Ragging, harassment or being followed",
    "This is never your fault. Tell your warden or call the Anti-Ragging helpline 1800-180-5522. Women’s helpline: 181. In danger, press SOS or call 112.",
  ],
  [
    "I feel I cannot go on",
    "Please do not stay alone with this. Call Tele-MANAS 14416 or KIRAN 1800-599-0019 now, free, 24×7. Or tell your warden or a friend and ask them to stay with you. If you are in immediate danger, call 112.",
  ],
];
const breatheCards =
  () => `<div class="card"><h2>Breathe for one minute</h2><div class="breath"></div><p style="text-align:center">In while the circle grows. Hold. Out slowly as it shrinks.</p></div><div class="card"><h2>Grounding: 5-4-3-2-1</h2><p>Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell and 1 you can taste. Go slowly. This brings your mind back to the room.</p></div>
<div class="card"><h2>Feel better in 5 minutes</h2>${["Walk outside for 10 minutes", "Message one friend or call home", "Tidy your desk", "Stretch your neck, shoulders and back", "Write down three good things from today", "Listen to one song you love"].map((x) => `<div class="row">${x}</div>`).join("")}</div>`;
const supportCards = () =>
  `<div class="card"><h2>Answers for common problems</h2>${QA.map((x) => `<details><summary>${x[0]}</summary><p>${x[1]}</p></details>`).join("")}</div><div class="card"><h2>Talk to someone</h2>${helplines}<p class="sm">Your warden: ${tel(C.wb, "Boys’ warden")}${tel(C.wg, "Girls’ warden")}</p></div>`;
V.calm = () => {
  const m = S.mt,
    tabs = [
      ["journal", "Journal"],
      ["breathe", "Breathe"],
      ["support", "Support"],
    ];
  return (
    `<div class="seg" role="tablist">${tabs.map(([k, t]) => `<button role="tab" class="${m === k ? "on" : ""}" onclick="jtKeep();S.mt='${k}';render()">${t}</button>`).join("")}</div>` +
    (m === "journal"
      ? V.journal()
      : m === "breathe"
        ? `<div class="grid">${breatheCards()}</div>`
        : `<div class="grid">${supportCards()}</div>`)
  );
};

/* ----- Low-mood detection (used by Home and the chat intro) ----- */
function lowNow() {
  const l = myLogs()
    .filter((x) => x.mood != null)
    .slice(0, 2);
  return l.length && (l[0].mood <= 1 || (l.length > 1 && l[0].mood <= 2 && l[1].mood <= 2));
}
