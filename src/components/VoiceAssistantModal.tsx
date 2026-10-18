import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  Square,
  MessageSquare,
  Radio,
} from 'lucide-react';
import { ActionIntent, SupportedLanguage } from '../types';
import { voiceService } from '../services/voiceService';
import { detectLanguage } from '../utils/languageDetector';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onExecuteIntent: (intent: ActionIntent) => void;
  onSendMessage: (text: string) => Promise<{ text: string; spokenSummary?: string; intent?: ActionIntent }>;
  onOpenSettings?: () => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  initialPrompt?: string;
  notesCount: number;
  tasksCount: number;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  language,
  onExecuteIntent,
  onSendMessage,
  onOpenSettings,
  onLanguageChange,
  initialPrompt,
  notesCount,
  tasksCount,
}) => {
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(language);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [spokenSummary, setSpokenSummary] = useState<string | null>(null);
  const [detectedIntent, setDetectedIntent] = useState<ActionIntent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [showTypeInput, setShowTypeInput] = useState(false);

  const followUpTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      voiceService.unlockAudio();
      setErrorMessage(null);
      setDetectedIntent(null);
      setShowTypeInput(false);
      setTypedInput('');
      if (initialPrompt) {
        setTranscript(initialPrompt);
        handleSendPrompt(initialPrompt);
      } else {
        startListeningSession();
      }
    } else {
      cleanupAllAudio();
    }

    return () => {
      cleanupAllAudio();
    };
  }, [isOpen, initialPrompt]);

  const cleanupAllAudio = () => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    voiceService.stopListening();
    voiceService.stopSpeaking();
    setIsListening(false);
    setIsSpeaking(false);
  };

  const startListeningSession = () => {
    setErrorMessage(null);
    setTranscript('');
    setInterimText('');
    setDetectedIntent(null);

    if (!voiceService.isSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome on Android, or type below.');
      setShowTypeInput(true);
      return;
    }

    voiceService.startListening(
      activeLang,
      (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterimText('');
          // Check for exit commands
          const lower = text.toLowerCase().trim();
          if (lower === 'stop' || lower === 'band karo' || lower === 'exit' || lower === 'close' || lower === 'chup raho') {
            voiceService.stopListening();
            voiceService.stopSpeaking();
            onClose();
            return;
          }
          handleSendPrompt(text);
        } else {
          setInterimText(text);
        }
      },
      (err) => {
        setErrorMessage(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
    setIsListening(true);
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;

    voiceService.stopListening();
    setIsListening(false);
    setIsProcessing(true);
    setErrorMessage(null);

    // Detect if Boss requested Settings
    const lowerPrompt = promptText.toLowerCase().trim();
    if (
      lowerPrompt.includes('open setting') ||
      lowerPrompt.includes('settings kholo') ||
      lowerPrompt.includes('setting kholo') ||
      lowerPrompt.includes('सेटिंग्स खोलो') ||
      lowerPrompt.includes('सेटिंग खोलो')
    ) {
      voiceService.stopListening();
      voiceService.stopSpeaking();
      onClose();
      if (onOpenSettings) onOpenSettings();
      return;
    }

    // Automatically detect language from speech/text (Hindi Devanagari, Hinglish, English)
    const detectedLang = detectLanguage(promptText, activeLang);
    setActiveLang(detectedLang);
    if (onLanguageChange && detectedLang !== language) {
      onLanguageChange(detectedLang);
    }

    try {
      const result = await onSendMessage(promptText);
      setAiResponse(result.text);
      setSpokenSummary(result.spokenSummary || null);

      if (result.intent) {
        setDetectedIntent(result.intent);
      }

      // Speak response if TTS is enabled in the detected language
      if (ttsEnabled && (result.spokenSummary || result.text)) {
        const textToSpeak = result.spokenSummary || result.text;
        const isHindiText = /[\u0900-\u097F]/.test(textToSpeak);
        const speechLang = isHindiText ? 'hi-IN' : detectedLang;
        voiceService.speak(
          textToSpeak,
          speechLang,
          1.0,
          1.0,
          () => setIsSpeaking(true),
          () => {
            setIsSpeaking(false);
            // Continuous follow-up listening mode:
            if (continuousMode && isOpen) {
              followUpTimerRef.current = setTimeout(() => {
                if (isOpen) {
                  startListeningSession();
                }
              }, 700);
            }
          }
        );
      } else if (continuousMode && isOpen) {
        followUpTimerRef.current = setTimeout(() => {
          if (isOpen) {
            startListeningSession();
          }
        }, 1200);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error processing your voice request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopAllAudio = () => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md transition-all">
      <div className="w-full sm:max-w-lg bg-gradient-to-b from-[#0c1425] via-[#090d16] to-[#070a12] border border-indigo-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              Brain Mate Voice Assistant
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
              {language}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Continuous Follow-up Toggle */}
            <button
              onClick={() => setContinuousMode(!continuousMode)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                continuousMode
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Continuous conversation mode keeps listening for follow-up questions"
            >
              <Radio className={`w-3.5 h-3.5 ${continuousMode ? 'animate-pulse text-cyan-400' : ''}`} />
              <span className="hidden xs:inline">Continuous</span>
            </button>

            {/* TTS Mute Button */}
            <button
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                if (!next) stopAllAudio();
              }}
              className={`p-1.5 rounded-lg border text-xs ${
                ttsEnabled
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={ttsEnabled ? 'Mute AI Voice Responses' : 'Enable AI Voice Responses'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={() => {
                cleanupAllAudio();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Voice Visualizer Orb */}
        <div className="p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="relative flex items-center justify-center my-3">
            {/* Animated Glow Rings */}
            <div
              className={`absolute w-36 h-36 rounded-full transition-all duration-700 pointer-events-none ${
                isListening
                  ? 'bg-rose-500/25 animate-ping'
                  : isSpeaking
                  ? 'bg-cyan-500/25 animate-pulse'
                  : isProcessing
                  ? 'bg-indigo-500/25 animate-spin'
                  : 'bg-indigo-500/10'
              }`}
            />
            <div
              className={`absolute w-28 h-28 rounded-full blur-xl transition-all duration-500 ${
                isListening
                  ? 'bg-rose-500/40'
                  : isSpeaking
                  ? 'bg-cyan-400/40'
                  : isProcessing
                  ? 'bg-indigo-500/40'
                  : 'bg-indigo-500/20'
              }`}
            />

            {/* Center Mic Orb */}
            <button
              onClick={() => {
                if (isListening) {
                  voiceService.stopListening();
                  setIsListening(false);
                } else {
                  startListeningSession();
                }
              }}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-500 scale-105 ring-4 ring-rose-500/40'
                  : isSpeaking
                  ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 scale-105 ring-4 ring-cyan-500/40 animate-pulse'
                  : isProcessing
                  ? 'bg-gradient-to-tr from-indigo-700 to-purple-600'
                  : 'bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:scale-105'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 text-white animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 text-white animate-pulse" />
              ) : isProcessing ? (
                <Sparkles className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          <div className="space-y-1 mt-1">
            <p className="text-sm font-bold text-white">
              {isListening
                ? 'Listening... (Speak your question)'
                : isProcessing
                ? 'Brain Mate reasoning...'
                : isSpeaking
                ? 'Speaking response...'
                : 'Tap microphone to speak'}
            </p>
            <p className="text-[11px] text-slate-400">
              Hindi • English • Hinglish (Say &quot;Stop&quot; or tap close anytime)
            </p>
          </div>

          {/* Transcript / Interim text */}
          {(transcript || interimText) && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 max-w-sm w-full font-medium">
              <span className="text-cyan-400 mr-1.5 font-bold">You:</span>
              <span>{transcript || interimText}</span>
              {interimText && <span className="animate-pulse">...</span>}
            </div>
          )}

          {errorMessage && (
            <div className="mt-2.5 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left max-w-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Fallback Type Input Toggle */}
          {showTypeInput && (
            <div className="mt-3 w-full max-w-sm flex gap-1.5">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendPrompt(typedInput);
                    setTypedInput('');
                  }
                }}
                placeholder="Type question if mic is unavailable..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  handleSendPrompt(typedInput);
                  setTypedInput('');
                }}
                className="px-3 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* AI Answer & Intent Action Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
          {aiResponse && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Brain Mate Response
                </span>
                {isSpeaking && (
                  <button
                    onClick={stopAllAudio}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[10px] font-semibold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20"
                  >
                    <Square className="w-2.5 h-2.5 fill-rose-400" />
                    <span>Stop Voice</span>
                  </button>
                )}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                {aiResponse}
              </div>
            </div>
          )}

          {/* Detected Intent Card */}
          {detectedIntent && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/80 to-cyan-950/80 border border-cyan-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  {detectedIntent.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                  {detectedIntent.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">{detectedIntent.description}</p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onExecuteIntent(detectedIntent);
                    cleanupAllAudio();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <span>Confirm &amp; Execute Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDetectedIntent(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={startListeningSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask Follow-up</span>
            </button>
            <button
              onClick={() => setShowTypeInput(!showTypeInput)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title="Type question instead"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              cleanupAllAudio();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
