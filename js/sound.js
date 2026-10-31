/* Sound effects (students) and audio unlock. */
addEventListener("pointerdown", () => {
  try {
    window.AC = window.AC || new (window.AudioContext || window.webkitAudioContext)();
    window.AC.resume();
  } catch {}
});
const sfxOn = () => LS.g("sfx", 1),
  sfxT = () => {
    LS.s("sfx", sfxOn() ? 0 : 1);
    snd("pop");
    render();
  };
const SFX = {
  pop: [
    [660, 0, 0.09],
    [880, 0.07, 0.12],
  ],
  win: [
    [523, 0, 0.14],
    [659, 0.11, 0.14],
    [784, 0.22, 0.14],
    [1047, 0.33, 0.3],
  ],
  squeak: [
    [950, 0, 0.06],
    [1350, 0.05, 0.1],
  ],
  send: [
    [520, 0, 0.07],
    [780, 0.06, 0.1],
  ],
  recv: [
    [880, 0, 0.09],
    [1175, 0.09, 0.18],
  ],
  tick: [[1500, 0, 0.02, 0.04]],
  err: [
    [300, 0, 0.14],
    [220, 0.13, 0.24],
  ],
  ok: [
    [523, 0, 0.12],
    [659, 0.1, 0.12],
    [784, 0.2, 0.28],
  ],
  warn: [
    [440, 0, 0.2],
    [330, 0.22, 0.24],
  ],
  red: [
    [880, 0, 0.16, 0.12, "triangle"],
    [660, 0.2, 0.16, 0.12, "triangle"],
    [880, 0.4, 0.16, 0.12, "triangle"],
    [660, 0.6, 0.26, 0.12, "triangle"],
  ],
};
snd = function (k) {
  if (!sfxOn() || !me || me.role !== "student") return;
  try {
    const A = (window.AC = window.AC || new (window.AudioContext || window.webkitAudioContext)());
    A.resume();
    const t = A.currentTime,
      q = k === "tap" ? [[700 + Math.random() * 120, 0, 0.07]] : SFX[k] || [];
    q.forEach(([f, d, l, v, w]) => {
      const o = A.createOscillator(),
        g = A.createGain();
      o.type = w || "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t + d);
      g.gain.linearRampToValueAtTime(v || 0.1, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + d + l);
      o.connect(g);
      g.connect(A.destination);
      o.start(t + d);
      o.stop(t + d + l + 0.02);
    });
  } catch (e) {}
};

/* Tap and squeak sounds on every button press. */
addEventListener(
  "click",
  (e) => {
    if (e.target.closest(".sos,.sosbig,.ov")) return;
    if (e.target.closest(".mas")) snd("squeak");
    else if (e.target.closest("button,a.btn,.pick,.sw")) snd("tap");
  },
  true,
);
