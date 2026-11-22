import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from './types';

export function generateId(): string {
  return uuidv4();
}

export function createConversation(systemPrompt?: string, persona?: string): Conversation {
  const ts = Date.now();
  return {
    id: generateId(),
    title: 'New conversation',
    messages: [],
    createdAt: ts,
    updatedAt: ts,
    systemPrompt,
    persona: persona || 'general',
  };
}

export function createMessage(role: Message['role'], content: string): Message {
  return {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  };
}

export function generateTitle(messages: Message[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (!firstUserMsg) return 'New conversation';
  const text = firstUserMsg.content.trim().replace(/\n+/g, ' ');
  if (text.length <= 40) return text;
  return text.slice(0, 37) + '…';
}

export function formatTimestamp(ts: number, referenceNow?: number): string {
  const now = referenceNow || ts;
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface ConversationGroup {
  label: string;
  items: Conversation[];
}

export function groupConversationsByDate(
  convos: Conversation[],
  currentTimestamp?: number
): ConversationGroup[] {
  if (!currentTimestamp) {
    return [{ label: 'Recent Chats', items: convos }];
  }

  const today = new Date(currentTimestamp);
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const yesterdayMs = todayMs - 86400000;
  const lastWeekMs = todayMs - 7 * 86400000;

  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  for (const c of convos) {
    const time = c.updatedAt || c.createdAt;
    if (time >= todayMs) {
      groups.Today.push(c);
    } else if (time >= yesterdayMs) {
      groups.Yesterday.push(c);
    } else if (time >= lastWeekMs) {
      groups['Previous 7 Days'].push(c);
    } else {
      groups.Older.push(c);
    }
  }

  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function exportAsText(conversation: Conversation): string {
  let text = `# ${conversation.title}\n`;
  text += `# Exported from QuantaV — Intelligence, without friction\n`;
  text += `# Date: ${new Date(conversation.createdAt).toLocaleString()}\n\n`;
  for (const msg of conversation.messages) {
    const prefix = msg.role === 'user' ? 'YOU' : 'QUANTAV AI';
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `[${prefix}] • ${new Date(msg.timestamp).toLocaleTimeString()}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `${msg.content}\n\n`;
  }
  return text;
}

export function exportAsMarkdown(conversation: Conversation): string {
  let md = `# ${conversation.title}\n\n`;
  md += `*Exported from QuantaV on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
  for (const msg of conversation.messages) {
    const isUser = msg.role === 'user';
    md += `### ${isUser ? '👤 User' : '✦ QuantaV'}\n\n`;
    md += `${msg.content}\n\n---\n\n`;
  }
  return md;
}

export function exportAsJSON(conversation: Conversation): string {
  return JSON.stringify(
    {
      title: conversation.title,
      exportedAt: new Date().toISOString(),
      persona: conversation.persona,
      systemPrompt: conversation.systemPrompt,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    },
    null,
    2
  );
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
