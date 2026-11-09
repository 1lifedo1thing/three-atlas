// Every sound is synthesized with Web Audio: a filtered drone that opens as you descend, a glass pad,
// cosmic wind, clock ticks that speed up into a buzz, a falling FM chime for each moment,
// a riser for the plunge and a low boom with a bright chord for the rebirth. Off until the visitor turns it on.
export const sound = {
  ctx: null, on: false,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    this.dull = c.createBiquadFilter(); this.dull.type = 'lowpass'; this.dull.frequency.value = 18000;
    this.master.connect(this.dull).connect(comp).connect(c.destination);
    // reverb from a synthetic impulse
    const len = c.sampleRate * 4.5, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    this.verbIn = c.createGain(); this.verbIn.gain.value = 0.5;
    this.verbIn.connect(this.verb).connect(this.master);
    // drone
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 240; this.lp.Q.value = 0.7;
    this.drone = c.createGain(); this.drone.gain.value = 0.22;
    this.lp.connect(this.drone); this.drone.connect(this.master); this.drone.connect(this.verbIn);
    this.oscs = [];
    [[55, 'sawtooth', 0.32], [55.21, 'sawtooth', 0.3], [82.4, 'sawtooth', 0.16], [27.5, 'sine', 0.9]].forEach(([f, t, g]) => {
      const o = c.createOscillator(); o.type = t; o.frequency.value = f;
      const gg = c.createGain(); gg.gain.value = g; o.connect(gg).connect(this.lp); o.start(); this.oscs.push(o);
    });
    // high glass pad, very quiet
    this.pad = c.createGain(); this.pad.gain.value = 0.035;
    this.pad.connect(this.verbIn); this.pad.connect(this.master);
    [440, 659.25, 783.99, 987.77, 1318.5].forEach((f, i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = c.createGain(); g.gain.value = 0;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.03 + i * 0.017;
      const lg = c.createGain(); lg.gain.value = 0.18 / (i + 1);
      lfo.connect(lg).connect(g.gain); o.connect(g).connect(this.pad); o.start(); lfo.start();
    });
    // cosmic wind
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    const ns = c.createBufferSource(); ns.buffer = nb; ns.loop = true;
    this.windF = c.createBiquadFilter(); this.windF.type = 'bandpass'; this.windF.frequency.value = 380; this.windF.Q.value = 0.6;
    this.wind = c.createGain(); this.wind.gain.value = 0.05;
    ns.connect(this.windF).connect(this.wind).connect(this.verbIn); ns.start();
    // buzz that replaces ticks once the outside clock races past hearing them apart
    this.buzzO = c.createOscillator(); this.buzzO.type = 'triangle'; this.buzzO.frequency.value = 40;
    this.buzzF = c.createBiquadFilter(); this.buzzF.type = 'bandpass'; this.buzzF.frequency.value = 1800; this.buzzF.Q.value = 2;
    this.buzz = c.createGain(); this.buzz.gain.value = 0;
    this.buzzO.connect(this.buzzF).connect(this.buzz).connect(this.master); this.buzz.connect(this.verbIn); this.buzzO.start();
  },
  enable(v) {
    if (v) this.init();
    if (!this.ctx) return;
    this.on = v;
    if (v && this.ctx.state !== 'running') this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(v ? 0.8 : 0, t, v ? 0.8 : 0.15);
  },
  tick(strong) {
    if (!this.on) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(strong ? 1650 : 2350, t);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(strong ? 0.12 : 0.07, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g); g.connect(this.master); g.connect(this.verbIn); o.start(t); o.stop(t + 0.08);
    const n = c.createBufferSource(); n.buffer = this.noiseBuf;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
    const ng = c.createGain(); ng.gain.setValueAtTime(0.06, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    n.connect(hp).connect(ng).connect(this.master); n.start(t, Math.random()); n.stop(t + 0.03);
  },
  chime(freq) {
    if (!this.on) return;
    const c = this.ctx, t = c.currentTime;
    const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.setValueAtTime(freq, t); mod.frequency.setValueAtTime(freq * 1.401, t);
    car.frequency.exponentialRampToValueAtTime(freq * 0.22, t + 9); mod.frequency.exponentialRampToValueAtTime(freq * 0.22 * 1.401, t + 9);
    mg.gain.setValueAtTime(freq * 2.2, t); mg.gain.exponentialRampToValueAtTime(freq * 0.05, t + 4);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11, t + 0.01); g.gain.exponentialRampToValueAtTime(0.03, t + 2.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 10);
    mod.connect(mg).connect(car.frequency); car.connect(g); g.connect(this.master); g.connect(this.verbIn);
    car.start(t); mod.start(t); car.stop(t + 10.2); mod.stop(t + 10.2);
  },
  riser(dur) {
    if (!this.on) return;
    const c = this.ctx, t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(160, t); f.frequency.exponentialRampToValueAtTime(9000, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + dur); g.gain.setValueAtTime(0.0001, t + dur + 0.02);
    n.connect(f).connect(g); g.connect(this.master); g.connect(this.verbIn); n.start(t); n.stop(t + dur + 0.1);
    this.oscs.forEach(o => o.frequency.setTargetAtTime(o.frequency.value * 6, t, dur / 2.5));
    this.drone.gain.setTargetAtTime(0.0001, t + dur, 0.02);
    this.pad.gain.setTargetAtTime(0.0001, t + dur, 0.02);
    this.wind.gain.setTargetAtTime(0.0001, t + dur, 0.02);
  },
  rebirth() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    [55, 55.21, 82.4, 27.5].forEach((f, i) => { this.oscs[i].frequency.cancelScheduledValues(t); this.oscs[i].frequency.setValueAtTime(f, t); });
    this.drone.gain.setTargetAtTime(0.22, t + 1.2, 2.5);
    this.pad.gain.setTargetAtTime(0.035, t + 1.0, 3);
    this.wind.gain.setTargetAtTime(0.05, t + 1.0, 3);
    if (!this.on) return;
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(24, t + 5);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
    o.connect(g); g.connect(this.master); g.connect(this.verbIn); o.start(t); o.stop(t + 6.2);
    [523.25, 659.25, 783.99, 1046.5, 1567.98].forEach((f, i) => {
      const s = c.createOscillator(); s.type = 'sine'; s.frequency.value = f;
      const sg = c.createGain(); sg.gain.setValueAtTime(0.0001, t + 0.5 + i * 0.22); sg.gain.exponentialRampToValueAtTime(0.05, t + 0.9 + i * 0.22); sg.gain.exponentialRampToValueAtTime(0.0001, t + 8 + i * 0.3);
      s.connect(sg); sg.connect(this.verbIn); sg.connect(this.master); s.start(t); s.stop(t + 9);
    });
  },
  update(depth, freeze, mult) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.lp.frequency.setTargetAtTime(170 + Math.pow(depth, 2.2) * 2600, t, 0.3);
    this.windF.frequency.setTargetAtTime(300 + depth * 1600, t, 0.4);
    this.dull.frequency.setTargetAtTime(freeze > 0.5 ? 700 : 18000, t, 0.25);
    const bz = mult > 22 ? Math.min(0.045, (Math.log10(mult) - 1.34) * 0.03) : 0;
    this.buzz.gain.setTargetAtTime(this.on ? bz * (1 - freeze) : 0, t, 0.2);
    this.buzzO.frequency.setTargetAtTime(Math.min(220, 20 + Math.log10(Math.max(mult, 1)) * 34), t, 0.2);
  },
};
