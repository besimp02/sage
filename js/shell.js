/* Shell: navigation, the render loop and the chat intro card. */
const NAV = {
  student: [
    ["home", "<span class=ni>🏠</span>Home"],
    ["checkin", "<span class=ni>✅</span>Check-in"],
    ["chat", "<span class=ni>💬</span>Chat"],
    ["calm", "<span class=ni>🌿</span>Mind"],
    ["campus", "<span class=ni>📍</span>Campus"],
    ["report", "<span class=ni>🛠️</span>Report"],
    ["me", "<span class=ni>👤</span>Profile"],
  ],
  warden: [
    ["live", "<span class=ni>🚨</span>Live"],
    ["audit", "<span class=ni>📋</span>Audit"],
    ["tix", "<span class=ni>🎫</span>Tickets"],
    ["well", "<span class=ni>💚</span>Wellbeing"],
    ["dir", "<span class=ni>☎️</span>Contacts"],
  ],
  driver: [["trip", "Trip"]],
};
/* The chat tab opens with the buddy saying hello. */
const chatIntro = () =>
  tab === "chat" ? `<div class="card mrow">${mascot(72)}<span class="bubble">Talk to me. No rush.</span></div>` : "";
function render() {
  document.body.dataset.r = me ? me.role : "student";
  document.body.dataset.t = th();
  bgSet();
  siren();
  subRole();
  if (!me) {
    loginView();
    document.body.classList.remove("red");
    return;
  }
  const st = me.role === "student";
  $("root").innerHTML =
    `<div class="top" style="margin:0 -14px"><div style="width:34px;height:34px;flex:none">${st ? (me.ph ? `<img src="${E(me.ph)}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover">` : mascot(34)) : leafIcon(0)}</div><b>Sage</b><span class="tag">${E(me.name.split(" ")[0])}</span>${st ? `<button class="sos" onclick="sendSOS()">SOS</button>` : ""}<a class="btn alt sm" href="tel:108">108</a>${st ? `<button class="btn alt sm" onclick="sfxT()" aria-label="Toggle sounds">${sfxOn() ? "🔊" : "🔇"}</button>` : ""}<button class="btn alt sm" onclick="logout()">Log out</button></div><div id="view">${st ? chatIntro() : ""}${V[tab]()}</div><nav>${NAV[me.role].map(([k, t]) => `<button class="${k === tab ? "on" : ""}" onclick="tab='${k}';render();scrollTo(0,0)">${t}</button>`).join("")}</nav>${st ? sosUI() : me.role === "warden" ? woa() : ""}`;
  document.body.classList.toggle("red", !!document.querySelector(".ov"));
  subLogs();
  flies();
  if (tab === "chat") {
    const c = $("ch");
    if (c) c.scrollTop = c.scrollHeight;
    if (S.ciFocus && $("ci")) {
      const el = $("ci");
      el.focus();
      try { el.setSelectionRange(el.value.length, el.value.length); } catch(e) {}
    }
  }
}
function paint(force) {
  if (!force && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  render();
}
