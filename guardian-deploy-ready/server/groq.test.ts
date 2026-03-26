import { describe, it, expect } from 'vitest';

describe('Groq API Key Validation', () => {
  it('should have GROQ_API_KEY set in environment', () => {
    const key = process.env.GROQ_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
    expect(key!.startsWith('gsk_')).toBe(true);
  });

  it('should successfully call Groq API with the provided key', async () => {
    const key = process.env.GROQ_API_KEY;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.choices).toBeDefined();
    expect(data.choices.length).toBeGreaterThan(0);
    expect(data.choices[0].message.content).toBeTruthy();
    console.log('Groq response:', data.choices[0].message.content);
  });
});
