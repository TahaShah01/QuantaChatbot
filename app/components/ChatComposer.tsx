
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/app/providers/ChatProvider';
import { PERSONAS } from '@/lib/types';
import { cn, estimateTokens } from '@/lib/utils';

interface ChatComposerProps {
  onOpenSettings: () => void;
}

export default function ChatComposer({ onOpenSettings }: ChatComposerProps) {
  const {
    sendMessage,
    isStreaming,
    stopGeneration,
    settings,
    updateSettings,
    availableModels,
  } = useChat();

  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  // Click outside to dismiss menus
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
      if (personaMenuRef.current && !personaMenuRef.current.contains(e.target as Node)) {
        setShowPersonaPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasApiKey = !!settings.apiKey;
  const currentPersona = PERSONAS.find((p) => p.id === settings.persona) || PERSONAS[0];
  const currentModel =
    availableModels.find((m) => m.id === (settings.customModelId || settings.model)) ||
    availableModels[0];
  const tokenCount = estimateTokens(input);

  return (
    <div className="relative border-t border-border/50 bg-background/95 backdrop-blur-xl px-3 sm:px-4 pt-2.5 pb-3 sm:pb-4 z-20">
      <div className="max-w-3xl mx-auto">
        {/* Missing API Key Banner */}
        {!hasApiKey && (
          <div className="mb-2.5 px-3.5 py-2 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between text-xs animate-fade-in">
            <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
              <span>🔑</span>
              <span>Groq API Key required to generate responses. Stored in memory only.</span>
            </span>
            <button
              onClick={onOpenSettings}
              className="text-[11px] font-semibold text-accent-light hover:underline shrink-0"
            >
              Enter API Key
            </button>
          </div>
        )}

        {/* Rounded Input Capsule */}
        <div
          className={cn(
            'relative rounded-3xl border transition-all duration-200',
            'bg-surface border-border shadow-sm',
            'focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/15'
          )}
        >
          {/* Textarea */}
          <div className="px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasApiKey
                  ? `Ask QuantaV (${currentModel.name})...`
                  : 'Enter your Groq API key in Settings to begin...'
              }
              rows={1}
              className="w-full bg-transparent resize-none text-sm text-foreground placeholder:text-muted focus:outline-none min-h-[36px] max-h-[200px] leading-relaxed"
            />
          </div>

          {/* Bottom Bar: In-Chatbar Model Switcher & Persona Switcher */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5 select-none">
            {/* Left Tools: Model Switcher Pill + Persona Pill */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* ── Flawless In-Chatbar Model Switcher ── */}
              <div className="relative" ref={modelMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModelPicker(!showModelPicker);
                    setShowPersonaPicker(false);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border',
                    showModelPicker
                      ? 'bg-accent/15 border-accent text-accent-light font-semibold shadow-sm'
                      : 'border-border/70 hover:border-border hover:bg-surface-hover text-muted-foreground hover:text-foreground'
                  )}
                  title="Change AI model directly from chatbar"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light shrink-0">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span className="font-medium text-[11px] truncate max-w-[120px] sm:max-w-[160px]">
                    {currentModel.name}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted shrink-0">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* Model Popover Menu */}
                {showModelPicker && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 bg-surface border border-border rounded-2xl shadow-2xl p-2 z-50 animate-fade-in max-h-72 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
                      <span>Select Groq Model</span>
                      <span className="text-[9px] text-accent-light font-mono">Active</span>
                    </div>

                    <div className="space-y-0.5 mt-1">
                      {availableModels.map((m) => {
                        const isSelected = settings.model === m.id && !settings.customModelId;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              updateSettings({ model: m.id, customModelId: '' });
                              setShowModelPicker(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors',
                              isSelected
                                ? 'bg-accent/15 text-accent-light font-semibold'
                                : 'text-foreground hover:bg-surface-hover'
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium truncate">{m.name}</span>
                                {m.badge && (
                                  <span className="px-1.5 py-0.2 rounded bg-surface-alt border border-border text-[9px] font-mono text-muted shrink-0">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted font-mono mt-0.5">
                                {m.speed} • {m.contextWindow} context
                              </div>
                            </div>

                            {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light shrink-0">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── In-Chatbar Persona Switcher ── */}
              <div className="relative" ref={personaMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonaPicker(!showPersonaPicker);
                    setShowModelPicker(false);
                  }}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors border',
                    showPersonaPicker
                      ? 'bg-accent/15 border-accent text-accent-light'
                      : 'border-border/70 hover:border-border hover:bg-surface-hover text-muted-foreground hover:text-foreground'
                  )}
                  title="Change persona"
                >
                  <span>{currentPersona.icon}</span>
                  <span className="font-medium text-[11px] hidden sm:inline">{currentPersona.name}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* Persona Popover */}
                {showPersonaPicker && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 bg-surface border border-border rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in">
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
                      Select Persona
                    </div>
                    <div className="space-y-0.5">
                      {PERSONAS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            updateSettings({ persona: p.id, systemPrompt: p.systemPrompt });
                            setShowPersonaPicker(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors',
                            settings.persona === p.id
                              ? 'bg-accent/15 text-accent-light font-medium'
                              : 'text-foreground hover:bg-surface-hover'
                          )}
                        >
                          <span className="text-sm">{p.icon}</span>
                          <div className="flex-1 truncate">
                            <div className="font-medium truncate">{p.name}</div>
                            <div className="text-[10px] text-muted truncate">{p.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Character & Token count */}
              {input.length > 0 && (
                <span className="text-[10px] font-mono text-muted/60 hidden sm:inline ml-1">
                  ~{tokenCount} tokens
                </span>
              )}
            </div>

            {/* Right Tools: Clear + Send/Stop Button */}
            <div className="flex items-center gap-1.5">
              {input.length > 0 && !isStreaming && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  title="Clear input"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}

              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-85 transition-opacity"
                  title="Stop generating"
                >
                  <span className="w-2.5 h-2.5 rounded-xs bg-background" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || !hasApiKey}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                    input.trim() && hasApiKey
                      ? 'bg-foreground text-background hover:opacity-90 shadow-sm'
                      : 'bg-surface-alt text-muted/40 cursor-not-allowed border border-border/60'
                  )}
                  title="Send message (Enter)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Footer Disclaimer */}
        <p className="text-center text-[11px] text-muted mt-2 select-none">
          QuantaV can make mistakes. Verify important info. • Powered by Groq Cloud
        </p>
      </div>
    </div>
  );
}
