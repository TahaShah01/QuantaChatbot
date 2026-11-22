import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

// Safe TPM caps for Groq On-Demand / Free tier (leaving safety margin for prompt)
const MODEL_TPM_LIMITS: Record<string, number> = {
  'openai/gpt-oss-120b': 7500,
  'openai/gpt-oss-20b': 7500,
  'llama-3.3-70b-versatile': 6000,
  'qwen/qwen3.8-27b': 7500,
  'minimaxai/minimax-m2.7': 7500,
  'meta-models/muse-spark-open': 7500,
  'llama-3.1-8b-instant': 28000,
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.8);
}

function cleanErrorMessage(err: unknown): string {
  if (err instanceof Groq.APIError) {
    const groqObj = (err as { error?: { message?: string } })?.error;
    if (groqObj?.message) return groqObj.message;

    const raw = err.message || '';
    const match = /"message"\s*:\s*"([^"]+)"/.exec(raw);
    if (match) return match[1];
    return raw;
  }
  return err instanceof Error ? err.message : 'Unknown error occurred';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, temperature, topP, maxTokens, stream, apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return Response.json(
        { error: 'Groq API key is required. Please add your key in Settings.' },
        { status: 401 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const selectedModel = model?.trim() || 'llama-3.1-8b-instant';
    const groq = new Groq({
      apiKey: apiKey.trim(),
      timeout: 180000,
      maxRetries: 3,
    });

    // ── TPM-AWARE PROMPT & TOKEN CALCULATION ──────────────────
    const tpmCap = MODEL_TPM_LIMITS[selectedModel] || 8000;

    // Prune history if total prompt tokens would overwhelm the TPM limit
    let rawMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })
    );

    const systemMsg = rawMessages.find((m) => m.role === 'system');
    const nonSystemMsgs = rawMessages.filter((m) => m.role !== 'system');

    // For models with 8k TPM cap, ensure prompt doesn't exceed 3500 tokens
    const maxPromptBudget = tpmCap <= 8000 ? 3500 : 16000;
    let promptTokens = rawMessages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);

    if (promptTokens > maxPromptBudget && nonSystemMsgs.length > 2) {
      // Keep most recent messages within budget
      const recent: typeof nonSystemMsgs = [];
      let recentTokens = systemMsg ? estimateTokens(systemMsg.content) : 0;

      for (let i = nonSystemMsgs.length - 1; i >= 0; i--) {
        const msg = nonSystemMsgs[i];
        const cost = estimateTokens(msg.content) + 4;
        if (recentTokens + cost > maxPromptBudget && recent.length >= 2) break;
        recent.unshift(msg);
        recentTokens += cost;
      }

      rawMessages = systemMsg ? [systemMsg, ...recent] : recent;
      promptTokens = rawMessages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
    }

    // Dynamically clamp max_tokens so (promptTokens + max_tokens) < tpmCap
    const requestedMax = Number(maxTokens) || 4096;
    const availableForOutput = Math.max(1024, tpmCap - promptTokens - 150);
    let effectiveMaxTokens = Math.min(requestedMax, availableForOutput);

    // Helper to invoke Groq API (with auto-retry on 413 TPM limit)
    const createCompletionStream = async (tokensToRequest: number) => {
      try {
        return await groq.chat.completions.create({
          model: selectedModel,
          messages: rawMessages,
          temperature: temperature ?? 0.7,
          top_p: topP ?? 1,
          max_tokens: tokensToRequest,
          stream: true,
        });
      } catch (err: unknown) {
        // Auto-heal if Groq returns 413: "Request too large ... Limit X, Requested Y"
        const errMsg = cleanErrorMessage(err);
        const match = /Limit\s+(\d+),\s*Requested\s+(\d+)/i.exec(errMsg);
        if (match) {
          const limit = parseInt(match[1], 10);
          const requested = parseInt(match[2], 10);
          const excess = requested - limit + 100;
          const retryTokens = Math.max(512, tokensToRequest - excess);
          // Retry automatically with clamped tokens
          return await groq.chat.completions.create({
            model: selectedModel,
            messages: rawMessages,
            temperature: temperature ?? 0.7,
            top_p: topP ?? 1,
            max_tokens: retryTokens,
            stream: true,
          });
        }
        throw err;
      }
    };

    // Non-streaming mode
    if (!stream) {
      const response = await groq.chat.completions.create({
        model: selectedModel,
        messages: rawMessages,
        temperature: temperature ?? 0.7,
        top_p: topP ?? 1,
        max_tokens: effectiveMaxTokens,
        stream: false,
      });

      const content = response.choices?.[0]?.message?.content || '';
      const finishReason = response.choices?.[0]?.finish_reason;
      return Response.json({ content, finishReason });
    }

    // Streaming mode
    const groqStream = await createCompletionStream(effectiveMaxTokens);
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of groqStream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            const finishReason = chunk.choices?.[0]?.finish_reason;

            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
              );
            }

            if (finishReason) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ finishReason })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err: unknown) {
          const errorMsg = cleanErrorMessage(err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const errorMsg = cleanErrorMessage(err);
    const status = err instanceof Groq.APIError ? err.status || 500 : 500;
    return Response.json({ error: errorMsg }, { status });
  }
}
