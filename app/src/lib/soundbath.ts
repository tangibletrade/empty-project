// Tiny Web Audio sound-bath engine: sustained drones, struck singing bowls, ocean noise, optional binaural beat.
// Everything is synthesized — no audio files to host or license.

export class SoundBath {
  ctx: AudioContext;
  master: GainNode;
  analyser: AnalyserNode;
  private drone?: { nodes: AudioScheduledSourceNode[]; gain: GainNode };
  private ocean?: { src: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode };
  private reverb: ConvolverNode;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.impulse(4.5);
    const wet = this.ctx.createGain();
    wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(this.master);
    this.master.connect(this.analyser).connect(this.ctx.destination);
  }

  // Synthetic hall reverb so bowls ring like a real room.
  private impulse(seconds: number) {
    const len = this.ctx.sampleRate * seconds;
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  private out(node: AudioNode) {
    node.connect(this.master);
    node.connect(this.reverb);
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  startDrone(freq: number, binauralBeat = 0, level = 0.5) {
    this.stopDrone();
    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level * 0.25, t + 4);
    this.out(gain);
    const nodes: AudioScheduledSourceNode[] = [];

    const voice = (f: number, amp: number, pan: number) => {
      const o = this.ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = amp;
      // Slow shimmer so the drone breathes instead of sitting flat.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07 + Math.random() * 0.08;
      const lfoAmt = this.ctx.createGain();
      lfoAmt.gain.value = amp * 0.35;
      lfo.connect(lfoAmt).connect(g.gain);
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      o.connect(g).connect(p).connect(gain);
      o.start();
      lfo.start();
      nodes.push(o, lfo);
    };

    if (binauralBeat > 0) {
      // Binaural: slightly different pitch in each ear; the brain perceives the difference as a slow pulse.
      voice(freq, 0.6, -1);
      voice(freq + binauralBeat, 0.6, 1);
    } else {
      voice(freq, 0.6, 0);
      voice(freq * 1.003, 0.3, -0.4);
    }
    voice(freq / 2, 0.35, 0);
    voice(freq * 1.5, 0.08, 0.3);
    this.drone = { nodes, gain };
  }

  setDroneLevel(level: number) {
    this.drone?.gain.gain.setTargetAtTime(level * 0.25, this.ctx.currentTime, 0.3);
  }

  stopDrone() {
    if (!this.drone) return;
    const { nodes, gain } = this.drone;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0, t, 0.8);
    nodes.forEach((n) => n.stop(t + 4));
    this.drone = undefined;
  }

  strikeBowl(freq: number, strength = 1) {
    const t = this.ctx.currentTime;
    // Singing-bowl partials are inharmonic; slight detune pairs create the characteristic "wah" beating.
    const partials = [
      [1, 1, 9],
      [1.004, 0.6, 9],
      [2.76, 0.35, 6],
      [2.765, 0.2, 6],
      [5.4, 0.12, 3.5],
      [8.9, 0.05, 2],
    ];
    for (const [ratio, amp, decay] of partials) {
      const o = this.ctx.createOscillator();
      o.frequency.value = freq * ratio;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp * 0.18 * strength, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g);
      this.out(g);
      o.start(t);
      o.stop(t + decay + 0.1);
    }
    // Mallet "thock": a noise burst through a bandpass sweeping down from 9x to ~2x the pitch.
    const n = this.ctx.createBufferSource();
    const len = this.ctx.sampleRate * 0.3;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 6;
    bp.frequency.setValueAtTime(Math.min(freq * 9, 16000), t);
    bp.frequency.exponentialRampToValueAtTime(freq * 2.2, t + 0.2);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.25 * strength, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    n.connect(bp).connect(ng);
    this.out(ng);
    n.start(t);
  }

  // C-major pentatonic tuned so C5 = 528 Hz (the creativesteeping.com tuning). Each typed word rings the next note.
  static PENTATONIC = [264, 297, 330, 396, 445.5, 528, 594, 660, 792, 891];

  setOcean(level: number) {
    if (level <= 0) {
      if (this.ocean) {
        const { src, gain, lfo } = this.ocean;
        gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
        src.stop(this.ctx.currentTime + 3);
        lfo.stop(this.ctx.currentTime + 3);
        this.ocean = undefined;
      }
      return;
    }
    if (!this.ocean) {
      const len = this.ctx.sampleRate * 4;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
        d[i] = last * 3.5;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 600;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      const swell = this.ctx.createGain();
      swell.gain.value = 0.6;
      // ~10s wave cycle
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.1;
      const lfoAmt = this.ctx.createGain();
      lfoAmt.gain.value = 0.4;
      lfo.connect(lfoAmt).connect(swell.gain);
      src.connect(filter).connect(swell).connect(gain).connect(this.master);
      src.start();
      lfo.start();
      this.ocean = { src, gain, lfo };
    }
    this.ocean.gain.gain.setTargetAtTime(level * 0.5, this.ctx.currentTime, 0.5);
  }

  stopAll() {
    this.stopDrone();
    this.setOcean(0);
  }
}
