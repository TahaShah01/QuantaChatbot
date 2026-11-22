import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return Response.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    const groq = new Groq({
      apiKey: apiKey.trim(),
      timeout: 15000,
      maxRetries: 2,
    });

    const modelList = await groq.models.list();
    const models = (modelList.data || []).map((m) => m.id);

    return Response.json({ valid: true, models });
  } catch (err: unknown) {
    if (err instanceof Groq.APIError) {
      return Response.json(
        { valid: false, error: `Groq Authentication Error (${err.status}): ${err.message}` },
        { status: 200 }
      );
    }
    const message = err instanceof Error ? err.message : 'Connection error';
    return Response.json({ valid: false, error: message }, { status: 200 });
  }
}
