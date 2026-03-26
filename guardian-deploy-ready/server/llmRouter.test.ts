import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the LLM core module
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          quotedPrice: 500,
          confidence: 0.9,
          reasoning: 'Test response from Manus',
        }),
      },
    }],
  }),
}));

describe('Multi-LLM Routing Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LLM Router Module', () => {
    it('exports invokeRoutedLLM function', async () => {
      const router = await import('./llmRouter');
      expect(typeof router.invokeRoutedLLM).toBe('function');
    });

    it('exports getActiveProviderCount function', async () => {
      const router = await import('./llmRouter');
      expect(typeof router.getActiveProviderCount).toBe('function');
    });

    it('getActiveProviderCount returns at least 1 (manus)', async () => {
      const router = await import('./llmRouter');
      const count = router.getActiveProviderCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('routeTask returns a valid route decision', async () => {
      const router = await import('./llmRouter');
      const decision = router.routeTask({
        taskWeight: 'lightweight',
        needsVision: false,
        agentIndex: 0,
        totalAgents: 10,
      });

      expect(decision).toHaveProperty('provider');
      expect(decision).toHaveProperty('fallbacks');
      expect(decision.provider).toHaveProperty('model');
    });

    it('routes vision tasks to manus provider', async () => {
      const router = await import('./llmRouter');
      const decision = router.routeTask({
        taskWeight: 'heavy',
        needsVision: true,
        agentIndex: 0,
        totalAgents: 10,
      });

      // Vision tasks must go to a provider that supports vision
      expect(decision.provider).toHaveProperty('name');
      expect(decision.provider.supportsVision).toBe(true);
    });

    it('getProviderStatus returns array of provider statuses', async () => {
      const router = await import('./llmRouter');
      const statuses = router.getProviderStatus();

      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
      for (const status of statuses) {
        expect(status).toHaveProperty('name');
        expect(status).toHaveProperty('healthy');
      }
    });
  });

  describe('Agent taskWeight Integration', () => {
    it('all manufacturing agents have taskWeight property', async () => {
      const { getAgentsForDomain } = await import('./agents');
      const agents = getAgentsForDomain('manufacturing');

      for (const agent of agents) {
        expect(agent).toHaveProperty('taskWeight');
        expect(['lightweight', 'standard', 'heavy']).toContain(agent.taskWeight);
      }
    });

    it('all defense agents have taskWeight property', async () => {
      const { getAgentsForDomain } = await import('./agents');
      const agents = getAgentsForDomain('defense');

      for (const agent of agents) {
        expect(agent).toHaveProperty('taskWeight');
        expect(['lightweight', 'standard', 'heavy']).toContain(agent.taskWeight);
      }
    });

    it('all medical agents have taskWeight property', async () => {
      const { getAgentsForDomain } = await import('./agents');
      const agents = getAgentsForDomain('medical');

      for (const agent of agents) {
        expect(agent).toHaveProperty('taskWeight');
        expect(['lightweight', 'standard', 'heavy']).toContain(agent.taskWeight);
      }
    });

    it('engineering agent is marked as heavy (needs vision)', async () => {
      const { getAgentsForDomain } = await import('./agents');
      const agents = getAgentsForDomain('manufacturing');
      const engineering = agents.find(a => a.department === 'Engineering');

      expect(engineering).toBeDefined();
      expect(engineering!.taskWeight).toBe('heavy');
    });

    it('reflection agent is marked as standard (meta-reasoning)', async () => {
      const { getAgentsForDomain } = await import('./agents');
      const agents = getAgentsForDomain('manufacturing');
      const reflection = agents.find(a => a.department === 'Reflection & Adjust');

      expect(reflection).toBeDefined();
      expect(reflection!.taskWeight).toBe('standard');
    });

    it('sales agent is marked as standard', async () => {
      const { getAgentsForDomain } = await import('./agents');
      const agents = getAgentsForDomain('manufacturing');
      const sales = agents.find(a => a.department === 'Sales');

      expect(sales).toBeDefined();
      expect(sales!.taskWeight).toBe('standard');
    });
  });

  describe('Shared Agent Definitions', () => {
    it('exports getAgentDefinitionsForDomain', async () => {
      const shared = await import('../shared/agentDefinitions');
      expect(typeof shared.getAgentDefinitionsForDomain).toBe('function');
    });

    it('returns definitions for manufacturing domain', async () => {
      const shared = await import('../shared/agentDefinitions');
      const defs = shared.getAgentDefinitionsForDomain('manufacturing');

      expect(defs.length).toBeGreaterThan(0);
      for (const def of defs) {
        expect(def).toHaveProperty('name');
        expect(def).toHaveProperty('department');
        expect(def).toHaveProperty('target');
        expect(['frontend', 'backend']).toContain(def.target);
      }
    });

    it('marks vision agents for backend execution', async () => {
      const shared = await import('../shared/agentDefinitions');
      const defs = shared.getAgentDefinitionsForDomain('manufacturing');
      const engineering = defs.find(d => d.department === 'Engineering');

      expect(engineering).toBeDefined();
      expect(engineering!.target).toBe('backend');
    });

    it('marks lightweight agents for frontend execution', async () => {
      const shared = await import('../shared/agentDefinitions');
      const defs = shared.getAgentDefinitionsForDomain('manufacturing');
      const sales = defs.find(d => d.department === 'Sales');

      expect(sales).toBeDefined();
      expect(sales!.target).toBe('frontend');
    });

    it('returns definitions for all three domains', async () => {
      const shared = await import('../shared/agentDefinitions');

      const mfg = shared.getAgentDefinitionsForDomain('manufacturing');
      const def = shared.getAgentDefinitionsForDomain('defense');
      const med = shared.getAgentDefinitionsForDomain('medical');

      expect(mfg.length).toBeGreaterThan(0);
      expect(def.length).toBeGreaterThan(0);
      expect(med.length).toBeGreaterThan(0);
    });
  });
});
