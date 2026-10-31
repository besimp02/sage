/* Buddy: XP and levels, quests, badges, care state, and the Profile tab (pixel card + editable details + customise). */
const LV = [0, 40, 100, 200, 350, 550, 800],
  LT = ["Sleepy seed", "Sprout", "Little buddy", "Brave buddy", "Cozy champion", "Sage friend", "Legend"],
  ACC = ["", "🌱", "🍀", "⭐", "👑", "🌈", "🏆"];
function xp() {
  if (!me || me.role !== "student") return 0;
  return myLogs("checkin").length * 20 + myLogs("journal").length * 10 + streak() * 5 + (me.pets || 0) * 5;
}
function lvlOf(x) {
  let n = 0;
  LV.forEach((v, i) => {
    if (x >= v) n = i;
  });
  const lo = LV[n],
    hi = LV[n + 1];
  return { n: n + 1, t: LT[n], a: ACC[n], x, lo, hi, p: hi ? (x - lo) / (hi - lo) : 1 };
}
function acc(px) {
  if (!me || me.role !== "student" || px < 60) return "";
  const a = lvlOf(xp()).a;
  const b = bstate().e;
  return (
    (a ? `<span class="acc" style="font-size:${Math.round(px / 3)}px">${a}</span>` : "") +
    (b ? `<span class="acc" style="left:-4px;right:auto;font-size:${Math.round(px / 3.4)}px">${b}</span>` : "")
  );
}
function lvlBar() {
  const l = lvlOf(xp());
  return `<div style="margin:4px 0 8px"><b>Lv ${l.n} · ${l.t}</b><div class="bar0"><div style="width:${Math.round(l.p * 100)}%"></div></div><small>${l.hi ? l.hi - l.x + " XP to the next level" : "Max level reached"}</small></div>`;
}
function quests() {
  const L = myLogs("checkin"),
    t = L.find((l) => dk(l.t) === dk(Date.now())),
    j = myLogs("journal").some((l) => dk(l.t) === dk(Date.now())),
    Q = [
      ["Do your daily check-in", "+20 XP", !!t, "checkin"],
      ["Write a journal entry", "+10 XP", j, "calm"],
      ["Drink 6+ glasses of water", "", !!t && t.water >= 6],
      ["Sleep 7+ hours", "", !!t && t.sleep >= 7],
      ["Move 20+ minutes", "", !!t && t.move >= 20],
    ],
    d = Q.filter((q) => q[2]).length;
  return `<div class="card"><h2>Today’s quests</h2><div class="bar0"><div style="width:${(d / Q.length) * 100}%"></div></div>${Q.map((q) => `<div class="row"><span>${q[2] ? "✅" : "⬜"} ${q[0]}</span>${q[1] ? `<small>${q[1]}</small>` : ""}${!q[2] && q[3] ? `<button class="btn alt sm" onclick="tab='${q[3]}';render()">Go</button>` : ""}</div>`).join("")}<small>${d === Q.length ? "All done. Your buddy is proud of you!" : d + " of " + Q.length + " done"}</small></div>`;
}
function best() {
  const ds = [...new Set(myLogs("checkin").map((l) => dk(l.t)))].sort();
  let b = 0,
    c = 0,
    p = null;
  ds.forEach((d) => {
    c = p && new Date(d) - new Date(p) === 864e5 ? c + 1 : 1;
    b = Math.max(b, c);
    p = d;
  });
  return b;
}
function badges() {
  const L = myLogs("checkin"),
    B = best(),
    x = lvlOf(xp()).n,
    A = [
      ["🌱", "First check-in", L.length >= 1],
      ["🔥", "3-day streak", B >= 3],
      ["🌟", "7-day streak", B >= 7],
      ["📓", "First journal entry", myLogs("journal").length >= 1],
      ["💧", "Hydration hero", L.some((l) => l.water >= 8)],
      ["😴", "Well rested", L.some((l) => l.sleep >= 8)],
      ["🏃", "On the move", L.some((l) => l.move >= 30)],
      ["🏅", "Level 5", x >= 5],
    ];
  return `<div class="card"><h2>Buddy level</h2>${lvlBar()}<h3>Badges</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${A.map((a) => `<div style="text-align:center;opacity:${a[2] ? 1 : 0.3};filter:${a[2] ? "none" : "grayscale(1)"}"><div style="font-size:30px">${a[0]}</div><small>${a[1]}</small></div>`).join("")}</div></div>`;
}

