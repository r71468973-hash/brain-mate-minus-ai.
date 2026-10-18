import { SupportedLanguage } from '../types';

// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private audioCtx: AudioContext | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initRecognition();
    this.initVoices();
  }

  private initRecognition() {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (this.onResultCallback) {
            if (finalTranscript) {
              this.onResultCallback(finalTranscript, true);
            } else if (interimTranscript) {
              this.onResultCallback(interimTranscript, false);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.log('[VoiceService] Recognition note:', event.error);
          this.isListening = false;
          if (this.onErrorCallback) {
            let userMsg = event.error;
            if (event.error === 'not-allowed') {
              userMsg = 'Microphone permission denied. Please allow microphone access.';
            } else if (event.error === 'no-speech') {
              userMsg = 'No speech detected. Please speak clearly.';
            } else if (event.error === 'network') {
              userMsg = 'Network connection issue with speech service.';
            }
            this.onErrorCallback(userMsg);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onEndCallback) this.onEndCallback();
        };
      } catch (err) {
        console.log('[VoiceService] Recognition init error:', err);
      }
    }
  }

  private resumeInterval: any = null;

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.cachedVoices = list;
          }
        } catch {
          this.cachedVoices = [];
        }
      };

      loadVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Retry voice loading up to 4 times for browsers that delay populating getVoices()
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        loadVoices();
        if (this.cachedVoices.length > 0 || attempts >= 4) {
          clearInterval(retryTimer);
        }
      }, 300);
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public unlockAudio() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // Ignored
      }
    }
  }

  public startListening(
    language: SupportedLanguage,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use Chrome on Android.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    // Map language tag for speech recognition
    let langTag = 'hi-IN';
    if (language === 'hi-IN' || language === 'hinglish') {
      langTag = 'hi-IN'; // hi-IN accurately captures Hindi & Hinglish
    } else if (language === 'en-IN') {
      langTag = 'en-IN';
    } else if (language === 'en-US') {
      langTag = 'en-US';
    }

    this.recognition.lang = langTag;

    try {
      this.playChime(660, 0.12); // Wake audio cue
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      console.log('[VoiceService] Recognition start exception:', e?.message || e);
      onError(e.message || 'Could not start microphone');
      this.isListening = false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
    }
    this.isListening = false;
  }

  public speak(
    text: string,
    language: SupportedLanguage = 'hinglish',
    rate: number = 1.0,
    pitch: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    // Clean text of markdown asterisks, hashes, brackets, and code blocks for crisp speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block completed.')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[#_`>~]/g, '')
      .replace(/✅|⏳|⚠️|❌|📋|📱|📊|🧮|📷|⚙️|▶️|💬|🎉|🚀|💡|👑|👋|📈|🏢/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // Clear previous resume watchdog
    if (this.resumeInterval) {
      clearInterval(this.resumeInterval);
      this.resumeInterval = null;
    }

    try {
      window.speechSynthesis.cancel(); // Cancel any lingering speech
    } catch {
      // Ignored
    }

    // Short timeout avoids WebKit/Chrome bug where cancel() immediately cancels subsequent speak()
    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = rate;
        utterance.pitch = pitch;

        // Refresh cached voices if empty
        if (this.cachedVoices.length === 0) {
          try {
            this.cachedVoices = window.speechSynthesis.getVoices();
          } catch {
            this.cachedVoices = [];
          }
        }

        const voices = this.cachedVoices;
        const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
        const isHindi = language === 'hi-IN' || hasDevanagari;

        let selectedVoice: SpeechSynthesisVoice | null = null;
        let targetLangTag = 'hi-IN';

        if (isHindi) {
          targetLangTag = 'hi-IN';
          selectedVoice =
            voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
            voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
            voices.find((v) => v.name.toLowerCase().includes('hindi')) ||
            voices.find((v) => v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('lekha')) ||
            null;
        } else if (language === 'hinglish') {
          targetLangTag = hasDevanagari ? 'hi-IN' : 'en-IN';
          selectedVoice =
            (hasDevanagari
              ? voices.find((v) => v.lang === 'hi-IN' || v.lang.toLowerCase().startsWith('hi'))
              : null) ||
            voices.find((v) => v.lang === 'en-IN') ||
            voices.find((v) => v.name.toLowerCase().includes('india')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
            null;
        } else if (language === 'en-IN') {
          targetLangTag = 'en-IN';
          selectedVoice =
            voices.find((v) => v.lang === 'en-IN') ||
            voices.find((v) => v.name.toLowerCase().includes('india')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
            null;
        } else {
          targetLangTag = 'en-US';
          selectedVoice =
            voices.find((v) => v.lang === 'en-US') ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
            voices[0] ||
            null;
        }

        utterance.lang = targetLangTag;
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Prevent garbage collection in Chrome during speech
        this.currentUtterance = utterance;
        (window as any)._activeUtterance = utterance;

        utterance.onstart = () => {
          if (onStart) onStart();
        };

        const handleFinish = () => {
          if (this.resumeInterval) {
            clearInterval(this.resumeInterval);
            this.resumeInterval = null;
          }
          this.currentUtterance = null;
          if (onEnd) onEnd();
        };

        utterance.onend = handleFinish;
        utterance.onerror = (e) => {
          console.log('[VoiceService] Synthesis note:', e?.error);
          handleFinish();
        };

        // Watchdog to prevent Chrome on Android from pausing on long text
        this.resumeInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            if (this.resumeInterval) {
              clearInterval(this.resumeInterval);
              this.resumeInterval = null;
            }
          } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 3500);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.log('[VoiceService] Speak exception:', err);
        if (onEnd) onEnd();
      }
    }, 30);
  }

  public stopSpeaking() {
    if (this.resumeInterval) {
      clearInterval(this.resumeInterval);
      this.resumeInterval = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored
      }
    }
    this.currentUtterance = null;
  }

  private playChime(freq: number, duration: number) {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio cue error ignored
    }
  }
}

export const voiceService = new VoiceService();
