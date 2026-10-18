import React, { useState } from 'react';
import {
  X,
  Volume2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Sparkles,
} from 'lucide-react';

interface ClapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isClapActive: boolean;
  audioLevel: number;
  sensitivity: number;
  onUpdateSensitivity: (val: number) => void;
  onToggleClap: () => void;
  lastClapCount: number;
}

export const ClapSettingsModal: React.FC<ClapSettingsModalProps> = ({
  isOpen,
  onClose,
  isClapActive,
  audioLevel,
  sensitivity,
  onUpdateSensitivity,
  onToggleClap,
  lastClapCount,
}) => {
  if (!isOpen) return null;

  const threshold = Math.max(35, 105 - sensitivity);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full sm:max-w-md bg-gradient-to-b from-[#0c1425] to-[#070b14] border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Clap-to-Activate Sensor
              </h3>
              <p className="text-[11px] text-slate-400">
                Acoustic transient spike detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Audio Level & Threshold Calibration Meter */}
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Live Room Sound Level:</span>
            <span className="font-mono text-cyan-400 font-bold">{audioLevel}%</span>
          </div>

          {/* Meter Bar */}
          <div className="h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
              style={{ width: `${Math.min(100, audioLevel * 1.2)}%` }}
            />
            {/* Threshold Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-md shadow-cyan-400 rounded-full"
              style={{ left: `${threshold}%` }}
              title={`Trigger Threshold: ${threshold}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Ambient Noise</span>
            <span className="text-cyan-400">▲ Clap Trigger Line ({threshold}%)</span>
            <span>Max Peak</span>
          </div>

          {/* Clap Detection Counter */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
            <span className="text-slate-400">Claps Detected in Session:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono font-bold">
              {lastClapCount} claps
            </span>
          </div>
        </div>

        {/* Sensitivity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Sensor Sensitivity</span>
            <span className="font-mono text-indigo-400 font-bold">{sensitivity}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={90}
            value={sensitivity}
            onChange={(e) => onUpdateSensitivity(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Low (Requires loud clap)</span>
            <span>High (Sensitive)</span>
          </div>
        </div>

        {/* Sensor Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <div className="font-bold text-xs text-white">Clap Sensor State</div>
            <p className="text-[11px] text-slate-400">
              {isClapActive ? 'Monitoring room for deliberate claps' : 'Microphone listener paused'}
            </p>
          </div>
          <button
            onClick={onToggleClap}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isClapActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isClapActive ? 'Pause' : 'Activate'}
          </button>
        </div>

        {/* Privacy & Anti-Echo Guarantees */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Anti-Echo &amp; Zero Recording Guarantee</span>
          </div>
          <p>
            Brain Mate analyzes waveform peaks locally in memory. Audio is never recorded to disk or sent to any server during clap listening. Debounce gating prevents echoes and repetitive false triggers.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
        >
          Save &amp; Close
        </button>
      </div>
    </div>
  );
};
