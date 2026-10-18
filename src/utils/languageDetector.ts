import { SupportedLanguage } from '../types';

/**
 * Detects whether the input text is in Hindi (Devanagari), Hinglish, or English.
 */
export function detectLanguage(text: string, currentFallback: SupportedLanguage = 'hinglish'): SupportedLanguage {
  if (!text || !text.trim()) return currentFallback;

  // 1. Devanagari Unicode Block: \u0900 to \u097F
  // If user speaks or writes in Hindi script, ALWAYS return 'hi-IN'
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi-IN';
  }

  const lower = text.toLowerCase().trim();

  // 2. Common Hindi words written in Latin script (Hinglish)
  const hinglishKeywords = [
    'kya', 'kaise', 'kaam', 'hua', 'batao', 'karo', 'khatam', 'mera', 'meri', 'mere',
    'aap', 'tum', 'namaste', 'bhai', 'theek', 'hai', 'hain', 'ho', 'nahin', 'nahi',
    'kar', 'raha', 'rahi', 'rahe', 'kijiye', 'bhejo', 'shuru', 'sunao', 'khabar',
    'samachar', 'banao', 'dikhaye', 'dikhao', 'chahiye', 'karna', 'kholo', 'madad',
    'shukriya', 'dhanyavad', 'kripya', 'shubh', 'prabhat', 'sandhya', 'raatri',
    'reliance', 'share', 'bhav', 'teji', 'mandi', 'paisa', 'kitna', 'sabse', 'achha',
    'pehle', 'bolo', 'bataiye', 'dekh', 'dekho', 'khol', 'gaya', 'gayi', 'hoga', 'hogi'
  ];

  const words = lower.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const matchCount = words.filter((w) => hinglishKeywords.includes(w)).length;

  if (matchCount > 0) {
    return 'hinglish';
  }

  // 3. If predominantly English words
  const englishKeywords = [
    'what', 'how', 'status', 'complete', 'finish', 'project', 'task', 'hello', 'hi',
    'weather', 'stock', 'market', 'analysis', 'create', 'build', 'apk', 'android',
    'open', 'settings', 'calculator', 'camera', 'note', 'reminder', 'error', 'fix',
    'report', 'website', 'change', 'check', 'did', 'news', 'today'
  ];

  const engMatch = words.filter((w) => englishKeywords.includes(w)).length;
  if (engMatch > 0) {
    return 'en-IN';
  }

  return currentFallback;
}
