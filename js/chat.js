/* Sage Buddy chat: crisis check, Gemini via Firebase AI Logic, local keyword fallback, voice in/out. */
let GEN = 0,
  STOP = 0;
const chat = [],
  hlb = `<br>${helplines}`,
  RP = [
    [
      /suicid|kill myself|end my life|want to die|hurt myself|self.?harm|no reason to live/,
      () =>
        `I am really glad you told me. You matter, and you do not have to carry this alone. Please reach out right now: tell your warden or someone you trust, or call a free 24×7 helpline.${hlb}If you are in immediate danger, call 112 or press SOS.`,
    ],
    [
      /panic|anxious|anxiety|overwhelm|hectic|too much|everything is (too much|falling apart|a mess)|\bcope\b|can.?t breathe/,
      () =>
        `That sounds like a lot. Let us slow down together. Breathe in as the circle grows, out as it shrinks:<div class="breath"></div>Then: 1) write what is on your mind in three lines, 2) pick one task for 10 minutes, 3) tell one person how you feel. What is the smallest next step?`,
    ],
    [
      /\b(sleep|tired|insomnia)\b/,
      () =>
        "Try screens off 30 minutes before bed, a cool dark room and the same wake-up time daily. Even a 20-minute nap helps. If poor sleep lasts over two weeks, see the medical room.",
    ],
    [
      /\b(exams?|stud(y|ying)|tests?|assignments?|deadlines?|focus)\b/,
      () =>
        "Make it tiny: one topic, 25 minutes, then a 5-minute rest. Repeat. You do not need to finish everything, just start. Sleep matters more than a late-night cram.",
    ],
    [
      /homesick|lonely|\balone\b|miss (home|mom|mum|dad)|no friends/,
      () =>
        "Missing home is very normal. Call someone you love at a fixed time, and join one small thing in the hostel today, even a chai chat. You are not alone here.",
    ],
    [
      /roommate|room ?mate|fight|argument/,
      () =>
        "Talk about one issue at a time, calmly and in private. Agree on quiet hours. If it does not improve, tell your warden. That is what they are for.",
    ],
    [
      /\b(food|mess|hungry|eat)\b/,
      () =>
        "Do not skip meals. Keep fruit or nuts handy and sip water through the day. If the mess food is a problem, tell your warden so it can be fixed.",
    ],
    [
      /angry|anger|frustrat/,
      () =>
        "Anger is a signal, not a flaw. Step away, breathe out for 6 counts, and walk for 10 minutes before you reply to anyone.",
    ],
    [
      /family|parents|home problem|breakup|relationship/,
      () =>
        `That is painful, and it is okay to feel it. Talking helps. The CGC counsellor is free and confidential.${hlb}`,
    ],
    [
      /\b(sad|cry(ing)?|depress(ed|ion)?|bad day|(feel(ing)?|so|really) (down|low))\b/,
      () =>
        `I am sorry today feels heavy. Do you want to tell me more? Water, a short walk and a check-in can help a little. If it lasts for days, please talk to the counsellor.${hlb}`,
    ],
    [/thank/, () => "Anytime. I am here whenever you need me."],
    [/^(hi|hello|hey)\b/, () => "Hi. How is your day going? If things feel hectic, tell me what is happening."],
  ],
  rep = (q) => {
    const s = q.toLowerCase(),
      r = RP.find((x) => x[0].test(s));
    return r ? r[1]() : "I am listening. Tell me more, or pick one of the buttons below.";
  };
const SYS =
  "You are Sage Buddy, a friendly, capable AI assistant inside Sage, a wellbeing and safety app for students in CGC University hostels in Punjab, India. You can help with anything a good general assistant can: studying and exams, explaining concepts, coding, writing and emails, career and college advice, languages, planning, and everyday questions, as well as stress, sleep, homesickness, roommates, food and basic first aid. Reply in the language the student writes in (English, Hindi, Punjabi or Hinglish). Match length to the question: short for simple things, thorough and step by step for complex ones. Use simple markdown (bold, bullet lists, numbered steps) when it helps. Be warm, honest and encouraging, and keep your personality light and a little playful. You are not a doctor or counsellor: never diagnose or give medication doses. For emergencies tell them to press SOS or call 108 or 112. If a student mentions self-harm or feeling hopeless, respond with care, encourage them to talk to someone now, and point to Tele-MANAS 14416, KIRAN 1800-599-0019 and the CGC counsellor. Verified Indian helplines you may share when relevant: emergency 112, ambulance 108, police 100, fire 101; mental health Tele-MANAS 14416 or 1800-891-4416, KIRAN 1800-599-0019, Vandrevala Foundation 9999 666 555, NIMHANS 080-4611-0007; anti-ragging 1800-180-5522; women helpline 181, women in distress 1091, NCW WhatsApp 7827-170-170; cyber crime 1930; child helpline 1098; SC/ST atrocities 14566. Never ask for passwords or ID numbers.";
