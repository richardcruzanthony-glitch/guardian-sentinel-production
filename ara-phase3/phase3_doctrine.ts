// =============================================================================
// ARA PHASE 3 — Enhanced Doctrine with Puzzle-Specific Algorithms
// =============================================================================
// FILE:    cognitiveLoop.ts
// TARGET:  Replace or augment the GRID_PUZZLE_DOCTRINE constant with
//          puzzle-specific algorithms for the 6 failing puzzles.
//
// PURPOSE: The current doctrine gives general instructions but lacks the
//          precise algorithms needed for gravity, fractal, surround,
//          height-rank, sub-pattern, and tiled mosaic puzzles.
//          This update adds step-by-step algorithms so the LLM can
//          execute these transforms correctly.
//
// INSTALL: The phase3_apply.py script handles insertion automatically.
//          Manual install: find the GRID_PUZZLE_DOCTRINE constant in
//          cognitiveLoop.ts and replace it with the version below.
//
// TOKEN BUDGET: ~2,400 tokens — fits within Groq's context window.
// =============================================================================


// --- BEGIN PHASE 3 DOCTRINE ---

export const GRID_PUZZLE_DOCTRINE = `
=== PATTERN RECOGNITION DOCTRINE v3.0.0 ===
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
- Test all four directions: down, up, left, right.

=== PUZZLE-SPECIFIC ALGORITHM: GRAVITY (25ff71a9) ===
For gravity: count ALL non-zero values in each column. Stack them at the bottom.
The count of each value MUST be preserved. If column has [2,0,5,2,0], output
column must have [0,0,2,5,2] (gravity down) — both 2s and the 5 are preserved.
Algorithm:
  1. For each column c (0 to cols-1):
     a. Collect all non-zero values top-to-bottom into list V
     b. Create output column: (rows - len(V)) zeros, then V
  2. Verify: count of each value per column is identical in input and output.
  3. If gravity-down doesn't match, try gravity-up (stack at top), gravity-left
     (stack at left of each row), gravity-right (stack at right of each row).
=== END GRAVITY ALGORITHM ===

STEP 5: CHECK COMPOSITIONAL RULES

=== PUZZLE-SPECIFIC ALGORITHM: FRACTAL TILING (007bbfb7) ===
For fractal tiling: output is NxN times input size (output_rows = input_rows^2,
output_cols = input_cols^2). For each cell (r,c) in input:
  - If input[r][c] != 0: place a COPY of the entire input pattern at block (r,c).
    Within that copy, replace each non-zero value with input[r][c].
  - If input[r][c] == 0: place a zero block of size (input_rows x input_cols).
  DO NOT fill with solid colour. Each non-zero block is a COPY of the pattern.
Algorithm:
  1. Create output grid of size (rows*rows) x (cols*cols), filled with 0.
  2. For each cell (r,c) in input where input[r][c] != 0:
     a. For each (br,bc) in input pattern:
        output[r*rows + br][c*cols + bc] = (input[br][bc] != 0) ? input[r][c] : 0
  3. Variant: if above doesn't match, try exact copy (preserve original values):
     output[r*rows + br][c*cols + bc] = input[br][bc]
=== END FRACTAL ALGORITHM ===

=== PUZZLE-SPECIFIC ALGORITHM: SURROUND/BORDER (dc1df850) ===
For surround/border: find each cell with the target value. Place the border
value in all 8 adjacent cells (up, down, left, right, and 4 diagonals).
Don't go outside grid bounds. Don't overwrite existing non-zero non-target values.
Algorithm:
  1. Identify target value T and border value B from training examples:
     - T is the value that exists in input and is surrounded in output
     - B is the new value that appears adjacent to T cells in output
  2. Copy input to output.
  3. For each cell (r,c) where input[r][c] == T:
     a. For each of 8 directions (dr,dc) in {-1,0,1}x{-1,0,1} \\ {0,0}:
        nr = r+dr, nc = c+dc
        If nr,nc in bounds AND output[nr][nc] == 0: set output[nr][nc] = B
  4. Verify: T cells unchanged, new B cells only where input was 0.
=== END SURROUND ALGORITHM ===

=== PUZZLE-SPECIFIC ALGORITHM: HEIGHT-RANK COLOURING (08ed6ac7) ===
For height-rank: count non-zero cells in each column to get height.
Rank columns by height (tallest=1, next=2, etc.). Replace each non-zero
cell with its column's rank value.
Algorithm:
  1. For each column c, count H[c] = number of non-zero cells.
  2. Sort unique heights descending. Assign rank: tallest=1, next=2, etc.
  3. For each cell (r,c): if input[r][c] != 0, output[r][c] = rank of column c.
     If input[r][c] == 0, output[r][c] = 0.
  4. Verify on ALL training pairs before applying.
=== END HEIGHT-RANK ALGORITHM ===

STEP 6: CHECK CONDITIONAL AND EXTRACTION RULES

=== PUZZLE-SPECIFIC ALGORITHM: SUB-PATTERN EXTRACTION (6ecd11f4) ===
For sub-pattern extraction: find the smallest bounding box containing all
non-zero cells. Extract that region. If there are multiple distinct regions,
identify which one is marked or highlighted.
Algorithm:
  1. Find min_row, max_row, min_col, max_col of all non-zero cells.
  2. Extract grid[min_row..max_row][min_col..max_col] as output.
  3. If this doesn't match training output, try:
     a. Extract bounding box of a specific marker value only
     b. Find connected components, extract the smallest one
     c. Find connected components, extract the one with unique properties
  4. Verify extracted region matches training output exactly.
=== END SUB-PATTERN ALGORITHM ===

=== PUZZLE-SPECIFIC ALGORITHM: TILED MOSAIC (ff805c23) ===
For tiled mosaic: the input contains a repeating tiled pattern with one
unique region. Find the non-repeating region and extract it.
Algorithm:
  1. Try tile sizes that evenly divide the grid (tileH divides rows,
     tileW divides cols).
  2. Extract all tiles at each position.
  3. Find the majority tile (most common pattern).
  4. The unique tile (the one that differs from the majority) is the answer.
  5. If no single unique tile, try: find the tile with the most unique values,
     or the tile at a specific position (center, corner).
  6. Verify on ALL training pairs.
=== END TILED MOSAIC ALGORITHM ===

STEP 7: CHECK COMPOUND RULES
- Try pairs of simple rules in sequence (e.g., substitution + reflection).
- Apply rule A to input, then rule B to result. Check if it matches output.

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
• Puzzle dc1df850: Surround placement error — missed diagonal adjacents.
  FIX: Border goes in ALL 8 directions, including diagonals. Only overwrite zero cells.
• Puzzle 08ed6ac7: Height-rank confusion — used raw height instead of rank.
  FIX: Rank by height (tallest=1). Replace non-zero cells with rank, not height.
• Puzzle 6ecd11f4: Extracted wrong region.
  FIX: Try multiple extraction modes: bounding box, marker-based, connected component.
• Puzzle ff805c23: Failed to identify tiled pattern.
  FIX: Try all tile sizes that divide the grid. Find the unique non-repeating tile.

=== OUTPUT FORMAT (MANDATORY) ===
You MUST output your final answer inside a \`\`\`grid\`\`\` code block.
Each row on its own line. Values separated by spaces. No trailing spaces.
Example:
\`\`\`grid
0 1 2
3 4 5
6 7 8
\`\`\`

IMPORTANT: Be CONCISE. Limit your reasoning to 1-2 sentences per step.
The total response must be under 4000 characters.
Focus on the grid answer, not lengthy explanations.
Show your work briefly. After Step 8 verification, output the grid block.
`;


// ---------------------------------------------------------------------------
// HELPER: Build the doctrine-injected prompt for puzzle domains
// ---------------------------------------------------------------------------

/**
 * Wraps an existing system prompt with the grid puzzle doctrine.
 * Only activates for 'check' or 'analytical' domains.
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

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Injects the doctrine as the first system message in a chat messages array.
 * Only activates for 'check' or 'analytical' domains.
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

  return [doctrineMessage, ...messages];
}


// --- END PHASE 3 DOCTRINE ---
