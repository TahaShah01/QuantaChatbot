'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@/app/providers/ChatProvider';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import WelcomeScreen from './WelcomeScreen';
import {
  exportAsMarkdown,
  exportAsText,
  exportAsJSON,
  downloadFile,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
}

export default function ChatArea({
  isSidebarOpen,
  onOpenSidebar,
  onOpenSettings,
}: ChatAreaProps) {
  const {
    activeConversation,
    isStreaming,
    regenerateLastResponse,
    clearConversation,
    settings,
    updateSettings,
    availableModels,
    newChat,
  } = useChat();

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or streaming delta
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isStreaming]);

  // Click outside to close menus
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
        setConfirmClear(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const messages = activeConversation?.messages.filter((m) => m.role !== 'system') || [];
  const hasMessages = messages.length > 0;
  const lastAiMsgIdx = [...messages].reverse().findIndex((m) => m.role === 'assistant');
  const lastAiIdx = lastAiMsgIdx === -1 ? -1 : messages.length - 1 - lastAiMsgIdx;

  const currentModel =
    availableModels.find((m) => m.id === (settings.customModelId || settings.model)) ||
    availableModels[0];

  const handleClear = () => {
    if (activeConversation) {
      clearConversation(activeConversation.id);
      setConfirmClear(false);
      setShowOptionsMenu(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col min-w-0 h-full bg-background overflow-hidden">
      {/* ── Top Header (Minimalist ChatGPT / Gemini Style) ────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-3 sm:px-4 h-12 border-b border-border/70 bg-background/90 backdrop-blur-md select-none shrink-0">
        {/* Left: Sidebar Expand Button (only when collapsed) + Model Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Sidebar Expand Button — Only visible when sidebar is closed on desktop, or always on mobile */}
          <button
            onClick={onOpenSidebar}
            className={cn(
              'p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors',
              isSidebarOpen ? 'lg:hidden' : 'inline-flex'
            )}
            title="Open sidebar (⌘B)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="m11 9 3 3-3 3" />
            </svg>
          </button>

          {/* Model Selector Dropdown (ChatGPT style in top-left) */}
          <div className="relative" ref={modelPickerRef}>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-surface-hover text-sm font-semibold text-foreground transition-colors group"
            >
              <span>QuantaV</span>
              <span className="text-muted font-normal text-xs">•</span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium truncate max-w-[140px] sm:max-w-[200px]">
                {currentModel.name}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted ml-0.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Popover Model Picker (Clean, grouped by categories) */}
            {showModelPicker && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-surface border border-border rounded-2xl shadow-2xl p-2 z-50 animate-fade-in max-h-[75vh] overflow-y-auto">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Groq Acceleration Engines
                </div>

                <div className="space-y-1">
                  {availableModels.map((m) => {
                    const isSelected = settings.model === m.id && !settings.customModelId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          updateSettings({ model: m.id, customModelId: '' });
                          setShowModelPicker(false);
                        }}
                        className={cn(
                          'w-full flex items-start justify-between p-2 rounded-xl text-left transition-colors',
                          isSelected
                            ? 'bg-accent/15 text-accent-light'
                            : 'hover:bg-surface-hover text-foreground'
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground truncate">{m.name}</span>
                            {m.badge && (
                              <span className="px-1.5 py-0.2 rounded-md bg-surface-alt border border-border/80 text-[10px] font-mono text-muted">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {m.description}
                          </p>
                          <div className="text-[10px] text-muted font-mono mt-0.5">
                            {m.speed} • {m.contextWindow} context
                          </div>
                        </div>

                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light shrink-0 mt-1">
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
        </div>

        {/* Right: Minimalist Action Icons (New Chat, Chat Options, Settings) */}
        <div className="flex items-center gap-1">
          {/* New Chat Button */}
          <button
            onClick={newChat}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            title="New chat (⌘K)"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Conversation Options Menu (Export & Clear) if messages exist */}
          {hasMessages && (
            <div className="relative" ref={optionsMenuRef}>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Chat actions"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {showOptionsMenu && activeConversation && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface border border-border rounded-xl shadow-xl py-1 text-xs z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      downloadFile(exportAsMarkdown(activeConversation), `${activeConversation.title}.md`, 'text/markdown');
                      setShowOptionsMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-surface-hover flex items-center gap-2"
                  >
                    <span>Export Markdown</span>
                  </button>

                  <button
                    onClick={() => {
                      downloadFile(exportAsText(activeConversation), `${activeConversation.title}.txt`, 'text/plain');
                      setShowOptionsMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-surface-hover flex items-center gap-2"
                  >
                    <span>Export TXT</span>
                  </button>

                  <button
                    onClick={() => {
                      downloadFile(exportAsJSON(activeConversation), `${activeConversation.title}.json`, 'application/json');
                      setShowOptionsMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-surface-hover flex items-center gap-2"
                  >
                    <span>Export JSON</span>
                  </button>

                  <div className="border-t border-border my-1" />

                  {confirmClear ? (
                    <div className="px-3 py-1.5 space-y-1">
                      <p className="text-[11px] text-rose-400 font-medium">Clear conversation?</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleClear}
                          className="px-2 py-0.5 rounded bg-rose-500 text-white text-[11px] font-medium hover:bg-rose-600"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="px-2 py-0.5 rounded bg-surface-alt hover:bg-surface-hover text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <span>Clear messages</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Settings (⌘,)"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Main Message Scroll Area ──────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className={cn(
          'relative flex-1 overflow-y-auto px-3 sm:px-4',
          !hasMessages && 'flex items-center justify-center'
        )}
      >
        {hasMessages ? (
          <div className="max-w-3xl mx-auto w-full py-4 sm:py-6">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onCopy={() => {}}
                onRegenerate={i === lastAiIdx && !isStreaming ? regenerateLastResponse : undefined}
                isLast={i === lastAiIdx}
              />
            ))}
            <div ref={bottomRef} className="h-4" />
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* ── Minimalist ChatGPT Style Composer ─────────────────────────────── */}
      <ChatComposer onOpenSettings={onOpenSettings} />
    </div>
  );
}
