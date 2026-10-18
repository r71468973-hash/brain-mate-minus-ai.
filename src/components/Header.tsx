import React from 'react';
import { Cpu, Settings, ShieldAlert, Sparkles, Volume2, Bell } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface HeaderProps {
  currentTab: string;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isClapActive: boolean;
  audioLevel: number;
  onOpenClapSettings: () => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
  isAdmin: boolean;
  systemAnnouncement?: string;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isClapActive,
  audioLevel,
  onOpenClapSettings,
  onOpenAdmin,
  onOpenSettings,
  isAdmin,
  systemAnnouncement,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            {isClapActive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-[#090d16]"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                Brain Mate
              </h1>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate hidden sm:block">
              Your Voice. Your AI. Your Control.
            </p>
          </div>
        </div>

        {/* Live Audio / Clap Monitor & Actions */}
        <div className="flex items-center gap-2">
          {/* Audio level meter when clap detector is active */}
          {isClapActive && (
            <button
              onClick={onOpenClapSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono transition-colors hover:bg-emerald-900/60"
              title="Clap Detector Active — Tap to tune sensitivity"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden xs:inline text-[11px] font-sans">Clap Sensor</span>
              {/* mini audio level bar */}
              <div className="w-8 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                />
              </div>
            </button>
          )}

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="text-xs bg-slate-900/80 border border-slate-700/80 text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="hinglish">Hinglish (हिंदी + Eng)</option>
            <option value="hi-IN">हिन्दी (Hindi)</option>
            <option value="en-IN">English (India)</option>
            <option value="en-US">English (US)</option>
          </select>

          {/* Restored Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition-colors"
            title="Open Brain Mate Settings (Voice, Language & Boss Mode)"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Super Admin Access */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isAdmin
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Super Admin Panel (r71468973@gmail.com)"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{isAdmin ? 'Admin Active' : 'Admin'}</span>
          </button>
        </div>
      </div>

      {/* System Announcement Banner if active */}
      {systemAnnouncement && (
        <div className="max-w-6xl mx-auto mt-2 px-3 py-1 bg-gradient-to-r from-indigo-950/60 to-slate-900/60 border border-indigo-500/20 rounded-lg flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2 truncate">
            <Bell className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{systemAnnouncement}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">Verified</span>
        </div>
      )}
    </header>
  );
};
