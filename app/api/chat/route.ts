import { NextRequest } from 'next/server';

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

    const groqBody = {
      model: selectedModel,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: temperature ?? 0.7,
      top_p: topP ?? 1,
      max_tokens: maxTokens ?? 4096,
      stream: stream ?? true,
    };

    // Controller with 45s network timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let groqRes: Response;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(groqBody),
        signal: controller.signal,
      });
    } catch (networkErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (networkErr as Error)?.name === 'AbortError';
      const msg = isAbort
        ? 'Connection to Groq timed out after 45 seconds.'
        : `Network connection to Groq API failed: ${(networkErr as Error)?.message || 'fetch failed'}`;
      return Response.json({ error: msg }, { status: 504 });
    }
    clearTimeout(timeoutId);

    if (!groqRes.ok) {
      const errorData = await groqRes.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ||
        `Groq API responded with status ${groqRes.status} (${groqRes.statusText})`;
      return Response.json({ error: errorMessage }, { status: groqRes.status });
    }

    // Non-streaming response
    if (!stream) {
      const data = await groqRes.json();
      const content =
        (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content || '';
      return Response.json({ content });
    }

    // Streaming SSE response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(streamController) {
        const reader = groqRes.body?.getReader();
        if (!reader) {
          streamController.close();
          return;
        }

        let buffer = '';

        try {
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
              if (data === '[DONE]') {
                streamController.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (delta) {
                  streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
              } catch {
                // Ignore parse errors on malformed chunks
              }
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error';
          streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        } finally {
          streamController.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
