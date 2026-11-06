// Ambience synthesised in the browser: wind that rises with speed, the river below,
// birdsong by day and crickets after dark. Nothing is downloaded; it starts only when asked.

function noiseBuffer(context, seconds, brown) {
  const length = Math.floor(context.sampleRate * seconds), buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; } else data[i] = white;
  }
  return buffer;
}

export function createAmbience() {
  let context = null, nodes = null, on = false, nextChirp = 0;

  function build() {
    context = new AudioContext();
    const master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
    const loop = (buffer, filterType, frequency, q) => {
      const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
      const filter = context.createBiquadFilter(); filter.type = filterType; filter.frequency.value = frequency; filter.Q.value = q;
      const gain = context.createGain(); gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(master); source.start();
      return { filter, gain };
    };
    const wind = loop(noiseBuffer(context, 4, true), 'bandpass', 420, 0.7);
    const river = loop(noiseBuffer(context, 3, false), 'lowpass', 520, 0.4);
    // Crickets: a high tone gated by a fast pulse train.
    const tone = context.createOscillator(); tone.frequency.value = 4300;
    const pulse = context.createOscillator(); pulse.frequency.value = 22; pulse.type = 'square';
    const gate = context.createGain(); gate.gain.value = 0;
    const depth = context.createGain(); depth.gain.value = 0.5;
    pulse.connect(depth).connect(gate.gain);
    const crickets = context.createGain(); crickets.gain.value = 0;
    tone.connect(gate).connect(crickets).connect(master);
    tone.start(); pulse.start();
    nodes = { master, wind, river, crickets };
  }

  function chirp(time, volume) {
    const osc = context.createOscillator(), gain = context.createGain();
    const base = 2400 + Math.random() * 1600, notes = 2 + Math.floor(Math.random() * 3);
    osc.type = 'sine';
    for (let i = 0; i < notes; i++) {
      const t = time + i * 0.11;
      osc.frequency.setValueAtTime(base * (1 + Math.random() * 0.15), t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.07);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    }
    osc.connect(gain).connect(nodes.master);
    osc.start(time); osc.stop(time + notes * 0.11 + 0.1);
  }

  return {
    get on() { return on; },
    async toggle() {
      on = !on;
      if (on && !context) build();
      if (!context) return on;
      const now = context.currentTime;
      nodes.master.gain.cancelScheduledValues(now);
      nodes.master.gain.setTargetAtTime(on ? 0.9 : 0, now, 0.4);
      if (on) await context.resume();
      return on;
    },
    /** speed in m/s, night 0–1, paused stops the flight-driven sounds. */
    update({ speed, night, paused }) {
      if (!context || !on) return;
      const now = context.currentTime, fast = Math.min(Math.abs(speed) / 90, 1);
      nodes.wind.gain.gain.setTargetAtTime(paused ? 0.05 : 0.09 + fast * 0.35, now, 0.6);
      nodes.wind.filter.frequency.setTargetAtTime(380 + fast * 900, now, 0.6);
      nodes.river.gain.gain.setTargetAtTime(0.035 + 0.01 * Math.sin(now * 0.3), now, 1);
      nodes.crickets.gain.setTargetAtTime(night > 0.5 ? 0.012 * (0.6 + 0.4 * Math.sin(now * 0.7)) : 0, now, 1.5);
      if (night < 0.4 && now > nextChirp) {
        if (nextChirp) chirp(now + 0.05, 0.025 * (1 - night));
        nextChirp = now + 2.5 + Math.random() * 6;
      }
    },
    suspend() { context?.suspend(); },
    resume() { if (on) context?.resume(); },
    dispose() { context?.close(); context = null; },
  };
}
