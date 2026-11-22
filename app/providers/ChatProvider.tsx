'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Conversation,
  Message,
  AISettings,
  DEFAULT_SETTINGS,
  PERSONAS,
  AVAILABLE_MODELS,
  GroqModelOption,
} from '@/lib/types';
import {
  createConversation,
  createMessage,
  generateTitle,
  generateId,
} from '@/lib/utils';
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSettings,
  saveSettings,
} from '@/lib/storage';

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  settings: AISettings;
  availableModels: GroqModelOption[];
  isStreaming: boolean;
  isConnected: boolean;
  connectionError: string | null;

  // Actions
  newChat: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  clearConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  stopGeneration: () => void;
  updateSettings: (s: Partial<AISettings>) => void;
  validateApiKey: (key: string) => Promise<{ valid: boolean; error?: string; models?: string[] }>;
  setApiKeyInMemory: (key: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [availableModels, setAvailableModels] = useState<GroqModelOption[]>(AVAILABLE_MODELS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const apiKeyRef = useRef('');

  // ── Init ───────────────────────────────────────────────
  useEffect(() => {
    const loaded = loadConversations();
    const savedSettings = loadSettings();
    setConversations(loaded);
    setSettings(savedSettings);
    const activeId = loadActiveConversationId();
    if (activeId && loaded.some((c) => c.id === activeId)) {
      setActiveConversationId(activeId);
    }
  }, []);

  // ── Persist conversations ──────────────────────────────
  const persistConversations = useCallback((convos: Conversation[]) => {
    setConversations(convos);
    saveConversations(convos);
  }, []);

  // ── Derived Active Conversation ────────────────────────
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  // ── Set Key In Memory ──────────────────────────────────
  const setApiKeyInMemory = useCallback((key: string) => {
    apiKeyRef.current = key;
    setSettings((prev) => ({ ...prev, apiKey: key }));
  }, []);

  // ── Validate Key with Groq & Merge Live Models ─────────
  const validateApiKey = useCallback(
    async (key: string): Promise<{ valid: boolean; error?: string; models?: string[] }> => {
      try {
        const res = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: key }),
        });
        const data = await res.json();
        if (data.valid) {
          setIsConnected(true);
          setConnectionError(null);
          apiKeyRef.current = key;

          // If Groq returned live models from account, update settings & models list
          if (Array.isArray(data.models) && data.models.length > 0) {
            const returnedModelsSet = new Set(data.models);

            setSettings((prev) => {
              let activeModel = prev.model;
              // If the current model is not accessible on user's account, fall back to accessible one
              if (!returnedModelsSet.has(activeModel) && !prev.customModelId) {
                activeModel = returnedModelsSet.has('llama-3.1-8b-instant')
                  ? 'llama-3.1-8b-instant'
                  : returnedModelsSet.has('openai/gpt-oss-120b')
                  ? 'openai/gpt-oss-120b'
                  : data.models[0];
              }
              const updated = { ...prev, model: activeModel, apiKey: key };
              saveSettings(updated);
              return updated;
            });

            setAvailableModels((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const additions: GroqModelOption[] = [];
              for (const mId of data.models) {
                if (!existingIds.has(mId)) {
                  additions.push({
                    id: mId,
                    name: mId.split('/').pop() || mId,
                    category: 'Latest & Powerful',
                    badge: 'Groq Cloud',
                    speed: 'Fast',
                    contextWindow: '131k',
                    description: `Active model on your Groq Cloud account: ${mId}`,
                  });
                }
              }
              return [...prev, ...additions];
            });
          } else {
            setSettings((prev) => ({ ...prev, apiKey: key }));
          }
        } else {
          setIsConnected(false);
          setConnectionError(data.error || 'Invalid API key');
        }
        return data;
      } catch {
        setIsConnected(false);
        setConnectionError('Connection failed. Please check network.');
        return { valid: false, error: 'Connection failed' };
      }
    },
    []
  );

  // ── New Chat ───────────────────────────────────────────
  const newChat = useCallback(() => {
    const persona = PERSONAS.find((p) => p.id === settings.persona);
    const convo = createConversation(
      settings.systemPrompt,
      settings.persona
    );
    if (persona) {
      convo.systemPrompt = persona.systemPrompt;
    }
    const updated = [convo, ...conversations];
    persistConversations(updated);
    setActiveConversationId(convo.id);
    saveActiveConversationId(convo.id);
  }, [conversations, settings, persistConversations]);

  // ── Select Conversation ────────────────────────────────
  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    saveActiveConversationId(id);
  }, []);

  // ── Delete Conversation ────────────────────────────────
  const deleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      persistConversations(updated);
      if (activeConversationId === id) {
        const next = updated[0]?.id || null;
        setActiveConversationId(next);
        saveActiveConversationId(next);
      }
    },
    [conversations, activeConversationId, persistConversations]
  );

  // ── Rename Conversation ────────────────────────────────
  const renameConversation = useCallback(
    (id: string, title: string) => {
      const updated = conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
      );
      persistConversations(updated);
    },
    [conversations, persistConversations]
  );

  // ── Clear Messages ─────────────────────────────────────
  const clearConversation = useCallback(
    (id: string) => {
      const updated = conversations.map((c) =>
        c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c
      );
      persistConversations(updated);
    },
    [conversations, persistConversations]
  );

  // ── Stop Generation ────────────────────────────────────
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  // ── Send Message ───────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      const key = apiKeyRef.current || settings.apiKey;
      if (!key) {
        setConnectionError('Groq API key required. Please enter it in Settings.');
        return;
      }

      let convoId = activeConversationId;
      let currentConvos = [...conversations];

      // Auto-create conversation if none selected
      if (!convoId) {
        const persona = PERSONAS.find((p) => p.id === settings.persona);
        const convo = createConversation(
          persona?.systemPrompt || settings.systemPrompt,
          settings.persona
        );
        currentConvos = [convo, ...currentConvos];
        convoId = convo.id;
        setActiveConversationId(convoId);
        saveActiveConversationId(convoId);
      }

      const userMsg = createMessage('user', content);
      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      // Add user message & auto-generate title if first message
      currentConvos = currentConvos.map((c) => {
        if (c.id !== convoId) return c;
        const updatedMessages = [...c.messages, userMsg];
        const title =
          c.messages.length === 0 ? generateTitle(updatedMessages) : c.title;
        return { ...c, messages: updatedMessages, title, updatedAt: Date.now() };
      });
      persistConversations(currentConvos);

      // Add empty streaming assistant message
      currentConvos = currentConvos.map((c) => {
        if (c.id !== convoId) return c;
        return { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() };
      });
      persistConversations(currentConvos);

      setIsStreaming(true);
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const convo = currentConvos.find((c) => c.id === convoId)!;

        // Build messages payload for Groq
        const apiMessages: { role: string; content: string }[] = [];
        const sysPrompt = convo.systemPrompt || settings.systemPrompt;
        if (sysPrompt) {
          apiMessages.push({ role: 'system', content: sysPrompt });
        }
        if (settings.historyEnabled) {
          for (const m of convo.messages) {
            if (m.role !== 'system' && m.id !== assistantMsg.id) {
              apiMessages.push({ role: m.role, content: m.content });
            }
          }
        } else {
          apiMessages.push({ role: 'user', content });
        }

        const modelId = settings.customModelId || settings.model || 'llama-3.1-8b-instant';

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: modelId,
            temperature: settings.temperature,
            topP: settings.topP,
            maxTokens: settings.maxTokens,
            stream: settings.streamingEnabled,
            apiKey: key,
          }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string })?.error || `Groq API Error (${res.status})`
          );
        }

        if (!settings.streamingEnabled) {
          const data = await res.json();
          const responseContent = (data as { content?: string })?.content || '';
          currentConvos = currentConvos.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: responseContent, isStreaming: false }
                  : m
              ),
              updatedAt: Date.now(),
            };
          });
          persistConversations(currentConvos);
        } else {
          // Stream response SSE
          const reader = res.body?.getReader();
          if (!reader) throw new Error('Unable to read streaming body');

          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.content) {
                  accumulated += parsed.content;
                  currentConvos = currentConvos.map((c) => {
                    if (c.id !== convoId) return c;
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, content: accumulated, isStreaming: true }
                          : m
                      ),
                      updatedAt: Date.now(),
                    };
                  });
                  persistConversations(currentConvos);
                }
              } catch (e) {
                if (e instanceof Error && e.message !== 'Stream error') {
                  if (e.message && !e.message.includes('JSON')) throw e;
                }
              }
            }
          }

          // Finalize streaming
          currentConvos = currentConvos.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: accumulated, isStreaming: false }
                  : m
              ),
              updatedAt: Date.now(),
            };
          });
          persistConversations(currentConvos);
        }

        setIsConnected(true);
        setConnectionError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User halted generation
          currentConvos = currentConvos.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
              ),
              updatedAt: Date.now(),
            };
          });
          persistConversations(currentConvos);
        } else {
          const errorMsg =
            err instanceof Error ? err.message : 'An unexpected error occurred';
          currentConvos = currentConvos.map((c) => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id
                  ? {
                      ...m,
                      content: `⚠️ **Groq Error**: ${errorMsg}`,
                      isStreaming: false,
                    }
                  : m
              ),
              updatedAt: Date.now(),
            };
          });
          persistConversations(currentConvos);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeConversationId, conversations, settings, persistConversations]
  );

  // ── Regenerate ─────────────────────────────────────────
  const regenerateLastResponse = useCallback(async () => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    const lastAssistantIdx = [...msgs]
      .reverse()
      .findIndex((m) => m.role === 'assistant');
    if (lastAssistantIdx === -1) return;

    const idx = msgs.length - 1 - lastAssistantIdx;
    const userMsgBefore = msgs
      .slice(0, idx)
      .reverse()
      .find((m) => m.role === 'user');
    if (!userMsgBefore) return;

    const updated = conversations.map((c) => {
      if (c.id !== activeConversationId) return c;
      return {
        ...c,
        messages: c.messages.filter((_, i) => i !== idx),
        updatedAt: Date.now(),
      };
    });
    persistConversations(updated);

    await sendMessage(userMsgBefore.content);
  }, [
    activeConversation,
    activeConversationId,
    conversations,
    persistConversations,
    sendMessage,
  ]);

  // ── Update Settings ────────────────────────────────────
  const updateSettings = useCallback(
    (partial: Partial<AISettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...partial };
        if (partial.apiKey !== undefined) {
          apiKeyRef.current = partial.apiKey;
        }
        saveSettings(updated);
        return updated;
      });
    },
    []
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        settings,
        availableModels,
        isStreaming,
        isConnected,
        connectionError,
        newChat,
        selectConversation,
        deleteConversation,
        renameConversation,
        clearConversation,
        sendMessage,
        regenerateLastResponse,
        stopGeneration,
        updateSettings,
        validateApiKey,
        setApiKeyInMemory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
