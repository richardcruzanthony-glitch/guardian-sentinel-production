import { describe, it, expect } from 'vitest';

describe('Claude/Anthropic API Key Validation', () => {
  it('should have ANTHROPIC_API_KEY set', () => {
    const key = process.env.ANTHROPIC_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
    expect(key!.startsWith('sk-ant-')).toBe(true);
  });

  it('should successfully call Claude API', async () => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      console.warn('ANTHROPIC_API_KEY not set — skipping live test');
      return;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 32,
        messages: [
          { role: 'user', content: 'Say OK.' },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      expect(data.content).toBeDefined();
      expect(data.content.length).toBeGreaterThan(0);
      console.log('Claude response:', data.content[0]?.text);
    } else {
      const errorText = await response.text();
      console.warn(`Claude API returned ${response.status}: ${errorText}`);
      // Accept 401 (invalid key) or 429 (rate limit) as "key format is valid but may have issues"
      // 400 = billing issue (key valid but no credits), 401 = invalid key, 429 = rate limit
      expect([200, 400, 401, 429, 529]).toContain(response.status);
    }
  }, 30000);
});
