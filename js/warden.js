/* Warden and driver tabs: live emergencies, audit, tickets, anonymous wellbeing, contacts, ambulance trip. */
const upA = (id, p) => upd("alerts", id, p),
  ackA = (id) => {
    upA(id, { ack: Date.now() });
    tab = "live";
    toast("Acknowledged. The student can see that help is on the way.");
  },
  reachA = (id) => upA(id, { reach: Date.now() }),
  handA = (id) => {
    setAmb("Available");
    upA(id, { done: Date.now(), out: "Patient handed over" });
  },
  callA = (id) => upA(id, { done: Date.now(), out: "108 called" });
function dispA(id) {
  const a = D.alerts.find((x) => x.id === id);
  if (!a) return toast("That alert is no longer active.");
  tab = "live"; /* the alarm screen closes, so land on the Live tab where the result is visible */
  if (D.amb !== "Available") {
    upA(id, { busy: 1, ack: a.ack || Date.now() });
    return toast("Ambulance is already on another trip. Alert acknowledged. Call 108 now, or mark the ambulance available.");
  }
  setAmb("On trip");
  upA(id, { ack: a.ack || Date.now(), disp: Date.now(), busy: 0 });
  toast("Ambulance dispatched to " + a.n + ". The driver and the student can now see it.");
}
const outs = (a) =>
  a.done
    ? a.out
    : a.reach
      ? "Ambulance reached"
      : a.disp
        ? "Ambulance dispatched"
        : a.ack
          ? "Acknowledged"
          : a.esc
            ? "Escalated"
            : "Awaiting";
