/**
 * Guardian OS — Multi-LLM Routing Layer (Ara's Nervous System)
 * 
 * Routes agent tasks to the optimal LLM provider based on task characteristics,
 * NOT hardcoded agent names. When a new domain adds agents, routing just works.
 * 
 * SILENT REROUTE PRINCIPLE:
 *   The user NEVER sees a provider failure. If one provider goes down,
 *   the router silently tries the next available provider. If all providers
 *   are exhausted, it waits and retries. The demo just works.
 * 
 * Providers:
 *   - Manus (built-in): Vision-capable, premium reasoning
 *   - Groq: Blazing fast inference, free tier, no vision
 *   - Gemini: Good general purpose, free tier, vision-capable
 *   - Puter: Free unlimited AI API, 500+ models, no API key needed
 * 
 * The frontend never sees which provider is used. It's one brain.
 */

import { ENV } from "./_core/env";

// ─── Provider Configuration ─────────────────────────────────────────

export type TaskWeight = 'lightweight' | 'standard' | 'heavy';

export interface LLMProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  supportsVision: boolean;
  supportsJsonMode: boolean;
  maxTokens: number;
  healthy: boolean;
  consecutiveFailures: number;
  maxFailures: number;
  /** Timestamp when this provider was circuit-broken — used for auto-recovery */
  circuitBrokenAt: number;
  /** How long to wait before trying a circuit-broken provider again (ms) */
  recoveryWindow: number;
  /** Whether this provider uses a custom SDK instead of OpenAI-compatible REST */
  useCustomSdk?: boolean;
}

export interface RouteDecision {
  provider: LLMProvider;
  fallbacks: LLMProvider[];
}

// ─── Provider Registry ──────────────────────────────────────────────

function getProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  // Manus built-in (always available — it's the platform)
  if (ENV.forgeApiKey) {
    providers.push({
      name: 'manus',
      endpoint: ENV.forgeApiUrl
        ? `${ENV.forgeApiUrl.replace(/\/$/, '')}/v1/chat/completions`
        : 'https://forge.manus.im/v1/chat/completions',
      apiKey: ENV.forgeApiKey,
      model: 'gemini-2.5-flash',
      supportsVision: true,
      supportsJsonMode: true,
      maxTokens: 32768,
      healthy: true,
      consecutiveFailures: 0,
      maxFailures: 3,
      circuitBrokenAt: 0,
      recoveryWindow: 30000, // 30s before retrying
    });
  }

  // Anthropic Claude — premium reasoning, strong for legal/analysis
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    providers.push({
      name: 'claude',
      endpoint: 'https://api.anthropic.com/v1/messages',
      apiKey: anthropicKey,
      model: 'claude-3-5-haiku-20241022',
      supportsVision: true,
      supportsJsonMode: true,
      maxTokens: 4096,
      healthy: true,
      consecutiveFailures: 0,
      maxFailures: 3,
      circuitBrokenAt: 0,
      recoveryWindow: 20000,
      useCustomSdk: true, // Claude uses non-OpenAI-compatible API
    });
  }

  // Groq — blazing fast, free tier, OpenAI-compatible
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    providers.push({
      name: 'groq',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: groqKey,
      model: 'llama-3.3-70b-versatile',
      supportsVision: false,
      supportsJsonMode: true,
      maxTokens: 8192,
      healthy: true,
      consecutiveFailures: 0,
      maxFailures: 3,
      circuitBrokenAt: 0,
      recoveryWindow: 15000, // 15s — Groq rate limits reset fast
    });
  }

  // Google Gemini — free tier, vision-capable, OpenAI-compatible
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    providers.push({
      name: 'gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      apiKey: geminiKey,
      model: 'gemini-2.0-flash',
      supportsVision: true,
      supportsJsonMode: true,
      maxTokens: 8192,
      healthy: true,
      consecutiveFailures: 0,
      maxFailures: 3,
      circuitBrokenAt: 0,
      recoveryWindow: 20000,
    });
  }

  // Puter.js — free unlimited AI API, 500+ models, no API key needed
  // Always available as the ultimate fallback
  const puterToken = process.env.PUTER_AUTH_TOKEN;
  if (puterToken) {
    providers.push({
      name: 'puter',
      endpoint: '', // Uses Puter SDK, not REST
      apiKey: puterToken,
      model: 'gpt-4o',
      supportsVision: true,
      supportsJsonMode: true,
      maxTokens: 8192,
      healthy: true,
      consecutiveFailures: 0,
      maxFailures: 5, // Higher tolerance — free unlimited
      circuitBrokenAt: 0,
      recoveryWindow: 10000,
      useCustomSdk: true,
    });
  }

  return providers;
}

