// =============================================================================
// ARA PHASE 2 HARDENING — LLM Prompt Doctrine Injection
// =============================================================================
// FILE:    cognitiveLoop.ts
// TARGET:  The LLM prompt construction section — inject the Pattern Recognition
//          Doctrine into the system prompt when domain is 'check' or 'analytical'.
//
// PURPOSE: When Groq (or any LLM) is available, ARA sends a prompt built from
//          context merge (memory + research + creativity + axioms). This patch
//          injects a structured 10-step doctrine directly into that prompt so
//          the LLM follows a precise elimination protocol instead of free-forming.
//
// INSTALL: The phase2_apply.py script handles insertion automatically.
//          Manual install: find the LLM prompt construction in cognitiveLoop.ts
//          (where systemPrompt or the messages array is built) and insert the
//          doctrine block below, guarded by the domain check.
//
// TOKEN BUDGET: ~1,200 tokens — fits within Groq's context window.
// =============================================================================


// ---------------------------------------------------------------------------
// DOCTRINE PROMPT — inject this into the system prompt / messages array
// ---------------------------------------------------------------------------
// Guard: only inject when the job domain is 'check' or 'analytical'.
// This keeps non-puzzle domains completely unaffected.
// ---------------------------------------------------------------------------

// --- BEGIN PHASE 2 DOCTRINE INJECTION ---

/*
  INSERT LOCATION: Inside the LLM prompt construction, BEFORE the user message
  is appended. Typically where systemPrompt, contextBlock, or the messages[]
  array is being assembled.

  EXAMPLE INTEGRATION (adapt variable names to your codebase):

    // After existing context merge...
    let systemPrompt = buildSystemPrompt(mergedContext);

    // PHASE 2: Inject doctrine for puzzle domains
    if (job.domain === 'check' || job.domain === 'analytical') {
      systemPrompt += '\n' + GRID_PUZZLE_DOCTRINE;
    }

    // Then send to LLM as usual...
*/

