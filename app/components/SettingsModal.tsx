'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/app/providers/ChatProvider';
import ThemeSwitcher from './ThemeSwitcher';
import { PERSONAS } from '@/lib/types';
import { cn, downloadFile } from '@/lib/utils';
import QuantaIcon from './QuantaIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'connection' | 'model' | 'persona' | 'data';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    settings,
    updateSettings,
    validateApiKey,
    setApiKeyInMemory,
    isConnected,
    connectionError,
    conversations,
    availableModels,
  } = useChat();

  const [tab, setTab] = useState<Tab>('connection');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<null | {
    valid: boolean;
    error?: string;
    models?: string[];
  }>(null);

  // Sync key when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(settings.apiKey ? '••••••••••••••••••••••••••••••••' : '');
      setValidationResult(null);
    }
  }, [isOpen, settings.apiKey]);

  // Escape key closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleValidate = async () => {
    const key = apiKeyInput.startsWith('••') ? settings.apiKey : apiKeyInput.trim();
    if (!key) return;
    setIsValidating(true);
    const result = await validateApiKey(key);
    setValidationResult(result);
    if (result.valid) {
      setApiKeyInMemory(key);
    }
    setIsValidating(false);
  };

  const handleSaveKey = () => {
    const key = apiKeyInput.startsWith('••') ? settings.apiKey : apiKeyInput.trim();
    if (key) {
      setApiKeyInMemory(key);
      setValidationResult({ valid: true });
    }
  };

  const handleExportAll = () => {
    const data = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        application: 'QuantaV AI',
        conversations,
      },
      null,
      2
    );
    downloadFile(data, `quantav-backup-${Date.now()}.json`, 'application/json');
  };

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'connection',
      label: 'API Connection',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      id: 'model',
      label: 'Model & Engine',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'persona',
      label: 'Personas & Prompt',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      ),
    },
    {
      id: 'general',
      label: 'Theme & Appearance',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ),
    },
    {
      id: 'data',
      label: 'Data & Privacy',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
        <div
          className="relative bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-surface-alt/20">
            <div className="flex items-center gap-2.5">
              <QuantaIcon size="sm" glow={false} />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Settings</h2>
                <p className="text-[11px] text-muted">Configure Groq connectivity, models, and interface</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="sm:w-48 border-b sm:border-b-0 sm:border-r border-border/70 p-2 bg-surface-alt/10 space-y-0.5 shrink-0 overflow-x-auto sm:overflow-visible flex sm:flex-col">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 sm:shrink sm:w-full',
                    tab === t.id
                      ? 'bg-surface-alt text-foreground font-semibold border border-border/80'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                  )}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Panels */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* ── CONNECTION TAB ── */}
              {tab === 'connection' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-foreground">Groq API Key</label>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-accent-light hover:underline flex items-center gap-1"
                      >
                        <span>Get key on Groq Console</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" x2="21" y1="14" y2="3" />
                        </svg>
                      </a>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={apiKeyInput}
                          onChange={(e) => {
                            setApiKeyInput(e.target.value);
                            setValidationResult(null);
                          }}
                          onFocus={() => {
                            if (apiKeyInput.startsWith('••')) setApiKeyInput('');
                          }}
                          placeholder="gsk_..."
                          className="w-full px-3 py-2 pr-9 rounded-xl bg-surface-alt border border-border text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                          title={showKey ? 'Hide key' : 'Show key'}
                        >
                          {showKey ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                              <line x1="2" x2="22" y1="2" y2="22" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={handleValidate}
                        disabled={isValidating || !apiKeyInput || apiKeyInput.startsWith('••')}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium bg-surface-alt border border-border hover:bg-surface-hover text-foreground disabled:opacity-40"
                      >
                        {isValidating ? 'Validating...' : 'Test Connection'}
                      </button>

                      <button
                        onClick={handleSaveKey}
                        disabled={!apiKeyInput || apiKeyInput.startsWith('••')}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>

                    {validationResult && (
                      <div
                        className={cn(
                          'mt-3 px-3 py-2 rounded-xl text-xs border flex items-center gap-2',
                          validationResult.valid
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        )}
                      >
                        <span>{validationResult.valid ? '✓' : '✗'}</span>
                        <span>
                          {validationResult.valid
                            ? 'Connected to Groq Cloud. Live models retrieved.'
                            : validationResult.error || 'Authentication error.'}
                        </span>
                      </div>
                    )}

                    {connectionError && !validationResult && (
                      <div className="mt-3 px-3 py-2 rounded-xl text-xs border bg-rose-500/10 border-rose-500/25 text-rose-400">
                        {connectionError}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl border border-border/80 bg-surface-alt/30 text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Ephemeral Session Privacy: </span>
                    Your API key is kept strictly in volatile browser memory for the session. It is never saved to local storage, cookies, or remote databases.
                  </div>
                </div>
              )}

              {/* ── MODEL TAB ── */}
              {tab === 'model' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Active Model</label>
                    <select
                      value={settings.model}
                      onChange={(e) => updateSettings({ model: e.target.value, customModelId: '' })}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-alt border border-border text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.speed} • {m.contextWindow}) — {m.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Custom Model ID</label>
                    <input
                      type="text"
                      value={settings.customModelId}
                      onChange={(e) => updateSettings({ customModelId: e.target.value })}
                      placeholder="e.g. openai/gpt-oss-120b"
                      className="w-full px-3 py-2 rounded-xl bg-surface-alt border border-border text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-3.5 pt-2 border-t border-border/70">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-foreground">Temperature</span>
                        <span className="text-xs font-mono text-muted">{settings.temperature.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={settings.temperature}
                        onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                        className="w-full accent-foreground h-1.5 bg-surface-alt rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-foreground">Top-P</span>
                        <span className="text-xs font-mono text-muted">{settings.topP.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.topP}
                        onChange={(e) => updateSettings({ topP: parseFloat(e.target.value) })}
                        className="w-full accent-foreground h-1.5 bg-surface-alt rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-foreground">Max Tokens</span>
                        <span className="text-xs font-mono text-muted">{settings.maxTokens}</span>
                      </div>
                      <input
                        type="range"
                        min="256"
                        max="32768"
                        step="256"
                        value={settings.maxTokens}
                        onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                        className="w-full accent-foreground h-1.5 bg-surface-alt rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/70 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span className="text-xs text-foreground">Stream responses in real-time</span>
                      <button
                        type="button"
                        onClick={() => updateSettings({ streamingEnabled: !settings.streamingEnabled })}
                        className={cn(
                          'w-9 h-5 rounded-full transition-colors relative',
                          settings.streamingEnabled ? 'bg-foreground' : 'bg-muted/40'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform',
                            settings.streamingEnabled ? 'translate-x-4' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span className="text-xs text-foreground">Include conversation history</span>
                      <button
                        type="button"
                        onClick={() => updateSettings({ historyEnabled: !settings.historyEnabled })}
                        className={cn(
                          'w-9 h-5 rounded-full transition-colors relative',
                          settings.historyEnabled ? 'bg-foreground' : 'bg-muted/40'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform',
                            settings.historyEnabled ? 'translate-x-4' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </label>
                  </div>
                </div>
              )}

              {/* ── PERSONA TAB ── */}
              {tab === 'persona' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Predefined Personas</label>
                    <div className="space-y-1.5 mt-2">
                      {PERSONAS.map((p) => {
                        const isSelected = settings.persona === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => updateSettings({ persona: p.id, systemPrompt: p.systemPrompt })}
                            className={cn(
                              'w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors',
                              isSelected
                                ? 'bg-surface-alt border-border text-foreground font-medium'
                                : 'border-transparent hover:bg-surface-hover text-muted-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{p.icon}</span>
                              <div>
                                <div className="text-xs font-semibold text-foreground">{p.name}</div>
                                <div className="text-[11px] text-muted">{p.description}</div>
                              </div>
                            </div>
                            {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-light shrink-0">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Custom System Prompt</label>
                    <textarea
                      value={settings.systemPrompt}
                      onChange={(e) => updateSettings({ systemPrompt: e.target.value, persona: 'custom' })}
                      rows={5}
                      className="w-full p-2.5 rounded-xl bg-surface-alt border border-border text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none resize-none font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* ── APPEARANCE TAB ── */}
              {tab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Color Theme</label>
                    <p className="text-[11px] text-muted mb-3">
                      Select how QuantaV appears. System follows your device setting.
                    </p>
                    <ThemeSwitcher />
                  </div>
                </div>
              )}

              {/* ── DATA TAB ── */}
              {tab === 'data' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-1">Export Chats</h3>
                    <p className="text-[11px] text-muted mb-2">
                      Backup all your conversations locally as a JSON file.
                    </p>
                    <button
                      onClick={handleExportAll}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-alt border border-border hover:bg-surface-hover text-foreground flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      <span>Export All ({conversations.length} chats)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
