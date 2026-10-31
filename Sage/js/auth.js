/* Accounts: login view, sign-up, session. Accounts live in localStorage and, when Firebase is on, in the `users` collection. */
function sv() {
  S.lg.v = {};
  ["lnm", "lid", "lbk", "lrm", "lgp"].forEach((i) => {
    if ($(i)) S.lg.v[i] = $(i).value;
  });
}
function loginView() {
  const L = S.lg,
    up = L.mode === "up",
    st = L.role === "student",
    iv = (i) => E((L.v || {})[i] || ""),
    ch = (k, v, t) =>
      `<button class="btn sm ${L[k] === v ? "on" : "alt"}" onclick="sv();S.lg.${k}='${v}';render()">${t}</button>`;
  $("root").innerHTML =
    `<div class="card" style="max-width:460px;margin:24px auto"><div style="text-align:center"><div style="width:84px;height:84px;margin:0 auto">${leafIcon(0)}</div><h1>Sage</h1><small>Safety, health and calm for hostel life · CGC University</small></div>
<div class="chips" style="margin-top:12px">${ch("mode", "in", "Log in")}${ch("mode", "up", "Create account")}</div>
${up ? `<label>I am a</label><div class="chips">${ch("role", "student", "Student")}${ch("role", "warden", "Warden / staff")}${ch("role", "driver", "Ambulance driver")}</div><label for="lnm">Full name</label><input id="lnm" value="${iv("lnm")}" onkeydown="if(event.key==='Enter')auth()">` : ""}
<label for="lid">Roll number / staff ID</label><input id="lid" value="${iv("lid")}" autocapitalize="none" onkeydown="if(event.key==='Enter')auth()"><label for="lpw">Password</label><input id="lpw" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')auth()">
${up && st ? `<label for="lbk">Hostel block</label><input id="lbk" placeholder="e.g. Block B" value="${iv("lbk")}" onkeydown="if(event.key==='Enter')auth()"><label for="lrm">Room number</label><input id="lrm" value="${iv("lrm")}" onkeydown="if(event.key==='Enter')auth()"><label for="lgp">Guardian phone</label><input id="lgp" inputmode="tel" value="${iv("lgp")}" onkeydown="if(event.key==='Enter')auth()">` : ""}

<button class="btn" style="width:100%;margin-top:8px" onclick="auth()">${up ? "Create account" : "Log in"}</button><div id="lmsg" class="warn r" style="display:none"></div><p class="sm" style="margin-top:10px">${fdb ? "Live sync is on." : "Demo mode: data stays in this browser until the Firebase key is added."} In danger, call 112 or 108.</p>
<details style="margin-top:12px;border-top:1px solid var(--bd);padding-top:10px">
  <summary style="font-size:16px;color:var(--ac)">⚡ Hackathon Demo Accounts (1-Click Login · PW: 1234)</summary>
  <p class="sm" style="margin:6px 0"><b>Demo build:</b> each role only loads its own data. Database-level access rules (Firebase sign-in + Firestore rules) are planned before launch. SOS auto-dial is switched off for the demo.</p>
  <p class="sm" style="margin:6px 0">Tap any account below to log in immediately, or type the ID with password <b>1234</b>:</p>
  <div style="margin:6px 0"><b>🏢 Wardens & Staff</b><div class="chips">
    <button class="btn alt sm" onclick="quickDemoLogin('warden_chief')">Chief Warden (WARDEN/CHIEF)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('warden_bh1')">Boys H1 Warden (WARDEN/BH1)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('warden_gh1')">Girls H1 Warden (WARDEN/GH1)</button>
  </div></div>
  <div style="margin:6px 0"><b>🚑 Ambulance Drivers</b><div class="chips">
    <button class="btn alt sm" onclick="quickDemoLogin('driver_amb1')">Driver Day (DRIVER/AMB1)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('driver_amb2')">Driver Night (DRIVER/AMB2)</button>
  </div></div>
  <div style="margin:6px 0"><b>🎓 Students (4 Hostels · 8 Students)</b><div class="chips">
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_101')">Aarav · BH1 (CGC/2026/101)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_102')">Rohan · BH1 (CGC/2026/102)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_201')">Harpreet · BH2 (CGC/2026/201)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_202')">Vikram · BH2 (CGC/2026/202)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_301')">Ananya · GH1 (CGC/2026/301)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_302')">Simran · GH1 (CGC/2026/302)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_401')">Ishita · GH2 (CGC/2026/401)</button>
    <button class="btn alt sm" onclick="quickDemoLogin('cgc_2026_402')">Tanya · GH2 (CGC/2026/402)</button>
  </div></div>
  <button class="btn sm" style="width:100%;margin-top:6px" onclick="seedDemoData(true)">🔄 Reset / Reload All 15 Demo Accounts & Sample Data</button>
</details></div>`;
}
function saveUser(u) {
  const U = LS.g("users", {});
  U[u.id] = u;
  LS.s("users", U);
  if (fdb)
    fdb
      .collection("users")
      .doc(u.id)
      .set(u)
      .catch((e) => toast("Could not sync profile: " + e.message));
}
async function auth() {
  const id = $("lid").value.trim().toLowerCase().replace(/\//g, "_"),
    pw = $("lpw").value,
    U = LS.g("users", {}),
    m = (t) => {
      const e = $("lmsg");
      e.style.display = "block";
      e.textContent = t;
    },
    L = S.lg;
  if (!id || !pw) return m("Enter your ID and password.");
  let ex = U[id];
  if (fdb) {
    try {
      const d = await fdb.collection("users").doc(id).get();
      if (d.exists) {
        ex = d.data();
        U[id] = ex;
        LS.s("users", U);
      }
    } catch (e) {}
  }
  if (L.mode === "up") {
    const n = $("lnm").value.trim();
    if (!n) return m("Enter your full name.");
    if (ex) return m("This ID already exists. Log in instead.");
    if (REQUIRE_STAFF_LIST && L.role !== "student" && fdb) {
      try {
        const d = await fdb.collection("staff").doc(id).get();
        if (!d.exists) return m("This staff ID is not on the approved list. Ask the chief warden office to add it.");
      } catch (e) {
        return m("Could not verify staff ID. Check your connection.");
      }
    }

    if (L.role === "student" && (!$("lbk").value.trim() || !$("lrm").value.trim()))
      return m("Enter your block and room so help can reach you.");
    saveUser({
      id,
      name: n,
      pw: hash(pw),
      role: L.role,
      blk: $("lbk") ? $("lbk").value.trim() : "",
      room: $("lrm") ? $("lrm").value.trim() : "",
      gp: $("lgp") ? $("lgp").value.trim() : "",
      med: "",
      created: Date.now(),
    });
  } else if (!ex || !chk(ex.pw, pw)) return m("ID or password is not correct.");
  LS.s("sess", id);
  boot();
}
function boot() {
  seedDemoData(false);
  me = LS.g("users", {})[LS.g("sess", "")] || null;
  tab = !me ? "" : me.role === "student" ? "home" : me.role === "warden" ? "live" : "trip";
  render();
}
const logout = () => {
  if (typeof chat !== "undefined") chat.length = 0;
  if (typeof CS !== "undefined") CS = null;
  if (typeof jtv !== "undefined") jtv = "";
  S.ciDraft = "";
  S.repDraft = {};
  S.pimg = "";
  S.wz = { i: 0, d: {} };
  LS.s("chat_history", []);
  LS.s("journal_draft", "");
  LS.s("sess", "");
  me = null;
  render();
};


/* ----- Hackathon Demo Database Seeder (4 Hostels, 8 Students, 5 Wardens, 2 Drivers) ----- */
const DEMO_USERS = [
  // Boys Hostel 1 (Block A - Boys) - 2 students
  { id: "cgc_2026_101", origId: "CGC/2026/101", name: "Aarav Sharma", role: "student", blk: "Boys Hostel 1 (Block A)", room: "101", gp: "9814011101", course: "BCA AI & ML", yr: "1st year", med: "Mild dust allergy, carries cetirizine", mp: "f", mn: "Bolt", ic: "bolt" },
  { id: "cgc_2026_102", origId: "CGC/2026/102", name: "Rohan Verma", role: "student", blk: "Boys Hostel 1 (Block A)", room: "104", gp: "9814011102", course: "B.Tech CSE", yr: "2nd year", med: "Asthma — uses Asthalin inhaler", mp: "b", mn: "Flutter", ic: "star" },

  // Boys Hostel 2 (Block B - Boys) - 2 students
  { id: "cgc_2026_201", origId: "CGC/2026/201", name: "Harpreet Gill", role: "student", blk: "Boys Hostel 2 (Block B)", room: "110", gp: "9872022201", course: "B.Tech CSE", yr: "2nd year", med: "", mp: "f", mn: "bandit", ic: "star" },
  { id: "cgc_2026_202", origId: "CGC/2026/202", name: "Vikramaditya Nair", role: "student", blk: "Boys Hostel 2 (Block B)", room: "208", gp: "9872022202", course: "BCA AI & ML", yr: "1st year", med: "Type-1 Diabetes (insulin in mini-fridge)", mp: "b", mn: "Nova", ic: "bolt" },

  // Girls Hostel 1 (Block C - Girls) - 2 students
  { id: "cgc_2026_301", origId: "CGC/2026/301", name: "Ananya Kapoor", role: "student", blk: "Girls Hostel 1 (Block C)", room: "102", gp: "9815033301", course: "BCA AI & ML", yr: "1st year", med: "Penicillin allergy", mp: "b", mn: "Mochi", ic: "flower" },
  { id: "cgc_2026_302", origId: "CGC/2026/302", name: "Simranjit Kaur", role: "student", blk: "Girls Hostel 1 (Block C)", room: "204", gp: "9815033302", course: "B.Tech CSE", yr: "3rd year", med: "", mp: "f", mn: "Coco", ic: "heart" },

  // Girls Hostel 2 (Block D - Girls) - 2 students
  { id: "cgc_2026_401", origId: "CGC/2026/401", name: "Ishita Joshi", role: "student", blk: "Girls Hostel 2 (Block D)", room: "105", gp: "9876044401", course: "B.Tech CSE", yr: "2nd year", med: "Lactose intolerance", mp: "b", mn: "Sunny", ic: "flower" },
  { id: "cgc_2026_402", origId: "CGC/2026/402", name: "Tanya Malhotra", role: "student", blk: "Girls Hostel 2 (Block D)", room: "211", gp: "9876044402", course: "BCA AI & ML", yr: "1st year", med: "Asthma — carries salbutamol inhaler", mp: "f", mn: "Noodle", ic: "heart" },

  // Wardens (4 Hostel Wardens + 1 Chief Warden)
  { id: "warden_bh1", origId: "WARDEN/BH1", name: "Dr. Rajinder Singh (Boys H1)", role: "warden", blk: "Boys Hostel 1 (Block A)", room: "Warden Office G-01", gp: "8872048001", med: "" },
  { id: "warden_bh2", origId: "WARDEN/BH2", name: "Prof. Sandeep Kumar (Boys H2)", role: "warden", blk: "Boys Hostel 2 (Block B)", room: "Warden Office G-02", gp: "9056764083", med: "" },
  { id: "warden_gh1", origId: "WARDEN/GH1", name: "Dr. Gurpreet Kaur (Girls H1)", role: "warden", blk: "Girls Hostel 1 (Block C)", room: "Warden Office G-01", gp: "9878100264", med: "" },
  { id: "warden_gh2", origId: "WARDEN/GH2", name: "Ms. Sunita Sharma (Girls H2)", role: "warden", blk: "Girls Hostel 2 (Block D)", room: "Warden Office G-02", gp: "9875919580", med: "" },
  { id: "warden_chief", origId: "WARDEN/CHIEF", name: "Col. H.S. Grewal (Chief Warden)", role: "warden", blk: "Central Hostel Admin", room: "Chief Office 101", gp: "9781925261", med: "" },

  // Ambulance Drivers (2 Shifts)
  { id: "driver_amb1", origId: "DRIVER/AMB1", name: "Balwinder Singh (Amb #1 - Day)", role: "driver", blk: "Campus Medical Unit", room: "Bay 1", gp: "9815100108", med: "" },
  { id: "driver_amb2", origId: "DRIVER/AMB2", name: "Sukhwinder Pal (Amb #2 - Night)", role: "driver", blk: "Campus Medical Unit", room: "Bay 2", gp: "9815100109", med: "" }
];

const OLD_DEMO_IDS = ["103", "104", "203", "204", "303", "304", "403", "404"].map((n) => "cgc_2026_" + n);
function seedDemoData(forceToast) {
  const U = LS.g("users", {});
  OLD_DEMO_IDS.forEach((id) => delete U[id]);
  const pwHash = hash("1234");
  const now = Date.now();
  DEMO_USERS.forEach((u, idx) => {
    if (!U[u.id] || forceToast) {
      U[u.id] = {
        ...u,
        pw: pwHash,
        created: now - (30 - idx) * 86400000,
        pets: (idx % 4) + 1
      };
      if (fdb && forceToast) {
        try { fdb.collection("users").doc(u.id).set(U[u.id]); } catch(e) {}
      }
    }
  });
  LS.s("users", U);

  // Seed realistic sample check-in logs, tickets, and 1 closed audit alert if empty or forced
  const existingLogs = LS.g("logs", []).filter((l) => !OLD_DEMO_IDS.includes(l.uid));
  if (!existingLogs.length || forceToast) {
    const sampleLogs = [];
    const students = DEMO_USERS.filter((u) => u.role === "student");
    students.forEach((st, idx) => {
      for (let d = 0; d < 5; d++) {
        const t = now - d * 86400000 - (idx * 1800000);
        const mood = (idx + d) % 5;
        const sleep = 5 + ((idx + d) % 4);
        const water = 4 + ((idx * 2 + d) % 5);
        const move = 15 + ((idx * 10 + d * 5) % 45);
        const meals = 2 + ((idx + d) % 2);
        const screen = 3 + ((idx + d) % 6);
        const stress = 1 + ((idx + d) % 3);
        sampleLogs.push({
          id: "dm_lg_" + st.id + "_" + d,
          t,
          type: "checkin",
          uid: st.id,
          n: st.name,
          blk: st.blk,
          mood,
          sleep,
          water,
          move,
          meals,
          screen,
          stress,
          sym: "none",
          win: d === 0 ? "Completed DSA assignment on time" : ""
        });
      }
    });
    LS.s("logs", sampleLogs);
    D.logs = sampleLogs;
  }

  const existingTickets = LS.g("tickets", []);
  if (!existingTickets.length || forceToast) {
    const sampleTix = [
      { id: "tix_demo_1", t: now - 172800000, ty: "Unlit stairwell", l: "Boys Hostel 1 (Block A), 2nd floor North stairs", d: "Tube light flickering and dark at night", uid: "cgc_2026_101", n: "Aarav Sharma", img: "", done: 0 },
      { id: "tix_demo_2", t: now - 259200000, ty: "Water leak", l: "Girls Hostel 1 (Block C), 3rd floor water cooler", d: "Drain pipe leaking near corridor", uid: "cgc_2026_301", n: "Ananya Kapoor", img: "", done: 0 },
      { id: "tix_demo_3", t: now - 432000000, ty: "Broken lock", l: "Boys Hostel 2 (Block B), Room 208 balcony door", d: "Latch jammed", uid: "cgc_2026_202", n: "Vikramaditya Nair", img: "", done: now - 86400000 }
    ];
    LS.s("tickets", sampleTix);
    D.tickets = sampleTix;
  }

  const existingAlerts = LS.g("alerts", []);
  if (!existingAlerts.length || forceToast) {
    const t0 = now - 5400000;
    const sampleAlerts = [
      {
        id: "sos_demo_past1",
        t: t0,
        n: "Rohan Verma",
        uid: "cgc_2026_102",
        blk: "Boys Hostel 1 (Block A)",
        room: "104",
        gp: "9814011102",
        med: "Asthma — uses Asthalin inhaler",
        ph: "",
        type: "Medical",
        loc: "Boys Hostel 1 (Block A), Room 104",
        gps: "30.6792, 76.6062",
        ack: t0 + 28000,
        disp: t0 + 45000,
        reach: t0 + 210000,
        done: t0 + 620000,
        out: "Patient handed over",
        esc: 0,
        vol: 3
      }
    ];
    LS.s("alerts", sampleAlerts);
    D.alerts = sampleAlerts;
  }

  if (forceToast) {
    toast("Demo database loaded (8 students, 5 wardens, 2 drivers)!");
    render();
  }
}

function quickDemoLogin(id) {
  seedDemoData(false);
  LS.s("sess", id);
  boot();
  toast("Logged in as " + (me ? me.name : id));
}
