/* Student tabs: Home, Campus (contacts + helplines), Report (maintenance tickets). */
V.home = () => {
  const low = lowNow(),
    lg = myLogs()[0],
    h = new Date().getHours(),
    gr = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening",
    done = myLogs("checkin").some((l) => dk(l.t) === dk(Date.now()));
  return `<div class="card" style="border-color:var(--red)"><h2>Emergency</h2><p>Medical emergency, fire or a safety threat? Alert your warden with your room and location.</p><button class="sosbig" onclick="sendSOS()">Send SOS</button><div class="chips" style="margin-top:8px"><a class="btn red sm" href="tel:108">Call 108 ambulance</a><a class="btn red sm" href="tel:112">Call 112</a>${tel(C.chief, "Chief warden")}</div></div>
<div class="card mrow">${mascot(84)}<div><h2>${gr}, ${E(me.name.split(" ")[0])}</h2>${lvlBar()}<div class="bubble">${low ? "You have had a hard few days. Talking to someone helps. The counsellor is free and confidential." : done ? "Check-in done today. Take a short walk or drink some water." : "A one-minute check-in helps you and your warden notice problems early."}</div></div></div>
${low ? `<div class="card"><h2>Support is close by</h2>${helplines}<p class="sm">All free and confidential. Tele-MANAS and KIRAN run 24×7.</p></div>` : ""}
${quests()}<div class="grid"><div class="card"><h2>Today</h2><div class="row"><span>Streak</span><b>${streak()} day${streak() === 1 ? "" : "s"}</b></div><div class="row"><span>Check-in</span><span class="pill ${done ? "" : "a"}">${done ? "Done" : "Not yet"}</span></div><div class="row"><span>Last mood</span><b>${lg && lg.mood != null ? MO[lg.mood][0] + " " + MO[lg.mood][1] : "—"}</b></div><button class="btn" onclick="tab='${done ? "calm" : "checkin"}';S.mt='journal';render()">${done ? "Write a journal entry" : "Start check-in"}</button></div>
<div class="card"><h2>Quick help</h2>${[
    ["I cannot sleep", "calm"],
    ["I am stressed about exams", "calm"],
    ["I feel homesick or lonely", "calm"],
    ["Something is unsafe in my hostel", "report"],
    ["Who do I call at CGC?", "campus"],
  ]
    .map(
      ([t, k]) =>
        `<div class="row"><span>${t}</span><button class="btn alt sm" onclick="tab='${k}';render()">Open</button></div>`,
    )
    .join("")}</div>
<div class="card"><h2>Medical room</h2><p>The campus has a 24/7 medical room with a nurse and an emergency ambulance. Serious cases are taken to partner hospitals in Jhanjeri and Mohali.</p><button class="btn alt" onclick="tab='campus';render()">See all contacts</button></div></div>`;
};
const campusBase = () => `<div class="grid"><div class="card"><h2>Who to call</h2>${[
  ["Medical emergency", "108 / campus ambulance", ""],
  ["Any emergency", "112", ""],
  ["Chief warden", C.chief],
  ["Boys’ warden", C.wb],
  ["Girls’ warden", C.wg],
  ["Boys’ hostel office", C.boys[0]],
  ["Girls’ hostel office", C.girls[0]],
  ["Counsellor", C.couns],
  ["Psychologist", C.psy],
]
  .map(([a, b]) => `<div class="row"><span>${a}</span>${/^\d/.test(b) || b === "112" ? telA(b) : `<b>${b}</b>`}</div>`)
  .join("")}</div>
<div class="card"><h2>On campus</h2><p><b>Address:</b> ${C.addr}</p><p><b>Medical room:</b> 24/7 with a qualified nurse.</p><p><b>Ambulance:</b> 24/7 emergency ambulance on campus.</p><p><b>Hospitals:</b> Tie-ups in Jhanjeri and Mohali.</p></div>
<div class="card"><h2>Stay safe in your hostel</h2>${[
  ["Know your exits", "Find the nearest fire exit and stairwell on your floor on day one."],
  ["Lock and tell", "Lock your room at night. Tell a friend when you go out late."],
  ["Electrical safety", "Do not overload sockets. Report sparking or exposed wires in Report."],
  ["If someone collapses", "Press SOS, call 108, and use the first aid steps shown after you send the alert."],
]
  .map((x) => `<details><summary>${x[0]}</summary><p>${x[1]}</p></details>`)
  .join("")}</div></div>`;
