import React, { useState } from 'react';
import {
  X,
  Settings,
  Languages,
  Volume2,
  VolumeX,
  Mic,
  Shield,
  Sparkles,
  Clock,
  Sliders,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';
import { SupportedLanguage, VoiceAssistantConfig } from '../types';
import { voiceService } from '../services/voiceService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VoiceAssistantConfig;
  onUpdateConfig: (updated: VoiceAssistantConfig) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenClapModal: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  language,
  onLanguageChange,
  onOpenClapModal,
  onOpenAdmin,
  isAdmin,
}) => {
  const [testSpeaking, setTestSpeaking] = useState(false);

  if (!isOpen) return null;

  const handleToggleTts = () => {
    const updated = { ...config, voiceTtsEnabled: !config.voiceTtsEnabled };
    onUpdateConfig(updated);
  };

  const handleToggleAutoGreeting = () => {
    const updated = { ...config, autoGreetingEnabled: !config.autoGreetingEnabled };
    onUpdateConfig(updated);
  };

  const handleToggleClap = () => {
    const updated = { ...config, clapDetectionEnabled: !config.clapDetectionEnabled };
    onUpdateConfig(updated);
  };

  const handleRateChange = (rate: number) => {
    const updated = { ...config, voiceRate: rate };
    onUpdateConfig(updated);
  };

  const handlePitchChange = (pitch: number) => {
    const updated = { ...config, voicePitch: pitch };
    onUpdateConfig(updated);
  };

  const handleTestVoice = () => {
    setTestSpeaking(true);
    let sampleText = 'Haanji Boss! Brain Mate voice output active hai. Main aapki command ke liye ready hoon.';
    if (language === 'hi-IN') {
      sampleText = 'नमस्ते बॉस! ब्रेन मेट एआई की आवाज सक्रिय है। मैं आपका कार्य निष्पादित करने के लिए तैयार हूँ।';
    } else if (language === 'en-IN' || language === 'en-US') {
      sampleText = 'Hello Boss! Brain Mate voice output is active and ready for your commands.';
    }

    voiceService.speak(
      sampleText,
      language,
      config.voiceRate || 1.0,
      config.voicePitch || 1.0,
      () => setTestSpeaking(true),
      () => setTestSpeaking(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="w-full sm:max-w-lg bg-gradient-to-b from-[#0c1425] via-[#090d16] to-[#070b14] border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Settings className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Brain Mate Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Voice, Multilingual, and Boss Mode Preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Boss Mode Badge */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="font-bold text-white">Boss Mode: Active</h4>
                <p className="text-[11px] text-slate-300">
                  Always addresses you respectfully as "Boss" in Hindi, English, and Hinglish.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-[10px]">
              Active
            </span>
          </div>

          {/* Language Selection */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white">Voice & Text Language</h4>
              </div>
              <span className="text-[10px] text-slate-400">Auto-Detect Supported</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'hi-IN', label: 'हिन्दी (Hindi)', note: 'हिंदी में बोलें और सुनें' },
                { id: 'hinglish', label: 'Hinglish', note: 'हिंदी + English mix' },
                { id: 'en-IN', label: 'English (India)', note: 'Indian English accent' },
                { id: 'en-US', label: 'English (US)', note: 'Standard US English' },
              ].map((lang) => {
                const isSelected = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => onLanguageChange(lang.id as SupportedLanguage)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]">{lang.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lang.note}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Output (TTS) & Speed Tuning */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <div>
                  <h4 className="font-bold text-white">Speech Synthesis (Voice Output)</h4>
                  <p className="text-[11px] text-slate-400">Assistant speaks answers aloud</p>
                </div>
              </div>

              <button
                onClick={handleToggleTts}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  config.voiceTtsEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {config.voiceTtsEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            {config.voiceTtsEnabled && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                {/* Speech Rate */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Speech Rate (Speed):</span>
                    <span className="font-mono text-cyan-400 font-bold">{config.voiceRate || 1.0}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={config.voiceRate || 1.0}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Slower (0.75x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Faster (1.5x)</span>
                  </div>
                </div>

                {/* Test Voice Button */}
                <button
                  onClick={handleTestVoice}
                  disabled={testSpeaking}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 font-semibold transition-colors"
                >
                  <Play className={`w-3.5 h-3.5 ${testSpeaking ? 'animate-pulse text-emerald-400' : ''}`} />
                  <span>{testSpeaking ? 'Speaking sample...' : 'Test Assistant Voice'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Time-Based Greetings */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="font-bold text-white">Time-Based Greetings</h4>
                <p className="text-[11px] text-slate-400">
                  Good Morning / Afternoon / Evening Boss on boot
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleAutoGreeting}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                config.autoGreetingEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {config.autoGreetingEnabled ? 'Active' : 'Off'}
            </button>
          </div>

          {/* Hands-free Clap Detection */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="font-bold text-white">Clap Sensor Activation</h4>
                <p className="text-[11px] text-slate-400">
                  Wake assistant hands-free with a deliberate double clap
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleClap}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  config.clapDetectionEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {config.clapDetectionEnabled ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenClapModal();
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Calibrate clap threshold"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Super Administrator Quick Access */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="font-bold text-white">Super Administrator</h4>
                <p className="text-[11px] text-slate-400">
                  r71468973@gmail.com server control panel
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
            >
              {isAdmin ? 'Open Admin' : 'Admin Login'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Brain Mate AI Assistant Pro</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
