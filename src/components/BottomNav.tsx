import React from 'react';
import { Home, MessageSquare, TrendingUp, Mic, CheckSquare, Settings, Video } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onTriggerVoiceModal: () => void;
  onOpenSettings?: () => void;
  isVoiceActive: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onTriggerVoiceModal,
  onOpenSettings,
  isVoiceActive,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-area-bottom">
      <div className="max-w-xl mx-auto flex items-center justify-around relative">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        {/* AI Chat */}
        <button
          onClick={() => onTabChange('chat')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'chat'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className={`w-5 h-5 transition-transform ${activeTab === 'chat' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1">AI Chat</span>
        </button>

        {/* Center Prominent Glowing Voice Mic Button */}
        <div className="relative -top-5">
          <button
            onClick={onTriggerVoiceModal}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
              isVoiceActive
                ? 'bg-gradient-to-tr from-rose-500 to-amber-500 scale-110 ring-4 ring-rose-500/30 shadow-rose-500/40 animate-pulse'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 ring-4 ring-indigo-500/20 shadow-indigo-500/30 hover:scale-105 active:scale-95'
            }`}
            title="Voice Assistant — Speak in Hindi, English, or Hinglish"
          >
            <Mic className="w-6 h-6 text-white" />
          </button>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-indigo-300 pointer-events-none">
            Speak
          </span>
        </div>

        {/* AI Video Studio */}
        <button
          onClick={() => onTabChange('studio')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
            activeTab === 'studio'
              ? 'text-rose-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="AI Video Studio & YouTube Creator"
        >
          <div className="relative">
            <Video className={`w-5 h-5 transition-transform ${activeTab === 'studio' ? 'scale-110' : ''}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <span className="text-[10px] mt-1">Video AI</span>
        </button>

        {/* Share Market */}
        <button
          onClick={() => onTabChange('markets')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
            activeTab === 'markets'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className={`w-5 h-5 transition-transform ${activeTab === 'markets' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1">Markets</span>
        </button>

        {/* Tasks & Notes */}
        <button
          onClick={() => onTabChange('tasks')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
            activeTab === 'tasks'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className={`w-5 h-5 transition-transform ${activeTab === 'tasks' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1">Tasks</span>
        </button>
      </div>
    </nav>
  );
};