function helpDir() {
  const G = [
    [
      "🧠 Mental health (free, 24×7)",
      [
        ["Tele-MANAS", "14416", "Govt. mental health helpline. Also 1800-891-4416"],
        ["KIRAN", "18005990019", "24×7, many languages"],
        ["Vandrevala Foundation", "9999666555", "Call or WhatsApp"],
        ["NIMHANS", "08046110007", "Bengaluru mental health helpline"],
      ],
    ],
    [
      "🚨 Emergency",
      [
        ["Emergency (all services)", "112", ""],
        ["Ambulance", "108", ""],
        ["Police", "100", ""],
        ["Fire", "101", ""],
        ["Health helpline", "104", "Govt. health advice"],
      ],
    ],
    [
      "🛡️ Safety and harassment",
      [
        ["Anti-ragging (UGC)", "18001805522", "24×7, toll free"],
        ["Women helpline", "181", ""],
        ["Women in distress (police)", "1091", ""],
        ["NCW WhatsApp", "7827170170", "Women’s complaints"],
        ["Cyber crime", "1930", "Online fraud, abuse, blackmail"],
        ["Child helpline", "1098", "For anyone under 18"],
        ["SC/ST atrocities", "14566", "Caste-based violence or bias"],
      ],
    ],
  ];
  return `<div class="card"><h2>More helplines</h2><p class="sm">Free and confidential unless noted. Tap to call. You are never a burden for asking.</p>${G.map(([t, L]) => `<details><summary>${t}</summary>${L.map(([n, v, d]) => `<div class="row"><span><b>${n}</b>${d ? `<br><small>${d}</small>` : ""}</span>${telA(v, v)}</div>`).join("")}</details>`).join("")}</div>`;
}
V.campus = () => campusBase() + helpDir();
V.report = () => {
  const T = D.tickets.filter((t) => t.uid === me.id),
    rd = S.repDraft || {},
    hzVal = rd.hz || "Ceiling fan",
    hlVal = rd.hl !== undefined ? rd.hl : (me.blk ? me.blk + ", " : ""),
    hdVal = rd.hd || "";
  return `<div class="grid"><div class="card"><h2>Report a hazard</h2><label for="hz">What is wrong?</label><select id="hz" onchange="S.repDraft={...(S.repDraft||{}),hz:this.value}">${["Ceiling fan", "Broken lock", "Unlit stairwell", "Exposed wiring", "Balcony or railing", "Water leak", "Other"].map((x) => `<option ${x === hzVal ? "selected" : ""}>${x}</option>`).join("")}</select><label for="hl">Where?</label><input id="hl" placeholder="e.g. Block B, 2nd floor corridor" value="${E(hlVal)}" oninput="S.repDraft={...(S.repDraft||{}),hl:this.value}"><label for="hd">Details</label><textarea id="hd" style="min-height:70px" oninput="S.repDraft={...(S.repDraft||{}),hd:this.value}">${E(hdVal)}</textarea><label for="hp">Photo (optional)</label><input id="hp" type="file" accept="image/*" capture="environment" onchange="pimg(this)">${S.pimg ? `<img src="${E(S.pimg)}" alt="Preview" style="max-width:100%;border-radius:8px;margin-bottom:8px">` : ""}<button class="btn" onclick="subT()">Create maintenance ticket</button></div>
<div class="card"><h2>My tickets</h2>${T.length ? T.map((x) => `<div class="row"><span><b>${E(x.ty)}</b><br><small>${E(x.l)} · ${fd(x.t)}</small></span><span class="pill ${x.done ? "" : "a"}">${x.done ? "Fixed" : "Open"}</span></div>`).join("") : "<p>No tickets yet. Reported hazards are sent to the warden and tracked here until fixed.</p>"}</div></div>`;
};
function pimg(el) {
  const fl = el.files[0];
  if (!fl) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 640 / im.width),
        c = document.createElement("canvas");
      c.width = im.width * k;
      c.height = im.height * k;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      S.pimg = c.toDataURL("image/jpeg", 0.6);
      S.hz = [$("hz").value, $("hl").value, $("hd").value];
      render();
      $("hz").value = S.hz[0];
      $("hl").value = S.hz[1];
      $("hd").value = S.hz[2];
    };
    im.src = r.result;
  };
  r.readAsDataURL(fl);
}
function subT() {
  const l = $("hl").value.trim();
  if (!l) return toast("Add the location");
  add("tickets", { ty: $("hz").value, l, d: $("hd").value.trim(), uid: me.id, n: me.name, img: S.pimg, done: 0 });
  S.pimg = "";
  S.repDraft = {};
  toast("Ticket created");
  render();
}
