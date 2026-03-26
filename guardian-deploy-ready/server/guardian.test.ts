import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAgentsForDomain } from './agents';

// Mock the LLM module — vi.mock is hoisted so all data must be inline
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          quotedPrice: 450,
          marginPercent: 25,
          confidence: 0.85,
          reasoning: 'Test analysis',
          totalLeadTimeDays: 12,
          riskLevel: 'medium',
          as9100Compliant: true,
        }),
      },
    }],
  }),
}));

// Mock the LLM router to prevent retry loops in tests
vi.mock('./llmRouter', () => ({
  invokeRoutedLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          quotedPrice: 450,
          marginPercent: 25,
          confidence: 0.85,
          reasoning: 'Test analysis',
          totalLeadTimeDays: 12,
          riskLevel: 'medium',
          as9100Compliant: true,
        }),
      },
    }],
    provider: 'manus',
    attempts: 1,
  }),
  routeTask: vi.fn().mockReturnValue({
    provider: { name: 'manus', model: 'test', healthy: true, consecutiveFailures: 0, circuitBrokenAt: 0, recoveryWindow: 30000, supportsJsonMode: true, supportsVision: true },
    fallbacks: [],
  }),
  getActiveProviderCount: vi.fn().mockReturnValue(1),
  refreshProviders: vi.fn(),
}));

describe('Guardian OS Agent Framework', () => {
  describe('getAgentsForDomain', () => {
    it('returns 12 agents for manufacturing domain', () => {
      const agents = getAgentsForDomain('manufacturing');
      expect(agents).toHaveLength(12);
    });

    it('returns 12 agents for aerospace domain', () => {
      const agents = getAgentsForDomain('aerospace');
      expect(agents).toHaveLength(12);
    });

    it('returns manufacturing agents as default for unknown domains', () => {
      const agents = getAgentsForDomain('unknown');
      expect(agents).toHaveLength(12);
    });

    it('includes all required departments for manufacturing', () => {
      const agents = getAgentsForDomain('manufacturing');
      const departments = agents.map(a => a.department);
      
      expect(departments).toContain('Sales');
      expect(departments).toContain('Engineering');
      expect(departments).toContain('Quality');
      expect(departments).toContain('Planning');
      expect(departments).toContain('Procurement');
      expect(departments).toContain('Manufacturing');
      expect(departments).toContain('Shipping');
      expect(departments).toContain('Compliance');
      expect(departments).toContain('Audit');
      expect(departments).toContain('CNC Programming');
      expect(departments).toContain('Outside Processes');
      expect(departments).toContain('Reflection & Adjust');
    });

    it('each agent has required properties', () => {
      const agents = getAgentsForDomain('manufacturing');
      
      for (const agent of agents) {
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('department');
        expect(agent).toHaveProperty('systemPrompt');
        expect(agent).toHaveProperty('userPromptBuilder');
        expect(typeof agent.name).toBe('string');
        expect(typeof agent.department).toBe('string');
        expect(typeof agent.systemPrompt).toBe('string');
        expect(typeof agent.userPromptBuilder).toBe('function');
      }
    });

    it('agent names follow naming convention', () => {
      const agents = getAgentsForDomain('manufacturing');
      
      for (const agent of agents) {
        expect(agent.name).toMatch(/Agent$/);
      }
    });

    it('each agent userPromptBuilder produces valid output', () => {
      const agents = getAgentsForDomain('manufacturing');
      const testInput = {
        fileName: 'test-bracket.jpeg',
        material: 'Aluminum 6061-T6',
        quantity: 5,
        complexity: 7,
        drawingDescription: 'A bracket with holes',
      };

      for (const agent of agents) {
        const prompt = agent.userPromptBuilder(testInput);
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain('test-bracket.jpeg');
      }
    });
  });

  describe('runAllAgents', () => {
    it('processes all agents in parallel and returns correct structure', async () => {
      const { runAllAgents } = await import('./agents');
      
      const result = await runAllAgents({
        fileName: 'test-part.jpeg',
        material: 'Aluminum 6061-T6',
        quantity: 1,
        complexity: 5,
      }, 'manufacturing');

      // Check result structure
      expect(result).toHaveProperty('fileName', 'test-part.jpeg');
      expect(result).toHaveProperty('totalDuration');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('sequentialEstimate');
      expect(result).toHaveProperty('speedMultiplier');
      expect(result).toHaveProperty('agentCount', 12);
      expect(result).toHaveProperty('domain', 'manufacturing');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('drawingAnalysis');
      expect(result).toHaveProperty('summary');

      // Check all 12 agents ran
      expect(result.agents).toHaveLength(12);

      // Check each agent has required output fields
      for (const agent of result.agents) {
        expect(agent).toHaveProperty('agentName');
        expect(agent).toHaveProperty('department');
        expect(agent).toHaveProperty('status');
        expect(agent).toHaveProperty('duration');
        expect(agent).toHaveProperty('data');
        expect(agent).toHaveProperty('confidence');
        expect(agent.status).toBe('completed');
      }

      // Check timing makes sense (parallel should be faster than sequential)
      expect(result.processingTime).toBeLessThanOrEqual(result.sequentialEstimate + 100); // small tolerance
      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('summary contains expected fields', async () => {
      const { runAllAgents } = await import('./agents');
      
      const result = await runAllAgents({
        fileName: 'test.jpeg',
        quantity: 1,
      });

      expect(result.summary).toHaveProperty('totalPrice');
      expect(result.summary).toHaveProperty('leadTimeDays');
      expect(result.summary).toHaveProperty('riskLevel');
      expect(result.summary).toHaveProperty('complianceStatus');
      expect(result.summary).toHaveProperty('confidence');
    });
  });
});
