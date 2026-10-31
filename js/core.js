/* Core: Firebase init, local storage, shared data, helpers, contacts, session state. */
let fdb = null;
try {
  const k = firebaseConfig.apiKey.trim();
  if (window.firebase && k && !k.startsWith("@secret")) {
    firebase.initializeApp({
      ...firebaseConfig,
      apiKey: k,
      measurementId: firebaseConfig.measurementId.trim().startsWith("@secret")
        ? undefined
        : firebaseConfig.measurementId.trim(),
    });
    fdb = firebase.firestore();
  }
} catch (e) {
  console.warn("Firebase off:", e);
}
const LS = {
  g: (k, d) => {
    try {
      const v = localStorage.getItem("sg_" + k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  },
  s: (k, v) => {
    try {
      localStorage.setItem("sg_" + k, JSON.stringify(v));
    } catch {}
  },
};
const D = {
  alerts: LS.g("alerts", []),
  tickets: LS.g("tickets", []),
  logs: LS.g("logs", []),
  amb: LS.g("amb", "Available"),
  users: [],
  stats: [],
};
const $ = (i) => document.getElementById(i),
  E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    ),
  uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const f = (t) =>
    t ? new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—",
  sec = (a, b) => (a && b ? Math.round((b - a) / 1000) : null),
  dur = (s) => (s == null ? "—" : s < 60 ? s + " s" : Math.floor(s / 60) + " m " + (s % 60) + " s"),
  dk = (t) => new Date(t).toLocaleDateString("en-CA"),
  fd = (t) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/* Live sync. Without Firebase the app runs in demo mode on localStorage.
 * Each role only subscribes to the data it needs, so a student's browser never receives other
 * students' alerts, tickets or profiles, and password hashes are dropped from the staff directory.
 * (Demo build: this is app-level scoping. Database-level enforcement needs Firebase Auth + Firestore rules.) */
let _sync = { role: null, id: null, un: [] };
const _err = (n) => (e) => console.warn("sync " + n + ":", e.message);
function subRole() {
  if (!fdb) return;
  const role = me ? me.role : null,
    id = me ? me.id : null;
  if (_sync.role === role && _sync.id === id) return;
  _sync.un.forEach((u) => u());
  _sync = { role, id, un: [] };
  D.alerts = [];
  D.tickets = [];
  D.users = [];
  D.stats = [];
  if (!me) return;
  const U = _sync.un,
    stu = role === "student",
    byT = (a, b) => (b.t || 0) - (a.t || 0),
    own = (c) =>
      fdb
        .collection(c)
        .where("uid", "==", id)
        .limit(100)
        .onSnapshot((s) => {
          D[c] = s.docs.map((d) => ({ ...d.data(), id: d.id })).sort(byT);
          paint();
        }, _err(c));
  if (stu) {
    U.push(own("alerts"), own("tickets"));
  } else {
    U.push(
      fdb
        .collection("alerts")
        .orderBy("t", "desc")
        .limit(300)
        .onSnapshot((s) => {
          D.alerts = s.docs.map((d) => ({ ...d.data(), id: d.id }));
          paint();
        }, _err("alerts")),
    );
    U.push(
      fdb
        .collection("meta")
        .doc("ambulance")
        .onSnapshot((d) => {
          D.amb = d.exists ? d.data().status : "Available";
          paint();
        }, _err("ambulance")),
    );
  }
  if (role === "warden") {
    U.push(
      fdb
        .collection("tickets")
        .orderBy("t", "desc")
        .limit(300)
        .onSnapshot((s) => {
          D.tickets = s.docs.map((d) => ({ ...d.data(), id: d.id }));
          paint();
        }, _err("tickets")),
    );
    U.push(
      fdb.collection("users").onSnapshot((s) => {
        D.users = s.docs.map((d) => {
          const { pw, ...u } = d.data();
          return u;
        });
        paint();
      }, _err("users")),
    );
    U.push(
      fdb.collection("stats").onSnapshot((q) => {
        D.stats = q.docs.map((d) => ({ ...d.data(), id: d.id }));
        paint();
      }, _err("stats")),
    );
  }
}
const startSync = subRole; /* main.js calls this at load; render() re-runs it after login/logout */
const add = (c, o) => {
    o.id = uid();
    o.t = Date.now();
    bumpStats(c, o);
    if (fdb)
      fdb
        .collection(c)
        .doc(o.id)
        .set(o)
        .catch((e) => toast("Could not sync: " + e.message));
    else {
      D[c].unshift(o);
      LS.s(c, D[c]);
    }
    paint(1);
    return o;
  },
  upd = (c, id, p) => {
    if (fdb)
      fdb
        .collection(c)
        .doc(id)
        .update(p)
        .catch((e) => toast("Could not sync: " + e.message));
    else {
      const o = D[c].find((x) => x.id === id);
      if (o) {
        Object.assign(o, p);
        LS.s(c, D[c]);
      }
    }
    paint(1);
  },
  setAmb = (s) => {
    if (fdb) fdb.collection("meta").doc("ambulance").set({ status: s });
    else {
      D.amb = s;
      LS.s("amb", s);
    }
    paint(1);
  };
addEventListener("storage", () => {
  if (fdb) return;
  ["alerts", "tickets", "logs"].forEach((c) => (D[c] = LS.g(c, [])));
  D.amb = LS.g("amb", "Available");
  paint();
});
function toast(m) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* Anonymous wellbeing totals: the warden dashboard only reads these counters; it never loads individual check-ins. */
function bumpStats(c, o) {
  if (c === "logs" && o.type === "checkin" && fdb) {
    try {
      const i = firebase.firestore.FieldValue.increment,
        p = { ["m" + o.mood]: i(1) };
      if (o.stress >= 3) p.hi = i(1);
      if (o.sleep < 6) p.sl = i(1);
      fdb.collection("stats").doc(dk(o.t)).set(p, { merge: true });
    } catch (e) {}
  }
}
function agg() {
  const A = { n: 0, low: 0, hi: 0, sl: 0, dist: [0, 0, 0, 0, 0] };
  if (fdb) {
    const lim = dk(Date.now() - 6048e5);
    D.stats
      .filter((x) => x.id >= lim)
      .forEach((x) => {
        for (let m = 0; m < 5; m++) {
          const c = x["m" + m] || 0;
          A.dist[m] += c;
          A.n += c;
        }
        A.hi += x.hi || 0;
        A.sl += x.sl || 0;
      });
  } else
    D.logs
      .filter((l) => l.type === "checkin" && Date.now() - l.t < 6048e5)
      .forEach((l) => {
        A.n++;
        A.dist[l.mood]++;
        if (l.stress >= 3) A.hi++;
        if (l.sleep < 6) A.sl++;
      });
  A.low = A.dist[0] + A.dist[1];
  return A;
}

/* Students only subscribe to their own logs. */
let _ls = null;
function subLogs() {
  if (!fdb || !me) return;
  if (me.role !== "student") {
    if (D.logs.length) D.logs = [];
    return;
  }
  if (_ls && _ls.id === me.id) return;
  if (_ls) _ls.un();
  _ls = {
    id: me.id,
    un: fdb
      .collection("logs")
      .where("uid", "==", me.id)
      .onSnapshot((q) => {
        D.logs = q.docs.map((d) => ({ ...d.data(), id: d.id }));
        paint();
      }),
  };
}

/* ----- Contacts and static content ----- */
const C = {
  boys: ["9056764083", "9056764078"],
  girls: ["9875919580", "9056954254"],
  chief: "9781925261",
  wb: "8872048001",
  wg: "9878100264",
  couns: "9815878787",
  psy: "8557807099",
  addr: "State Highway 12A, Chandigarh–Sirhind Road, Mohali, Punjab 140307",
};
const tel = (n, t) => `<a class="btn sm" href="tel:${n.replace(/[^\d+]/g, "")}">${t || n}</a>`,
  telA = (n, t) => `<a class="btn alt sm" href="tel:${n.replace(/[^\d+]/g, "")}">${t || n}</a>`;
const FA = [
  [
    "Seizure",
    "Note the time. Clear space and cushion the head. Do not hold them down or put anything in their mouth. When shaking stops, roll them onto their side. Call 108 if it lasts over 5 minutes or they do not wake up.",
  ],
  [
    "Asthma",
    "Sit them upright, loosen tight clothing, keep them calm and help them use their own reliever inhaler. Call 108 if there is no quick relief, they cannot speak in full sentences, or lips look blue.",
  ],
  [
    "Choking",
    "Ask “Can you cough?”. If they cannot cough or breathe: 5 firm back blows between the shoulder blades, then 5 abdominal thrusts. Repeat and call 108.",
  ],
  [
    "Fainting",
    "Lay them flat and raise their legs. Loosen clothing, give fresh air, check breathing. Call 108 if they do not wake within a minute or are injured.",
  ],
  [
    "Bleeding",
    "Press firmly with a clean cloth and keep pressing. Raise the limb if possible. Add more cloth on top instead of removing a soaked one. Call 108 for heavy bleeding.",
  ],
  [
    "Burns",
    "Cool the burn under running water for 20 minutes. Remove rings or tight items before swelling. Do not use ice, butter or toothpaste. Call 108 for large or facial burns.",
  ],
];

/* ----- Passwords: salted SHA-256 (hash) plus the legacy djb2 hash older accounts still use (hash0) ----- */
const sha = (() => {
  const K = [],
    H = [];
  for (let p = 2, c = 0; c < 64; p++) {
    let q = 1;
    for (let d = 2; d * d <= p; d++) if (p % d == 0) q = 0;
    if (q) {
      if (c < 8) H[c] = (Math.pow(p, 0.5) * 4294967296) | 0;
      K[c++] = (Math.pow(p, 1 / 3) * 4294967296) | 0;
    }
  }
  const r = (x, n) => (x >>> n) | (x << (32 - n));
  return (m) => {
    const b = [...new TextEncoder().encode(m)],
      l = b.length * 8;
    b.push(128);
    while (b.length % 64 != 56) b.push(0);
    b.push(0, 0, 0, 0, (l >>> 24) & 255, (l >>> 16) & 255, (l >>> 8) & 255, l & 255);
    let h = H.slice();
    for (let o = 0; o < b.length; o += 64) {
      const w = [];
      for (let i = 0; i < 64; i++)
        w[i] =
          i < 16
            ? (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3]
            : ((r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10)) +
                w[i - 7] +
                (r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3)) +
                w[i - 16]) |
              0;
      let [a, B, c, d, e, f, g, k] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (k + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0,
          t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & B) ^ (a & c) ^ (B & c))) | 0;
        k = g;
        g = f;
        f = e;
        e = (d + t1) | 0;
        d = c;
        c = B;
        B = a;
        a = (t1 + t2) | 0;
      }
      h = h.map((v, i) => (v + [a, B, c, d, e, f, g, k][i]) | 0);
    }
    return h.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
  };
})();
const hash0 = (s) => {
  let h = 5381;
  for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h;
};
const hash = (s) => "s2$" + sha("sage.cgc|" + s),
  chk = (st, pw) => st === hash(pw) || st === hash0(pw);