export const GRID_PUZZLE_DOCTRINE = `
=== PATTERN RECOGNITION DOCTRINE v2.1.0 ===
You are solving an ARC (Abstract Reasoning Challenge) grid puzzle.
Follow these steps IN ORDER. Do NOT skip steps. Do NOT guess.

STEP 1: PARSE TRAINING PAIRS
- Extract each training input grid and output grid.
- Record dimensions (rows x cols) for each.
- Note if dimensions change between input and output.

STEP 2: CHECK VALUE SUBSTITUTION
- For every cell (r,c), map input[r][c] → output[r][c].
- If the mapping is consistent across ALL training pairs → apply to test.
- If inconsistent → move to Step 3.

STEP 3: CHECK SPATIAL TRANSFORMS (test each, pick the one that matches ALL training pairs)
CRITICAL DEFINITIONS — do NOT confuse:
  • HORIZONTAL REFLECTION: reverse each ROW left-to-right. Row order unchanged.
    Formal: output[r][c] = input[r][cols-1-c]
  • VERTICAL REFLECTION: reverse ROW ORDER top-to-bottom. Each row unchanged.
    Formal: output[r][c] = input[rows-1-r][c]
  • 90° CW ROTATION: output[c][rows-1-r] = input[r][c]
  • 180° ROTATION: output[rows-1-r][cols-1-c] = input[r][c]
  • 270° CW ROTATION: output[cols-1-c][r] = input[r][c]
  • TRANSPOSITION: output[c][r] = input[r][c]
Test ALL six. Use the one that matches ALL training outputs.

STEP 4: CHECK GRAVITY
- Non-zero values "fall" to bottom (or top/left/right) of their column (or row).
- CRITICAL: gravity PRESERVES the count of each value per column.
  If a column has two 2s and one 5, output must have two 2s and one 5.
- Test all four directions.

STEP 5: CHECK COMPOSITIONAL RULES
- Fractal Tiling: each non-zero cell → COPY of the input pattern (NOT solid fill).
  Output dims = input_rows² × input_cols². Zero cells → zero blocks.
  ERROR TO AVOID: Do NOT fill non-zero cells with solid blocks of that value.
- Border/Surround: non-zero cells gain adjacent border of specific value.
- XOR/Intersection: input has two sub-grids separated by divider → XOR, AND, or OR.
- Sub-Pattern Extraction: output is a sub-region of input.

STEP 6: CHECK CONDITIONAL RULES
- Uniform row detection: all-same rows → value A, mixed rows → value B.
- Height-rank colouring: columns ranked by non-zero count → colour by rank.
- Region detection: connected components → transform per region.

STEP 7: CHECK COMPOUND RULES
- Try pairs of simple rules in sequence (e.g., substitution + reflection).

STEP 8: VERIFY ON ALL TRAINING EXAMPLES
- Apply your identified rule to EVERY training input.
- Compare cell-by-cell to expected output.
- If ANY training example fails → rule is WRONG. Go back and try next candidate.
- NEVER skip verification.

STEP 9: APPLY TO TEST INPUT
- Apply the verified rule to the test input. No modifications.

STEP 10: SELF-CHECK AND OUTPUT
- Verify output dimensions match the ratio from training pairs.
- Verify all values are in range 0-9.
- Verify consistency with training transformation.

=== KNOWN ERROR CATALOGUE ===
• Puzzle 3c9b0459: Mirror axis confusion — applied horizontal when vertical was correct.
  FIX: Test BOTH reflections. Use the one matching ALL training pairs.
• Puzzle 25ff71a9: Gravity value loss — collapsed two rows of 2s into one.
  FIX: Gravity NEVER reduces value count. Every non-zero value must be preserved.
• Puzzle 007bbfb7: Fractal solid fill — filled cells with solid value instead of pattern copy.
  FIX: Fractal tiling copies the ENTIRE input pattern into each non-zero cell position.

=== OUTPUT FORMAT (MANDATORY) ===
You MUST output your final answer inside a \`\`\`grid\`\`\` code block.
Each row on its own line. Values separated by spaces. No trailing spaces.
Example:
\`\`\`grid
0 1 2
3 4 5
6 7 8
\`\`\`

Show your work: for each step, briefly state what you tested and the result.
After Step 8 verification passes, output the answer in the grid block above.
`;


// ---------------------------------------------------------------------------
// HELPER: Build the doctrine-injected prompt for puzzle domains
// ---------------------------------------------------------------------------
// This function can be called directly if the codebase uses a function-based
// prompt builder. It wraps the existing prompt with the doctrine.

/**
 * Wraps an existing system prompt with the grid puzzle doctrine.
 * Only activates for 'check' or 'analytical' domains.
 *
 * @param existingPrompt - The system prompt built by ContextMerge
 * @param domain - The job domain string
 * @returns The augmented system prompt
 */
export function injectDoctrine(existingPrompt: string, domain: string): string {
  if (domain === 'check' || domain === 'analytical') {
    return existingPrompt + '\n' + GRID_PUZZLE_DOCTRINE;
  }
  return existingPrompt;
}


// ---------------------------------------------------------------------------
// ALTERNATIVE: Message-array injection for chat-completion APIs
// ---------------------------------------------------------------------------
// If the codebase builds a messages[] array for the LLM call, insert the
// doctrine as a system message at the beginning of the array.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Injects the doctrine as the first system message in a chat messages array.
 * Only activates for 'check' or 'analytical' domains.
 *
 * @param messages - The existing messages array
 * @param domain - The job domain string
 * @returns The augmented messages array (original array is not mutated)
 */
export function injectDoctrineMessages(
  messages: ChatMessage[],
  domain: string
): ChatMessage[] {
  if (domain !== 'check' && domain !== 'analytical') {
    return messages;
  }

  const doctrineMessage: ChatMessage = {
    role: 'system',
    content: GRID_PUZZLE_DOCTRINE.trim(),
  };

  // Insert doctrine as the first system message
  return [doctrineMessage, ...messages];
}


// --- END PHASE 2 DOCTRINE INJECTION ---
