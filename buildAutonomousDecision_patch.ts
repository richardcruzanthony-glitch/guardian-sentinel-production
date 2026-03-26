// =============================================================================
// ARA HARDENING PATCH — buildAutonomousDecision grid solver branch
// =============================================================================
// FILE:    cognitiveLoop.ts
// TARGET:  Replace the generic "else" fallback in buildAutonomousDecision
//          with a new analytical/check domain branch + preserved fallback.
//
// INSTALL: Locate the function buildAutonomousDecision in cognitiveLoop.ts.
//          Find the final "} else {" block. Replace it with the code below.
//          The original generic fallback is preserved as the final else.
//
// AXIOM ALIGNMENT:
//   AXIOM_03 — Handle the Unknown: systematic elimination, never guess.
//   AXIOM_01 — Iron Holds: no action that violates principles.
// =============================================================================

// --- PASTE THIS BLOCK to replace the final "} else {" in buildAutonomousDecision ---

} else if (job.domain === 'check' || job.domain === 'analytical') {
    // =========================================================================
    // ANALYTICAL REASONING BRANCH — Grid Puzzle Solver
    // =========================================================================
    // Follows Pattern Recognition Doctrine from analytical-reasoning.json:
    //   1. Parse training pairs
    //   2. Check substitution → spatial → compositional → conditional
    //   3. Verify on ALL training examples
    //   4. Apply to test input
    //   5. Self-check dimensions, values, consistency
    //   6. Output in ```grid``` format
    // =========================================================================

    lines.push('AUTONOMOUS ANALYTICAL ASSESSMENT:');
    lines.push('  Doctrine: Pattern Recognition Doctrine v2.1.0');
    lines.push('  Axiom: AXIOM_03 — Handle the Unknown');
    lines.push('');

    // --- STEP 1: Parse training pairs and test input from job.input ---
    const rawInput: string = job.input || '';

    interface GridPair {
        input: number[][];
        output: number[][];
    }

    interface ParsedPuzzle {
        training: GridPair[];
        testInput: number[][];
    }

    function parseGrid(text: string): number[][] {
        const rows = text.trim().split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('=') && !line.startsWith('-') && !line.startsWith('#'));
        return rows.map(row => {
            // Handle space-separated, comma-separated, or bracket-enclosed formats
            const cleaned = row.replace(/[\[\]]/g, '').trim();
            const separator = cleaned.includes(',') ? ',' : /\s+/;
            return cleaned.split(separator).map(v => parseInt(v.toString().trim(), 10)).filter(v => !isNaN(v));
        }).filter(row => row.length > 0);
    }

    function extractPuzzleData(text: string): ParsedPuzzle {
        const training: GridPair[] = [];
        let testInput: number[][] = [];

        // Try to find structured sections: "Training X:", "Input:", "Output:", "Test:"
        const sections = text.split(/(?:training\s*(?:example\s*)?\d*\s*:|example\s*\d+\s*:)/i);

        if (sections.length > 1) {
            // Structured format with labeled sections
            for (let i = 1; i < sections.length; i++) {
                const section = sections[i];
                const ioParts = section.split(/(?:output\s*:)/i);
                if (ioParts.length >= 2) {
                    const inputGrid = parseGrid(ioParts[0].replace(/input\s*:/i, ''));
                    const outputText = ioParts[1].split(/(?:test\s*(?:input\s*)?:)/i)[0];
                    const outputGrid = parseGrid(outputText);
                    if (inputGrid.length > 0 && outputGrid.length > 0) {
                        training.push({ input: inputGrid, output: outputGrid });
                    }
                }
            }
        }

        // Extract test input
        const testMatch = text.split(/(?:test\s*(?:input\s*)?:)/i);
        if (testMatch.length > 1) {
            const testSection = testMatch[testMatch.length - 1].split(/(?:test\s*output|expected|answer)/i)[0];
            testInput = parseGrid(testSection);
        }

        // Fallback: try to find grid blocks separated by blank lines
        if (training.length === 0) {
            const gridBlocks: number[][][] = [];
            const blockTexts = text.split(/\n\s*\n/).filter(b => b.trim().length > 0);
            for (const block of blockTexts) {
                const grid = parseGrid(block);
                if (grid.length > 0 && grid[0].length > 0) {
                    gridBlocks.push(grid);
                }
            }
            // Assume pairs: input, output, input, output, ..., test_input
            for (let i = 0; i + 1 < gridBlocks.length - 1; i += 2) {
                training.push({ input: gridBlocks[i], output: gridBlocks[i + 1] });
            }
            if (gridBlocks.length > 0 && gridBlocks.length % 2 === 1) {
                testInput = gridBlocks[gridBlocks.length - 1];
            }
        }

        return { training, testInput };
    }

    const puzzle = extractPuzzleData(rawInput);

    lines.push(`  Step 1 — Parsed ${puzzle.training.length} training pair(s).`);
    if (puzzle.testInput.length > 0) {
        lines.push(`           Test input: ${puzzle.testInput.length}x${puzzle.testInput[0]?.length || 0}`);
    } else {
        lines.push('           WARNING: No test input found. Will provide analysis only.');
    }
    lines.push('');

    // --- Utility functions ---
    function gridsEqual(a: number[][], b: number[][]): boolean {
        if (a.length !== b.length) return false;
        for (let r = 0; r < a.length; r++) {
            if (a[r].length !== b[r].length) return false;
            for (let c = 0; c < a[r].length; c++) {
                if (a[r][c] !== b[r][c]) return false;
            }
        }
        return true;
    }

    function gridToString(grid: number[][]): string {
        return grid.map(row => row.join(' ')).join('\n');
    }

    function deepCopyGrid(grid: number[][]): number[][] {
        return grid.map(row => [...row]);
    }

    // --- STEP 2: Transformation detection functions ---

    // T01: Value Substitution
    function tryValueSubstitution(pairs: GridPair[]): Map<number, number> | null {
        const mapping = new Map<number, number>();
        for (const pair of pairs) {
            if (pair.input.length !== pair.output.length) return null;
            for (let r = 0; r < pair.input.length; r++) {
                if (pair.input[r].length !== pair.output[r].length) return null;
                for (let c = 0; c < pair.input[r].length; c++) {
                    const iv = pair.input[r][c];
                    const ov = pair.output[r][c];
                    if (mapping.has(iv)) {
                        if (mapping.get(iv) !== ov) return null; // Inconsistent
                    } else {
                        mapping.set(iv, ov);
                    }
                }
            }
        }
        return mapping;
    }

    function applyValueSubstitution(grid: number[][], mapping: Map<number, number>): number[][] {
        return grid.map(row => row.map(v => mapping.has(v) ? mapping.get(v)! : v));
    }

    // T02: Horizontal Reflection (reverse each row)
    function horizontalReflect(grid: number[][]): number[][] {
        return grid.map(row => [...row].reverse());
    }

    // T03: Vertical Reflection (reverse row order)
    function verticalReflect(grid: number[][]): number[][] {
        return [...grid].reverse().map(row => [...row]);
    }

    // T04: Rotation 90° clockwise
    function rotate90(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result: number[][] = [];
        for (let c = 0; c < cols; c++) {
            const newRow: number[] = [];
            for (let r = rows - 1; r >= 0; r--) {
                newRow.push(grid[r][c]);
            }
            result.push(newRow);
        }
        return result;
    }

    // T05: Rotation 180°
    function rotate180(grid: number[][]): number[][] {
        return horizontalReflect(verticalReflect(grid));
    }

    // T06: Rotation 270° clockwise
    function rotate270(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result: number[][] = [];
        for (let c = cols - 1; c >= 0; c--) {
            const newRow: number[] = [];
            for (let r = 0; r < rows; r++) {
                newRow.push(grid[r][c]);
            }
            result.push(newRow);
        }
        return result;
    }

    // T07: Transposition
    function transpose(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result: number[][] = [];
        for (let c = 0; c < cols; c++) {
            const newRow: number[] = [];
            for (let r = 0; r < rows; r++) {
                newRow.push(grid[r][c]);
            }
            result.push(newRow);
        }
        return result;
    }

    // T08: Gravity Down
    function gravityDown(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let c = 0; c < cols; c++) {
            const nonZero: number[] = [];
            for (let r = 0; r < rows; r++) {
                if (grid[r][c] !== 0) nonZero.push(grid[r][c]);
            }
            // Place at bottom, preserving order and count
            let writePos = rows - 1;
            for (let i = nonZero.length - 1; i >= 0; i--) {
                result[writePos][c] = nonZero[i];
                writePos--;
            }
        }
        return result;
    }

    // T08b: Gravity Up
    function gravityUp(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let c = 0; c < cols; c++) {
            const nonZero: number[] = [];
            for (let r = 0; r < rows; r++) {
                if (grid[r][c] !== 0) nonZero.push(grid[r][c]);
            }
            for (let i = 0; i < nonZero.length; i++) {
                result[i][c] = nonZero[i];
            }
        }
        return result;
    }

    // T09: Fractal Tiling — each non-zero cell becomes a copy of the input pattern
    function fractalTile(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const outRows = rows * rows;
        const outCols = cols * cols;
        const result: number[][] = Array.from({ length: outRows }, () => new Array(outCols).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== 0) {
                    // Place a copy of the input pattern at block (r, c)
                    for (let br = 0; br < rows; br++) {
                        for (let bc = 0; bc < cols; bc++) {
                            result[r * rows + br][c * cols + bc] = grid[br][bc] !== 0 ? grid[r][c] : 0;
                        }
                    }
                }
                // If grid[r][c] === 0, the block stays all zeros
            }
        }
        return result;
    }

    // T09b: Fractal Tiling variant — non-zero cells get exact copy of input (preserving original values)
    function fractalTileExact(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const outRows = rows * rows;
        const outCols = cols * cols;
        const result: number[][] = Array.from({ length: outRows }, () => new Array(outCols).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== 0) {
                    for (let br = 0; br < rows; br++) {
                        for (let bc = 0; bc < cols; bc++) {
                            result[r * rows + br][c * cols + bc] = grid[br][bc];
                        }
                    }
                }
            }
        }
        return result;
    }

    // T11: XOR Mask — split grid at divider, XOR the two halves
    function tryXorMask(grid: number[][]): number[][] | null {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;

        // Look for a divider column (all same non-zero value)
        for (let c = 0; c < cols; c++) {
            const divVal = grid[0][c];
            if (divVal === 0) continue;
            let isDivider = true;
            for (let r = 0; r < rows; r++) {
                if (grid[r][c] !== divVal) { isDivider = false; break; }
            }
            if (isDivider && c > 0 && c < cols - 1) {
                // Split into left and right
                const left = grid.map(row => row.slice(0, c));
                const right = grid.map(row => row.slice(c + 1));
                if (left[0].length === right[0].length) {
                    const result: number[][] = [];
                    for (let r = 0; r < rows; r++) {
                        const newRow: number[] = [];
                        for (let j = 0; j < left[r].length; j++) {
                            // XOR: cell is non-zero if exactly one side is non-zero
                            const lv = left[r][j] !== 0 ? 1 : 0;
                            const rv = right[r][j] !== 0 ? 1 : 0;
                            if (lv !== rv) {
                                newRow.push(left[r][j] !== 0 ? left[r][j] : right[r][j]);
                            } else {
                                newRow.push(0);
                            }
                        }
                        result.push(newRow);
                    }
                    return result;
                }
            }
        }

        // Look for a divider row
        for (let r = 0; r < rows; r++) {
            const divVal = grid[r][0];
            if (divVal === 0) continue;
            let isDivider = true;
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== divVal) { isDivider = false; break; }
            }
            if (isDivider && r > 0 && r < rows - 1) {
                const top = grid.slice(0, r);
                const bottom = grid.slice(r + 1);
                if (top.length === bottom.length && top[0].length === bottom[0].length) {
                    const result: number[][] = [];
                    for (let i = 0; i < top.length; i++) {
                        const newRow: number[] = [];
                        for (let j = 0; j < top[i].length; j++) {
                            const tv = top[i][j] !== 0 ? 1 : 0;
                            const bv = bottom[i][j] !== 0 ? 1 : 0;
                            if (tv !== bv) {
                                newRow.push(top[i][j] !== 0 ? top[i][j] : bottom[i][j]);
                            } else {
                                newRow.push(0);
                            }
                        }
                        result.push(newRow);
                    }
                    return result;
                }
            }
        }

        return null;
    }

    // T13: Uniform Row Detection
    function tryUniformRowDetection(pairs: GridPair[]): { uniformVal: number; mixedVal: number } | null {
        // Check if output is a single column where uniform rows → one value, mixed → another
        for (const pair of pairs) {
            if (pair.output[0].length !== 1) return null; // Output must be single column
        }
        let uniformVal: number | null = null;
        let mixedVal: number | null = null;
        for (const pair of pairs) {
            for (let r = 0; r < pair.input.length; r++) {
                const row = pair.input[r];
                const isUniform = row.every(v => v === row[0]);
                const outVal = pair.output[r]?.[0];
                if (outVal === undefined) return null;
                if (isUniform) {
                    if (uniformVal === null) uniformVal = outVal;
                    else if (uniformVal !== outVal) return null;
                } else {
                    if (mixedVal === null) mixedVal = outVal;
                    else if (mixedVal !== outVal) return null;
                }
            }
        }
        if (uniformVal !== null && mixedVal !== null) {
            return { uniformVal, mixedVal };
        }
        return null;
    }

    // --- STEP 3-8: Try each transformation, verify on all training pairs ---

    type TransformFn = (grid: number[][]) => number[][];
    interface TransformCandidate {
        name: string;
        id: string;
        apply: TransformFn;
    }

    const candidates: TransformCandidate[] = [];
    let identifiedRule: string = 'UNKNOWN';
    let ruleApply: TransformFn | null = null;

    // Check value substitution first (doctrine priority 1)
    const subMap = tryValueSubstitution(puzzle.training);
    if (subMap) {
        const mapEntries = Array.from(subMap.entries()).map(([k, v]) => `${k}→${v}`).join(', ');
        lines.push(`  Step 2 — VALUE SUBSTITUTION detected: mapping {${mapEntries}}`);
        // Verify
        let verified = true;
        for (const pair of puzzle.training) {
            const result = applyValueSubstitution(pair.input, subMap);
            if (!gridsEqual(result, pair.output)) { verified = false; break; }
        }
        if (verified) {
            identifiedRule = `T01: Value Substitution (${mapEntries})`;
            ruleApply = (grid) => applyValueSubstitution(grid, subMap);
            lines.push('           VERIFIED on all training pairs. ✓');
        } else {
            lines.push('           Substitution mapping inconsistent. Moving to spatial transforms.');
        }
    }

    // Check spatial transforms (doctrine priority 2)
    if (!ruleApply) {
        const spatialTransforms: TransformCandidate[] = [
            { name: 'Horizontal Reflection', id: 'T02', apply: horizontalReflect },
            { name: 'Vertical Reflection', id: 'T03', apply: verticalReflect },
            { name: 'Rotation 90° CW', id: 'T04', apply: rotate90 },
            { name: 'Rotation 180°', id: 'T05', apply: rotate180 },
            { name: 'Rotation 270° CW', id: 'T06', apply: rotate270 },
            { name: 'Transposition', id: 'T07', apply: transpose },
            { name: 'Gravity Down', id: 'T08', apply: gravityDown },
            { name: 'Gravity Up', id: 'T08b', apply: gravityUp },
        ];

        lines.push('  Step 3 — Testing spatial transforms...');
        for (const transform of spatialTransforms) {
            let allMatch = true;
            for (const pair of puzzle.training) {
                const result = transform.apply(pair.input);
                if (!gridsEqual(result, pair.output)) { allMatch = false; break; }
            }
            if (allMatch) {
                identifiedRule = `${transform.id}: ${transform.name}`;
                ruleApply = transform.apply;
                lines.push(`           ${transform.name} VERIFIED on all training pairs. ✓`);
                break;
            }
        }
        if (!ruleApply) {
            lines.push('           No single spatial transform matched all training pairs.');
        }
    }

    // Check compositional rules (doctrine priority 3)
    if (!ruleApply) {
        lines.push('  Step 5 — Testing compositional rules...');

        // Fractal tiling (both variants)
        for (const pair of puzzle.training) {
            const fracResult = fractalTile(pair.input);
            if (gridsEqual(fracResult, pair.output)) {
                let allMatch = true;
                for (const p of puzzle.training) {
                    if (!gridsEqual(fractalTile(p.input), p.output)) { allMatch = false; break; }
                }
                if (allMatch) {
                    identifiedRule = 'T09: Fractal Tiling (value-mapped)';
                    ruleApply = fractalTile;
                    lines.push('           Fractal Tiling (value-mapped) VERIFIED. ✓');
                    break;
                }
            }
            const fracExact = fractalTileExact(pair.input);
            if (gridsEqual(fracExact, pair.output)) {
                let allMatch = true;
                for (const p of puzzle.training) {
                    if (!gridsEqual(fractalTileExact(p.input), p.output)) { allMatch = false; break; }
                }
                if (allMatch) {
                    identifiedRule = 'T09b: Fractal Tiling (exact copy)';
                    ruleApply = fractalTileExact;
                    lines.push('           Fractal Tiling (exact copy) VERIFIED. ✓');
                    break;
                }
            }
        }

        // XOR Mask
        if (!ruleApply) {
            let xorMatch = true;
            for (const pair of puzzle.training) {
                const xorResult = tryXorMask(pair.input);
                if (!xorResult || !gridsEqual(xorResult, pair.output)) { xorMatch = false; break; }
            }
            if (xorMatch) {
                identifiedRule = 'T11: XOR Mask';
                ruleApply = (grid) => tryXorMask(grid) || grid;
                lines.push('           XOR Mask VERIFIED. ✓');
            }
        }

        if (!ruleApply) {
            lines.push('           No compositional rule matched.');
        }
    }

    // Check conditional rules (doctrine priority 4)
    if (!ruleApply) {
        lines.push('  Step 6 — Testing conditional rules...');

        const uniformResult = tryUniformRowDetection(puzzle.training);
        if (uniformResult) {
            identifiedRule = `T13: Uniform Row Detection (uniform→${uniformResult.uniformVal}, mixed→${uniformResult.mixedVal})`;
            ruleApply = (grid) => {
                return grid.map(row => {
                    const isUniform = row.every(v => v === row[0]);
                    return [isUniform ? uniformResult.uniformVal : uniformResult.mixedVal];
                });
            };
            lines.push(`           Uniform Row Detection VERIFIED. ✓`);
        }

        if (!ruleApply) {
            lines.push('           No conditional rule matched.');
        }
    }

    // --- STEP 9: Apply rule to test input ---
    lines.push('');
    if (ruleApply && puzzle.testInput.length > 0) {
        lines.push(`  Step 9 — Applying rule: ${identifiedRule}`);
        const testOutput = ruleApply(puzzle.testInput);

        // --- STEP 10: Self-check ---
        lines.push('  Step 10 — Self-check:');

        // Check dimensions consistency with training
        if (puzzle.training.length > 0) {
            const trainInRows = puzzle.training[0].input.length;
            const trainOutRows = puzzle.training[0].output.length;
            const dimRatio = trainOutRows / trainInRows;
            const expectedTestRows = Math.round(puzzle.testInput.length * dimRatio);
            if (testOutput.length === expectedTestRows) {
                lines.push('    (a) Dimensions consistent with training ratio. ✓');
            } else {
                lines.push(`    (a) WARNING: Expected ~${expectedTestRows} rows, got ${testOutput.length}. Verify manually.`);
            }
        }

        // Check values are valid (0-9)
        let valuesValid = true;
        for (const row of testOutput) {
            for (const v of row) {
                if (v < 0 || v > 9 || !Number.isInteger(v)) { valuesValid = false; break; }
            }
            if (!valuesValid) break;
        }
        lines.push(`    (b) All values in range 0-9: ${valuesValid ? '✓' : 'WARNING — invalid values detected'}`);
        lines.push(`    (c) Rule applied: ${identifiedRule}`);
        lines.push('');

        // Output the answer
        lines.push('ANSWER:');
        lines.push('```grid');
        lines.push(gridToString(testOutput));
        lines.push('```');
    } else if (ruleApply && puzzle.testInput.length === 0) {
        lines.push(`  Rule identified: ${identifiedRule}`);
        lines.push('  No test input provided. Provide test input to generate answer.');
    } else {
        // No rule found — escalate per AXIOM_03
        lines.push('  AXIOM_03 INVOKED — Handle the Unknown:');
        lines.push('  No transformation rule matched all training examples.');
        lines.push('  Transforms tested:');
        lines.push('    - Value substitution: FAILED');
        lines.push('    - Horizontal reflection: FAILED');
        lines.push('    - Vertical reflection: FAILED');
        lines.push('    - Rotation (90°, 180°, 270°): FAILED');
        lines.push('    - Transposition: FAILED');
        lines.push('    - Gravity (down, up): FAILED');
        lines.push('    - Fractal tiling (both variants): FAILED');
        lines.push('    - XOR mask: FAILED');
        lines.push('    - Uniform row detection: FAILED');
        lines.push('');
        lines.push('  ESCALATION: Requesting LLM assistance with the following context:');
        lines.push(`    Training pairs: ${puzzle.training.length}`);
        if (puzzle.training.length > 0) {
            lines.push(`    Input dims: ${puzzle.training[0].input.length}x${puzzle.training[0].input[0]?.length}`);
            lines.push(`    Output dims: ${puzzle.training[0].output.length}x${puzzle.training[0].output[0]?.length}`);
            const dimChange = puzzle.training[0].input.length !== puzzle.training[0].output.length ||
                              puzzle.training[0].input[0]?.length !== puzzle.training[0].output[0]?.length;
            lines.push(`    Dimensions change: ${dimChange ? 'YES — rules involving resize' : 'NO — same-size transform'}`);
        }
        lines.push('    Hypothesis: compound rule or pattern type not yet in transformation library.');
        lines.push('    Action: Store attempt in PostgreSQL, increment iteration_count, retry with LLM.');
    }

} else {
    // =========================================================================
    // ORIGINAL GENERIC FALLBACK — preserved for all other domains
    // =========================================================================
    lines.push('AUTONOMOUS ASSESSMENT:');
    lines.push('  Step 1 — Identify the primary threat vector.');
    lines.push('  Step 2 — Apply economy of force — minimum resources to secondary threats.');
    lines.push('  Step 3 — Escalate to human authority immediately.');
    lines.push('  Step 4 — Iron holds. No action that violates principles.');
}

// --- END OF PATCH ---
