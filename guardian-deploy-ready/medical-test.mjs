/**
 * Medical Dispatch Performance Test
 * Fires all 10 medical domain agents against a realistic emergency scenario
 */

const BASE = 'http://localhost:3000';

const scenario = {
  fileName: "911 DISPATCH: 45-year-old male, crushing substernal chest pain radiating to left arm and jaw, onset 25 minutes ago while shoveling snow. History: Hypertension (lisinopril 20mg), Type 2 Diabetes (metformin 1000mg BID), hyperlipidemia (atorvastatin 40mg). Current vitals from bystander with AED: HR 115 irregular, diaphoretic, pale, nauseous. Patient states 9/10 pain. Wife reports he took 1 aspirin 325mg 10 minutes ago. Location: 1847 Oak Ridge Drive, single-family home, 2nd floor bedroom, narrow staircase. Nearest hospital: Regional Medical Center (12 min), Level 1 Trauma Center (22 min). Weather: 28°F, icy roads reported on Route 9.",
  complexity: 8,
  quantity: 1,
  material: "Cardiac - STEMI",
  domain: "medical",
};

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GUARDIAN OS — MEDICAL DISPATCH PERFORMANCE TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Scenario: ${scenario.fileName.substring(0, 80)}...`);
  console.log(`Scene Type: ${scenario.material}`);
  console.log(`Severity: ${scenario.complexity}/10`);
  console.log(`Patients: ${scenario.quantity}`);
  console.log('');

  const startTime = Date.now();

  try {
    const res = await fetch(`${BASE}/api/trpc/guardian.processRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: scenario,
      }),
    });

    const data = await res.json();
    const wallClock = Date.now() - startTime;

    const resultData = data?.result?.data?.json || data?.result?.data;
    if (!resultData?.result) {
      console.error('Unexpected response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
      return;
    }

    const result = resultData.result;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Wall Clock Time:       ${(wallClock / 1000).toFixed(2)}s`);
    console.log(`Parallel Processing:   ${(result.processingTime / 1000).toFixed(2)}s`);
    console.log(`Sequential Estimate:   ${(result.sequentialEstimate / 1000).toFixed(2)}s`);
    console.log(`Speed Multiplier:      ${result.speedMultiplier}x`);
    console.log(`Agents Fired:          ${result.agentCount}`);
    console.log(`Domain:                ${result.domain}`);
    console.log('');

    console.log('─── INDIVIDUAL AGENT TIMING ───');
    const sorted = [...result.agents].sort((a, b) => a.duration - b.duration);
    for (const agent of sorted) {
      const bar = '█'.repeat(Math.round(agent.duration / 1000));
      const status = agent.status === 'completed' ? '✓' : '✗';
      console.log(`  ${status} ${agent.department.padEnd(30)} ${(agent.duration / 1000).toFixed(2)}s  ${(agent.confidence * 100).toFixed(0)}%  ${bar}`);
    }

    console.log('');
    console.log('─── EMERGENCY RESPONSE SUMMARY ───');
    console.log(`  ESI Level:       ${result.summary.riskLevel}`);
    console.log(`  EMTALA Status:   ${result.summary.complianceStatus}`);
    console.log(`  Response Time:   ${result.summary.leadTimeDays} min`);
    console.log(`  Est. Charges:    $${result.summary.totalPrice?.toLocaleString() || 'N/A'}`);
    console.log(`  Confidence:      ${(result.summary.confidence * 100).toFixed(0)}%`);
    console.log('');

    // Print key agent outputs
    console.log('─── KEY AGENT OUTPUTS ───');
    for (const agent of result.agents) {
      console.log(`\n  ▸ ${agent.department} (${agent.agentName}):`);
      const agentData = agent.data;
      const keys = Object.keys(agentData).filter(k => k !== 'reasoning' && k !== 'confidence');
      for (const key of keys.slice(0, 4)) {
        const val = typeof agentData[key] === 'object' ? JSON.stringify(agentData[key]) : agentData[key];
        const valStr = String(val).substring(0, 120);
        console.log(`    ${key}: ${valStr}`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
