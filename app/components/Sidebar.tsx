'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useChat } from '@/app/providers/ChatProvider';
import { cn } from '@/lib/utils';
import {
  exportAsText,
  exportAsMarkdown,
  exportAsJSON,
  downloadFile,
  groupConversationsByDate,
} from '@/lib/utils';
import QuantaIcon from './QuantaIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpenSettings }: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    newChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    settings,
    isConnected,
  } = useChat();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [clientNow, setClientNow] = useState<number | undefined>(undefined);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClientNow(Date.now());
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const grouped = groupConversationsByDate(filtered, clientNow);

  const handleRename = useCallback(
    (id: string) => {
      if (editTitle.trim()) {
        renameConversation(id, editTitle.trim());
      }
      setEditingId(null);
    },
    [editTitle, renameConversation]
  );

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
    setActiveMenuId(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const hasApiKey = !!settings.apiKey;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed lg:static z-50 h-full flex flex-col bg-surface border-r border-border',
          'w-64 transition-all duration-200 ease-in-out select-none shrink-0',
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:-ml-64 lg:translate-x-0'
        )}
      >
        {/* Top Header: Logo + Collapse Sidebar Button */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <QuantaIcon size="sm" glow={false} />
            <span className="font-semibold text-sm tracking-tight text-foreground">QuantaV</span>
          </div>

          {/* Single Collapse Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Collapse sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="m14 9-3 3 3 3" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-2.5 pb-2">
          <button
            onClick={() => {
              newChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-alt hover:bg-surface-hover border border-border/80 text-xs font-medium text-foreground transition-all"
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>New chat</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-[10px] font-mono text-muted">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Search */}
        <div className="px-2.5 pb-2">
          <div className="relative">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-6 py-1.5 bg-surface-alt/60 rounded-lg text-xs text-foreground placeholder:text-muted border border-border/60 focus:border-accent/40 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3 py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 px-3">
              <p className="text-xs text-muted">
                {search ? 'No matching chats' : 'No previous chats'}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted/70 uppercase tracking-wider">
                  {group.label}
                </div>

                {group.items.map((convo) => {
                  const isActive = convo.id === activeConversationId;
                  return (
                    <div
                      key={convo.id}
                      className={cn(
                        'group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors',
                        isActive
                          ? 'bg-surface-alt text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                      )}
                      onClick={() => {
                        if (editingId !== convo.id) {
                          selectConversation(convo.id);
                          if (window.innerWidth < 1024) onClose();
                        }
                      }}
                    >
                      {editingId === convo.id ? (
                        <input
                          ref={editInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRename(convo.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(convo.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-surface border border-accent rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                        />
                      ) : (
                        <span className="truncate flex-1 pr-1">{convo.title}</span>
                      )}

                      {/* Options Trigger (three dots) */}
                      {editingId !== convo.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === convo.id ? null : convo.id);
                          }}
                          className={cn(
                            'p-1 rounded hover:bg-surface text-muted transition-opacity shrink-0',
                            activeMenuId === convo.id ? 'opacity-100 text-foreground' : 'opacity-0 group-hover:opacity-100'
                          )}
                          title="Chat options"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                      )}

                      {/* Dropdown Menu */}
                      {activeMenuId === convo.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-2 top-full mt-1 z-50 w-40 bg-surface border border-border rounded-xl shadow-xl py-1 text-xs animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-full px-3 py-1.5 text-left hover:bg-surface-hover flex items-center gap-2"
                            onClick={() => startRename(convo.id, convo.title)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                            Rename
                          </button>

                          <button
                            className="w-full px-3 py-1.5 text-left hover:bg-surface-hover flex items-center gap-2"
                            onClick={() => {
                              downloadFile(exportAsMarkdown(convo), `${convo.title}.md`, 'text/markdown');
                              setActiveMenuId(null);
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            Export Markdown
                          </button>

                          <button
                            className="w-full px-3 py-1.5 text-left hover:bg-surface-hover flex items-center gap-2"
                            onClick={() => {
                              downloadFile(exportAsJSON(convo), `${convo.title}.json`, 'application/json');
                              setActiveMenuId(null);
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
                            </svg>
                            Export JSON
                          </button>

                          <div className="border-t border-border my-1" />

                          <button
                            className="w-full px-3 py-1.5 text-left hover:bg-rose-500/10 text-rose-400 flex items-center gap-2"
                            onClick={() => {
                              deleteConversation(convo.id);
                              setActiveMenuId(null);
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer: Settings Capsule (ChatGPT style) */}
        <div className="border-t border-border p-2 bg-surface-alt/30">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-hover text-xs transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    isConnected && hasApiKey ? 'bg-emerald-500' : 'bg-amber-400'
                  )}
                />
              </span>
              <div className="text-left min-w-0">
                <div className="font-semibold text-foreground truncate">Settings</div>
                <div className="text-[10px] text-muted truncate">
                  {isConnected && hasApiKey ? 'Groq Connected' : 'API Key Setup'}
                </div>
              </div>
            </div>

            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
