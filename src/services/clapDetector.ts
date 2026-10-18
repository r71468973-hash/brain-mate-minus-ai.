export interface ClapDetectorStatus {
  isActive: boolean;
  hasPermission: boolean;
  currentLevel: number; // 0 to 100
  threshold: number; // 0 to 100
  lastClapTime: number | null;
  errorMessage?: string;
}

export class ClapDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isListening: boolean = false;
  private onClapCallback: (() => void) | null = null;
  private onLevelCallback: ((level: number) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  private sensitivity: number = 65; // 0 (low) to 100 (high)
  private lastClapTimestamp: number = 0;
  private debounceMs: number = 1800; // prevent echo or multiple rapid triggers
  private noiseBaseline: number = 10;

  constructor() {}

  public isRunning(): boolean {
    return this.isListening;
  }

  public setSensitivity(sensitivity: number) {
    this.sensitivity = Math.max(10, Math.min(95, sensitivity));
  }

  public async start(
    sensitivity: number,
    onClap: () => void,
    onLevel?: (level: number) => void,
    onError?: (err: string) => void
  ): Promise<boolean> {
    this.sensitivity = sensitivity;
    this.onClapCallback = onClap;
    this.onLevelCallback = onLevel || null;
    this.onErrorCallback = onError || null;

    if (this.isListening) {
      return true;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone mediaDevices API not available in this browser environment.');
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported on this device.');
      }

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2; // Quick response to transients

      source.connect(this.analyser);
      this.isListening = true;

      this.monitorAudio();
      return true;
    } catch (err: any) {
      console.warn('Microphone permission or AudioContext error for clap detection:', err);
      this.isListening = false;
      let msg = err.message || 'Microphone access failed';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission denied. To enable Clap-to-Open, tap Allow in Android site permissions.';
      }
      if (this.onErrorCallback) {
        this.onErrorCallback(msg);
      }
      return false;
    }
  }

  private monitorAudio() {
    if (!this.analyser || !this.isListening) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);

    const check = () => {
      if (!this.isListening || !this.analyser) return;

      this.analyser.getByteTimeDomainData(timeData);

      // Compute peak-to-peak amplitude
      let min = 255;
      let max = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = timeData[i];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      const peakAmplitude = (max - min) / 255; // 0.0 to 1.0
      const currentLevel = Math.round(peakAmplitude * 100);

      // Slowly adapt baseline noise floor
      this.noiseBaseline = this.noiseBaseline * 0.95 + currentLevel * 0.05;

      if (this.onLevelCallback) {
        this.onLevelCallback(currentLevel);
      }

      // Clap trigger calculation:
      // High sensitivity = lower required threshold
      const thresholdLevel = Math.max(35, 105 - this.sensitivity);

      const now = Date.now();
      const timeSinceLast = now - this.lastClapTimestamp;

      // Condition for deliberate clap:
      // 1. Current level spikes past thresholdLevel
      // 2. Spike is at least 3x above ambient baseline
      // 3. Debounce window elapsed
      if (
        currentLevel > thresholdLevel &&
        currentLevel > this.noiseBaseline * 2.8 &&
        timeSinceLast > this.debounceMs
      ) {
        this.lastClapTimestamp = now;
        if (this.onClapCallback) {
          this.onClapCallback();
        }
      }

      this.animationFrameId = requestAnimationFrame(check);
    };

    this.animationFrameId = requestAnimationFrame(check);
  }

  public stop() {
    this.isListening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {
        console.warn('AudioContext close error:', e);
      }
      this.audioCtx = null;
      this.analyser = null;
    }

    if (this.onLevelCallback) {
      this.onLevelCallback(0);
    }
  }
}

export const clapDetector = new ClapDetector();
