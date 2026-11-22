'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useChat } from '@/app/providers/ChatProvider';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import QuantaIcon from './QuantaIcon';

interface ChatMessageProps {
  message: Message;
  onCopy: () => void;
  onRegenerate?: () => void;
  isLast?: boolean;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node) && (node.props as { children?: React.ReactNode })?.children) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const rawCode = extractText(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!className?.includes('language-') && !rawCode.includes('\n')) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const lineCount = rawCode ? rawCode.split('\n').length : 1;

  return (
    <div className="relative group my-4 rounded-2xl overflow-hidden border border-border bg-[#0f0e14] shadow-md w-full">
      {/* Code Window Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#171520] border-b border-border/80 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
            {lang || 'code'}
          </span>
          <span className="text-[10px] text-muted/60 font-mono">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className={cn(
              'p-1.5 rounded-md text-[10px] font-mono transition-colors',
              wrapLines
                ? 'bg-accent/20 text-accent-light'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
            )}
            title="Toggle line wrapping"
          >
            Wrap
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-md hover:bg-surface-hover"
            title="Copy code"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-emerald-400 font-sans">Copied</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span className="font-sans">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <pre className={cn('!m-0 !p-0 !rounded-none overflow-x-auto', wrapLines && '!whitespace-pre-wrap !break-all')}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function ChatMessage({ message, onCopy, onRegenerate, isLast }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [msgCopied, setMsgCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeString, setTimeString] = useState('');
  const { updateSettings, sendMessage } = useChat();

  useEffect(() => {
    setTimeString(
      new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, [message.timestamp]);

  const handleCopyMsg = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setMsgCopied(true);
      onCopy();
      setTimeout(() => setMsgCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = message.content.replace(/```[\s\S]*?```/g, 'Code block omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isErrorMessage = !isUser && message.content.includes('⚠️ **Groq Error**:');
  const isRateLimitError = isErrorMessage && (message.content.includes('413') || message.content.toLowerCase().includes('rate_limit') || message.content.toLowerCase().includes('limit'));

  const handleFallbackToLlama = () => {
    updateSettings({ model: 'llama-3.1-8b-instant', customModelId: '' });
    if (onRegenerate) {
      setTimeout(() => onRegenerate(), 100);
    }
  };

  // ── USER MESSAGE: Right-aligned compact bubble ──
  if (isUser) {
    return (
      <div className="flex justify-end items-start gap-2.5 sm:gap-3 py-3 px-1 sm:px-2 animate-fade-in group">
        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex flex-col items-end">
          <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted select-none">
            <span className="font-medium text-foreground/80">You</span>
            {timeString && <span>• {timeString}</span>}
          </div>

          <div className="rounded-3xl rounded-tr-sm px-4 sm:px-5 py-2.5 sm:py-3 bg-user-bubble text-user-bubble-fg text-sm leading-relaxed shadow-sm">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>

        <div className="shrink-0 mt-0.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
            U
          </div>
        </div>
      </div>
    );
  }

  // ── ASSISTANT MESSAGE: Full-Width, Spacious, Modern ChatGPT / Claude / Gemini Style ──
  return (
    <div className="flex justify-start items-start gap-3 sm:gap-4 py-4 sm:py-5 px-1 sm:px-2 animate-fade-in group w-full">
      {/* Brand AI Avatar */}
      <div className="shrink-0 mt-1">
        <QuantaIcon size="sm" glow={false} />
      </div>

      {/* Main Full-Width Content Container */}
      <div className="flex-1 min-w-0">
        {/* Subtle Author / Time label */}
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-muted select-none">
          <span className="font-semibold text-foreground">QuantaV</span>
          {timeString && (
            <>
              <span>•</span>
              <span>{timeString}</span>
            </>
          )}
        </div>

        {/* Message Body — Seamless, Full Screen Width, Spacious Typography */}
        {isErrorMessage ? (
          <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm leading-relaxed">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-rose-200">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{isRateLimitError ? 'Groq Rate Limit Reached' : 'Groq API Error'}</span>
            </div>

            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>

            {isRateLimitError && (
              <p className="text-[11px] text-rose-300/80 mt-2 bg-rose-500/15 p-2.5 rounded-xl border border-rose-500/20">
                💡 <strong>Tip</strong>: Free tier Groq accounts limit GPT OSS 120B to 8,000 Tokens/Minute. <strong>Llama 3.1 8B Instant</strong> has a 30,000 TPM limit (almost 4x higher) with near-instant speed.
              </p>
            )}

            {onRegenerate && (
              <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleFallbackToLlama}
                  className="px-3.5 py-1.5 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  <span>⚡ Switch to Llama 3.1 8B Instant & Retry (High TPM)</span>
                </button>
                <button
                  onClick={onRegenerate}
                  className="px-3 py-1.5 rounded-xl bg-surface-alt border border-border text-foreground font-medium text-xs hover:bg-surface-hover transition-colors flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                  <span>Retry Current Model</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="prose-quantav w-full break-words">
            {message.isStreaming && !message.content ? (
              <div className="flex items-center gap-2 py-1 text-muted text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span>Thinking with Groq...</span>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: CodeBlock as never,
                  table: ({ children, ...props }) => (
                    <div className="table-wrapper">
                      <table {...props}>{children}</table>
                    </div>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}

            {/* Streaming Cursor */}
            {message.isStreaming && message.content && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-accent-light rounded-sm animate-cursor align-middle" />
            )}

            {/* Token Limit Continuation Button */}
            {message.finishReason === 'length' && !message.isStreaming && (
              <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-xs animate-fade-in">
                <div className="flex items-center gap-2 text-amber-300">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Response reached token budget. Click to seamlessly continue generating.</span>
                </div>
                <button
                  onClick={() => sendMessage('Continue generating from where you left off. Continue the code and explanation seamlessly without repeating what was already written.')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-semibold text-xs hover:bg-amber-300 transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <span>Continue Generating</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Toolbar on hover */}
        {!message.isStreaming && message.content && !isErrorMessage && (
          <div className="flex items-center gap-1 mt-2.5 text-xs select-none opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopyMsg}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              title="Copy response"
            >
              {msgCopied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-emerald-400 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleSpeak}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                isSpeaking
                  ? 'bg-accent/20 text-accent-light'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              )}
              title={isSpeaking ? 'Stop audio' : 'Read aloud'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span className="text-[10px]">{isSpeaking ? 'Pause' : 'Listen'}</span>
            </button>

            {isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Regenerate"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
                <span className="text-[10px]">Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
