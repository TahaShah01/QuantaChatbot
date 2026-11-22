'use client';

import { Conversation, AISettings, ThemeMode, DEFAULT_SETTINGS, AVAILABLE_MODELS } from './types';

const KEYS = {
  conversations: 'quantav-conversations',
  activeConversation: 'quantav-active-conversation',
  settings: 'quantav-settings',
  theme: 'quantav-theme',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ── Conversations ──────────────────────────────────────────
export function loadConversations(): Conversation[] {
  return safeGet<Conversation[]>(KEYS.conversations, []);
}

export function saveConversations(convos: Conversation[]): void {
  safeSet(KEYS.conversations, convos);
}

export function loadActiveConversationId(): string | null {
  return safeGet<string | null>(KEYS.activeConversation, null);
}

export function saveActiveConversationId(id: string | null): void {
  safeSet(KEYS.activeConversation, id);
}

// ── Settings (minus apiKey — stays in memory only) ─────────
export function loadSettings(): AISettings {
  const saved = safeGet<Partial<AISettings>>(KEYS.settings, {});
  const validModelIds = new Set(AVAILABLE_MODELS.map((m) => m.id));

  // If the saved model is an old deprecated model (or invalid), fall back to default
  let model = saved.model || DEFAULT_SETTINGS.model;
  if (!validModelIds.has(model) && !saved.customModelId) {
    model = DEFAULT_SETTINGS.model;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    model,
    apiKey: '',
  };
}

export function saveSettings(settings: AISettings): void {
  // Never persist the API key to localStorage
  const { apiKey: _removed, ...rest } = settings;
  void _removed;
  safeSet(KEYS.settings, rest);
}

// ── Theme ──────────────────────────────────────────────────
export function loadTheme(): ThemeMode {
  return safeGet<ThemeMode>(KEYS.theme, 'system');
}

export function saveTheme(mode: ThemeMode): void {
  safeSet(KEYS.theme, mode);
}
