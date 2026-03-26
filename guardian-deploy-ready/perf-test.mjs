/**
 * Guardian OS — Live Performance Test
 * Fires all 10 agents against the real bracket engineering drawing
 */

const API_URL = 'http://localhost:3000/api/trpc';

async function runPerformanceTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GUARDIAN OS — LIVE PERFORMANCE TEST');
  console.log('  10 Parallel Domain Agents vs Engineering Drawing');
  console.log('═══════════════════════════════════════════════════════════\n');

  const imageUrl = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663291553249/nppLlilikyLfvbZM.jpeg';

  const payload = {
    fileName: 'Esercizio66-Aerospace-Bracket.jpeg',
    fileSize: 32331,
    complexity: 7,
    material: 'Aluminum 6061-T6',
    quantity: 5,
    imageUrl: imageUrl,
    domain: 'manufacturing',
  };

  console.log('Input:');
  console.log(`  File: ${payload.fileName}`);
  console.log(`  Material: ${payload.material}`);
  console.log(`  Quantity: ${payload.quantity}`);
  console.log(`  Complexity: ${payload.complexity}/10`);
  console.log(`  Image URL: ${payload.imageUrl.substring(0, 60)}...`);
  console.log('');

  const wallStart = Date.now();

  try {
    const response = await fetch(`${API_URL}/guardian.processRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: payload }),
    });

    const wallEnd = Date.now();
    const wallTime = wallEnd - wallStart;

    if (!response.ok) {
      const text = await response.text();
      console.error(`HTTP ${response.status}: ${text}`);
      return;
    }

    const data = await response.json();
    // Debug: log the response structure
    console.log('Response structure:', JSON.stringify(Object.keys(data)));
    
    // tRPC wraps responses differently
    let result;
    if (data.result?.data?.json?.result) {
      result = data.result.data.json.result;
    } else if (data.result?.data?.result) {
      result = data.result.data.result;
    } else if (data.result?.json?.result) {
      result = data.result.json.result;
    } else if (data.result?.result) {
      result = data.result.result;
    } else {
      console.log('Full response:', JSON.stringify(data).substring(0, 500));
      console.error('Could not find result in response');
      return;
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TIMING RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`  Wall Clock Time:        ${(wallTime / 1000).toFixed(2)}s`);
    console.log(`  Total Duration:         ${(result.totalDuration / 1000).toFixed(2)}s`);
    console.log(`  Parallel Processing:    ${(result.processingTime / 1000).toFixed(2)}s`);
    console.log(`  Sequential Estimate:    ${(result.sequentialEstimate / 1000).toFixed(2)}s`);
    console.log(`  Speed Multiplier:       ${result.speedMultiplier}x faster`);
    console.log(`  Agents Fired:           ${result.agentCount}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  INDIVIDUAL AGENT PERFORMANCE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Sort by duration descending
    const sortedAgents = [...result.agents].sort((a, b) => b.duration - a.duration);

    console.log('  Agent                    Department              Duration    Confidence  Status');
    console.log('  ─────────────────────────────────────────────────────────────────────────────────');

    for (const agent of sortedAgents) {
      const name = agent.agentName.padEnd(24);
      const dept = agent.department.padEnd(22);
      const dur = `${(agent.duration / 1000).toFixed(2)}s`.padStart(8);
      const conf = `${(agent.confidence * 100).toFixed(0)}%`.padStart(6);
      const status = agent.status === 'completed' ? '✓' : '✗';
      console.log(`  ${status} ${name} ${dept} ${dur}    ${conf}      ${agent.status}`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`  Quoted Price:           $${result.summary.totalPrice?.toLocaleString() || 'N/A'}`);
    console.log(`  Lead Time:              ${result.summary.leadTimeDays || 'N/A'} days`);
    console.log(`  Risk Level:             ${result.summary.riskLevel}`);
    console.log(`  Compliance:             ${result.summary.complianceStatus}`);
    console.log(`  Avg Confidence:         ${(result.summary.confidence * 100).toFixed(0)}%`);
    console.log('');

    // Drawing analysis excerpt
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  DRAWING ANALYSIS (first 500 chars)');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`  ${result.drawingAnalysis.substring(0, 500)}...`);
    console.log('');

    // Key data from each agent
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  KEY OUTPUTS BY DEPARTMENT');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const agent of result.agents) {
      const reasoning = agent.data.reasoning || agent.data.raw?.substring(0, 100) || 'N/A';
      console.log(`  [${agent.department}]`);
      console.log(`    ${String(reasoning).substring(0, 150)}`);
      console.log('');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runPerformanceTest();