// Provider instances (mutable for health tracking)
let providerPool: LLMProvider[] = getProviders();

/** Refresh provider pool (call after adding new API keys) */
export function refreshProviders() {
  providerPool = getProviders();
}

// ─── Silent Recovery ────────────────────────────────────────────────

/**
 * Check if a circuit-broken provider has recovered (enough time has passed).
 * This allows providers to come back online automatically without manual intervention.
 */
function checkRecovery(provider: LLMProvider): boolean {
  if (provider.healthy) return true;
  if (Date.now() - provider.circuitBrokenAt > provider.recoveryWindow) {
    // Recovery window passed — give it another chance
    provider.healthy = true;
    provider.consecutiveFailures = 0;
    console.log(`[Ara Router] Provider "${provider.name}" recovered — back in rotation`);
    return true;
  }
  return false;
}

// ─── Intelligent Routing ────────────────────────────────────────────

const roundRobinCounters: Record<string, number> = {};

/**
 * Route a task to the best available provider.
 * Task-characteristic-based, NOT agent-name-based.
 */
export function routeTask(options: {
  needsVision: boolean;
  taskWeight: TaskWeight;
  agentIndex: number;
  totalAgents: number;
}): RouteDecision {
  const { needsVision, taskWeight } = options;

  // Check recovery on all providers first
  providerPool.forEach(checkRecovery);

  // Get all available providers
  let candidates = providerPool.filter(p => p.healthy);

  // If task needs vision, filter to vision-capable providers
  if (needsVision) {
    candidates = candidates.filter(p => p.supportsVision);
  }

  // If no healthy candidates, force-reset ALL providers (silent recovery)
  if (candidates.length === 0) {
    console.log(`[Ara Router] All providers exhausted — force-resetting for silent reroute`);
    providerPool.forEach(p => {
      p.healthy = true;
      p.consecutiveFailures = 0;
      p.circuitBrokenAt = 0;
    });
    candidates = needsVision
      ? providerPool.filter(p => p.supportsVision)
      : [...providerPool];
  }

  // Last resort — if still nothing (no providers configured)
  if (candidates.length === 0) {
    const manus = providerPool.find(p => p.name === 'manus');
    if (manus) {
      return { provider: manus, fallbacks: [] };
    }
    throw new Error('No LLM providers configured. Add at least one API key.');
  }

  // Distribute agents across providers using round-robin
  const key = `${taskWeight}-${needsVision}`;
  if (!(key in roundRobinCounters)) {
    roundRobinCounters[key] = 0;
  }

  const primaryIndex = roundRobinCounters[key] % candidates.length;
  roundRobinCounters[key]++;

  const primary = candidates[primaryIndex];
  const fallbacks = candidates.filter((_, i) => i !== primaryIndex);

  return { provider: primary, fallbacks };
}

// ─── LLM Invocation with Silent Reroute ─────────────────────────────

export interface RoutedLLMParams {
  messages: any[];
  needsVision?: boolean;
  taskWeight?: TaskWeight;
  agentIndex?: number;
  totalAgents?: number;
  response_format?: any;
}

export interface RoutedLLMResult {
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | any[];
    };
    finish_reason: string | null;
  }>;
  _provider: string;
  _model: string;
}

/** Sleep utility for retry delays */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Invoke LLM through the routing layer with SILENT REROUTE.
 * 
 * The user NEVER sees a failure. The router:
 *   1. Tries the primary provider
 *   2. On failure, silently falls back to next provider
 *   3. If ALL providers fail, waits briefly and retries the full cycle
 *   4. Up to MAX_RETRY_CYCLES total attempts before giving up
 * 
 * This means even with quota exhaustion on one provider,
 * the system silently reroutes and the demo keeps running.
 */
