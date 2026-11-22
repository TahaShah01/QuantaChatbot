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

function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!className?.includes('language-') && !code.includes('\n')) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const lineCount = code.split('\n').length;

  return (
    <div className="relative group my-3.5 rounded-2xl overflow-hidden border border-border bg-[#0f0e14] shadow-md">
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
  const { updateSettings } = useChat();

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

  const handleFallbackToLlama = () => {
    updateSettings({ model: 'llama-3.1-8b-instant', customModelId: '' });
    if (onRegenerate) {
      setTimeout(() => onRegenerate(), 100);
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-3 px-2 sm:px-3 py-3 transition-colors animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="shrink-0 mt-0.5">
          <QuantaIcon size="sm" glow={false} />
        </div>
      )}

      {/* Bubble Content */}
      <div className={cn('max-w-[85%] sm:max-w-[75%]', isUser && 'order-first flex flex-col items-end')}>
        {/* Subtle Author / Time label */}
        <div className={cn('flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted select-none', isUser && 'justify-end')}>
          <span className="font-medium text-foreground/80">{isUser ? 'You' : 'QuantaV'}</span>
          {timeString && (
            <>
              <span>•</span>
              <span>{timeString}</span>
            </>
          )}
        </div>

        {/* Message Bubble Body */}
        <div
          className={cn(
            'rounded-3xl px-4 sm:px-4.5 py-2.5 sm:py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-user-bubble text-user-bubble-fg rounded-br-sm'
              : isErrorMessage
              ? 'bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-bl-sm'
              : 'bg-surface border border-border/80 text-foreground rounded-bl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose-quantav break-words">
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
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}

              {/* Instant One-Click Model Fix Button if model error occurs */}
              {isErrorMessage && onRegenerate && (
                <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleFallbackToLlama}
                    className="px-3 py-1.5 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                  >
                    <span>⚡ Switch to Llama 3.1 8B Instant & Retry</span>
                  </button>
                  <span className="text-[11px] text-muted">Or pick another model from the chatbar below.</span>
                </div>
              )}

              {/* Streaming Cursor */}
              {message.isStreaming && message.content && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-accent-light rounded-sm animate-cursor align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar on hover */}
        {!isUser && !message.isStreaming && message.content && !isErrorMessage && (
          <div className="flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopyMsg}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              title="Copy"
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
                'flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
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
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
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

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0 mt-0.5">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-bold">
            U
          </div>
        </div>
      )}
    </div>
  );
}
