import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { MarketView } from './components/MarketView';
import { TasksNotesView } from './components/TasksNotesView';
import { AdminView } from './components/AdminView';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { StockDetailModal } from './components/StockDetailModal';
import { ClapSettingsModal } from './components/ClapSettingsModal';
import { IntentConfirmationModal } from './components/IntentConfirmationModal';
import { ApkReleaseModal } from './components/ApkReleaseModal';
import { SettingsModal } from './components/SettingsModal';
import { detectLanguage } from './utils/languageDetector';

import {
  ActionIntent,
  ChatMessage,
  ExecutableTask,
  MarketStock,
  SupportedLanguage,
  TaskExecutionStatus,
  UserNote,
  UserTask,
  VoiceAssistantConfig,
} from './types';
import { StorageService } from './services/storage';
import { clapDetector } from './services/clapDetector';
import { AndroidIntentService } from './services/androidIntents';
import { voiceService } from './services/voiceService';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'markets' | 'tasks' | 'admin'>('home');

  // Assistant Configuration
  const [language, setLanguage] = useState<SupportedLanguage>('hinglish');
  const [voiceConfig, setVoiceConfig] = useState<VoiceAssistantConfig>(() => StorageService.getVoiceConfig());
  const [greetingInfo, setGreetingInfo] = useState(() => StorageService.getGreetingInfo());

  // Data collections
  const [notes, setNotes] = useState<UserNote[]>(() => StorageService.getNotes());
  const [tasks, setTasks] = useState<UserTask[]>(() => StorageService.getTasks());
  const [executableTasks, setExecutableTasks] = useState<ExecutableTask[]>(() => StorageService.getExecutableTasks());
  const [watchlist, setWatchlist] = useState<string[]>(() => StorageService.getWatchlist());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => StorageService.getChatHistory());

  // AI Loading & Error States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Stock Market State
  const [stocks, setStocks] = useState<MarketStock[]>([]);
  const [selectedStock, setSelectedStock] = useState<MarketStock | null>(null);

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceInitialPrompt, setVoiceInitialPrompt] = useState<string | undefined>(undefined);
  const [isClapModalOpen, setIsClapModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<ActionIntent | null>(null);

  // Clap Sensor State
  const [isClapActive, setIsClapActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [clapCount, setClapCount] = useState(0);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(false);
  const adminEmail = 'r71468973@gmail.com';

  // PWA BeforeInstallPrompt Event
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 0. Automatic Time-Based Greeting on first session of greeting period
  useEffect(() => {
    if (voiceConfig.autoGreetingEnabled) {
      const info = StorageService.getGreetingInfo();
      setGreetingInfo(info);
      if (info.shouldGreet) {
        StorageService.recordGreetingDelivered(info.period);
        showToast(`👋 ${info.greeting}`);
        // Allow assistant to speak greeting aloud when voice output is enabled (without activating mic)
        if (voiceConfig.voiceTtsEnabled) {
          setTimeout(() => {
            voiceService.speak(info.greeting, language, 1.0, 1.0);
          }, 600);
        }
      }
    }
  }, []);

  // 1. Fetch live/delayed stock market quotes on boot
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/market/quotes');
        if (res.ok) {
          const data = await res.json();
          if (data.stocks && data.stocks.length > 0) {
            setStocks(data.stocks);
          }
        }
      } catch (e) {
        console.warn('Failed to load quotes from server:', e);
      }
    };
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // 1-minute ticker refresh
    return () => clearInterval(interval);
  }, []);

  // 2. Setup PWA install listeners
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // 3. Setup Clap-to-Activate Sensor
  useEffect(() => {
    if (voiceConfig.clapDetectionEnabled) {
      startClapSensor();
    } else {
      clapDetector.stop();
      setIsClapActive(false);
    }

    return () => {
      clapDetector.stop();
    };
  }, [voiceConfig.clapDetectionEnabled, voiceConfig.clapSensitivity]);

  const startClapSensor = async () => {
    const success = await clapDetector.start(
      voiceConfig.clapSensitivity,
      () => {
        // Deliberate clap detected!
        setClapCount((prev) => prev + 1);
        if ('vibrate' in navigator) {
          navigator.vibrate([60, 60, 60]);
        }
        showToast('👏 Clap Detected! Summoning Brain Mate...');
        // Open voice assistant in listening mode
        setVoiceInitialPrompt(undefined);
        setIsVoiceModalOpen(true);
      },
      (level) => setAudioLevel(level),
      (err) => {
        console.warn('Clap detection notice:', err);
        setIsClapActive(false);
      }
    );
    setIsClapActive(success);
  };

  const handleToggleClap = () => {
    const nextState = !isClapActive;
    if (nextState) {
      const newConfig = { ...voiceConfig, clapDetectionEnabled: true };
      setVoiceConfig(newConfig);
      StorageService.saveVoiceConfig(newConfig);
      startClapSensor();
      showToast('Clap Sensor activated. Monitoring room.');
    } else {
      clapDetector.stop();
      setIsClapActive(false);
      const newConfig = { ...voiceConfig, clapDetectionEnabled: false };
      setVoiceConfig(newConfig);
      StorageService.saveVoiceConfig(newConfig);
      showToast('Clap Sensor paused.');
    }
  };

  const handleUpdateClapSensitivity = (val: number) => {
    const newConfig = { ...voiceConfig, clapSensitivity: val };
    setVoiceConfig(newConfig);
    StorageService.saveVoiceConfig(newConfig);
    clapDetector.setSensitivity(val);
  };

  // 4. Handle Voice Modal execution
  const handleStartVoice = (initialPrompt?: string) => {
    setVoiceInitialPrompt(initialPrompt);
    setIsVoiceModalOpen(true);
  };

  // 5. Send message with full conversational context
  const handleSendMessage = async (text: string) => {
    setChatError(null);
    setIsAiLoading(true);

    // Auto-detect language (Hindi, Hinglish, English) from input text
    const detectedLang = detectLanguage(text, language);
    let effectiveLang = language;
    if (detectedLang !== language) {
      effectiveLang = detectedLang;
      setLanguage(detectedLang);
      const newConfig = { ...voiceConfig, language: detectedLang };
      setVoiceConfig(newConfig);
      StorageService.saveVoiceConfig(newConfig);
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      language: effectiveLang,
    };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    StorageService.saveChatHistory(updatedHistory);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.slice(-8),
          language: effectiveLang,
          context: {
            notes,
            tasks,
            watchlist,
            executableTasks,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok && !data.text) {
        throw new Error(data.error || 'Server error communicating with AI brain.');
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.text || 'Command processed.',
        timestamp: Date.now(),
        language,
        spokenSummary: data.spokenSummary,
        intentAction: data.intent,
      };

      const finalHistory = [...updatedHistory, botMsg];
      setChatHistory(finalHistory);
      StorageService.saveChatHistory(finalHistory);

      return {
        text: data.text,
        spokenSummary: data.spokenSummary,
        intent: data.intent,
      };
    } catch (e: any) {
      console.error('Chat error:', e);
      const errMsg = e.message || 'Unable to connect to Brain Mate server.';
      setChatError(errMsg);
      showToast(`Error: ${errMsg}`);
      throw e;
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...chatHistory].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleClearChat = () => {
    StorageService.clearAllData();
    const fresh = StorageService.getChatHistory();
    setChatHistory(fresh);
    showToast('Chat history cleared.');
  };

  // 6. Handle Intent Actions (Sensitive actions prompt confirmation)
  const handleExecuteIntent = (intent: ActionIntent) => {
    if (intent.requiresConfirmation) {
      setPendingIntent(intent);
    } else {
      executeIntentDirectly(intent);
    }
  };

  const executeIntentDirectly = (intent: ActionIntent) => {
    setPendingIntent(null);

    switch (intent.type) {
      case 'stock_analysis': {
        const symbol = intent.payload?.symbol || 'RELIANCE.NS';
        const found = stocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase()) || stocks[0];
        if (found) {
          setSelectedStock(found);
          setActiveTab('markets');
          showToast(`Opening ${found.name} stock analysis`);
        }
        break;
      }

      case 'create_note': {
        const title = intent.payload?.title || 'Voice Note';
        const content = intent.payload?.content || '';
        handleAddNote({
          title,
          content,
          category: 'personal',
          tags: ['voice-assistant'],
        });
        showToast(`Saved note: "${title}"`);
        break;
      }

      case 'create_task': {
        const title = intent.payload?.title || 'Voice Task';
        handleAddTask({
          title,
          priority: intent.payload?.priority || 'medium',
          dueDate: 'Today',
          isCompleted: false,
        });
        showToast(`Added task: "${title}"`);
        break;
      }

      case 'open_app': {
        const appName = intent.payload?.appName?.toLowerCase() || '';
        const uri = intent.payload?.intentUri || '';

        if (appName.includes('calc') || uri.includes('calculator')) {
          const res = AndroidIntentService.openCalculator();
          showToast(res.message);
        } else if (appName.includes('youtube') || uri.includes('youtube')) {
          const res = AndroidIntentService.openYouTube(intent.payload?.query);
          showToast(res.message);
        } else if (appName.includes('camera') || uri.includes('camera')) {
          const res = AndroidIntentService.openCamera();
          showToast(res.message);
        } else if (appName.includes('setting') || uri.includes('settings')) {
          setIsSettingsOpen(true);
          showToast('Opened Brain Mate Settings');
        } else if (appName.includes('news')) {
          const res = AndroidIntentService.openNews(intent.payload?.query);
          showToast(res.message);
        } else if (appName.includes('whatsapp') || uri.includes('whatsapp')) {
          const res = AndroidIntentService.openWhatsApp(intent.payload?.phone, intent.payload?.text);
          showToast(res.message);
        } else {
          const res = AndroidIntentService.openAndroidSettings();
          showToast(res.message);
        }
        break;
      }

      case 'send_whatsapp': {
        const res = AndroidIntentService.openWhatsApp(intent.payload?.phone, intent.payload?.text);
        showToast(res.message);
        break;
      }

      case 'execute_task': {
        const title = intent.payload?.title || 'Assigned Project Task';
        const desc = intent.payload?.description || '';
        const category = intent.payload?.category || 'project_build';
        const rawSteps = intent.payload?.steps;
        const steps = Array.isArray(rawSteps)
          ? rawSteps.map((s: any, idx: number) => ({
              id: `s-${idx}`,
              title: typeof s === 'string' ? s : s.title || `Step ${idx + 1}`,
              status: s.status || 'Pending',
            }))
          : [
              { id: 's-1', title: 'Plan requirements', status: 'Completed' },
              { id: 's-2', title: 'Execute implementation', status: 'In Progress' },
              { id: 's-3', title: 'Verify deliverables', status: 'Pending' },
            ];

        StorageService.createExecutableTask({
          title,
          description: desc,
          category,
          status: intent.payload?.status || 'In Progress',
          result: intent.payload?.result,
          steps,
        });
        setExecutableTasks(StorageService.getExecutableTasks());
        showToast(`Boss, project "${title}" tracked in Task System.`);
        break;
      }

      case 'check_task_status': {
        setActiveTab('tasks');
        showToast('Opened Boss Task Status System');
        break;
      }

      case 'call_contact': {
        const res = AndroidIntentService.openDialer(intent.payload?.phone || '');
        showToast(res.message);
        break;
      }

      case 'share_content': {
        AndroidIntentService.shareNative(
          intent.payload?.title || 'Brain Mate Share',
          intent.payload?.content || ''
        );
        break;
      }

      case 'search_web': {
        const res = AndroidIntentService.searchWeb(intent.payload?.query || '');
        showToast(res.message);
        break;
      }

      default:
        showToast('Action executed successfully.');
    }
  };

  // Executable tasks operations
  const handleCreateExecutableTask = (taskData: Omit<ExecutableTask, 'id' | 'creationTime' | 'lastUpdated'>) => {
    const created = StorageService.createExecutableTask(taskData);
    setExecutableTasks(StorageService.getExecutableTasks());
    showToast(`Task assigned: "${created.title}"`);
  };

  const handleUpdateExecutableTaskStatus = (id: string, status: TaskExecutionStatus) => {
    const updated = StorageService.updateExecutableTask(id, { status });
    setExecutableTasks(updated);
    showToast(`Task status: "${status}"`);
  };

  const handleAskTaskStatus = (queryText?: string) => {
    const query = queryText || 'Boss, mera kaam hua kya?';
    setActiveTab('chat');
    handleSendMessage(query);
  };

  // Notes operations
  const handleAddNote = (noteData: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: UserNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    StorageService.saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    StorageService.saveNotes(updated);
    showToast('Note deleted.');
  };

  // Tasks operations
  const handleAddTask = (taskData: Omit<UserTask, 'id' | 'createdAt'>) => {
    const newTask: UserTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    StorageService.saveTasks(updated);
    showToast('Task removed.');
  };

  // Watchlist
  const handleToggleWatchlist = (symbol: string) => {
    let updated: string[];
    if (watchlist.includes(symbol)) {
      updated = watchlist.filter((s) => s !== symbol);
      showToast(`Removed from Watchlist.`);
    } else {
      updated = [...watchlist, symbol];
      showToast(`Added to Watchlist.`);
    }
    setWatchlist(updated);
    StorageService.saveWatchlist(updated);
  };

  // Admin login check
  const handleLoginAdmin = (email: string, _pass: string) => {
    if (email.trim().toLowerCase() === adminEmail.toLowerCase()) {
      setIsAdmin(true);
      showToast('Super Administrator Verified.');
      return true;
    }
    return false;
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    showToast('Exited Admin Mode.');
  };

  // PWA Install Trigger
  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
        showToast('Brain Mate installed on your Android device!');
      }
      setDeferredPrompt(null);
    } else {
      showToast('To install, open Chrome options (⋮) and tap "Install app"');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        currentTab={activeTab}
        language={language}
        onLanguageChange={(l) => {
          setLanguage(l);
          const newConfig = { ...voiceConfig, language: l };
          setVoiceConfig(newConfig);
          StorageService.saveVoiceConfig(newConfig);
        }}
        isClapActive={isClapActive}
        audioLevel={audioLevel}
        onOpenClapSettings={() => setIsClapModalOpen(true)}
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            onStartVoice={handleStartVoice}
            onOpenMarketStock={(s) => {
              setSelectedStock(s);
              setActiveTab('markets');
            }}
            onOpenTab={(t) => setActiveTab(t as any)}
            stocks={stocks}
            tasks={tasks}
            notes={notes}
            executableTasks={executableTasks}
            onAskTaskStatus={handleAskTaskStatus}
            greetingInfo={greetingInfo}
            isClapActive={isClapActive}
            audioLevel={audioLevel}
            clapSensitivity={voiceConfig.clapSensitivity}
            onUpdateClapSensitivity={handleUpdateClapSensitivity}
            onToggleClap={handleToggleClap}
            onOpenClapModal={() => setIsClapModalOpen(true)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            messages={chatHistory}
            onSendMessage={handleSendMessage}
            onExecuteIntent={handleExecuteIntent}
            onClearChat={handleClearChat}
            language={language}
            isLoading={isAiLoading}
            activeError={chatError}
            onRetryLast={handleRetryLast}
          />
        )}

        {activeTab === 'markets' && (
          <MarketView
            stocks={stocks}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            selectedStock={selectedStock}
            onSelectStock={setSelectedStock}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksNotesView
            notes={notes}
            tasks={tasks}
            executableTasks={executableTasks}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onCreateExecutableTask={handleCreateExecutableTask}
            onUpdateExecutableTaskStatus={handleUpdateExecutableTaskStatus}
            onAskTaskStatus={handleAskTaskStatus}
            language={language}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            isAdmin={isAdmin}
            onLoginAdmin={handleLoginAdmin}
            onLogoutAdmin={handleLogoutAdmin}
            adminEmail={adminEmail}
          />
        )}
      </main>

      {/* Bottom Android Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        onTriggerVoiceModal={() => handleStartVoice()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isVoiceActive={isVoiceModalOpen}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onExecuteIntent={handleExecuteIntent}
        onSendMessage={handleSendMessage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLanguageChange={(l) => {
          setLanguage(l);
          const updated = { ...voiceConfig, language: l };
          setVoiceConfig(updated);
          StorageService.saveVoiceConfig(updated);
        }}
        initialPrompt={voiceInitialPrompt}
        notesCount={notes.length}
        tasksCount={tasks.length}
      />

      {/* Restored Brain Mate Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={voiceConfig}
        onUpdateConfig={(updated) => {
          setVoiceConfig(updated);
          StorageService.saveVoiceConfig(updated);
          if (updated.language) setLanguage(updated.language);
          showToast('Settings saved.');
        }}
        language={language}
        onLanguageChange={(l) => {
          setLanguage(l);
          const updated = { ...voiceConfig, language: l };
          setVoiceConfig(updated);
          StorageService.saveVoiceConfig(updated);
        }}
        onOpenClapModal={() => setIsClapModalOpen(true)}
        onOpenAdmin={() => {
          setActiveTab('admin');
        }}
        isAdmin={isAdmin}
      />

      {/* Clap Settings Modal */}
      <ClapSettingsModal
        isOpen={isClapModalOpen}
        onClose={() => setIsClapModalOpen(false)}
        isClapActive={isClapActive}
        audioLevel={audioLevel}
        sensitivity={voiceConfig.clapSensitivity}
        onUpdateSensitivity={handleUpdateClapSensitivity}
        onToggleClap={handleToggleClap}
        lastClapCount={clapCount}
      />

      {/* Android Intent Confirmation Modal */}
      <IntentConfirmationModal
        intent={pendingIntent}
        onConfirm={executeIntentDirectly}
        onCancel={() => setPendingIntent(null)}
      />

      {/* APK & PWA Release Center Modal */}
      <ApkReleaseModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
        isPwaInstalled={isPwaInstalled}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm px-4 py-2 rounded-xl bg-indigo-950/95 border border-indigo-500/50 text-indigo-200 text-xs shadow-2xl font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
