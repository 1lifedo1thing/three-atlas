// Quiet, locally synthesized pads. No recording, network request or autoplay.
export class AmbientAudio {
  context = null;
  gain = null;
  nodes = [];
  enabled = false;

  async toggle() {
    if (!this.context) this.create();
    await this.context.resume();
    this.enabled = !this.enabled;
    this.gain.gain.cancelScheduledValues(this.context.currentTime);
    this.gain.gain.setTargetAtTime(this.enabled ? .17 : 0, this.context.currentTime, .65);
    return this.enabled;
  }

  create() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('此浏览器暂不支持氛围音');
    this.context = new AudioContext();
    this.gain = this.context.createGain(); this.gain.gain.value = 0;
    const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1100;
    const compressor = this.context.createDynamicsCompressor(); compressor.threshold.value = -20; compressor.ratio.value = 3;
    filter.connect(this.gain); this.gain.connect(compressor); compressor.connect(this.context.destination);
    [130.813, 196, 261.626, 392, 523.251].forEach((note, index) => {
      const voice = this.context.createOscillator(), amp = this.context.createGain();
      voice.type = 'sine'; voice.frequency.value = note; voice.detune.value = (index - 2) * 1.7;
      amp.gain.value = index === 0 ? .2 : .12 / (index * .35 + 1);
      const breath = this.context.createOscillator(), depth = this.context.createGain();
      breath.frequency.value = .055 + index * .013; depth.gain.value = amp.gain.value * .35;
      breath.connect(depth); depth.connect(amp.gain); voice.connect(amp); amp.connect(filter);
      voice.start(); breath.start(); this.nodes.push(voice, breath, amp, depth);
    });
  }

  async setVisible(visible) {
    if (!this.context) return;
    if (visible && this.enabled) await this.context.resume();
    else await this.context.suspend();
  }

  dispose() {
    for (const node of this.nodes) { if (node.stop) node.stop(); node.disconnect(); }
    this.context?.close(); this.context = null;
  }
}
