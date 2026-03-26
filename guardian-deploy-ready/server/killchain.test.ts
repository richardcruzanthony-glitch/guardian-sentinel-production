import { describe, it, expect } from "vitest";
import { getAgentsForDomain } from "./agents";

describe("Kill Chain Domain Agents", () => {
  it("should return 10 agents for defense domain", () => {
    const agents = getAgentsForDomain("defense");
    expect(agents).toHaveLength(10);
  });

  it("should return 10 agents for killchain domain alias", () => {
    const agents = getAgentsForDomain("killchain");
    expect(agents).toHaveLength(10);
  });

  it("should return 10 agents for military domain alias", () => {
    const agents = getAgentsForDomain("military");
    expect(agents).toHaveLength(10);
  });

  it("should have all required kill chain departments", () => {
    const agents = getAgentsForDomain("defense");
    const departments = agents.map(a => a.department);
    expect(departments).toContain("Intelligence, Surveillance & Reconnaissance");
    expect(departments).toContain("Targeting");
    expect(departments).toContain("Weapons & Munitions");
    expect(departments).toContain("Electronic Warfare");
    expect(departments).toContain("Cyber Operations");
    expect(departments).toContain("Command & Control");
    expect(departments).toContain("Legal / JAG");
    expect(departments).toContain("Battle Damage Assessment");
    expect(departments).toContain("Logistics & Sustainment");
    expect(departments).toContain("Reflection & Lessons Learned");
  });

  it("should have unique agent names for defense domain", () => {
    const agents = getAgentsForDomain("defense");
    const names = agents.map(a => a.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("should have unique department names for defense domain", () => {
    const agents = getAgentsForDomain("defense");
    const depts = agents.map(a => a.department);
    const uniqueDepts = new Set(depts);
    expect(uniqueDepts.size).toBe(depts.length);
  });

  it("each defense agent should have a system prompt and user prompt builder", () => {
    const agents = getAgentsForDomain("defense");
    for (const agent of agents) {
      expect(agent.systemPrompt).toBeTruthy();
      expect(typeof agent.userPromptBuilder).toBe("function");
    }
  });

  it("each defense agent userPromptBuilder should produce a string", () => {
    const agents = getAgentsForDomain("defense");
    const mockInput = {
      fileName: "Test Scenario",
      material: "Contested multi-domain",
      complexity: 8,
      quantity: 2,
      drawingDescription: "Enemy SAM battery detected",
    };
    for (const agent of agents) {
      const prompt = agent.userPromptBuilder(mockInput);
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(50);
    }
  });

  it("manufacturing domain should still return 12 agents", () => {
    const agents = getAgentsForDomain("manufacturing");
    expect(agents).toHaveLength(12);
  });

  it("defense and manufacturing domains should have different agents", () => {
    const defenseAgents = getAgentsForDomain("defense");
    const mfgAgents = getAgentsForDomain("manufacturing");
    const defenseNames = defenseAgents.map(a => a.name);
    const mfgNames = mfgAgents.map(a => a.name);
    // They should not overlap
    const overlap = defenseNames.filter(n => mfgNames.includes(n));
    expect(overlap).toHaveLength(0);
  });
});
