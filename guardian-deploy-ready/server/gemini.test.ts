import { describe, it, expect } from 'vitest';

describe('Gemini API Key Validation', () => {
  it('should have GEMINI_API_KEY set in environment', () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
    expect(key!.startsWith('AIza')).toBe(true);
  });

  it('should be able to reach Gemini API with a lightweight request', async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('GEMINI_API_KEY not set — skipping live test');
      return;
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
          max_tokens: 10,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error ${response.status}: ${errorText}`);
      // Key may be quota-exhausted on free tier — accept 429 or quota errors as valid key
      const isQuotaError = errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED') || response.status === 429;
      expect(isQuotaError).toBe(true);
      return;
    }
    const data = await response.json();
    expect(data.choices).toBeDefined();
    expect(data.choices.length).toBeGreaterThan(0);
    expect(data.choices[0].message.content.toLowerCase()).toContain('hello');
  }, 30000);
});