export async function invokeRoutedLLM(params: RoutedLLMParams): Promise<RoutedLLMResult> {
  const {
    messages,
    needsVision = false,
    taskWeight = 'standard',
    agentIndex = 0,
    totalAgents = 10,
    response_format,
  } = params;

  const MAX_RETRY_CYCLES = 3;
  let lastError: Error | null = null;

  for (let cycle = 0; cycle < MAX_RETRY_CYCLES; cycle++) {
    // On retry cycles, wait before trying again (exponential backoff)
    if (cycle > 0) {
      const delay = Math.min(2000 * Math.pow(2, cycle - 1), 10000);
      console.log(`[Ara Router] Retry cycle ${cycle + 1}/${MAX_RETRY_CYCLES} — waiting ${delay}ms`);
      await sleep(delay);
    }

    const route = routeTask({ needsVision, taskWeight, agentIndex, totalAgents });
    const providersToTry = [route.provider, ...route.fallbacks];

    for (const provider of providersToTry) {
      try {
        const result = await callProvider(provider, messages, response_format);

        // Success — reset failure counter silently
        provider.consecutiveFailures = 0;
        provider.healthy = true;

        return {
          ...result,
          _provider: provider.name,
          _model: provider.model,
        };
      } catch (error) {
        lastError = error as Error;
        const errMsg = String(error);

        // Track failures for circuit-breaking
        provider.consecutiveFailures++;
        if (provider.consecutiveFailures >= provider.maxFailures) {
          provider.healthy = false;
          provider.circuitBrokenAt = Date.now();
          console.warn(`[Ara Router] Circuit-breaking "${provider.name}" — silent reroute active`);
        }

        // Determine if this is a quota/rate-limit error (retryable) vs a hard error
        const isQuotaError = errMsg.includes('exhausted') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('rate');
        const isServerError = errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503');

        if (isQuotaError || isServerError) {
          console.warn(`[Ara Router] "${provider.name}" hit limit — silently trying next provider`);
        } else {
          console.warn(`[Ara Router] "${provider.name}" error: ${errMsg.substring(0, 120)} — trying next`);
        }

        continue;
      }
    }

    // All providers failed this cycle — they'll be reset on next routeTask call
    console.warn(`[Ara Router] All providers failed cycle ${cycle + 1} — will retry silently`);
  }

  // All retry cycles exhausted — this should be extremely rare with multiple providers
  throw lastError || new Error('Neural routing temporarily unavailable');
}

/**
 * Call a specific provider with OpenAI-compatible API format
 */
