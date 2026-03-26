/**
 * Puter.js Frontend LLM Service — Ara's distributed nervous system
 * 
 * Handles lightweight agent calls directly from the browser using Puter.js.
 * No API keys needed. The user's browser makes the calls.
 * 
 * KEY DESIGN:
 *   - Pre-initializes on page load so auth happens BEFORE user clicks Process
 *   - Uses a background warm-up call that triggers Puter's auth flow early
 *   - If auth popup is blocked, silently marks Puter as unavailable
 *   - All calls wrapped with timeouts so the UI never hangs
 *   - If Puter fails, the hybrid orchestrator falls back to backend
 */

// Puter.js is loaded via CDN in index.html — access via window.puter
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string | Array<{ role: string; content: string }>,
          options?: { model?: string; stream?: boolean; max_tokens?: number; temperature?: number }
        ) => Promise<any>;
      };
      authToken?: string;
      auth?: {
        isSignedIn: () => boolean;
        signIn: () => Promise<any>;
      };
    };
    __puterAuthReady?: boolean;
    __puterAuthPromise?: Promise<boolean>;
  }
}

export interface PuterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PuterLLMResult {
  content: string;
  provider: string;
  model: string;
}

/** Track whether Puter.js has been verified to work (not just loaded) */
let puterVerified: boolean | null = null;
let initAttempted = false;
let authInProgress = false;

/** Check if Puter.js is available and can actually make calls */
export function isPuterAvailable(): boolean {
  // If we've already verified, use cached result
  if (puterVerified !== null) return puterVerified;
  // Basic check — is the SDK loaded?
  return !!(window.puter?.ai?.chat);
}

/** Mark Puter as verified working or not */
export function setPuterVerified(works: boolean): void {
  puterVerified = works;
  window.__puterAuthReady = works;
  console.log(`[Ara] Puter.js verified: ${works ? '✓ operational — free unlimited AI active' : '✗ unavailable — routing all through backend'}`);
}

/** Wrap a promise with a timeout to prevent hanging */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Puter call timed out after ${ms}ms`)), ms);
    promise
      .then(val => { clearTimeout(timer); resolve(val); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

/**
 * Check if Puter.js is already authenticated (return visit with cached token).
 * Does NOT trigger the auth popup — just checks silently.
 * 
 * If the user has visited puter.com before and completed the Turnstile check,
 * the auth token is cached in localStorage and Puter works instantly.
 * If not, we skip Puter and route everything through the backend.
 * 
 * This avoids the page-hijacking issue where Puter's auth popup
 * takes over the entire browser window.
 */
export async function preInitializePuter(): Promise<boolean> {
  if (initAttempted) {
    if (window.__puterAuthPromise) {
      return window.__puterAuthPromise;
    }
    return puterVerified === true;
  }
  initAttempted = true;

  if (!window.puter?.ai?.chat) {
    // SDK not loaded yet — wait a moment and retry
    await new Promise(r => setTimeout(r, 2000));
    if (!window.puter?.ai?.chat) {
      console.log('[Ara] Puter.js SDK not loaded — frontend AI unavailable');
      setPuterVerified(false);
      return false;
    }
  }

  // Check if already authenticated (return visit with cached token)
  if (window.puter?.authToken) {
    console.log('[Ara] Puter.js already authenticated — free unlimited AI is active');
    setPuterVerified(true);
    return true;
  }

  // NOT authenticated — do NOT trigger the auth popup (it hijacks the page).
  // Instead, mark Puter as unavailable and route through backend.
  console.log('[Ara] Puter.js not authenticated — routing all agents through backend');
  console.log('[Ara] To enable Puter: visit puter.com first, then return here');
  setPuterVerified(false);
  return false;
}

/**
 * Wait for Puter auth to complete (if in progress).
 * Returns true if Puter is ready, false if not.
 */
export async function waitForPuterAuth(timeoutMs = 5000): Promise<boolean> {
  if (puterVerified !== null) return puterVerified;
  if (window.__puterAuthPromise) {
    try {
      return await withTimeout(window.__puterAuthPromise, timeoutMs);
    } catch {
      return false;
    }
  }
  return false;
}

/** Available models through Puter — fast and free */
const PUTER_MODELS = [
  'gpt-4o-mini',
  'claude-sonnet-4-5',
  'gemini-2.0-flash',
  'gpt-5-nano',
] as const;

/** Round-robin index for distributing across models */
let modelIndex = 0;

/** Get the next model in rotation */
function getNextModel(): string {
  const model = PUTER_MODELS[modelIndex % PUTER_MODELS.length];
  modelIndex++;
  return model;
}

/**
 * Call Puter.js LLM from the frontend.
 * Distributes across multiple models using round-robin.
 * Silently retries with different models on failure.
 * All calls are wrapped with a 30s timeout to prevent hanging.
 */
export async function callPuterLLM(
  messages: PuterChatMessage[],
  options?: { preferredModel?: string }
): Promise<PuterLLMResult> {
  // If auth is still in progress, wait for it first
  if (authInProgress && window.__puterAuthPromise) {
    await withTimeout(window.__puterAuthPromise, 10000).catch(() => {});
  }

  if (!isPuterAvailable()) {
    throw new Error('Puter.js not available');
  }

  const modelsToTry = options?.preferredModel
    ? [options.preferredModel, ...PUTER_MODELS.filter(m => m !== options.preferredModel)]
    : [getNextModel(), ...PUTER_MODELS.filter((_, i) => i !== ((modelIndex - 1) % PUTER_MODELS.length))];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await withTimeout(
        window.puter!.ai.chat(
          messages as any,
          { model, max_tokens: 4096 }
        ),
        30000 // 30 second timeout per model attempt
      );

      // Mark as verified on first success
      if (puterVerified !== true) {
        setPuterVerified(true);
      }

      // Puter response format varies by model
      let content: string;
      if (typeof response === 'string') {
        content = response;
      } else if (response?.message?.content) {
        // Claude-style response
        if (Array.isArray(response.message.content)) {
          content = response.message.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');
        } else {
          content = String(response.message.content);
        }
      } else if (response?.toString) {
        content = response.toString();
      } else {
        content = JSON.stringify(response);
      }

      return {
        content,
        provider: 'puter',
        model,
      };
    } catch (error) {
      lastError = error as Error;
      const errMsg = String(error);
      // If it's a timeout or popup block, mark Puter as unavailable immediately
      if (errMsg.includes('timed out') || errMsg.includes('blocked') || errMsg.includes('popup')) {
        setPuterVerified(false);
        throw new Error('Puter.js unavailable (popup blocked or timeout)');
      }
      console.warn(`[Ara Frontend] Puter model "${model}" failed, trying next...`);
      continue;
    }
  }

  throw lastError || new Error('All Puter models failed');
}

/**
 * Process a lightweight agent task on the frontend via Puter.
 * Returns the raw text response.
 * 
 * This is called for agents that don't need vision or heavy reasoning.
 */
export async function processAgentOnFrontend(
  systemPrompt: string,
  userPrompt: string,
): Promise<PuterLLMResult> {
  const messages: PuterChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return callPuterLLM(messages);
}
