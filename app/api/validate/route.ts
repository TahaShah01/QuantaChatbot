import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return Response.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg =
        (data as { error?: { message?: string } })?.error?.message ||
        `Validation failed: ${res.status}`;
      return Response.json({ valid: false, error: errorMsg }, { status: 200 });
    }

    const data = await res.json();
    const models = ((data as { data?: { id: string }[] })?.data || []).map(
      (m: { id: string }) => m.id
    );

    return Response.json({ valid: true, models });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection error';
    return Response.json({ valid: false, error: message }, { status: 500 });
  }
}
