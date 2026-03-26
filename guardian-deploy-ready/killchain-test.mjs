/**
 * Kill Chain Performance Test
 * Fires all 10 defense domain agents against a realistic threat scenario
 */

const BASE = 'http://localhost:3000';

const scenario = {
  fileName: "OPORD-2026-ALPHA: Enemy mobile SAM battery (SA-21 Growler / S-400) detected at grid reference NK 38T LP 45123 78456, moving south along MSR Tampa at 15 km/h. SIGINT confirms active 91N6E acquisition radar emissions and 92N6E engagement radar in standby. Two TELs observed via IMINT with 4x 48N6E3 missiles loaded per TEL. Friendly CAS flight of 2x F-16C operating within 40km at FL250. Civilian village (est. pop 2,400) located 2.1km east of current target position. ROE: Hostile Act / Hostile Intent authorized. Theater commander has delegated engagement authority to division level. Time-sensitive target — window estimated at 45 minutes before target reaches urban area.",
  complexity: 9,
  quantity: 4,
  material: "Contested multi-domain",
  domain: "defense",
};

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GUARDIAN OS — KILL CHAIN PERFORMANCE TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Scenario: ${scenario.fileName.substring(0, 80)}...`);
  console.log(`Threat Environment: ${scenario.material}`);
  console.log(`Priority: ${scenario.complexity}/10`);
  console.log(`Force Elements: ${scenario.quantity}`);
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

    // tRPC with superjson wraps in result.data.json
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
      console.log(`  ${status} ${agent.department.padEnd(42)} ${(agent.duration / 1000).toFixed(2)}s  ${(agent.confidence * 100).toFixed(0)}%  ${bar}`);
    }

    console.log('');
    console.log('─── KILL CHAIN SUMMARY ───');
    console.log(`  Threat Classification: ${result.summary.riskLevel}`);
    console.log(`  LOAC Status:           ${result.summary.complianceStatus}`);
    console.log(`  Decision Confidence:   ${(result.summary.confidence * 100).toFixed(0)}%`);
    console.log('');

    // Print key agent outputs
    console.log('─── KEY AGENT OUTPUTS ───');
    for (const agent of result.agents) {
      console.log(`\n  ▸ ${agent.department} (${agent.agentName}):`);
      const data = agent.data;
      // Print a few key fields from each agent
      const keys = Object.keys(data).filter(k => k !== 'reasoning' && k !== 'confidence');
      for (const key of keys.slice(0, 4)) {
        const val = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
        const valStr = String(val).substring(0, 100);
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
