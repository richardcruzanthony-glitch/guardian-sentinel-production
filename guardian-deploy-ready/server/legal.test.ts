import { describe, it, expect } from "vitest";
import { getAgentsForDomain } from "./agents";

describe("Self-Help Legal Domain Agents", () => {
  it("should return 9 agents for legal domain", () => {
    const agents = getAgentsForDomain("legal");
    expect(agents.length).toBe(9);
  });

  it("should return 9 agents for self_help_legal alias", () => {
    const agents = getAgentsForDomain("self_help_legal");
    expect(agents.length).toBe(9);
  });

  it("should return 9 agents for legal_aid alias", () => {
    const agents = getAgentsForDomain("legal_aid");
    expect(agents.length).toBe(9);
  });

  it("should have CaseAnalysisAgent", () => {
    const agents = getAgentsForDomain("legal");
    const caseAgent = agents.find(a => a.name === "CaseAnalysisAgent");
    expect(caseAgent).toBeDefined();
    expect(caseAgent!.department).toBe("Case Analysis");
  });

  it("should have PrecedentResearchAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "PrecedentResearchAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Precedent Research");
  });

  it("should have StatuteCodeAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "StatuteCodeAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Statute & Code");
  });

  it("should have DocumentDraftingAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "DocumentDraftingAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Document Drafting");
  });

  it("should have FilingRequirementsAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "FilingRequirementsAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Filing Requirements");
  });

  it("should have LegalComplianceAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "LegalComplianceAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Legal Compliance");
  });

  it("should have StrategyAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "StrategyAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Strategy");
  });

  it("should have DamagesAssessmentAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "DamagesAssessmentAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Damages Assessment");
  });

  it("should have LegalReflectionAgent", () => {
    const agents = getAgentsForDomain("legal");
    const agent = agents.find(a => a.name === "LegalReflectionAgent");
    expect(agent).toBeDefined();
    expect(agent!.department).toBe("Reflection & Cross-Validation");
  });

  it("all agents should have system prompts", () => {
    const agents = getAgentsForDomain("legal");
    agents.forEach(agent => {
      expect(agent.systemPrompt).toBeTruthy();
      expect(agent.systemPrompt.length).toBeGreaterThan(50);
    });
  });

  it("all agents should have user prompt builders", () => {
    const agents = getAgentsForDomain("legal");
    agents.forEach(agent => {
      expect(agent.userPromptBuilder).toBeDefined();
      expect(typeof agent.userPromptBuilder).toBe("function");
    });
  });

  it("agents should generate prompts with state/jurisdiction", () => {
    const agents = getAgentsForDomain("legal");
    const caseAgent = agents.find(a => a.name === "CaseAnalysisAgent");
    const prompt = caseAgent!.userPromptBuilder({
      fileName: "test-case",
      material: "California",
    });
    expect(prompt).toContain("California");
  });
});