/* ===== v6: buddy care, fireflies ===== */
const todayCI = () => myLogs("checkin").find((l) => dk(l.t) === dk(Date.now()));
function bstate() {
  const t = todayCI();
  if (!t) return { e: "", txt: "Check in so I know how you are doing." };
  if (t.sleep < 6) return { e: "💤", txt: "I am sleepy. Rest well tonight?" };
  if (t.water < 4) return { e: "💧", txt: "I am thirsty. Water time!" };
  if (t.mood <= 1) return { e: "🫂", txt: "I am right here with you." };
  return { e: "✨", txt: "We are doing great today!" };
}
function glow(px) {
  if (px < 60 || !me || me.role !== "student") return "none";
  const n = lvlOf(xp()).n;
  return n >= 3 ? `drop-shadow(0 0 ${n * 2}px rgba(255,214,102,.75))` : "none";
}
function petB() {
  me.pets = (me.pets || 0) + 1;
  me.petd = dk(Date.now());
  saveUser(me);
  snd("squeak");
  boom();
  render();
}
function buddyCard() {
  const l = lvlOf(xp()),
    b = bstate(),
    t = todayCI(),
    nm = E(me.mn || (mk() === "b" ? "Flutter" : "Ferris")),
    pet = me.petd === dk(Date.now()),
    bar = (n, v) =>
      `<div class="row" style="padding:4px 0"><span>${n}</span><div class="bar0" style="width:55%;margin:0"><div style="width:${v}%"></div></div></div>`;
  return `<div class="card" style="text-align:center"><h2>${nm}</h2><div style="width:120px;height:120px;margin:4px auto 10px">${mascot(120)}</div><div class="bubble" style="margin:8px 0">${b.txt}</div>${lvlBar()}${bar("Mood", t ? (t.mood + 1) * 20 : 0)}${bar("Energy", t ? Math.round(Math.min(t.sleep / 8, 1) * 100) : 0)}${bar("Hydration", t ? Math.round(Math.min(t.water / 8, 1) * 100) : 0)}<button class="btn" style="margin-top:8px" ${pet ? "disabled" : ""} onclick="petB()">${pet ? "Petted today 💖" : "Pet " + nm + " (+5 XP)"}</button><small style="display:block;margin-top:6px">${LV[l.n] ? "Next: " + ACC[l.n] + " at Lv " + (l.n + 1) : "Fully grown"}</small></div>`;
}