async function callProvider(
  provider: LLMProvider,
  messages: any[],
  response_format?: any,
): Promise<RoutedLLMResult> {
  // Puter.js uses its own SDK instead of OpenAI-compatible REST
  if (provider.useCustomSdk && provider.name === 'puter') {
    return callPuterProvider(provider, messages, response_format);
  }

  // Claude uses Anthropic's non-OpenAI-compatible API
  if (provider.useCustomSdk && provider.name === 'claude') {
    return callClaudeProvider(provider, messages, response_format);
  }

  // For non-vision providers (like Groq), strip image content from messages
  // Groq requires messages[].content to be a string, not an array
  let processedMessages = messages;
  if (!provider.supportsVision) {
    processedMessages = messages.map((msg: any) => {
      if (Array.isArray(msg.content)) {
        // Extract only text parts, skip image_url parts
        const textParts = msg.content
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('\n');
        return { ...msg, content: textParts || 'Analyze the provided information.' };
      }
      return msg;
    });
  }

  const payload: Record<string, unknown> = {
    model: provider.model,
    messages: processedMessages,
    max_tokens: provider.maxTokens,
  };

  // Add thinking budget for Manus provider (gemini-2.5-flash supports it)
  if (provider.name === 'manus') {
    payload.thinking = { budget_tokens: 128 };
  }

  // JSON mode — handle per-provider differences
  if (response_format) {
    if (provider.name === 'groq') {
      payload.response_format = { type: 'json_object' };
    } else {
      payload.response_format = response_format;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `${provider.name} (${response.status}): ${errorText.substring(0, 200)}`
      );
    }

    const data = await response.json();
    return data as RoutedLLMResult;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Provider Status (internal logging only, NOT exposed to UI) ─────

export function getProviderStatus(): Array<{
  name: string;
  healthy: boolean;
  failures: number;
  model: string;
  supportsVision: boolean;
}> {
  return providerPool.map(p => ({
    name: p.name,
    healthy: p.healthy,
    failures: p.consecutiveFailures,
    model: p.model,
    supportsVision: p.supportsVision,
  }));
}

export function getActiveProviderCount(): number {
  return providerPool.filter(p => p.healthy).length;
}

export function getTotalProviderCount(): number {
  return providerPool.length;
}

// ─── Claude/Anthropic Provider (Messages API) ──────────────────────────────

async function callClaudeProvider(
  provider: LLMProvider,
  messages: any[],
  response_format?: any,
): Promise<RoutedLLMResult> {
  // Convert OpenAI-style messages to Anthropic format
  // Anthropic uses separate 'system' parameter, not in messages array
  let systemPrompt = '';
  const anthropicMessages: any[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt += (typeof msg.content === 'string' ? msg.content : 
        Array.isArray(msg.content) ? msg.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n') : '');
    } else {
      // Convert content arrays for Claude's format
      let content: any;
      if (Array.isArray(msg.content)) {
        content = msg.content.map((part: any) => {
          if (part.type === 'text') return { type: 'text', text: part.text };
          if (part.type === 'image_url') {
            // Claude uses base64 or URL for images
            const url = part.image_url?.url || '';
            if (url.startsWith('data:')) {
              const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
              if (match) {
                return {
                  type: 'image',
                  source: { type: 'base64', media_type: match[1], data: match[2] },
                };
              }
            }
            return { type: 'text', text: `[Image: ${url}]` };
          }
          return part;
        });
      } else {
        content = msg.content;
      }
      anthropicMessages.push({ role: msg.role, content });
    }
  }

  // Add JSON instruction to system prompt if needed
  if (response_format) {
    systemPrompt += '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.';
  }

  const payload: Record<string, unknown> = {
    model: provider.model,
    max_tokens: provider.maxTokens,
    messages: anthropicMessages,
  };
  if (systemPrompt) {
    payload.system = systemPrompt;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `${provider.name} (${response.status}): ${errorText.substring(0, 200)}`
      );
    }

    const data = await response.json();

    // Normalize Anthropic response to RoutedLLMResult format
    const content = data.content?.map((block: any) => block.text).join('') || '';

    return {
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: content,
        },
        finish_reason: data.stop_reason || 'stop',
      }],
      _provider: 'claude',
      _model: provider.model,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Puter.js Provider (SDK-based) ─────────────────────────────────────────

let puterInstance: any = null;

function getPuterInstance(): any {
  if (puterInstance) return puterInstance;
  try {
    // Dynamic import for Puter.js Node.js SDK
    const { init } = require('@heyputer/puter.js/src/init.cjs');
    const token = process.env.PUTER_AUTH_TOKEN;
    if (!token) throw new Error('PUTER_AUTH_TOKEN not set');
    puterInstance = init(token);
    console.log('[Ara Router] Puter.js initialized successfully');
    return puterInstance;
  } catch (err) {
    console.error('[Ara Router] Failed to initialize Puter.js:', err);
    throw err;
  }
}

async function callPuterProvider(
  provider: LLMProvider,
  messages: any[],
  response_format?: any,
): Promise<RoutedLLMResult> {
  const puter = getPuterInstance();

  const options: any = {
    model: provider.model,
    max_tokens: provider.maxTokens,
  };

  // Puter supports response_format for JSON mode
  if (response_format) {
    // For JSON mode, instruct the model via system message instead
    // since Puter SDK may not support response_format directly
    const hasJsonInstruction = messages.some((m: any) => 
      typeof m.content === 'string' && m.content.includes('JSON')
    );
    if (!hasJsonInstruction && messages.length > 0) {
      // Add JSON instruction to system message
      const systemIdx = messages.findIndex((m: any) => m.role === 'system');
      if (systemIdx >= 0) {
        messages[systemIdx] = {
          ...messages[systemIdx],
          content: messages[systemIdx].content + '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
        };
      }
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await puter.ai.chat(messages, false, options);

    // Normalize Puter response to match RoutedLLMResult format
    const content = typeof response === 'string' 
      ? response 
      : response?.message?.content ?? response?.toString() ?? '';

    return {
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: content,
        },
        finish_reason: 'stop',
      }],
      _provider: 'puter',
      _model: provider.model,
    };
  } finally {
    clearTimeout(timeout);
  }
}