/* ----- App state ----- */
const V = {}; /* view renderers by tab name */
let me = null,
  tab = "home";
const S = {
  lg: { mode: "in", role: "student" },
  jm: 2,
  muted: 0,
  pimg: "",
  vl: "en-IN",
  wz: { i: 0, d: {} },
  hm: "sleep",
  mt: "journal",
  tts: 0,
};
const MO = [
  ["😢", "Very low"],
  ["😟", "Low"],
  ["😐", "Okay"],
  ["🙂", "Good"],
  ["😄", "Great"],
];
const mine = () => D.alerts.find((a) => a.uid === me.id && !a.done);
const myLogs = (t) => D.logs.filter((l) => l.uid === me.id && (!t || l.type === t)).sort((a, b) => b.t - a.t);
function streak() {
  const ds = new Set(myLogs("checkin").map((l) => dk(l.t)));
  let n = 0,
    d = new Date();
  if (!ds.has(dk(d))) d.setDate(d.getDate() - 1);
  while (ds.has(dk(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const helplines = `<div class="chips">${tel("14416", "Tele-MANAS 14416")}${tel("18005990019", "KIRAN 1800-599-0019")}${tel("9999666555", "Vandrevala 9999 666 555")}${tel(C.couns, "CGC counsellor")}${tel(C.psy, "CGC psychologist")}</div>`;
