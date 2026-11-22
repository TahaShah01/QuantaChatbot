export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  finishReason?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
  persona?: string;
  pinned?: boolean;
}

export interface AISettings {
  apiKey: string;
  model: string;
  customModelId: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  streamingEnabled: boolean;
  historyEnabled: boolean;
  systemPrompt: string;
  persona: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  icon: string;
}

export interface GroqModelOption {
  id: string;
  name: string;
  category: 'Ultra-Fast & Versatile' | 'Latest & Powerful' | 'Extended Context';
  badge?: string;
  speed: string;
  contextWindow: string;
  description: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'general',
    name: 'General Assistant',
    role: 'Versatile Intelligence',
    description: 'Helpful, accurate, and thoughtful AI assistant for any task',
    systemPrompt: 'You are QuantaV, a premium, exceptionally capable AI assistant. Provide clear, elegant, well-structured, and rigorous answers. Format code meticulously with comments and adhere to modern best practices.',
    icon: '✦',
  },
  {
    id: 'python-tutor',
    name: 'Python Tutor',
    role: 'Code Mentor',
    description: 'Patient programming instructor focusing on idiomatic, Pythonic code',
    systemPrompt: 'You are QuantaV Python Tutor, an elite programming instructor. Explain concepts clearly with real-world examples, type hints, docstrings, and performance considerations. Always provide runnable, robust code.',
    icon: '🐍',
  },
  {
    id: 'ml-expert',
    name: 'Machine Learning Expert',
    role: 'AI Researcher',
    description: 'Deep knowledge of neural architectures, transformers, and PyTorch',
    systemPrompt: 'You are QuantaV ML Expert, a senior AI researcher and machine learning scientist. Provide mathematically grounded explanations, PyTorch/TensorFlow implementations, training tips, and architectural trade-offs.',
    icon: '🧠',
  },
  {
    id: 'ai-robotics',
    name: 'AI & Robotics Trainer',
    role: 'Robotics & Control',
    description: 'Autonomous systems, ROS2, SLAM, kinematics, and sensor fusion',
    systemPrompt: 'You are QuantaV Robotics Trainer, specializing in robotics, embedded edge AI, kinematics, ROS2, SLAM, and sensor fusion. Deliver practical engineering architectures and production-level algorithms.',
    icon: '🤖',
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    role: 'Analytics & Insights',
    description: 'Statistical reasoning, high-performance Pandas/Polars, and SQL',
    systemPrompt: 'You are QuantaV Data Analyst, an expert in statistical modeling, exploratory data analysis, Pandas, Polars, DuckDB, SQL, and data visualization. Derive actionable, executive-ready insights from data.',
    icon: '📊',
  },
];

export const AVAILABLE_MODELS: GroqModelOption[] = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    category: 'Ultra-Fast & Versatile',
    badge: '30k TPM • Recommended',
    speed: '~560 tps',
    contextWindow: '131,072',
    description: 'Highest TPM limits (30k tokens/min). Instant latency and rock-solid reliability across all accounts.',
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    category: 'Latest & Powerful',
    badge: 'Latest Reasoning',
    speed: '~500 tps',
    contextWindow: '131,072',
    description: 'OpenAI 120B open weights model. Auto-budgeted to 7.5k TPM to prevent free tier rate limits.',
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    category: 'Ultra-Fast & Versatile',
    badge: '1,000 tps',
    speed: '~1,000 tps',
    contextWindow: '131,072',
    description: 'Extreme speed 20B model engineered for instantaneous conversational responses and coding.',
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    category: 'Latest & Powerful',
    badge: 'New',
    speed: '~450 tps',
    contextWindow: '131,072',
    description: 'High-accuracy instruction following and multilingual reasoning model.',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    category: 'Latest & Powerful',
    badge: '70B',
    speed: '~280 tps',
    contextWindow: '131,072',
    description: 'Meta flagship 70B versatile model for advanced complex reasoning.',
  },
  {
    id: 'minimaxai/minimax-m2.7',
    name: 'MiniMax M2.7',
    category: 'Extended Context',
    badge: '196k Context',
    speed: '~260 tps',
    contextWindow: '196,608',
    description: 'Extended 196k context window model built for large document comprehension.',
  },
  {
    id: 'meta-models/muse-spark-open',
    name: 'Muse Spark Open',
    category: 'Extended Context',
    badge: 'Creative',
    speed: '~350 tps',
    contextWindow: '131,072',
    description: 'High-speed open weights creative reasoning and generative brainstorming model.',
  },
];

export const DEFAULT_SETTINGS: AISettings = {
  apiKey: '',
  model: 'llama-3.1-8b-instant',
  customModelId: '',
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  streamingEnabled: true,
  historyEnabled: true,
  systemPrompt: PERSONAS[0].systemPrompt,
  persona: 'general',
};
