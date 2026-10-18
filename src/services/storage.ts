import { ChatMessage, ExecutableTask, MarketStock, UserNote, UserTask, VoiceAssistantConfig } from '../types';

const STORAGE_KEYS = {
  CHAT_HISTORY: 'brainmate_chat_history',
  NOTES: 'brainmate_notes',
  TASKS: 'brainmate_tasks',
  EXECUTABLE_TASKS: 'brainmate_executable_tasks',
  WATCHLIST: 'brainmate_watchlist',
  VOICE_CONFIG: 'brainmate_voice_config',
  ADMIN_AUTH: 'brainmate_admin_auth',
};

const DEFAULT_VOICE_CONFIG: VoiceAssistantConfig = {
  language: 'hinglish',
  voiceTtsEnabled: true,
  voiceRate: 1.0,
  voicePitch: 1.0,
  clapDetectionEnabled: true,
  clapSensitivity: 65,
  continuousListening: true,
  soundEffects: true,
  hapticFeedback: true,
  bossModeEnabled: true,
  autoGreetingEnabled: true,
};

export const StorageService = {
  getGreetingInfo(): { greeting: string; period: 'morning' | 'afternoon' | 'evening' | 'night'; shouldGreet: boolean } {
    const now = new Date();
    const hour = now.getHours();
    const todayStr = now.toISOString().slice(0, 10);

    let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    let greeting = 'Good Morning, Boss! Have a wonderful day.';

    if (hour >= 5 && hour < 12) {
      period = 'morning';
      greeting = 'Good Morning, Boss! Have a wonderful day.';
    } else if (hour >= 12 && hour < 17) {
      period = 'afternoon';
      greeting = 'Good Afternoon, Boss! How can I help you today?';
    } else if (hour >= 17 && hour < 21) {
      period = 'evening';
      greeting = 'Good Evening, Boss! What can I do for you?';
    } else {
      period = 'night';
      greeting = 'Good Night, Boss! Have a peaceful night.';
    }

    const config = this.getVoiceConfig();
    const shouldGreet = config.lastGreetingDate !== todayStr || config.lastGreetingPeriod !== period;

    return { greeting, period, shouldGreet };
  },

  recordGreetingDelivered(period: 'morning' | 'afternoon' | 'evening' | 'night') {
    const config = this.getVoiceConfig();
    const now = new Date();
    const updated = {
      ...config,
      lastGreetingPeriod: period,
      lastGreetingDate: now.toISOString().slice(0, 10),
    };
    this.saveVoiceConfig(updated);
  },

  getChatHistory(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read chat history', e);
    }
    const { greeting } = this.getGreetingInfo();
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `**${greeting}** 🚀\n\n*Brain Mate Boss Mode is Active.*\n\nMain aapki saari commands sunne aur tasks execute karne ke liye ready hoon:\n\n- 📊 **Real Task Tracking**: *"Boss, mera kaam hua kya?"* ya *"What is the status of my task?"*\n- 📈 **Share Market Analysis**: *"Boss, Reliance aur TCS shares ka valuation check karo"*\n- 📱 **Android Actions**: WhatsApp message draft karna, Calculator ya Settings kholna\n- 🎙️ **Voice & Follow-up**: Continuous listening active hai — aap bina ruke agla sawal pooch sakte hain.\n\nAaj kya project ya task shuru karein, Boss?`,
        timestamp: Date.now(),
        language: 'hinglish',
        spokenSummary: `${greeting} Main Brain Mate hoon. Aaj kya kaam karna hai, Boss?`,
      },
    ];
  },

  saveChatHistory(messages: ChatMessage[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages.slice(-50)));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  },

  getExecutableTasks(): ExecutableTask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXECUTABLE_TASKS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read executable tasks', e);
    }
    return [
      {
        id: 'task-exec-1',
        title: 'Reliance Industries & Nifty 50 Market Analysis',
        description: 'Analyze Q3 technical momentum, RSI indicators, and valuation thesis for Reliance Industries.',
        category: 'market_research',
        status: 'Completed',
        creationTime: Date.now() - 3600000 * 4,
        lastUpdated: Date.now() - 3600000 * 2,
        result: 'Reliance trading at ₹2,984.50. RSI at 56.4 (Neutral/Bullish above 20-MA). P/E 28.4 with ₹20.19 Lakh Cr market cap.',
        steps: [
          { id: 's1', title: 'Fetch NSE/BSE tick feeds', status: 'Completed' },
          { id: 's2', title: 'Calculate RSI and Moving Averages', status: 'Completed' },
          { id: 's3', title: 'Generate Gemini AI fundamental report', status: 'Completed' },
        ],
      },
      {
        id: 'task-exec-2',
        title: 'Android APK Release & GitHub Actions Pipeline',
        description: 'Configure Capacitor build pipeline, Android permissions, and GitHub Actions CI/CD.',
        category: 'project_build',
        status: 'In Progress',
        creationTime: Date.now() - 3600000 * 2,
        lastUpdated: Date.now() - 1800000,
        result: 'Workflow .github/workflows/build-apk.yml created. AndroidManifest.xml configured with RECORD_AUDIO and FOREGROUND_SERVICE.',
        steps: [
          { id: 's1', title: 'Setup Capacitor configuration', status: 'Completed' },
          { id: 's2', title: 'Generate AndroidManifest.xml permissions', status: 'Completed' },
          { id: 's3', title: 'Setup GitHub Actions APK workflow', status: 'Completed' },
          { id: 's4', title: 'Compile release keystore and signed APK', status: 'In Progress' },
        ],
      },
      {
        id: 'task-exec-3',
        title: 'Send Market Summary via WhatsApp',
        description: 'Compose and dispatch quarterly earnings summary to WhatsApp group.',
        category: 'android_action',
        status: 'Waiting for User Action',
        creationTime: Date.now() - 3600000,
        lastUpdated: Date.now() - 1200000,
        requiresUserAction: true,
        userActionPrompt: 'Boss, I need your authorization to launch WhatsApp with the recipient details.',
        steps: [
          { id: 's1', title: 'Draft market summary text', status: 'Completed' },
          { id: 's2', title: 'Request Boss authorization to open WhatsApp', status: 'In Progress' },
          { id: 's3', title: 'Launch Android WhatsApp intent', status: 'Pending' },
        ],
      },
      {
        id: 'task-exec-4',
        title: 'Automated Broker Trade Execution',
        description: 'Attempted to link external broker credentials for automatic algorithmic buy order.',
        category: 'general',
        status: 'Failed',
        creationTime: Date.now() - 7200000,
        lastUpdated: Date.now() - 7100000,
        errorDetails: 'Broker trading blocked for security. Brain Mate is programmed as an educational research assistant and will never risk placing unverified financial trades.',
        steps: [
          { id: 's1', title: 'Security policy evaluation', status: 'Failed', detail: 'Zero unauthorized trade policy enforced' },
        ],
      },
    ];
  },

  saveExecutableTasks(tasks: ExecutableTask[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXECUTABLE_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save executable tasks', e);
    }
  },

  updateExecutableTask(id: string, updates: Partial<ExecutableTask>) {
    const tasks = this.getExecutableTasks();
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates, lastUpdated: Date.now() } : t));
    this.saveExecutableTasks(updated);
    return updated;
  },

  createExecutableTask(task: Omit<ExecutableTask, 'id' | 'creationTime' | 'lastUpdated'>): ExecutableTask {
    const newTask: ExecutableTask = {
      ...task,
      id: `task-exec-${Date.now()}`,
      creationTime: Date.now(),
      lastUpdated: Date.now(),
    };
    const tasks = [newTask, ...this.getExecutableTasks()];
    this.saveExecutableTasks(tasks);
    return newTask;
  },

  getNotes(): UserNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read notes', e);
    }
    return [
      {
        id: 'note-1',
        title: 'Share Market Strategy 2026',
        content: 'Focus on fundamentally strong companies with low debt, strong ROE, and competitive advantage in Indian manufacturing & IT.',
        category: 'finance',
        tags: ['Stocks', 'Investing', 'Strategy'],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'note-2',
        title: 'Brain Mate Assistant Voice Rules',
        content: 'Boss Mode active. Continuous follow-up listening enabled. Clap sensor detects transient acoustic spikes.',
        category: 'personal',
        tags: ['Voice', 'Tips'],
        createdAt: Date.now() - 43200000,
        updatedAt: Date.now() - 43200000,
      },
    ];
  },

  saveNotes(notes: UserNote[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to save notes', e);
    }
  },

  getTasks(): UserTask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read tasks', e);
    }
    return [
      {
        id: 'task-1',
        title: 'Review Reliance & TCS quarterly performance',
        priority: 'high',
        dueDate: 'Today',
        isCompleted: false,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'task-2',
        title: 'Test Clap-to-Activate on Android device',
        priority: 'medium',
        dueDate: 'Tomorrow',
        isCompleted: true,
        createdAt: Date.now() - 7200000,
      },
      {
        id: 'task-3',
        title: 'Set up Firebase Cloud Firestore project',
        priority: 'urgent',
        dueDate: 'This Week',
        isCompleted: false,
        createdAt: Date.now() - 10800000,
      },
    ];
  },

  saveTasks(tasks: UserTask[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks', e);
    }
  },

  getWatchlist(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read watchlist', e);
    }
    return ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', '^NSEI'];
  },

  saveWatchlist(watchlist: string[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
    } catch (e) {
      console.warn('Failed to save watchlist', e);
    }
  },

  getVoiceConfig(): VoiceAssistantConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VOICE_CONFIG);
      if (data) return { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(data) };
    } catch (e) {
      console.warn('Failed to read voice config', e);
    }
    return DEFAULT_VOICE_CONFIG;
  },

  saveVoiceConfig(config: VoiceAssistantConfig) {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICE_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save voice config', e);
    }
  },

  exportFullBackup() {
    const backup = {
      app: 'Brain Mate',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      bossMode: true,
      chatHistory: this.getChatHistory(),
      executableTasks: this.getExecutableTasks(),
      notes: this.getNotes(),
      tasks: this.getTasks(),
      watchlist: this.getWatchlist(),
      voiceConfig: this.getVoiceConfig(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brain-mate-boss-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.EXECUTABLE_TASKS);
    localStorage.removeItem(STORAGE_KEYS.WATCHLIST);
    localStorage.removeItem(STORAGE_KEYS.VOICE_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  },
};
