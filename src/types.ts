export type SupportedLanguage = 'hi-IN' | 'en-IN' | 'hinglish' | 'en-US';

export type TaskExecutionStatus = 
  | 'Pending' 
  | 'In Progress' 
  | 'Completed' 
  | 'Failed' 
  | 'Waiting for User Action';

export interface TaskStep {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  detail?: string;
}

export interface ExecutableTask {
  id: string;
  title: string;
  description: string;
  category: 'android_action' | 'market_research' | 'project_build' | 'note_doc' | 'general';
  status: TaskExecutionStatus;
  creationTime: number;
  lastUpdated: number;
  result?: string;
  errorDetails?: string;
  steps: TaskStep[];
  requiresUserAction?: boolean;
  userActionPrompt?: string;
  artifacts?: { name: string; url?: string; type: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  language?: SupportedLanguage;
  intentAction?: ActionIntent;
  spokenSummary?: string;
  isVoiceInput?: boolean;
}

export interface ActionIntent {
  type: 
    | 'stock_analysis'
    | 'create_note'
    | 'create_task'
    | 'execute_task'
    | 'check_task_status'
    | 'open_app'
    | 'share_content'
    | 'call_contact'
    | 'send_whatsapp'
    | 'set_reminder'
    | 'search_web'
    | 'create_video'
    | 'edit_video'
    | 'upload_youtube'
    | 'automate_browser';
  title: string;
  description: string;
  requiresConfirmation: boolean;
  executed?: boolean;
  payload: Record<string, any>;
}

export type VideoAspectRatio = '16:9' | '9:16';

export interface VideoScene {
  id: string;
  title: string;
  subtitle: string;
  narration: string;
  visualPrompt: string;
  bgGradient: [string, string];
  iconName?: string;
  durationSec: number;
  transition: 'fade' | 'slide' | 'zoom';
}

export interface VideoProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  aspectRatio: VideoAspectRatio;
  status: 'draft' | 'generating' | 'ready' | 'uploading' | 'published' | 'error';
  progress: number;
  currentStepMessage?: string;
  scenes: VideoScene[];
  bgmStyle: 'tech_ambient' | 'energetic' | 'lofi' | 'cinematic' | 'none';
  videoBlobUrl?: string;
  videoDurationSec?: number;
  trimStartSec?: number;
  trimEndSec?: number;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  youtubePrivacy?: 'private' | 'unlisted' | 'public';
  createdAt: number;
  updatedAt: number;
}

export interface YouTubeChannelProfile {
  id: string;
  title: string;
  customUrl?: string;
  avatarUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
}

export interface YouTubeUploadConfig {
  title: string;
  description: string;
  tags: string[];
  privacy: 'private' | 'unlisted' | 'public';
  madeForKids: boolean;
}

export interface BrowserAutomationItem {
  id: string;
  command: string;
  actionType: 'navigate' | 'search' | 'open_app' | 'inspect' | 'purchase' | 'delete';
  targetUrl?: string;
  status: 'executing' | 'completed' | 'blocked' | 'requires_confirmation';
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  resultMessage: string;
  timestamp: number;
  extractedData?: any;
}

export interface StockChartPoint {
  time: string;
  price: number;
  volume?: number;
}

export interface MarketStock {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'INDEX';
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  volume: string;
  marketCap: string;
  peRatio: number;
  dividendYield: number;
  rsi14: number;
  ma20: number;
  ma50: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  chartData1D: StockChartPoint[];
  chartData1W: StockChartPoint[];
  chartData1M: StockChartPoint[];
  chartData1Y: StockChartPoint[];
  lastUpdated: string;
  isDelayed: boolean;
  dataSource: string;
  sector: string;
  description: string;
}

export interface StockAiAnalysis {
  symbol: string;
  name: string;
  overview: string;
  valuation: string;
  technicalSummary: string;
  fundamentalHealth: string;
  majorRisks: string[];
  growthDrivers: string[];
  disclaimer: string;
  generatedAt: string;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  category: 'personal' | 'study' | 'work' | 'finance' | 'general';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  language?: string;
}

export interface UserTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  dueTime?: string;
  isCompleted: boolean;
  createdAt: number;
  reminderSet?: boolean;
}

export interface VoiceAssistantConfig {
  language: SupportedLanguage;
  voiceTtsEnabled: boolean;
  voiceRate: number;
  voicePitch: number;
  clapDetectionEnabled: boolean;
  clapSensitivity: number; // 0 to 100
  continuousListening: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  bossModeEnabled: boolean; // Always address as Boss
  autoGreetingEnabled: boolean; // Time-based greeting on first session
  lastGreetingPeriod?: 'morning' | 'afternoon' | 'evening' | 'night';
  lastGreetingDate?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  adminEmail: string;
  action: string;
  details: string;
  severity?: 'info' | 'warning' | 'critical';
  ip?: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'user';
  status: 'active' | 'suspended';
  apiCallsCount: number;
  createdAt: string;
  lastLoginAt: string;
  suspendReason?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: number;
  adminReply?: string;
  resolvedAt?: number;
}

export interface AiErrorLog {
  id: string;
  timestamp: number;
  endpoint: string;
  error: string;
  statusCode: number;
  callerIp?: string;
}

export interface MaintenanceState {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedBy: string;
  updatedAt: string;
}

export interface AdminStats {
  superAdminEmail: string;
  totalAiQueries: number;
  totalTokensUsed: number;
  estimatedCostUSD: number;
  serverUptimeSeconds: number;
  activeUsersCount: number;
  registeredUsersCount: number;
  suspendedUsersCount: number;
  modelInUse: string;
  hasApiKey: boolean;
  serverTimestamp: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureFlags: {
    voiceAssistant: boolean;
    clapDetection: boolean;
    marketAnalysis: boolean;
    geminiLive: boolean;
    adminPanel: boolean;
    pwaDownload: boolean;
    bossMode: boolean;
  };
  systemAnnouncement: string;
  auditLogs: AuditLogEntry[];
  recentErrors?: AiErrorLog[];
}