/* Newest first. 404 = Google retired the name for this project, so we stay on the next one.
 * 500/503/429 = temporary overload, so we retry once, then use a lighter model for this message only. */
const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
let MI = 0,
  AIK = null,
  AIM = {},
  CS = null; /* CS is a map: model index -> chat session */
async function aiInit(i) {
  if (AIM[i]) return AIM[i];
  try {
    const k = firebaseConfig.apiKey.trim();
    if (!k || k.startsWith("@secret")) return false;
    if (!AIK) {
      const v = "11.10.0",
        [a, b] = await Promise.all([
          import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
          import(`https://www.gstatic.com/firebasejs/${v}/firebase-ai.js`),
        ]);
      const app = a.initializeApp({ ...firebaseConfig, apiKey: k, measurementId: undefined }, "sage-ai");
      AIK = { b, ai: b.getAI(app, { backend: new b.GoogleAIBackend() }) };
    }
    AIM[i] = AIK.b.getGenerativeModel(AIK.ai, {
      model: MODELS[i],
      systemInstruction: SYS,
      generationConfig: { maxOutputTokens: 2048, temperature: 0.8 },
    });
    return AIM[i];
  } catch (e) {
    console.warn("AI init failed:", e);
    window.aiErr = e; /* not cached, so the next message retries */
    return false;
  }
}
const CRI =
  /suicid|kill myself|end my life|want to die|hurt myself|self.?harm|no reason to live|can.?t go on|end it all|better off (dead|without me)|(life|everything) (is |feels )?(pointless|meaningless)|want to disappear|marna chah|jaan de|khatam kar/i;
