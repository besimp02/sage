/* Emergency: SOS (student), alarm (warden), siren, auto-escalation and police call-out. */
const steps = (a) =>
  `<div class="steps">${[
    ["Alert sent", a.t],
    ["Warden acknowledged", a.ack],
    ["Ambulance dispatched", a.disp],
    ["Ambulance arrived", a.reach],
  ]
    .map(([l, t]) => `<div class="${t ? "d" : ""}">${l}<br>${t ? f(t) : "Waiting"}</div>`)
    .join("")}</div>`;
const exr = () =>
  `<div class="ex"><img class="exl" src="${EXLI}" alt=""><img class="sosimg" src="${SOSI}" alt="SOS"><img class="exl" src="${EXLI}" alt=""></div>`;
function sendSOS() {
  if (!navigator.onLine) {
    alert("You are offline, so the alert could not be sent. In the live app your phone would dial 112 now. Tap Call 112 below.");
    toast("🚨 Demo mode: auto-dial is switched off for the stage, so no real call was placed.");
    return;
  }
  if (mine()) return;
  const a = add("alerts", {
    n: me.name,
    uid: me.id,
    blk: me.blk,
    room: me.room,
    gp: me.gp || "",
    med: me.med || "",
    ph: me.ph || "",
    type: "Medical",
    loc: me.blk + ", Room " + me.room,
    ack: 0,
    disp: 0,
    reach: 0,
    done: 0,
    esc: 0,
    vol: 3,
  });
  try {
    navigator.vibrate && navigator.vibrate([300, 150, 300]);
  } catch (e) {}
  try {
    navigator.geolocation.getCurrentPosition(
      (p) => upd("alerts", a.id, { gps: p.coords.latitude.toFixed(4) + ", " + p.coords.longitude.toFixed(4) }),
      () => {},
      { timeout: 7000 },
    );
  } catch (e) {}
}
const setType = (t) => upd("alerts", mine().id, { type: t });
function sosUI() {
  const a = mine();
  if (!a) return "";
  return `<div class="ov"><div class="in" style="text-align:center">${exr()}<h1>SOS sent. Help is coming.</h1><p>The warden’s alarm is ringing now. Stay where you are.</p>${steps(a)}<p>${E(a.loc)}${a.gps ? " · GPS " + E(a.gps) : ""}</p><div class="chips" style="justify-content:center">${["Medical", "Fire or smoke", "Safety threat"].map((t) => `<button class="btn sm ${a.type === t ? "on" : "alt"}" onclick="setType('${t}')">${t}</button>`).join("")}</div>
${a.busy ? `<div class="warn r" style="color:#1d2b25;text-align:left"><b>The campus ambulance is on another trip.</b> Call 108 now.</div>` : ""}${a.esc && !a.ack ? `<div class="warn r" style="color:#1d2b25;text-align:left"><b>No reply in 2 minutes. Alert escalated.</b> Call 108 or 112 now.</div>` : ""}
<a class="btn red" href="tel:108">Call 108</a><a class="btn red" href="tel:112">Call 112</a><a class="btn red" href="tel:100">Police 100</a><a class="btn red" href="tel:101">Fire 101</a><a class="btn red" href="tel:${C.chief}">Chief warden</a><a class="btn red" href="sms:${C.chief}?body=${encodeURIComponent("SOS from " + a.n + ", " + a.loc + (a.gps ? " GPS " + a.gps : "") + ". Need help.")}">Text chief warden</a>
<div class="card" style="text-align:left"><h2>First aid while you wait</h2>${FA.map((x) => `<details><summary>${x[0]}</summary><p>${x[1]}</p></details>`).join("")}<p class="sm">General guidance only. For serious emergencies always call 108.</p></div><button class="btn alt" onclick="upd('alerts','${E(a.id)}',{done:Date.now(),out:'Cancelled by student'})">I am safe. Cancel alert</button></div></div>`;
}
function woa() {
  const u = D.alerts.filter((a) => !a.done && !a.ack);
  if (!u.length) return "";
  return `<div class="ov"><div class="in" style="text-align:center">${exr()}<h1>SOS ALARM</h1>${u.map((a) => `<div class="card" style="text-align:left"><h2>${a.ph ? `<img class="ph" src="${E(a.ph)}" alt="">` : ""}${E(a.n)} needs help</h2><p>${E(a.type)} · ${E(a.loc)}${a.gps ? " · GPS " + E(a.gps) : ""}<br><small>Pressed ${f(a.t)}</small></p>${a.med ? `<p><b>Medical notes:</b> ${E(a.med)}</p>` : ""}${a.esc ? `<div class="warn r"><b>Not acknowledged for 2 minutes.</b> Call 108 or 112.</div>` : ""}<button class="btn" onclick="ackA('${E(a.id)}')">Acknowledge</button><button class="btn red" onclick="dispA('${E(a.id)}')">Dispatch ambulance</button>${a.gp ? telA(a.gp, "Call guardian") : ""}</div>`).join("")}<button class="btn alt" onclick="S.muted=!S.muted;render()">${S.muted ? "Sound on" : "Mute"}</button><a class="btn alt" href="tel:108">Call 108</a></div></div>`;
}
let sir = 0,
  osc;
