'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/app/providers/ChatProvider';
import QuantaIcon from './QuantaIcon';

const PROMPT_SUGGESTIONS = [
  {
    title: 'Explain a technical concept',
    prompt: 'Explain transformer KV caching and attention mechanics in intuitive terms with a Python analogy.',
  },
  {
    title: 'Write production Python code',
    prompt: 'Write an asynchronous Python worker pipeline using asyncio, semaphores, and Pydantic validation.',
  },
  {
    title: 'Analyze data & find patterns',
    prompt: 'Provide a Polars and Pandas workflow to calculate user retention cohorts and churn rates from event logs.',
  },
  {
    title: 'Design software architecture',
    prompt: 'Design a high-throughput event-driven microservice architecture with Redis Streams, Kafka, and Go.',
  },
];

export default function WelcomeScreen() {
  const { sendMessage } = useChat();
  const [greeting, setGreeting] = useState('What can I help with today?');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 5) setGreeting('Good night. What shall we explore?');
    else if (h < 12) setGreeting('Good morning. What can I help with?');
    else if (h < 17) setGreeting('Good afternoon. Where shall we start?');
    else setGreeting('Good evening. What are we building?');
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 max-w-2xl mx-auto w-full select-none animate-fade-in">
      {/* Centered Brand Mark */}
      <div className="flex flex-col items-center text-center mb-8">
        <QuantaIcon size="lg" glow={true} className="mb-4" />
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1.5">
          QuantaV • High-speed reasoning powered by Groq
        </p>
      </div>

      {/* Clean 2x2 Minimalist Suggestion Grid (ChatGPT / Gemini style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {PROMPT_SUGGESTIONS.map((item, i) => (
          <button
            key={i}
            onClick={() => sendMessage(item.prompt)}
            className="p-3.5 rounded-2xl border border-border/80 bg-surface hover:bg-surface-hover hover:border-border text-left transition-all group"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-accent-light transition-colors">
              {item.title}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {item.prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