const md = (s) =>
    E(s)
      .replace(/^#{1,3} (.+)$/gm, "<b>$1</b>")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?]|$)/g, "$1<i>$2</i>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^[-*] (.+)$/gm, "• $1")
      .replace(/\n/g, "<br>"),
  sc = () =>
    setTimeout(() => {
      const c = $("ch");
      if (c) c.scrollTop = c.scrollHeight;
    }, 0);
function speak(h) {
  try {
    speechSynthesis.cancel();
    const d = document.createElement("div");
    d.innerHTML = h;
    const u = new SpeechSynthesisUtterance(d.textContent.replace(/\s+/g, " ").slice(0, 420));
    u.rate = 0.95;
    u.pitch = 1.1;
    u.lang = "en-IN";
    speechSynthesis.speak(u);
  } catch (e) {}
}
let vr = null;
function vmic() {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return toast("Voice is not supported here. Try Chrome.");
  if (vr) {
    vr.stop();
    return;
  }
  vr = new R();
  vr.lang = "en-IN";
  vr.onresult = (e) => {
    S.tts = 1;
    say(e.results[0][0].transcript);
  };
  vr.onerror = () => toast("Microphone not available. Check permission.");
  vr.onend = () => {
    vr = null;
    const b = $("vmic");
    if (b) b.classList.remove("rec");
  };
  const b = $("vmic");
  if (b) b.classList.add("rec");
  vr.start();
}
/* Each message: crisis phrases get the helpline reply, never the AI. Otherwise stream the AI answer, falling back to the local replies. */
async function say(q) {
  q = (q || "").trim();
  if (!q || GEN) return;
  S.ciDraft = "";
  S.ciFocus = 1;
  const i = $("ci");
  if (i) i.value = "";
  snd("send");
  chat.push({ m: 1, t: E(q) });
  if (CRI.test(q)) {
    const r = { m: 0, t: RP[0][1]() };
    chat.push(r);
    render();
    sc();
    snd("recv");
    if (S.tts) speak(r.t);
    return;
  }
  const b = { m: 0, t: "<i>Thinking…</i>" };
  chat.push(b);
  GEN = 1;
  STOP = 0;
  render();
  sc();
  let txt = "",
    n = 0;
  try {
    let i = MI,
      waited = 0;
    for (;;) {
      try {
        const m = await aiInit(i);
        if (!m) break;
        CS = CS || {};
        CS[i] = CS[i] || m.startChat({ history: [] });
        const r = await CS[i].sendMessageStream(q);
        for await (const c of r.stream) {
          if (STOP) break;
          txt += c.text();
          b.t = md(txt);
          const sp = [...document.querySelectorAll("#ch .msg span")].pop();
          if (sp) sp.innerHTML = b.t;
          if (++n % 6 == 0) snd("tick");
          sc();
        }
        console.info("Sage chat answered by " + MODELS[i]);
        break;
      } catch (e) {
        const msg = String(e.message || e),
          gone = /404|no longer available|is not found|not supported for|billing|free.?tier/i.test(msg);
        if (!txt && gone) {
          if (i < MODELS.length - 1) {
            console.warn(MODELS[i] + " not available for this project, using " + MODELS[i + 1]);
            i = MI = i + 1;
            continue;
          }
          MI = 0; /* every name failed: start from the top next time instead of staying on a dead one */
        }
        if (!txt && /500|503|429|high demand|overload|unavailable|try again|quota/i.test(msg)) {
          if (!waited) {
            waited = 1;
            await new Promise((res) => setTimeout(res, 1500));
            continue;
          }
          if (i < MODELS.length - 1) {
            console.warn(MODELS[i] + " busy, trying " + MODELS[i + 1] + " for this message");
            i++;
            continue;
          }
        }
        throw e;
      }
    }
  } catch (e) {
    console.warn("AI error:", e);
    window.aiErr = e;
    if (!txt) CS = null;
  }
  GEN = 0;
  if (!txt) {
    const why = /debug/.test(location.search) && window.aiErr ? " " + E(String(window.aiErr.code || "") + " " + String(window.aiErr.message || window.aiErr).slice(0, 220)) : "";
    b.t = rep(q) + "<br><small>(The AI could not be reached, so this is a basic reply.)" + why + "</small>";
    snd("err");
  } else {
    if (STOP) b.t += " <small>(stopped)</small>";
    snd("recv");
  }
  render();
  sc();
  if (S.tts) speak(b.t);
}
function newChat() {
  chat.length = 0;
  CS = null;
  render();
}

V.chat = () => {
  const nm = E(me.mn || (mk() === "b" ? "Flutter" : "Ferris"));
  if (!chat.length)
    chat.push({
      m: 0,
      t: `Hi ${E(me.name.split(" ")[0])}, I am ${nm}. If things feel hectic, tell me what is going on.`,
    });
  return `<div class="card"><h2>Chat with ${nm}</h2><div class="chat" id="ch">${chat.map((x) => `<div class="msg ${x.m ? "me" : ""}"><span>${x.t}</span></div>`).join("")}</div><div class="chips"><button class="btn sm alt" onclick="newChat()">🧹 New chat</button>${GEN ? '<button class="btn sm red" onclick="STOP=1">⏹ Stop</button>' : ""}${["I feel stressed", "I cannot sleep", "Exam panic", "I feel lonely", "Everything is too much"].map((t) => `<button class="btn sm alt" onclick="say(this.textContent)">${t}</button>`).join("")}</div><div style="display:flex;gap:6px"><input id="ci" placeholder="Type here" value="${E(S.ciDraft || "")}" oninput="S.ciDraft=this.value" onfocus="S.ciFocus=1" onblur="S.ciFocus=0" onkeydown="if(event.key==='Enter')say(this.value)"><button class="btn alt" id="vmic" onclick="vmic()" aria-label="Speak to me">🎤</button><button class="btn" onclick="say($('ci').value)">Send</button></div><p><button class="btn alt sm" onclick="S.tts=!S.tts;if(!S.tts)speechSynthesis.cancel();render()">${S.tts ? "🔊 Reading replies aloud" : "🔇 Read replies aloud"}</button></p><p class="sm">I am a friendly bot, not a doctor or counsellor. In danger, press SOS.</p></div>`;
};