/* ----- Profile ----- */
const pixelCard = () => {
  const c = myLogs("checkin").slice(0, 7),
    av = (k) => (c.length ? c.reduce((p, x) => p + (+x[k] || 0), 0) / c.length : 0),
    T = (a) => Math.round(Math.max(0, Math.min(a, 1)) * 10),
    hp = c.length ? Math.round(c.reduce((p, x) => p + score(x), 0) / c.length) : 0,
    bl = (l, n, s, col) =>
      `<div class="px" style="margin-top:8px">${l}</div><div class="hp" style="color:${col}">${[...Array(10)].map((_, i) => `<i class="${i < n ? "f" : ""}">${s}</i>`).join("")}</div>`;
  return `<div class="pxc"><div style="display:flex;gap:14px;align-items:center"><div class="avt">${me.ph ? `<img src="${E(me.ph)}" alt="Your photo" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : mascot(88)}</div><div class="pxn"><h2 style="margin:0">${E(me.name)}</h2>ID ${E(me.id)}<br>${E(me.blk)} · Room ${E(me.room)}<br>Guardian ${E(me.gp || "—")}${me.course ? `<br>${E(me.course)}${me.yr ? " · " + E(me.yr) : ""}` : ""}${me.bio ? `<br><small>${E(me.bio)}</small>` : ""}</div></div><hr>${bl("HP · wellness " + hp + "/100", Math.round(hp / 10), "♥", "#ff5d7a")}${bl("MP · sleep", T(av("sleep") / 8), "◆", "#6aa0ff")}${bl("WATER", T(av("water") / 8), "●", "#4fd6e8")}${bl("STAMINA · movement", T(av("move") / 30), "▲", "#ffc247")}${bl("CALM", c.length ? T((4 - av("stress")) / 3) : 0, "✿", "#b58cff")}${bl("FUEL · meals", T(av("meals") / 3), "■", "#6fd987")}
<hr><div class="row"><span>Streak</span><b>${streak()} days ${ICN()}</b></div><div class="row"><span>Check-ins</span><b>${myLogs("checkin").length}</b></div><div class="row"><span>Average sleep</span><b>${av("sleep").toFixed(1)} h</b></div><div class="row"><span>Average screen time</span><b>${av("screen").toFixed(1)} h</b></div><p class="sm">A wellness score from your check-ins. Not medical advice.</p></div>`;
};
V.me = () => {
  const mp = mk(),
    on = me.bgx == null && !me.bgu,
    ac = me.ac || "#4a6f8a";
  return `<div class="grid">${pixelCard()}
