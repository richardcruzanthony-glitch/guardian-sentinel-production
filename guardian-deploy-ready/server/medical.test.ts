import { describe, it, expect } from "vitest";
import { getAgentsForDomain } from "./agents";

describe("Medical Dispatch Domain Agents", () => {
  it("should return 10 agents for medical domain", () => {
    const agents = getAgentsForDomain("medical");
    expect(agents).toHaveLength(10);
  });

  it("should return 10 agents for medical_dispatch domain alias", () => {
    const agents = getAgentsForDomain("medical_dispatch");
    expect(agents).toHaveLength(10);
  });

  it("should return 10 agents for healthcare domain alias", () => {
    const agents = getAgentsForDomain("healthcare");
    expect(agents).toHaveLength(10);
  });

  it("should return 10 agents for ems domain alias", () => {
    const agents = getAgentsForDomain("ems");
    expect(agents).toHaveLength(10);
  });

  it("should have all required medical departments", () => {
    const agents = getAgentsForDomain("medical");
    const departments = agents.map(a => a.department);
    expect(departments).toContain("Triage");
    expect(departments).toContain("Dispatch & Routing");
    expect(departments).toContain("EMT / Paramedic");
    expect(departments).toContain("ER Preparation");
    expect(departments).toContain("Pharmacy");
    expect(departments).toContain("Laboratory");
    expect(departments).toContain("Imaging / Radiology");
    expect(departments).toContain("Billing & Insurance");
    expect(departments).toContain("Medical Compliance");
    expect(departments).toContain("QI & Reflection");
  });

  it("should have unique agent names for medical domain", () => {
    const agents = getAgentsForDomain("medical");
    const names = agents.map(a => a.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("should have unique department names for medical domain", () => {
    const agents = getAgentsForDomain("medical");
    const depts = agents.map(a => a.department);
    const uniqueDepts = new Set(depts);
    expect(uniqueDepts.size).toBe(depts.length);
  });

  it("each medical agent should have a system prompt and user prompt builder", () => {
    const agents = getAgentsForDomain("medical");
    for (const agent of agents) {
      expect(agent.systemPrompt).toBeTruthy();
      expect(typeof agent.userPromptBuilder).toBe("function");
    }
  });

  it("each medical agent userPromptBuilder should produce a string", () => {
    const agents = getAgentsForDomain("medical");
    const mockInput = {
      fileName: "911 DISPATCH: Chest pain",
      material: "Cardiac - STEMI",
      complexity: 8,
      quantity: 1,
      drawingDescription: "45-year-old male with chest pain",
    };
    for (const agent of agents) {
      const prompt = agent.userPromptBuilder(mockInput);
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(50);
    }
  });

  it("medical agents should be completely different from defense and manufacturing", () => {
    const medAgents = getAgentsForDomain("medical");
    const defAgents = getAgentsForDomain("defense");
    const mfgAgents = getAgentsForDomain("manufacturing");
    const medNames = medAgents.map(a => a.name);
    const defNames = defAgents.map(a => a.name);
    const mfgNames = mfgAgents.map(a => a.name);
    // No overlap with defense
    expect(medNames.filter(n => defNames.includes(n))).toHaveLength(0);
    // No overlap with manufacturing
    expect(medNames.filter(n => mfgNames.includes(n))).toHaveLength(0);
  });

  it("all domains should have correct agent counts", () => {
    expect(getAgentsForDomain("manufacturing")).toHaveLength(12);
    expect(getAgentsForDomain("defense")).toHaveLength(10);
    expect(getAgentsForDomain("medical")).toHaveLength(10);
  });
});
