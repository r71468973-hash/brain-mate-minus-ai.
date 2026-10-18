import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ActionIntent, ChatMessage, SupportedLanguage } from '../types';
import { voiceService } from '../services/voiceService';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<any>;
  onExecuteIntent: (intent: ActionIntent) => void;
  onClearChat: () => void;
  language: SupportedLanguage;
  isLoading: boolean;
  activeError: string | null;
  onRetryLast: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onExecuteIntent,
  onClearChat,
  language,
  isLoading,
  activeError,
  onRetryLast,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    }
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceService.startListening(
        language,
        (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal) {
            setIsListening(false);
            handleSend(transcript);
          }
        },
        (err) => {
          console.warn('Speech error in chat:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleSpeakMessage = (msg: ChatMessage) => {
    if (speakingId === msg.id) {
      voiceService.stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(msg.id);
    const toSpeak = msg.spokenSummary || msg.content;
    voiceService.speak(
      toSpeak,
      msg.language || language,
      1.0,
      1.0,
      () => setSpeakingId(msg.id),
      () => setSpeakingId(null)
    );
  };

  const handleCopy = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedPrompts = [
    'Boss, mera kaam hua kya?',
    'Is my project complete?',
    'Reliance share ka analysis karo',
    'Nifty 50 live trend check karo',
    'Open WhatsApp',
    'Calculator open karo',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto px-3 sm:px-4 pb-20">
      {/* Top Chat Bar */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-extrabold text-white">Brain Mate AI Chat</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
            <span>👑</span> Boss Mode Active
          </span>
        </div>

        <button
          onClick={onClearChat}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Clear Chat History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[10px] text-cyan-400 font-bold tracking-wider">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Brain Mate AI
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeakMessage(msg)}
                        className={`text-slate-400 hover:text-cyan-300 transition-colors ${
                          speakingId === msg.id ? 'text-cyan-400 animate-pulse' : ''
                        }`}
                        title={speakingId === msg.id ? 'Stop speaking' : 'Read aloud'}
                      >
                        {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(msg)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed text-slate-100">
                  {msg.content}
                </div>

                {/* Intent Card if present */}
                {msg.intentAction && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-cyan-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                        {msg.intentAction.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 uppercase">
                        {msg.intentAction.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{msg.intentAction.description}</p>
                    <button
                      onClick={() => onExecuteIntent(msg.intentAction!)}
                      className="w-full mt-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>
                        {msg.intentAction.type === 'check_task_status'
                          ? 'View in Boss Task Tracker'
                          : msg.intentAction.type === 'execute_task'
                          ? 'Track Real Project Task'
                          : 'Execute Action'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl rounded-bl-none bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <div className="flex items-center gap-1">
                <span>Brain Mate is reasoning...</span>
                <span className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error notification with retry */}
        {activeError && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="truncate">{activeError}</span>
            </div>
            <button
              onClick={onRetryLast}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-[11px] shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up chips */}
      <div className="pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all hover:border-indigo-500/50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box Bar */}
      <div className="pt-1.5">
        <div className="flex items-end gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 focus-within:border-indigo-500 transition-colors shadow-lg">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to your speech...'
                : 'Type your question in Hindi, English, or Hinglish...'
            }
            className="flex-1 bg-transparent border-0 text-xs text-white placeholder-slate-400 focus:outline-none resize-none max-h-28 py-1.5 px-2"
          />

          {/* Voice Input Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={isListening ? 'Stop Listening' : 'Speak Question'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
