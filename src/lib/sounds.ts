let audioCtx: AudioContext | null = null;

let soundEnabled = true;
try {
  soundEnabled = localStorage.getItem('lazydrop-sound-enabled') !== 'false';
} catch {
  soundEnabled = true;
}

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playNoise(duration: number, volume = 0.05) {
  if (!soundEnabled) return;
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {}
}

export const sounds = {
  setEnabled(v: boolean) {
    soundEnabled = v;
    try {
      localStorage.setItem('lazydrop-sound-enabled', v ? 'true' : 'false');
    } catch {
      soundEnabled = v;
    }
  },

  isEnabled(): boolean {
    return soundEnabled;
  },

  click() {
    playTone(800, 0.08, 'sine', 0.08);
    setTimeout(() => playTone(1200, 0.05, 'sine', 0.05), 30);
  },

  hover() {
    playTone(600, 0.04, 'sine', 0.03);
  },

  upload() {
    playTone(400, 0.15, 'sine', 0.06);
    setTimeout(() => playTone(600, 0.15, 'sine', 0.06), 100);
    setTimeout(() => playTone(800, 0.2, 'sine', 0.08), 200);
  },

  uploadProgress(pct: number) {
    const freq = 300 + (pct / 100) * 600;
    playTone(freq, 0.06, 'sine', 0.04);
  },

  download() {
    playTone(800, 0.12, 'sine', 0.06);
    setTimeout(() => playTone(600, 0.12, 'sine', 0.06), 80);
    setTimeout(() => playTone(400, 0.15, 'sine', 0.08), 160);
  },

  store() {
    playTone(500, 0.1, 'triangle', 0.06);
    setTimeout(() => playTone(700, 0.1, 'triangle', 0.06), 80);
    setTimeout(() => playTone(900, 0.15, 'triangle', 0.08), 160);
    setTimeout(() => playNoise(0.1, 0.03), 250);
  },

  delete() {
    playTone(600, 0.1, 'sawtooth', 0.04);
    setTimeout(() => playTone(400, 0.1, 'sawtooth', 0.04), 80);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.06), 160);
  },

  error() {
    playTone(300, 0.15, 'square', 0.06);
    setTimeout(() => playTone(200, 0.25, 'square', 0.08), 120);
  },

  success() {
    playTone(523, 0.1, 'sine', 0.06);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.06), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.08), 200);
  },

  rocket() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playTone(100 + i * 30, 0.08, 'sawtooth', 0.03);
        playNoise(0.05, 0.02);
      }, i * 60);
    }
  },

  rocketFly() {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        playTone(80 + Math.random() * 40, 0.05, 'sawtooth', 0.02);
      }, i * 100);
    }
  },

  notification() {
    playTone(880, 0.12, 'sine', 0.06);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.08), 120);
  },

  type() {
    playTone(400 + Math.random() * 200, 0.03, 'sine', 0.02);
  },

  toggle() {
    playTone(500, 0.06, 'sine', 0.05);
    setTimeout(() => playTone(700, 0.08, 'sine', 0.06), 40);
  },

  copy() {
    playTone(1000, 0.06, 'sine', 0.05);
    setTimeout(() => playTone(1200, 0.08, 'sine', 0.06), 60);
  },
};
