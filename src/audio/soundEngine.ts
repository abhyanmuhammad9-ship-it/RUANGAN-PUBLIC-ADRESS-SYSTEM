import { AlarmLevel } from '../types/twin';

export interface LiveMicRoutingParams {
  pttActive: boolean;
  micGainDb: number;
  mixerGain: number;
  mixerEqLow: number;
  mixerEqMid: number;
  mixerEqHigh: number;
  channel1Fader: number;
  mainMixFader: number;
  speakerTapPowerW: number;
  lineSupervisionOk: boolean;
  monitorVolume: number; // 0..1.5
  terminalEcho: boolean;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private alarmTimer: number | null = null;
  private currentAlarmLevel: AlarmLevel = 'normal';
  private paDroneOsc: OscillatorNode | null = null;
  private paDroneGain: GainNode | null = null;

  // Live Laptop Microphone PA Routing
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micPreampGain: GainNode | null = null;
  private eqLowFilter: BiquadFilterNode | null = null;
  private eqMidFilter: BiquadFilterNode | null = null;
  private eqHighFilter: BiquadFilterNode | null = null;
  private paHpf: BiquadFilterNode | null = null;
  private paLpf: BiquadFilterNode | null = null;
  private echoDelay: DelayNode | null = null;
  private echoFeedback: GainNode | null = null;
  private echoWetGain: GainNode | null = null;
  private masterMonitorGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array<ArrayBuffer> | null = null;
  private liveMicActive = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(on: boolean) {
    this.enabled = on;
    if (on) {
      this.ensureContext();
      this.syncAlarmLoop(this.currentAlarmLevel);
    } else {
      this.stopPaTone();
      this.stopAlarmLoop();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public isLiveMicActive(): boolean {
    return this.liveMicActive;
  }

  public async startLiveMic(): Promise<{ ok: boolean; error?: string }> {
    if (this.liveMicActive && this.micStream) {
      return { ok: true };
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        ok: false,
        error: 'Browser tidak mendukung akses mikrofon (getUserMedia).',
      };
    }

    try {
      const ctx = this.ensureContext();
      if (!ctx) {
        return { ok: false, error: 'Web Audio API tidak tersedia.' };
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.micStream = stream;
      const source = ctx.createMediaStreamSource(stream);
      const preamp = ctx.createGain();
      preamp.gain.value = 1.0;

      // 3-Band Mixer EQ
      const low = ctx.createBiquadFilter();
      low.type = 'lowshelf';
      low.frequency.value = 220;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1600;
      mid.Q.value = 1.1;

      const high = ctx.createBiquadFilter();
      high.type = 'highshelf';
      high.frequency.value = 4200;

      // Airport Ceiling Speaker Voice Band Shaping (300 Hz - 6.5 kHz)
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 260;

      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 6500;

      // Analyser for real-time voice amplitude
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;

      // Dynamics compressor to prevent speaker clipping / howling
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 18;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.15;

      // Airport Terminal Subtle Acoustic Echo
      const delay = ctx.createDelay(0.5);
      delay.delayTime.value = 0.125;
      const echoFb = ctx.createGain();
      echoFb.gain.value = 0.22;
      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 2200;
      const echoWet = ctx.createGain();
      echoWet.gain.value = 0.24;

      // Master Monitor Gain (Speaker Output to Laptop)
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.85;

      // Wire signal path:
      // Source -> Preamp -> EQ Low -> EQ Mid -> EQ High -> PA HPF -> PA LPF -> Analyser
      source.connect(preamp);
      preamp.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(hpf);
      hpf.connect(lpf);
      lpf.connect(analyser);

      // Dry path -> Compressor -> MasterGain -> Destination
      analyser.connect(compressor);

      // Wet Terminal Echo path
      analyser.connect(delay);
      delay.connect(echoFilter);
      echoFilter.connect(echoFb);
      echoFb.connect(delay);
      echoFilter.connect(echoWet);
      echoWet.connect(compressor);

      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      this.micSource = source;
      this.micPreampGain = preamp;
      this.eqLowFilter = low;
      this.eqMidFilter = mid;
      this.eqHighFilter = high;
      this.paHpf = hpf;
      this.paLpf = lpf;
      this.echoDelay = delay;
      this.echoFeedback = echoFb;
      this.echoWetGain = echoWet;
      this.masterMonitorGain = masterGain;
      this.analyser = analyser;
      this.analyserData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      this.liveMicActive = true;

      return { ok: true };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.name === 'NotAllowedError'
            ? 'Izin mikrofon ditolak. Izinkan akses mikrofon di browser Anda.'
            : err.name === 'NotFoundError'
              ? 'Perangkat mikrofon tidak ditemukan pada laptop.'
              : `Gagal mengakses mikrofon: ${err.message}`
          : 'Gagal mengaktifkan mikrofon laptop.';
      return { ok: false, error: msg };
    }
  }

  public stopLiveMic() {
    this.liveMicActive = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.micSource?.disconnect();
    this.micPreampGain?.disconnect();
    this.eqLowFilter?.disconnect();
    this.eqMidFilter?.disconnect();
    this.eqHighFilter?.disconnect();
    this.paHpf?.disconnect();
    this.paLpf?.disconnect();
    this.echoDelay?.disconnect();
    this.echoFeedback?.disconnect();
    this.echoWetGain?.disconnect();
    this.masterMonitorGain?.disconnect();
    this.analyser?.disconnect();

    this.micSource = null;
    this.micPreampGain = null;
    this.eqLowFilter = null;
    this.eqMidFilter = null;
    this.eqHighFilter = null;
    this.paHpf = null;
    this.paLpf = null;
    this.echoDelay = null;
    this.echoFeedback = null;
    this.echoWetGain = null;
    this.masterMonitorGain = null;
    this.analyser = null;
    this.analyserData = null;
  }

  public updateLiveMicRouting(params: LiveMicRoutingParams) {
    if (!this.liveMicActive || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.micPreampGain) {
      const preampLinear = Math.pow(10, (params.micGainDb - 26) / 20);
      const gate = params.pttActive && params.lineSupervisionOk ? 1 : 0;
      this.micPreampGain.gain.setTargetAtTime(preampLinear * gate, now, 0.025);
    }
    if (this.eqLowFilter) {
      this.eqLowFilter.gain.setTargetAtTime(params.mixerEqLow, now, 0.03);
    }
    if (this.eqMidFilter) {
      this.eqMidFilter.gain.setTargetAtTime(params.mixerEqMid, now, 0.03);
    }
    if (this.eqHighFilter) {
      this.eqHighFilter.gain.setTargetAtTime(params.mixerEqHigh, now, 0.03);
    }
    if (this.echoWetGain) {
      this.echoWetGain.gain.setTargetAtTime(
        params.terminalEcho ? 0.28 : 0,
        now,
        0.04,
      );
    }
    if (this.masterMonitorGain) {
      const faderMix =
        (params.mixerGain / 100) *
        (params.channel1Fader / 100) *
        (params.mainMixFader / 100);
      // Scale slightly by speaker tap (0.25W -> 0.55x, 2W -> 1.15x)
      const tapScale = 0.45 + Math.sqrt(params.speakerTapPowerW) * 0.5;
      const outGain =
        this.enabled && params.pttActive && params.lineSupervisionOk
          ? Math.min(2.2, faderMix * tapScale * params.monitorVolume * 2.1)
          : 0;
      this.masterMonitorGain.gain.setTargetAtTime(outGain, now, 0.03);
    }
  }

  public getLiveMicLevel(): number {
    if (!this.liveMicActive || !this.analyser || !this.analyserData) return 0;
    this.analyser.getByteTimeDomainData(this.analyserData);
    let sumSq = 0;
    for (let i = 0; i < this.analyserData.length; i++) {
      const normalized = (this.analyserData[i] - 128) / 128;
      sumSq += normalized * normalized;
    }
    const rms = Math.sqrt(sumSq / this.analyserData.length);
    return Math.min(1, rms * 4.5);
  }

  public playChime() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Classic 2/3-tone airport chime: C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.24;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.68);
    });
  }

  public playRelayClick() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.03);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public updatePaVoiceCarrier(active: boolean, gainNormalized: number) {
    // Do not play synthetic carrier tone when live user microphone is active
    if (this.liveMicActive || !this.enabled || !active || gainNormalized <= 0.02) {
      this.stopPaTone();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.paDroneOsc || !this.paDroneGain) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = 185;
      filter.type = 'bandpass';
      filter.frequency.value = 720;
      filter.Q.value = 2.2;

      gain.gain.value = 0.001;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.paDroneOsc = osc;
      this.paDroneGain = gain;
    }

    const targetGain = Math.min(0.045, Math.max(0.004, gainNormalized * 0.035));
    this.paDroneGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.06);
  }

  private stopPaTone() {
    if (this.paDroneOsc) {
      try {
        this.paDroneOsc.stop();
        this.paDroneOsc.disconnect();
      } catch {
        // ignore already stopped
      }
      this.paDroneOsc = null;
    }
    if (this.paDroneGain) {
      this.paDroneGain.disconnect();
      this.paDroneGain = null;
    }
  }

  public syncAlarmLoop(level: AlarmLevel) {
    this.currentAlarmLevel = level;
    if (!this.enabled || level === 'normal') {
      this.stopAlarmLoop();
      return;
    }
    if (this.alarmTimer !== null) return;

    const triggerBeep = () => {
      if (!this.enabled || this.currentAlarmLevel === 'normal') return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = this.currentAlarmLevel === 'critical' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(
        this.currentAlarmLevel === 'critical' ? 920 : 640,
        now,
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    };

    triggerBeep();
    this.alarmTimer = window.setInterval(
      triggerBeep,
      level === 'critical' ? 1100 : 2200,
    );
  }

  private stopAlarmLoop() {
    if (this.alarmTimer !== null) {
      window.clearInterval(this.alarmTimer);
      this.alarmTimer = null;
    }
  }

  public dispose() {
    this.stopLiveMic();
    this.stopPaTone();
    this.stopAlarmLoop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
