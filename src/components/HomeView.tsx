import React from 'react';
import {
  Mic,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Volume2,
  Share2,
  Phone,
  MessageSquare,
  Camera,
  MapPin,
  Sliders,
  ChevronRight,
  Zap,
  Video,
  Globe,
} from 'lucide-react';
import { ExecutableTask, MarketStock, UserNote, UserTask } from '../types';
import { AndroidIntentService } from '../services/androidIntents';

interface HomeViewProps {
  onStartVoice: (initialPrompt?: string) => void;
  onOpenMarketStock: (stock: MarketStock) => void;
  onOpenTab: (tab: string) => void;
  onOpenBrowserAutomation?: () => void;
  stocks: MarketStock[];
  tasks: UserTask[];
  notes: UserNote[];
  executableTasks?: ExecutableTask[];
  onAskTaskStatus?: (query?: string) => void;
  greetingInfo?: { greeting: string; period: string };
  isClapActive: boolean;
  audioLevel: number;
  clapSensitivity: number;
  onUpdateClapSensitivity: (val: number) => void;
  onToggleClap: () => void;
  onOpenClapModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartVoice,
  onOpenMarketStock,
  onOpenTab,
  onOpenBrowserAutomation,
  stocks,
  tasks,
  notes,
  executableTasks = [],
  onAskTaskStatus,
  greetingInfo,
  isClapActive,
  audioLevel,
  clapSensitivity,
  onUpdateClapSensitivity,
  onToggleClap,
  onOpenClapModal,
}) => {
  const quickPrompts = [
    { label: 'Mera Kaam Hua Kya?', text: 'Boss, mera kaam hua kya?', icon: Sparkles, highlight: true },
    { label: '🎬 Video Creator', text: 'Boss, create a video about technology for YouTube Shorts', icon: Video, action: () => onOpenTab('studio') },
    { label: '🌐 Browser Automator', text: 'Brain Mate, open Google and search tech news', icon: Globe, action: () => onOpenBrowserAutomation?.() },
    { label: 'Reliance Share Analysis', text: 'Brain Mate, Reliance share ka analysis karo', icon: TrendingUp },
    { label: 'Is Project Complete?', text: 'Is my project complete?', icon: CheckCircle2 },
  ];

  const pendingTasks = tasks.filter((t) => !t.isCompleted);

  return (
    <div className="space-y-5 pb-20 pt-2 max-w-4xl mx-auto px-4">
      {/* Hero Assistant Banner with Boss Mode & Time-Based Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/90 via-[#0c1424] to-slate-900 border border-indigo-500/30 p-5 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span className="text-amber-400">👑</span>
              <span>Boss Mode Active • Hindi, English & Hinglish</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{greetingInfo?.greeting || 'Good Day, Boss!'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Your Voice. Your AI. Your Control.
            </p>
          </div>

          {/* Quick Triggers */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onStartVoice()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Mic className="w-4 h-4 text-white animate-pulse" />
              <span>Speak to Brain Mate</span>
            </button>

            <button
              onClick={() => onOpenTab('chat')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 font-bold text-xs sm:text-sm transition-all hover:border-cyan-500/50"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>AI Chat</span>
            </button>
          </div>
        </div>

        {/* Quick Voice Suggestions */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Ask Boss Status or Command:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if ((item as any).action) {
                    (item as any).action();
                  } else if (item.highlight && onAskTaskStatus) {
                    onAskTaskStatus(item.text);
                  } else {
                    onStartVoice(item.text);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  item.highlight
                    ? 'bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-400/50 text-indigo-200'
                    : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-200 hover:border-indigo-500/50'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clap-to-Open Sensor Card */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isClapActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Clap-to-Activate Detection</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isClapActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                  {isClapActive ? 'Active & Listening' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Firm deliberate clap when screen is ON wakes Brain Mate hands-free.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleClap}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isClapActive
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isClapActive ? 'Pause Sensor' : 'Enable Sensor'}
            </button>
            <button
              onClick={onOpenClapModal}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Tune sensitivity & audio meter"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Visualizer & Sensitivity meter */}
        {isClapActive && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-3 text-xs">
            <span className="text-slate-400 text-[11px] shrink-0 font-mono">Mic Level:</span>
            <div className="flex-1 bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
              <div
                className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
                style={{ width: `${Math.min(100, audioLevel * 1.2)}%` }}
              />
              {/* Threshold line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-sm shadow-cyan-400"
                style={{ left: `${Math.max(10, 100 - clapSensitivity)}%` }}
                title="Clap Trigger Threshold"
              />
            </div>
            <span className="text-[11px] font-mono text-emerald-400 w-8 text-right shrink-0">{audioLevel}%</span>
          </div>
        )}
      </div>

      {/* Share Market Live Intraday Ticker Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Share Market Highlights (NSE / BSE)</h3>
            <span className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
              Delayed 15m
            </span>
          </div>
          <button
            onClick={() => onOpenTab('markets')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            All Stocks <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {stocks.slice(0, 4).map((stock) => {
            const isPos = stock.change >= 0;
            return (
              <div
                key={stock.symbol}
                onClick={() => onOpenMarketStock(stock)}
                className="cursor-pointer rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 p-3 transition-all hover:bg-slate-800/80 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors truncate">
                    {stock.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{stock.exchange}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-extrabold font-mono text-white">
                    ₹{stock.price.toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>RSI: {stock.rsi14}</span>
                  <span className="text-indigo-400">Analysis →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Android Intents and Shortcuts */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Android Native Integrations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => AndroidIntentService.openWhatsApp()}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors border border-slate-700/50"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Open WhatsApp</span>
          </button>

          <button
            onClick={() => AndroidIntentService.openDialer('')}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors border border-slate-700/50"
          >
            <Phone className="w-4 h-4 text-cyan-400" />
            <span>Phone Dialer</span>
          </button>

          <button
            onClick={() => AndroidIntentService.openCamera()}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors border border-slate-700/50"
          >
            <Camera className="w-4 h-4 text-indigo-400" />
            <span>Camera Capture</span>
          </button>

          <button
            onClick={() => AndroidIntentService.shareNative('Brain Mate AI Assistant', 'Your Voice. Your AI. Your Control. Android AI Assistant with Market Analysis.')}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors border border-slate-700/50"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Native Share</span>
          </button>
        </div>
      </div>

      {/* Real Executable Projects & Task Status System */}
      <div className="rounded-xl bg-slate-900/80 border border-indigo-500/30 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Boss's Real Tasks & Projects ({executableTasks.length})
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              Real Engine
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAskTaskStatus?.('Boss, mera kaam hua kya?')}
              className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>"Mera Kaam Hua Kya?"</span>
            </button>
            <button
              onClick={() => onOpenTab('tasks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center"
            >
              All Projects <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {executableTasks.slice(0, 4).map((task) => {
            const statusConfig = {
              'Completed': { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', icon: '✅' },
              'In Progress': { bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400', icon: '⏳' },
              'Waiting for User Action': { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', icon: '⚠️' },
              'Failed': { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', icon: '❌' },
              'Pending': { bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400', icon: '📋' },
            }[task.status] || { bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400', icon: '📋' };

            return (
              <div
                key={task.id}
                onClick={() => onAskTaskStatus?.(`Boss, check status of "${task.title}"`)}
                className="cursor-pointer p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition-all hover:bg-slate-850 space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                    {task.title}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border shrink-0 ${statusConfig.bg}`}>
                    {statusConfig.icon} {task.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {task.result || task.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Steps: {task.steps.filter((s) => s.status === 'Completed').length}/{task.steps.length}</span>
                  <span className="text-indigo-400 group-hover:underline">Tap to Ask Status →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Tasks & Quick Notes Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pending Tasks */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Reminders ({pendingTasks.length})</h4>
            </div>
            <button
              onClick={() => onOpenTab('tasks')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              Manage
            </button>
          </div>

          <div className="space-y-1.5">
            {pendingTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-800 text-xs text-slate-200"
              >
                <span className="truncate pr-2">{task.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Notes */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Saved Notes ({notes.length})</h4>
            </div>
            <button
              onClick={() => onOpenTab('tasks')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              View All
            </button>
          </div>

          <div className="space-y-1.5">
            {notes.slice(0, 2).map((note) => (
              <div
                key={note.id}
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-800 text-xs text-slate-200"
              >
                <div className="font-semibold text-white truncate">{note.title}</div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