V.live = () => {
  const act = D.alerts.filter((a) => !a.done),
    all = D.alerts,
    ak = all.map((a) => sec(a.t, a.ack)).filter((x) => x != null),
    avg = ak.length ? Math.round(ak.reduce((p, x) => p + x) / ak.length) : null;
  return `<div class="grid" style="margin-top:12px"><div class="card"><small>Active emergencies</small><div class="stat">${act.length}</div></div><div class="card"><small>Ambulance</small><div class="stat">${D.amb}</div>${D.amb !== "Available" ? `<button class="btn alt sm" onclick="setAmb('Available')">Mark available</button>` : ""}</div><div class="card"><small>Average time to acknowledge</small><div class="stat">${dur(avg)}</div></div></div>
<div class="card"><h2>Active emergencies</h2>${
    act.length
      ? act
          .map(
            (
              a,
            ) => `<div class="row" style="display:block">${a.ph ? `<img class="ph" src="${E(a.ph)}" alt="">` : ""}<b>${E(a.n)}</b> · ${E(a.type)} · ${E(a.loc)}${a.gps ? ` · <a href="https://maps.google.com/?q=${encodeURIComponent(a.gps)}" target="_blank" rel="noopener">GPS ${E(a.gps)}</a>` : ""}<br><small>Pressed ${f(a.t)} · Ack ${f(a.ack)} · Dispatched ${f(a.disp)} · Reached ${f(a.reach)}</small>${a.med ? `<br><b>Medical notes:</b> ${E(a.med)}` : ""}
${a.busy ? `<div class="warn r"><b>Ambulance is on another trip.</b> Call 108 now.</div>` : ""}${a.esc && !a.ack ? `<div class="warn r"><b>No acknowledgement in 2 minutes.</b> Call 108 / 112 and the chief warden.</div>` : ""}
<div>${a.ack ? "" : `<button class="btn sm" onclick="ackA('${E(a.id)}')">Acknowledge</button>`}${a.disp ? (a.reach ? `<button class="btn sm" onclick="handA('${E(a.id)}')">Patient handed over</button>` : `<button class="btn sm" onclick="reachA('${E(a.id)}')">Ambulance reached</button>`) : `<button class="btn red sm" onclick="dispA('${E(a.id)}')">Dispatch ambulance</button>`}<button class="btn alt sm" onclick="callA('${E(a.id)}')">108 called</button>${a.gp ? telA(a.gp, "Call guardian") : ""}${tel("108", "Call 108")}</div></div>`,
          )
          .join("")
      : "<p>No active emergencies. New alerts appear here instantly and sound an alarm.</p>"
  }</div>`;
};
V.audit = () => {
  const x = D.alerts,
    mx = Math.max(60, ...x.map((a) => sec(a.t, a.reach) || sec(a.t, a.ack) || 0)),
    rs = x.map((a) => sec(a.t, a.reach)).filter((v) => v != null);
  return `<div class="card"><h2>Emergency audit report</h2><p>SOS pressed → Warden acknowledged → Ambulance dispatched → Ambulance reached → Handed over or 108 called.</p><div class="tw"><table><tr><th>ID</th><th>Student</th><th>Type</th><th>SOS</th><th>Ack</th><th>Dispatched</th><th>Reached</th><th>Closed</th><th>Outcome</th></tr>${x.length ? x.map((a) => `<tr><td>${a.id.slice(-5)}</td><td>${E(a.n)}<br><small>${E(a.loc)}</small></td><td>${E(a.type)}</td><td>${f(a.t)}</td><td>${f(a.ack)}</td><td>${f(a.disp)}</td><td>${f(a.reach)}</td><td>${f(a.done)}</td><td>${outs(a)}</td></tr>`).join("") : `<tr><td colspan="9">No emergencies recorded yet.</td></tr>`}</table></div><button class="btn" onclick="cp()">Copy report</button></div>
<div class="card"><h2>Response times</h2><p>Average time to ambulance arrival: <b>${rs.length ? dur(Math.round(rs.reduce((p, v) => p + v) / rs.length)) : "—"}</b> across ${rs.length} case${rs.length === 1 ? "" : "s"}.</p>${
    x
      .map((a) => {
        const p = sec(a.t, a.ack),
          q = sec(a.t, a.reach);
        return `<div><small>${E(a.n)} · ${f(a.t)}</small><div class="bar" style="width:${((p || 0) / mx) * 100}%"></div><small>Acknowledged ${dur(p)}</small><div class="bar" style="width:${((q || 0) / mx) * 100}%;background:#c58a00"></div><small>Reached ${dur(q)}</small></div>`;
      })
      .join("") || "<p>Charts appear after the first alert.</p>"
  }<p class="sm">Use these timings as evidence when asking the university for another ambulance.</p></div>`;
};
async function cp() {
  const t =
    "SAGE EMERGENCY AUDIT\n" +
    D.alerts
      .map((a) =>
        [
          a.id,
          a.n,
          a.loc,
          "SOS " + f(a.t),
          "Ack " + f(a.ack),
          "Disp " + f(a.disp),
          "Reached " + f(a.reach),
          "Closed " + f(a.done),
          outs(a),
        ].join(" | "),
      )
      .join("\n");
  try {
    await navigator.clipboard.writeText(t);
    toast("Report copied");
  } catch {
    toast("Copy blocked. Select the table instead.");
  }
}
V.tix = () =>
  `<div class="card"><h2>Maintenance tickets</h2>${D.tickets.length ? D.tickets.map((t) => `<div class="row"><span><b>${E(t.ty)}</b> · ${E(t.l)}<br><small>${E(t.n)} · ${fd(t.t)}${t.d ? " · " + E(t.d) : ""}</small>${t.img ? `<br><img src="${E(t.img)}" alt="Hazard photo" style="max-width:160px;border-radius:6px;margin-top:4px">` : ""}</span>${t.done ? `<span class="pill">Fixed ${fd(t.done)}</span>` : `<button class="btn sm" onclick="upd('tickets','${E(t.id)}',{done:Date.now()})">Mark fixed</button>`}</div>`).join("") : "<p>No tickets. Student hazard reports with photos appear here.</p>"}</div>`;
