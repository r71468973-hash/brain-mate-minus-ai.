import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  Shield,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Trash2,
  Lock,
} from 'lucide-react';
import { BrowserAutomationItem } from '../types';
import { browserAutomationService } from '../services/browserAutomationService';

interface BrowserAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCommand?: string;
  onShowToast: (msg: string) => void;
}

export const BrowserAutomationModal: React.FC<BrowserAutomationModalProps> = ({
  isOpen,
  onClose,
  initialCommand,
  onShowToast,
}) => {
  const [commandInput, setCommandInput] = useState(initialCommand || '');
  const [history, setHistory] = useState<BrowserAutomationItem[]>([]);
  const [activeItem, setActiveItem] = useState<BrowserAutomationItem | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<BrowserAutomationItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory(browserAutomationService.getHistory());
      if (initialCommand && initialCommand.trim()) {
        setCommandInput(initialCommand);
        handleRunCommand(initialCommand);
      }
    }
  }, [isOpen, initialCommand]);

  if (!isOpen) return null;

  const handleRunCommand = async (customCmd?: string, confirmedByUser: boolean = false) => {
    const cmd = (customCmd || commandInput).trim();
    if (!cmd) return;

    setIsExecuting(true);
    setPendingConfirmation(null);

    try {
      const result = await browserAutomationService.executeCommand(cmd, confirmedByUser);
      setActiveItem(result);
      setHistory(browserAutomationService.getHistory());

      if (result.status === 'requires_confirmation') {
        setPendingConfirmation(result);
        onShowToast('Action requires your explicit confirmation.');
      } else {
        onShowToast(result.resultMessage);
      }
    } catch (e: any) {
      onShowToast(`Automation error: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirmation) return;
    await handleRunCommand(pendingConfirmation.command, true);
  };

  const handleClearHistory = () => {
    browserAutomationService.clearHistory();
    setHistory([]);
    setActiveItem(null);
    setPendingConfirmation(null);
    onShowToast('Browser automation history cleared.');
  };

  const quickCommands = [
    'Open YouTube and search AI documentary',
    'Search Google for Reliance share market news',
    'Open website https://news.google.com',
    'Navigate to https://github.com',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="w-full sm:max-w-2xl bg-gradient-to-b from-[#0c1425] via-[#090d16] to-[#070b14] border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Globe className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Brain Mate Browser Automation Engine</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Verified Gateway
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Voice-guided website navigation, web search & secure action execution
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

        {/* Command Input Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
                placeholder="Enter command e.g., 'Open YouTube', 'Search for AI news'..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <button
              onClick={() => handleRunCommand()}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Running...' : 'Execute'}</span>
            </button>
          </div>

          {/* Quick Command Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">Try:</span>
            {quickCommands.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCommandInput(q);
                  handleRunCommand(q);
                }}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Body & Session Logs */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Sensitive Action Confirmation Guard */}
          {pendingConfirmation && (
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Security Confirmation Required</h4>
                  <p className="text-xs text-amber-200">
                    {pendingConfirmation.confirmationPrompt || 'This action requires explicit approval before executing.'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-300">
                    Target Command: "{pendingConfirmation.command}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setPendingConfirmation(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel & Abort
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/30"
                >
                  Approve & Execute
                </button>
              </div>
            </div>
          )}

          {/* Active Execution Summary */}
          {activeItem && !pendingConfirmation && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Latest Action Result</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(activeItem.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-300 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {activeItem.resultMessage}
              </p>
              {activeItem.targetUrl && (
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400 truncate max-w-sm">Target: {activeItem.targetUrl}</span>
                  <a
                    href={activeItem.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline font-semibold"
                  >
                    Open Directly <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Automation History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                Session Audit History ({history.length})
              </h4>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-slate-500 text-center py-6 text-[11px]">
                No browser actions recorded yet. Give a voice or text command above.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate text-xs">
                        {item.command}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {item.resultMessage}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 border ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : item.status === 'requires_confirmation'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
