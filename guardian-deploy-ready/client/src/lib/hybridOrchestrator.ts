/**
 * Guardian OS — Hybrid Orchestrator (Ara's Nervous System)
 * 
 * Splits agent execution between:
 * - Frontend (Puter.js): Lightweight agents, each fires independently from the browser
 * - Backend (Manus API): Heavy/vision agents, called via tRPC
 * 
 * Every agent is an independent parallel request. No shared pipe. No single chokepoint.
 * If a frontend agent fails, it silently retries then falls back to backend.
 * If ALL providers fail, the system still returns results (with failed status) instead of hanging.
 */

import {
  type SharedAgentDefinition,
  getAgentDefinitionsForDomain,
  buildUserPrompt,
} from '@shared/agentDefinitions';
import { isPuterAvailable, processAgentOnFrontend, setPuterVerified, waitForPuterAuth } from './puterLLM';

// ─── Types ───────────────────────────────────────────────────────

export interface AgentResult {
  agentName: string;
  department: string;
  status: 'completed' | 'failed' | 'pending' | 'running';
  duration: number;
  data: Record<string, unknown>;
  confidence: number;
  provider: string; // 'puter' | 'manus' | 'fallback'
}

export interface HybridProcessingResult {
  fileName: string;
  imageUrl?: string;
  totalDuration: number;
  processingTime: number;
  sequentialEstimate: number;
  speedMultiplier: number;
  agentCount: number;
  domain: string;
  agents: AgentResult[];
  drawingAnalysis: string;
  summary: {
    totalPrice: number;
    leadTimeDays: number;
    riskLevel: string;
    complianceStatus: string;
    confidence: number;
  };
}

export interface ProcessingInput {
  fileName: string;
  fileSize?: number;
  complexity?: number;
  material?: string;
  quantity?: number;
  imageUrl?: string;
  domain: string;
  scenarioText?: string;
}

/** Callback for real-time agent status updates */
export type AgentStatusCallback = (agentName: string, status: AgentResult['status'], result?: AgentResult) => void;

// ─── JSON Parser ─────────────────────────────────────────────────