${badges()}<div class="card"><h2>My profile</h2><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><div class="avt" style="width:96px;height:96px">${me.ph ? `<img src="${E(me.ph)}" alt="Your photo" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : mascot(80)}</div><div><label for="phf" class="btn alt sm" style="cursor:pointer">${me.ph ? "Change photo" : "Add photo"}</label><input id="phf" type="file" accept="image/*" style="display:none" onchange="phup(this)">${me.ph ? `<button class="btn alt sm" onclick="phrm()">Remove</button>` : ""}<p class="sm" style="margin:6px 0 0">Your warden sees your photo when you press SOS, so help can recognise you.</p></div></div><label for="pn">Full name</label><input id="pn" value="${E(me.name)}"><label for="pb">Hostel block</label><input id="pb" value="${E(me.blk)}"><label for="pr">Room number</label><input id="pr" value="${E(me.room)}"><label for="pg">Guardian phone</label><input id="pg" inputmode="tel" value="${E(me.gp || "")}"><label for="pcs">Course / department</label><input id="pcs" value="${E(me.course || "")}" placeholder="e.g. B.Tech CSE"><label for="pyr">Year</label><input id="pyr" value="${E(me.yr || "")}" placeholder="e.g. 2nd year"><label for="pbio">About me (optional)</label><textarea id="pbio" maxlength="140" style="min-height:60px" placeholder="A line about you">${E(me.bio || "")}</textarea><label for="pm">Medical notes (allergies, conditions, medicines)</label><textarea id="pm" style="min-height:70px">${E(me.med || "")}</textarea><p class="sm">Shared with your warden and the ambulance only when you press SOS.</p><button class="btn" onclick="saveD()">Save details</button>
<details><summary>Change password</summary><label for="pw0">Current password</label><input id="pw0" type="password"><label for="pw1">New password</label><input id="pw1" type="password"><button class="btn sm" onclick="savePw()">Update password</button></details><button class="btn alt sm" style="margin-top:8px" onclick="dl()">Download my data</button></div>
<div class="card"><h2>Make it yours</h2><h3>Buddy</h3><div class="chips"><button class="pick ${mp === "b" ? "on" : ""}" onclick="setP('mp','b')"><div style="width:80px;height:80px">${BF}</div>Butterfly</button><button class="pick ${mp === "f" ? "on" : ""}" onclick="setP('mp','f')"><div style="width:80px;height:80px">${FR}</div>Ferret</button></div><label for="mn">Buddy name</label><input id="mn" value="${E(me.mn || "")}" onchange="setP('mn',this.value)">
<h3>Streak icon</h3><div class="chips">${Object.entries(IC)
    .map(
      ([k, v]) =>
        `<button class="btn ${(me.ic || "flower") === k ? "on" : "alt"}" style="font-size:22px" onclick="setP('ic','${k}')">${v}</button>`,
    )
    .join("")}</div>
<h3>Colour</h3><div class="chips">${SW.map(([n, c]) => `<button class="sw ${me.ac === c || (!me.ac && c === "#4a6f8a") ? "on" : ""}" style="background:${c}" title="${n}" aria-label="${n}" onclick="setP('ac','${c}')"></button>`).join("")}</div><label for="pc">Or pick your own</label><input type="color" id="pc" value="${ac}" onchange="setP('ac',this.value)">
<h3>Background</h3><div class="thumbs">${BG.map((u, i) => `<img src="${u}" alt="Background ${i + 1}" class="${me.bgx === i && !me.bgu ? "on" : ""}" onclick="setBg(${i})">`).join("")}</div>${me.bgu ? `<img src="${E(me.bgu)}" alt="Your background" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px">` : ""}<label for="bgf">Upload your own</label><input id="bgf" type="file" accept="image/*" onchange="bgup(this)"><div class="chips"><button class="btn sm ${on ? "on" : "alt"}" onclick="setBg(null)">Default</button><button class="btn sm ${me.bgx === -1 && !me.bgu ? "on" : "alt"}" onclick="setBg(-1)">Plain</button><button class="btn sm alt" onclick="setP('deco',me.deco===0?1:0)">Stickers: ${me.deco === 0 ? "off" : "on"}</button></div></div></div>`;
};
function setP(k, v) {
  me[k] = v;
  saveUser(me);
  render();
}
function saveD() {
  const v = (i) => $(i).value.trim();
  if (!v("pn") || !v("pb") || !v("pr")) return toast("Name, block and room are required");
  if (v("pg") && !/^[\d+\s-]{8,15}$/.test(v("pg"))) return toast("Enter a valid guardian phone number");
  Object.assign(me, {
    name: v("pn"),
    blk: v("pb"),
    room: v("pr"),
    gp: v("pg"),
    med: v("pm"),
    course: v("pcs"),
    yr: v("pyr"),
    bio: v("pbio"),
  });
  saveUser(me);
  toast("Details saved");
  render();
}
function savePw() {
  const a = $("pw0").value,
    b = $("pw1").value;
  if (!chk(me.pw, a)) return toast("Current password is not correct");
  if (b.length < 4) return toast("Use at least 4 characters");
  me.pw = hash(b);
  saveUser(me);
  toast("Password changed");
  render();
}
function dl() {
  const p = { ...me };
  delete p.pw;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify({ profile: p, logs: myLogs() }, null, 1)], { type: "application/json" }),
  );
  a.download = "my-sage-data.json";
  a.click();
}
function phup(el) {
  const f = el.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const z = Math.min(im.width, im.height),
        c = document.createElement("canvas");
      c.width = c.height = 160;
      c.getContext("2d").drawImage(im, (im.width - z) / 2, (im.height - z) / 2, z, z, 0, 0, 160, 160);
      me.ph = c.toDataURL("image/jpeg", 0.72);
      saveUser(me);
      toast("Photo saved");
      render();
    };
    im.onerror = () => toast("Could not read that image");
    im.src = r.result;
  };
  r.readAsDataURL(f);
}
function phrm() {
  delete me.ph;
  saveUser(me);
  toast("Photo removed");
  render();
}