V.well = () => {
  const A = agg(),
    w = { length: A.n },
    low = { length: A.low },
    hi = { length: A.hi },
    sl = { length: A.sl },
    dist = A.dist,
    mx = Math.max(1, ...dist);
  return `<div class="grid" style="margin-top:12px"><div class="card"><small>Check-ins this week</small><div class="stat">${w.length}</div></div><div class="card"><small>Low mood</small><div class="stat">${low.length}</div></div><div class="card"><small>High stress</small><div class="stat">${hi.length}</div></div><div class="card"><small>Under 6 h sleep</small><div class="stat">${sl.length}</div></div></div>
<div class="card"><h2>Mood spread (last 7 days)</h2>${dist.map((n, i) => `<div class="row"><span style="width:110px">${MO[i][0]} ${MO[i][1]}</span><div style="flex:1"><div class="bar" style="width:${(n / mx) * 100}%;margin:0"></div></div><b>${n}</b></div>`).join("")}<p class="sm">Anonymous totals only. This dashboard never loads any individual student’s check-in, journal or voice entry.</p></div>
<div class="card"><h2>Practical steps</h2><p>If low mood or stress counts rise before exams, plan a floor meeting, extend mess timings for late study, and share the counsellor’s number: ${C.couns}.</p></div>`;
};
const dirGrid = () => `<div class="grid" style="margin-top:12px"><div class="card"><h2>Escalation chain</h2>${[
  ["1. Hostel warden (boys)", C.wb],
  ["1. Hostel warden (girls)", C.wg],
  ["2. Chief warden", C.chief],
  ["3. Ambulance 108", "108"],
  ["4. Emergency 112", "112"],
]
  .map(([a, b]) => `<div class="row"><span>${a}</span>${telA(b)}</div>`)
  .join(
    "",
  )}<p class="sm">If no warden acknowledges within 2 minutes, an alert is escalated automatically and a 108/112 call is prompted.</p></div>
<div class="card"><h2>Hostel and support</h2>${[
  ["Boys’ hostel office", C.boys[0]],
  ["Boys’ hostel office 2", C.boys[1]],
  ["Girls’ hostel office", C.girls[0]],
  ["Girls’ hostel office 2", C.girls[1]],
  ["Counsellor", C.couns],
  ["Psychologist", C.psy],
  ["Tele-MANAS", "14416"],
  ["KIRAN", "1800-599-0019"],
]
  .map(([a, b]) => `<div class="row"><span>${a}</span>${telA(b)}</div>`)
  .join("")}</div></div>`;
const stu = () => (fdb ? D.users : Object.values(LS.g("users", {}))).filter((u) => u.role === "student");
V.dir = () =>
  dirGrid() +
  `<div class="card"><h2>Registered students (${stu().length})</h2>${
    stu().length
      ? stu()
          .map(
            (u) =>
              `<div class="row"><span>${u.ph ? `<img class="ph" src="${E(u.ph)}" alt="">` : ""}<b>${E(u.name)}</b> · ${E(u.blk)}, Room ${E(u.room)}${u.med && D.alerts.some((a) => a.uid === u.id && !a.done) ? `<br><small><b>Medical (SOS Active):</b> ${E(u.med)}</small>` : ""}</span>${u.gp ? telA(u.gp, "Guardian") : ""}</div>`,
          )
          .join("")
      : "<p>Students appear here after they create an account.</p>"
  }</div>`;
V.trip = () => {
  const a = D.alerts.find((q) => q.disp && !q.done);
  return `<div class="card"><h2>Ambulance status: ${D.amb}</h2>${["Available", "On trip", "Returning"].map((s) => `<button class="btn ${D.amb === s ? "on" : "alt"}" onclick="setAmb('${s}')">${s}</button>`).join("")}</div><div class="card"><h2>Current patient</h2>${a ? `<p style="font-size:20px"><b>${E(a.n)}</b><br>${E(a.loc)}${a.gps ? `<br><a href="https://maps.google.com/?q=${encodeURIComponent(a.gps)}" target="_blank" rel="noopener">Open GPS ${E(a.gps)}</a>` : ""}<br>${E(a.type)}${a.med ? `<br>Medical notes: ${E(a.med)}` : ""}</p>${a.reach ? `<span class="pill">Reached ${f(a.reach)}</span>` : `<button class="btn" onclick="reachA('${E(a.id)}')">I have reached the patient</button>`}` : "<p>No active dispatch. Keep the status set to Available when ready.</p>"}</div>`;
};

/* Tab-title flash, system notification and vibration on each new unacknowledged SOS. */
const _nt = new Set();
setInterval(() => {
  if (!me || me.role !== "warden") return;
  const u = D.alerts.filter((a) => !a.done && !a.ack);
  document.title = u.length ? "🚨 (" + u.length + ") SOS – Sage" : "Sage – CGC University Hostel Safety & Wellbeing";
  u.forEach((a) => {
    if (_nt.has(a.id)) return;
    _nt.add(a.id);
    try {
      if (window.Notification && Notification.permission === "granted")
        new Notification("SOS: " + a.n, { body: a.type + " · " + a.loc, requireInteraction: true });
      navigator.vibrate && navigator.vibrate([400, 200, 400]);
    } catch (e) {}
  });
}, 2000);
addEventListener("pointerdown", () => {
  try {
    if (me && me.role === "warden" && window.Notification && Notification.permission === "default")
      Notification.requestPermission();
  } catch (e) {}
});