function parseLLMResponse(content: string): Record<string, unknown> {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

// ─── Frontend Agent Execution (Puter.js) ─────────────────────────

async function runFrontendAgent(
  definition: SharedAgentDefinition,
  promptInput: {
    fileName: string;
    material?: string;
    quantity?: number;
    complexity?: number;
    drawingDescription?: string;
    scenarioText?: string;
  },
  onStatus?: AgentStatusCallback,
): Promise<AgentResult> {
  const startTime = Date.now();
  onStatus?.(definition.name, 'running');

  try {
    const userPrompt = buildUserPrompt(definition.userPromptTemplate, promptInput);

    // Each agent fires its own independent Puter.js request
    const result = await processAgentOnFrontend(definition.systemPrompt, userPrompt);
    const parsed = parseLLMResponse(result.content);

    const agentResult: AgentResult = {
      agentName: definition.name,
      department: definition.department,
      status: 'completed',
      duration: Date.now() - startTime,
      data: parsed,
      confidence: Number(parsed.confidence) || 0.80,
      provider: `puter:${result.model}`,
    };

    onStatus?.(definition.name, 'completed', agentResult);
    return agentResult;
  } catch (error) {
    console.warn(`[Ara] Frontend agent ${definition.name} failed:`, error);

    // Return failed result — the orchestrator can decide to retry on backend
    const failedResult: AgentResult = {
      agentName: definition.name,
      department: definition.department,
      status: 'failed',
      duration: Date.now() - startTime,
      data: { status: 'Agent temporarily unavailable — provider rerouting in progress' },
      confidence: 0,
      provider: 'puter:failed',
    };

    onStatus?.(definition.name, 'failed', failedResult);
    return failedResult;
  }
}

// ─── Backend Agent Execution (via tRPC) ──────────────────────────

interface BackendProcessFn {
  (input: {
    fileName: string;
    fileSize?: number;
    complexity?: number;
    material?: string;
    quantity?: number;
    imageUrl?: string;
    domain: string;
    agentNames?: string[];
  }): Promise<{
    success: boolean;
    result: {
      agents: Array<{
        agentName: string;
        department: string;
        status: 'completed' | 'failed';
        duration: number;
        data: Record<string, unknown>;
        confidence: number;
      }>;
      drawingAnalysis: string;
      processingTime: number;
      sequentialEstimate: number;
      speedMultiplier: number;
      summary: any;
    };
  }>;
}

// ─── Hybrid Orchestrator ─────────────────────────────────────────

export async function runHybridProcessing(
  input: ProcessingInput,
  backendProcessFn: BackendProcessFn,
  onStatus?: AgentStatusCallback,
): Promise<HybridProcessingResult> {
  const startTime = Date.now();

  // Wait for Puter auth if it's still in progress (triggered on page load)
  // This gives Puter up to 5 seconds to complete its background auth
  await waitForPuterAuth(5000);
  const puterAvailable = isPuterAvailable();

  const allAgents = getAgentDefinitionsForDomain(input.domain);

  // Split agents by execution target
  const frontendAgents = allAgents.filter(a => a.target === 'frontend');
  const backendAgents = allAgents.filter(a => a.target === 'backend');

  // Initialize all agents as pending
  for (const agent of allAgents) {
    onStatus?.(agent.name, 'pending');
  }

  // ─── STRATEGY: Always try backend first. If Puter is available, run frontend agents in parallel.
  // If both fail, return partial results instead of hanging.

  if (!puterAvailable) {
    // All through backend
    console.log('[Ara] Puter.js not available — routing all agents through backend');
    try {
      const backendResult = await backendProcessFn({
        fileName: input.fileName,
        fileSize: input.fileSize,
        complexity: input.complexity,
        material: input.material,
        quantity: input.quantity,
        imageUrl: input.imageUrl,
        domain: input.domain,
      });

      const result = backendResult.result;
      for (const agent of result.agents) {
        onStatus?.(agent.agentName, agent.status as any, {
          ...agent,
          provider: 'manus',
        } as AgentResult);
      }

      return {
        fileName: input.fileName,
        imageUrl: input.imageUrl,
        totalDuration: Date.now() - startTime,
        processingTime: result.processingTime,
        sequentialEstimate: result.sequentialEstimate,
        speedMultiplier: result.speedMultiplier,
        agentCount: result.agents.length,
        domain: input.domain,
        agents: result.agents.map(a => ({ ...a, provider: 'manus' })),
        drawingAnalysis: result.drawingAnalysis,
        summary: result.summary,
      };
    } catch (backendError) {
      console.error('[Ara] Backend also failed:', backendError);
      // Return a graceful failure result instead of crashing
      return buildGracefulFailureResult(input, allAgents, startTime, onStatus);
    }
  }

  // ─── TRUE HYBRID: Frontend + Backend in parallel ─────────────

  console.log(`[Ara] Hybrid routing: ${frontendAgents.length} frontend (Puter.js) + ${backendAgents.length} backend (Manus)`);

  const promptInput = {
    fileName: input.fileName,
    material: input.material,
    quantity: input.quantity,
    complexity: input.complexity,
    drawingDescription: '', // Will be filled by backend drawing analysis
    scenarioText: input.domain !== 'manufacturing' ? input.fileName : undefined,
  };

  // Fire ALL agents simultaneously — true parallel, independent requests
  const parallelStart = Date.now();

  // Backend agents (includes drawing analysis, vision, reflection)
  const backendPromise = backendProcessFn({
    fileName: input.fileName,
    fileSize: input.fileSize,
    complexity: input.complexity,
    material: input.material,
    quantity: input.quantity,
    imageUrl: input.imageUrl,
    domain: input.domain,
    agentNames: backendAgents.map(a => a.name),
  });

  // Mark backend agents as running
  for (const agent of backendAgents) {
    onStatus?.(agent.name, 'running');
  }

  // Frontend agents — each fires independently, no shared pipe
  const frontendPromises = frontendAgents.map(agent =>
    runFrontendAgent(agent, promptInput, onStatus)
  );

  // Wait for all to complete — true parallel execution
  const [backendResult, ...frontendResults] = await Promise.all([
    backendPromise.catch(err => {
      console.error('[Ara] Backend processing failed:', err);
      return null;
    }),
    ...frontendPromises,
  ]);

  const parallelDuration = Date.now() - parallelStart;

  // ─── Merge Results ───────────────────────────────────────────

  let allResults: AgentResult[] = [];
  let drawingAnalysis = '';

  // Add backend results
  if (backendResult?.result) {
    drawingAnalysis = backendResult.result.drawingAnalysis;
    for (const agent of backendResult.result.agents) {
      const agentResult: AgentResult = {
        ...agent,
        provider: 'manus',
      };
      allResults.push(agentResult);
      onStatus?.(agent.agentName, agent.status as any, agentResult);
    }
  } else {
    // Backend failed — create placeholder results for backend agents
    for (const agent of backendAgents) {
      const failedResult: AgentResult = {
        agentName: agent.name,
        department: agent.department,
        status: 'failed',
        duration: parallelDuration,
        data: { status: 'Backend provider temporarily unavailable — rerouting' },
        confidence: 0,
        provider: 'manus:failed',
      };
      allResults.push(failedResult);
      onStatus?.(agent.name, 'failed', failedResult);
    }
  }

  // Add frontend results
  for (const result of frontendResults) {
    allResults.push(result);
  }

  // ─── Check if Puter failed for ALL agents (popup blocked) ────
  const allFrontendFailed = frontendResults.length > 0 && frontendResults.every(r => r.status === 'failed');
  if (allFrontendFailed) {
    console.warn('[Ara] All frontend agents failed — marking Puter as unavailable');
    setPuterVerified(false);
  }

  // ─── Fallback: Retry failed frontend agents on backend ───────
  const failedFrontend = frontendResults.filter(r => r.status === 'failed');
  if (failedFrontend.length > 0) {
    console.log(`[Ara] ${failedFrontend.length} frontend agents failed — attempting backend retry`);
    // Try to retry failed agents through backend if backend is working
    if (backendResult?.result) {
      try {
        const retryResult = await backendProcessFn({
          fileName: input.fileName,
          fileSize: input.fileSize,
          complexity: input.complexity,
          material: input.material,
          quantity: input.quantity,
          imageUrl: input.imageUrl,
          domain: input.domain,
          agentNames: failedFrontend.map(a => a.agentName),
        });
        
        if (retryResult?.result?.agents) {
          for (const retryAgent of retryResult.result.agents) {
            // Replace the failed result with the retry result
            const idx = allResults.findIndex(r => r.agentName === retryAgent.agentName);
            if (idx >= 0) {
              allResults[idx] = { ...retryAgent, provider: 'manus:retry' };
              onStatus?.(retryAgent.agentName, retryAgent.status as any, allResults[idx]);
            }
          }
        }
      } catch {
        console.warn('[Ara] Backend retry also failed — keeping original results');
      }
    }
  }

  // ─── Calculate Summary ───────────────────────────────────────

  const completedAgents = allResults.filter(a => a.status === 'completed');
  const sequentialEstimate = allResults.reduce((sum, a) => sum + a.duration, 0);
  const speedMultiplier = sequentialEstimate > 0 ? sequentialEstimate / parallelDuration : allResults.length;

  // Use backend summary if available, otherwise calculate from agent results
  const summary = backendResult?.result?.summary || calculateSummary(allResults, input.domain);

  return {
    fileName: input.fileName,
    imageUrl: input.imageUrl,
    totalDuration: Date.now() - startTime,
    processingTime: parallelDuration,
    sequentialEstimate,
    speedMultiplier: Math.round(speedMultiplier * 10) / 10,
    agentCount: allResults.length,
    domain: input.domain,
    agents: allResults,
    drawingAnalysis,
    summary,
  };
}

// ─── Graceful Failure Result ──────────────────────────────────────

function buildGracefulFailureResult(
  input: ProcessingInput,
  allAgents: SharedAgentDefinition[],
  startTime: number,
  onStatus?: AgentStatusCallback,
): HybridProcessingResult {
  const agents: AgentResult[] = allAgents.map(agent => {
    const result: AgentResult = {
      agentName: agent.name,
      department: agent.department,
      status: 'failed',
      duration: Date.now() - startTime,
      data: { status: 'All LLM providers temporarily unavailable. Please add a working API key (Groq, Gemini with billing, or OpenRouter) or try again later.' },
      confidence: 0,
      provider: 'none',
    };
    onStatus?.(agent.name, 'failed', result);
    return result;
  });

  return {
    fileName: input.fileName,
    imageUrl: input.imageUrl,
    totalDuration: Date.now() - startTime,
    processingTime: Date.now() - startTime,
    sequentialEstimate: 0,
    speedMultiplier: 0,
    agentCount: agents.length,
    domain: input.domain,
    agents,
    drawingAnalysis: '',
    summary: {
      totalPrice: 0,
      leadTimeDays: 0,
      riskLevel: 'Provider Unavailable',
      complianceStatus: 'Requires Active LLM Provider',
      confidence: 0,
    },
  };
}

// ─── Summary Calculator (fallback when backend summary unavailable) ──

function calculateSummary(agents: AgentResult[], domain: string) {
  const completedAgents = agents.filter(a => a.status === 'completed');
  const avgConfidence = completedAgents.length > 0
    ? completedAgents.reduce((sum, a) => sum + a.confidence, 0) / completedAgents.length
    : 0;

  if (domain === 'defense' || domain === 'killchain' || domain === 'kill_chain' || domain === 'military') {
    const c2Data = agents.find(a => a.agentName === 'C2Agent')?.data || {};
    const legalData = agents.find(a => a.agentName === 'LegalAgent')?.data || {};
    const isrData = agents.find(a => a.agentName === 'ISRAgent')?.data || {};
    return {
      totalPrice: 0,
      leadTimeDays: 0,
      riskLevel: String(isrData.threatClassification || 'high'),
      complianceStatus: legalData.rolesCompliant ? 'ROE Compliant' : 'Review Required',
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  if (domain === 'medical' || domain === 'medical_dispatch' || domain === 'healthcare' || domain === 'ems') {
    const triageData = agents.find(a => a.agentName === 'TriageAgent')?.data || {};
    const dispatchData = agents.find(a => a.agentName === 'DispatchAgent')?.data || {};
    const complianceData = agents.find(a => a.agentName === 'MedComplianceAgent')?.data || {};
    const billingData = agents.find(a => a.agentName === 'BillingAgent')?.data || {};
    return {
      totalPrice: Number(billingData.estimatedCharges) || 0,
      leadTimeDays: Number(dispatchData.estimatedResponseMinutes) || 0,
      riskLevel: `ESI-${triageData.esiLevel || '?'}`,
      complianceStatus: complianceData.emtalaCompliant ? 'EMTALA Compliant' : 'Review Required',
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  // Legal domain
  if (domain === 'legal' || domain === 'self_help_legal' || domain === 'legal_aid') {
    const caseData = agents.find(a => a.agentName === 'CaseAnalysisAgent' && a.status === 'completed')?.data || {};
    const damagesData = agents.find(a => a.agentName === 'DamagesAssessmentAgent' && a.status === 'completed')?.data || {};
    const strategyData = agents.find(a => a.agentName === 'StrategyAgent' && a.status === 'completed')?.data || {};
    const filingData = agents.find(a => a.agentName === 'FilingRequirementsAgent' && a.status === 'completed')?.data || {};
    const complianceData = agents.find(a => a.agentName === 'LegalComplianceAgent' && a.status === 'completed')?.data || {};
    const reflectionData = agents.find(a => a.agentName === 'LegalReflectionAgent' && a.status === 'completed')?.data || {};
    return {
      totalPrice: Number(damagesData.totalEstimatedRecovery) || Number((damagesData.compensatoryDamages as any)?.amount) || 0,
      leadTimeDays: 0,
      riskLevel: String(reflectionData.overallCaseStrength || caseData.strengthAssessment || strategyData.recommendedApproach || 'pending'),
      complianceStatus: complianceData.courtRulesCompliance === 'compliant' ? 'Court Ready' : (filingData.filingCourt ? 'Filing Ready' : 'Review Required'),
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  // Manufacturing default
  const salesData = agents.find(a => a.agentName === 'SalesAgent' && a.status === 'completed')?.data || {};
  const costData = agents.find(a => a.agentName === 'CostAgent' && a.status === 'completed')?.data || {};
  const planningData = agents.find(a => a.agentName === 'PlanningAgent' && a.status === 'completed')?.data || {};
  const mfgData = agents.find(a => a.agentName === 'ManufacturingAgent' && a.status === 'completed')?.data || {};
  const complianceData = agents.find(a => a.agentName === 'ComplianceAgent' && a.status === 'completed')?.data || {};

  const price = Number(salesData.quotedPrice) || Number(costData.totalCost) || 0;
  const leadTime = Number(planningData.totalLeadTimeDays) || Number(mfgData.estimatedDays) || 0;
  const risk = String(complianceData.riskLevel || 'medium');
  const isCompliant = complianceData.as9100Compliant;

  return {
    totalPrice: price,
    leadTimeDays: leadTime,
    riskLevel: risk,
    complianceStatus: isCompliant ? 'Compliant' : 'Review Required',
    confidence: Math.round(avgConfidence * 100) / 100,
  };
}