let osc2;
function siren() {
  const on = me && me.role === "warden" && !S.muted && D.alerts.some((a) => !a.done && !a.ack);
  if (on && !sir) {
    try {
      const A = (window.AC = window.AC || new (window.AudioContext || window.webkitAudioContext)());
      A.resume();
      const g = A.createGain();
      g.gain.value = 0.55;
      const cp = A.createDynamicsCompressor();
      g.connect(cp);
      cp.connect(A.destination);
      osc = A.createOscillator();
      osc2 = A.createOscillator();
      osc.type = "sawtooth";
      osc2.type = "square";
      osc.connect(g);
      osc2.connect(g);
      osc.start();
      osc2.start();
      let n = 0;
      sir = setInterval(() => {
        n++;
        const f = n % 2 ? 1480 : 620;
        osc.frequency.value = f;
        osc2.frequency.value = f * 1.5 + (n % 4) * 7;
        try {
          navigator.vibrate && navigator.vibrate(200);
        } catch (e) {}
      }, 140);
    } catch {}
  } else if (!on && sir) {
    clearInterval(sir);
    sir = 0;
    try {
      osc.stop();
      osc2.stop();
    } catch {}
  }
}

/* ----- Escalation watchers ----- */
/* 2 minutes with no acknowledgement: mark the alert escalated. */
function escalateTick() {
  if (!me) return;
  D.alerts
    .filter((a) => !a.ack && !a.esc && !a.done && Date.now() - a.t > 12e4)
    .forEach((a) => upd("alerts", a.id, { esc: Date.now() }));
}
const _pd = {};
function polX(id) {
  _pd[id + "x"] = 1;
  upd("alerts", id, { done: Date.now(), out: "Cancelled by student" });
  const e = $("polov");
  if (e) e.remove();
}
function polTick() {
  try {
    if (!me) return;
    const now = Date.now();
    D.alerts
      .filter((a) => !a.ack && !a.pol && !a.done && now - a.t > POLICE_AFTER_MIN * 6e4)
      .forEach((a) => upd("alerts", a.id, { pol: now }));
    let el = $("polov"),
      bar = $("polbar");
    const live = D.alerts.filter((a) => a.pol && !a.ack && !a.done),
      my = me.role === "student" ? live.find((a) => a.uid === me.id && !_pd[a.id + "x"]) : null;
    if (my) {
      if (!el) {
        el = document.createElement("div");
        el.id = "polov";
        el.style.cssText =
          "position:fixed;inset:0;z-index:90;background:#8a1c15;color:#fff;overflow:auto;padding:24px 16px;text-align:center";
        document.body.appendChild(el);
        try {
          navigator.vibrate && navigator.vibrate([500, 200, 500, 200, 500]);
        } catch (e) {}
        snd("red");
      }
      const bt = "display:block;background:#fff;color:#8a1c15;margin:8px 0;";
      el.innerHTML =
        '<div style="max-width:520px;margin:0 auto"><div style="font-size:56px">🚔</div><h1>No reply in ' +
        POLICE_AFTER_MIN +
        ' minutes</h1><p>Demo mode: in the live app your phone would start calling the police now. Auto-dial is switched off for this demo, so no real call is placed. The buttons below still work.</p><a class="btn" style="' +
        bt +
        'font-size:22px;padding:18px" href="tel:112">Call police (112)</a><a class="btn" style="' +
        bt +
        '" href="tel:100">Call police (100)</a><a class="btn" style="' +
        bt +
        '" href="tel:108">Call ambulance (108)</a><p><small style="color:#fff">' +
        E(my.type) +
        " · " +
        E(my.loc) +
        (my.gps ? " · GPS " + my.gps : "") +
        '</small></p><button class="btn alt" onclick="polX(\'' +
        my.id +
        "')\">I am safe. Cancel alert</button></div>";
      if (!_pd[my.id]) {
        _pd[my.id] = 1;
        setTimeout(() => {
          toast("🚨 Demo Mode: Auto-dialing 112 prevented for live stage safety.");
        }, 1500);
      }
    } else if (el) el.remove();
    if (me.role !== "student" && live.length) {
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "polbar";
        bar.style.cssText =
          "position:fixed;left:0;right:0;top:0;z-index:85;background:#b3261e;color:#fff;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top,0px));text-align:center;font-weight:700";
        document.body.appendChild(bar);
      }
      bar.innerHTML =
        "🚔 " +
        live.length +
        " SOS not answered for " +
        POLICE_AFTER_MIN +
        '+ min. Police escalation triggered (demo: no real call placed). <a style="color:#fff" href="tel:112">Call 112</a>';
    } else if (bar) bar.remove();
  } catch (e) {}
}
function startEmergencyWatchers() {
  setInterval(escalateTick, 5000);
  setInterval(polTick, 2000);
}
