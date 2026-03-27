// =============================================================================
// ARA PHASE 3 — Expanded Autonomous Transform Library
// =============================================================================
// FILE:    cognitiveLoop.ts (injected into the analytical branch)
// TARGET:  Add to the candidates[] array and compositional/conditional checks
//          in buildAutonomousDecision's analytical reasoning branch.
//
// NEW TRANSFORMS:
//   T10:  Border / Surround
//   T12:  Sub-Pattern Extraction (improved)
//   T14:  Height-Rank Colouring
//   T15a: Gravity Left
//   T15b: Gravity Right
//   T16:  Compound Rules (pairs of simple transforms)
//
// INSTALL: The phase3_apply.py script injects this code into cognitiveLoop.ts.
//          Manual install: paste into the analytical branch, after the existing
//          transform definitions and before the candidate testing loop.
//
// AXIOM ALIGNMENT:
//   AXIOM_03 — Handle the Unknown: systematic elimination, never guess.
// =============================================================================


// --- BEGIN PHASE 3 TRANSFORMS ---

    // =========================================================================
    // T10: Border / Surround
    // =========================================================================
    // For each cell with a specific "target" value, place a ring of a "border"
    // value in all 8 adjacent cells. Don't overwrite cells that already have
    // non-zero values (unless they're 0).
    //
    // Detection: Check if output has new values adjacent to specific input cells.
    // Must infer target value and border value from training examples.
    // =========================================================================

    function tryBorderSurround(pairs: GridPair[]): { targetVal: number; borderVal: number } | null {
        // For each training pair, identify which value gains a border
        // Strategy: find values that exist in output but not in input at specific positions
        // The border value appears in output adjacent to the target value cells

        if (pairs.length === 0) return null;

        // Collect candidate (target, border) pairs from first training example
        const pair0 = pairs[0];
        if (pair0.input.length !== pair0.output.length) return null;
        if (pair0.input[0]?.length !== pair0.output[0]?.length) return null;

        const rows = pair0.input.length;
        const cols = pair0.input[0]?.length || 0;

        // Find cells that changed from 0 to non-zero (these are border cells)
        const newCells: { r: number; c: number; val: number }[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (pair0.input[r][c] === 0 && pair0.output[r][c] !== 0) {
                    newCells.push({ r, c, val: pair0.output[r][c] });
                }
            }
        }

        if (newCells.length === 0) return null;

        // The border value is the most common new value
        const valCounts = new Map<number, number>();
        for (const cell of newCells) {
            valCounts.set(cell.val, (valCounts.get(cell.val) || 0) + 1);
        }
        let borderVal = 0;
        let maxCount = 0;
        for (const [v, cnt] of valCounts) {
            if (cnt > maxCount) { maxCount = cnt; borderVal = v; }
        }

        // The target value: cells that are adjacent to the new border cells
        // and exist in both input and output unchanged
        const targetCandidates = new Set<number>();
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

        for (const cell of newCells) {
            if (cell.val !== borderVal) continue;
            for (const [dr, dc] of dirs) {
                const nr = cell.r + dr;
                const nc = cell.c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const iv = pair0.input[nr][nc];
                    if (iv !== 0 && iv !== borderVal) {
                        targetCandidates.add(iv);
                    }
                }
            }
        }

        if (targetCandidates.size === 0) return null;

        // Try each target candidate
        for (const targetVal of targetCandidates) {
            // Verify on ALL training pairs
            let allMatch = true;
            for (const pair of pairs) {
                const result = applyBorderSurround(pair.input, targetVal, borderVal);
                if (!gridsEqual(result, pair.output)) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                return { targetVal, borderVal };
            }
        }

        return null;
    }

    function applyBorderSurround(grid: number[][], targetVal: number, borderVal: number): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result = deepCopyGrid(grid);
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

        // First pass: find all target cells
        const targetCells: [number, number][] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] === targetVal) {
                    targetCells.push([r, c]);
                }
            }
        }

        // Second pass: place border around each target cell
        for (const [tr, tc] of targetCells) {
            for (const [dr, dc] of dirs) {
                const nr = tr + dr;
                const nc = tc + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    // Only overwrite zero cells (don't overwrite existing non-zero non-target values)
                    if (result[nr][nc] === 0) {
                        result[nr][nc] = borderVal;
                    }
                }
            }
        }

        return result;
    }

    // =========================================================================
    // T12: Sub-Pattern Extraction (improved)
    // =========================================================================
    // Find the bounding box of non-zero cells in the input and extract that
    // region as the output. Also try: find a specific marker value, extract
    // the region around it.
    // =========================================================================

    function trySubPatternExtraction(pairs: GridPair[]): { mode: string; markerVal?: number } | null {
        if (pairs.length === 0) return null;

        // Mode A: Bounding box of all non-zero cells
        let modeA_match = true;
        for (const pair of pairs) {
            const extracted = extractBoundingBox(pair.input, null);
            if (!extracted || !gridsEqual(extracted, pair.output)) {
                modeA_match = false;
                break;
            }
        }
        if (modeA_match) return { mode: 'bounding_box' };

        // Mode B: Bounding box of a specific marker value
        // Try each non-zero value as the marker
        const allValues = new Set<number>();
        for (const pair of pairs) {
            for (const row of pair.input) {
                for (const v of row) {
                    if (v !== 0) allValues.add(v);
                }
            }
        }

        for (const markerVal of allValues) {
            let allMatch = true;
            for (const pair of pairs) {
                const extracted = extractBoundingBox(pair.input, markerVal);
                if (!extracted || !gridsEqual(extracted, pair.output)) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) return { mode: 'marker', markerVal };
        }

        // Mode C: Extract the smallest non-zero region (connected component)
        let modeC_match = true;
        for (const pair of pairs) {
            const extracted = extractSmallestRegion(pair.input);
            if (!extracted || !gridsEqual(extracted, pair.output)) {
                modeC_match = false;
                break;
            }
        }
        if (modeC_match) return { mode: 'smallest_region' };

        // Mode D: Extract the unique/non-repeating region from a tiled pattern
        let modeD_match = true;
        for (const pair of pairs) {
            const extracted = extractUniqueRegion(pair.input);
            if (!extracted || !gridsEqual(extracted, pair.output)) {
                modeD_match = false;
                break;
            }
        }
        if (modeD_match) return { mode: 'unique_region' };

        return null;
    }

    function extractBoundingBox(grid: number[][], markerVal: number | null): number[][] | null {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        let minR = rows, maxR = -1, minC = cols, maxC = -1;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const v = grid[r][c];
                const match = markerVal === null ? v !== 0 : v === markerVal;
                if (match) {
                    minR = Math.min(minR, r);
                    maxR = Math.max(maxR, r);
                    minC = Math.min(minC, c);
                    maxC = Math.max(maxC, c);
                }
            }
        }

        if (maxR < 0) return null;

        const result: number[][] = [];
        for (let r = minR; r <= maxR; r++) {
            result.push(grid[r].slice(minC, maxC + 1));
        }
        return result;
    }

    function extractSmallestRegion(grid: number[][]): number[][] | null {
        // Find connected components of non-zero cells, return the smallest one's bounding box
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const visited: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
        const components: { cells: [number, number][] }[] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== 0 && !visited[r][c]) {
                    // BFS to find connected component
                    const cells: [number, number][] = [];
                    const queue: [number, number][] = [[r, c]];
                    visited[r][c] = true;
                    while (queue.length > 0) {
                        const [cr, cc] = queue.shift()!;
                        cells.push([cr, cc]);
                        for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
                            const nr = cr + dr;
                            const nc = cc + dc;
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                                !visited[nr][nc] && grid[nr][nc] !== 0) {
                                visited[nr][nc] = true;
                                queue.push([nr, nc]);
                            }
                        }
                    }
                    components.push({ cells });
                }
            }
        }

        if (components.length === 0) return null;

        // Find smallest component
        components.sort((a, b) => a.cells.length - b.cells.length);
        const smallest = components[0];

        let minR = rows, maxR = -1, minC = cols, maxC = -1;
        for (const [r, c] of smallest.cells) {
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
            minC = Math.min(minC, c);
            maxC = Math.max(maxC, c);
        }

        const result: number[][] = [];
        for (let r = minR; r <= maxR; r++) {
            result.push(grid[r].slice(minC, maxC + 1));
        }
        return result;
    }

    function extractUniqueRegion(grid: number[][]): number[][] | null {
        // For tiled mosaics: find the non-repeating region
        // Strategy: try different tile sizes, find the tile that doesn't match the majority
        const rows = grid.length;
        const cols = grid[0]?.length || 0;

        // Try tile sizes that evenly divide the grid
        for (let tileH = 1; tileH <= Math.floor(rows / 2); tileH++) {
            if (rows % tileH !== 0) continue;
            for (let tileW = 1; tileW <= Math.floor(cols / 2); tileW++) {
                if (cols % tileW !== 0) continue;

                const tilesR = rows / tileH;
                const tilesC = cols / tileW;
                if (tilesR * tilesC < 3) continue; // Need at least 3 tiles

                // Extract all tiles
                const tiles: number[][][] = [];
                const tilePositions: [number, number][] = [];
                for (let tr = 0; tr < tilesR; tr++) {
                    for (let tc = 0; tc < tilesC; tc++) {
                        const tile: number[][] = [];
                        for (let r = 0; r < tileH; r++) {
                            tile.push(grid[tr * tileH + r].slice(tc * tileW, tc * tileW + tileW));
                        }
                        tiles.push(tile);
                        tilePositions.push([tr, tc]);
                    }
                }

                // Find the majority tile (most common pattern)
                const tileStrings = tiles.map(t => t.map(r => r.join(',')).join(';'));
                const counts = new Map<string, number>();
                for (const ts of tileStrings) {
                    counts.set(ts, (counts.get(ts) || 0) + 1);
                }

                let majorityStr = '';
                let majorityCount = 0;
                for (const [ts, cnt] of counts) {
                    if (cnt > majorityCount) {
                        majorityCount = cnt;
                        majorityStr = ts;
                    }
                }

                // If there's exactly one tile that differs from the majority, that's our unique region
                const uniqueIndices: number[] = [];
                for (let i = 0; i < tileStrings.length; i++) {
                    if (tileStrings[i] !== majorityStr) {
                        uniqueIndices.push(i);
                    }
                }

                if (uniqueIndices.length === 1) {
                    return tiles[uniqueIndices[0]];
                }
            }
        }

        return null;
    }

    function applySubPatternExtraction(grid: number[][], mode: string, markerVal?: number): number[][] {
        switch (mode) {
            case 'bounding_box':
                return extractBoundingBox(grid, null) || grid;
            case 'marker':
                return extractBoundingBox(grid, markerVal ?? 0) || grid;
            case 'smallest_region':
                return extractSmallestRegion(grid) || grid;
            case 'unique_region':
                return extractUniqueRegion(grid) || grid;
            default:
                return grid;
        }
    }

    // =========================================================================
    // T14: Height-Rank Colouring
    // =========================================================================
    // Count the height of non-zero stacks in each column.
    // Rank columns by height (tallest = rank 1, etc.).
    // Replace non-zero cells with a colour based on rank.
    // =========================================================================

    function tryHeightRankColouring(pairs: GridPair[]): boolean {
        if (pairs.length === 0) return false;

        for (const pair of pairs) {
            if (pair.input.length !== pair.output.length) return false;
            if (pair.input[0]?.length !== pair.output[0]?.length) return false;

            const result = applyHeightRankColouring(pair.input);
            if (!gridsEqual(result, pair.output)) return false;
        }
        return true;
    }

    function applyHeightRankColouring(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;

        // Count non-zero cells per column (height)
        const heights: number[] = [];
        for (let c = 0; c < cols; c++) {
            let count = 0;
            for (let r = 0; r < rows; r++) {
                if (grid[r][c] !== 0) count++;
            }
            heights.push(count);
        }

        // Rank columns by height (tallest = rank 1)
        // Create sorted unique heights in descending order
        const uniqueHeights = [...new Set(heights)].filter(h => h > 0).sort((a, b) => b - a);
        const heightToRank = new Map<number, number>();
        for (let i = 0; i < uniqueHeights.length; i++) {
            heightToRank.set(uniqueHeights[i], i + 1);
        }

        // Build output: replace non-zero cells with rank value
        const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let c = 0; c < cols; c++) {
            const rank = heightToRank.get(heights[c]) || 0;
            for (let r = 0; r < rows; r++) {
                if (grid[r][c] !== 0) {
                    result[r][c] = rank;
                }
            }
        }

        return result;
    }

    // =========================================================================
    // T15a: Gravity Left
    // =========================================================================
    // Non-zero values slide left within each row.
    // =========================================================================

    function gravityLeft(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let r = 0; r < rows; r++) {
            const nonZero: number[] = [];
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== 0) nonZero.push(grid[r][c]);
            }
            // Place at left, preserving order
            for (let i = 0; i < nonZero.length; i++) {
                result[r][i] = nonZero[i];
            }
        }
        return result;
    }

    // =========================================================================
    // T15b: Gravity Right
    // =========================================================================
    // Non-zero values slide right within each row.
    // =========================================================================

    function gravityRight(grid: number[][]): number[][] {
        const rows = grid.length;
        const cols = grid[0]?.length || 0;
        const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let r = 0; r < rows; r++) {
            const nonZero: number[] = [];
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== 0) nonZero.push(grid[r][c]);
            }
            // Place at right, preserving order
            let writePos = cols - 1;
            for (let i = nonZero.length - 1; i >= 0; i--) {
                result[r][writePos] = nonZero[i];
                writePos--;
            }
        }
        return result;
    }

    // =========================================================================
    // T16: Compound Rules
    // =========================================================================
    // Try every pair of simple transforms in sequence.
    // For each pair (A, B): apply A to training input, then B to result,
    // check if it matches training output. If a compound rule matches all
    // training pairs, use it.
    // =========================================================================

    function tryCompoundRules(pairs: GridPair[], simpleTransforms: TransformCandidate[]): TransformCandidate | null {
        if (pairs.length === 0) return null;

        for (const tA of simpleTransforms) {
            for (const tB of simpleTransforms) {
                // Skip identity pairs (same transform twice is usually not useful,
                // but allow it for some cases like double rotation)
                let allMatch = true;
                for (const pair of pairs) {
                    try {
                        const intermediate = tA.apply(pair.input);
                        const final_result = tB.apply(intermediate);
                        if (!gridsEqual(final_result, pair.output)) {
                            allMatch = false;
                            break;
                        }
                    } catch {
                        allMatch = false;
                        break;
                    }
                }
                if (allMatch) {
                    const compoundName = `${tA.name} → ${tB.name}`;
                    const compoundId = `T16: ${tA.id}+${tB.id}`;
                    return {
                        name: compoundName,
                        id: compoundId,
                        apply: (grid: number[][]) => {
                            const intermediate = tA.apply(grid);
                            return tB.apply(intermediate);
                        }
                    };
                }
            }
        }
        return null;
    }


    // =========================================================================
    // PHASE 3: Register new transforms in the candidates array
    // =========================================================================
    // This block adds the new transforms to the existing testing pipeline.
    // It should be placed AFTER the existing spatial/compositional checks
    // and BEFORE the final "no rule found" fallback.
    // =========================================================================

    // --- Add gravity left/right to spatial transforms ---
    if (!ruleApply) {
        lines.push('  Step 3b — Testing Phase 3 spatial transforms...');
        const phase3Spatial: TransformCandidate[] = [
            { name: 'Gravity Left', id: 'T15a', apply: gravityLeft },
            { name: 'Gravity Right', id: 'T15b', apply: gravityRight },
        ];

        for (const transform of phase3Spatial) {
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
            lines.push('           No Phase 3 spatial transform matched.');
        }
    }

    // --- Check border/surround (T10) ---
    if (!ruleApply) {
        lines.push('  Step 5b — Testing Phase 3 compositional rules...');

        const borderResult = tryBorderSurround(puzzle.training);
        if (borderResult) {
            identifiedRule = `T10: Border/Surround (target=${borderResult.targetVal}, border=${borderResult.borderVal})`;
            ruleApply = (grid) => applyBorderSurround(grid, borderResult.targetVal, borderResult.borderVal);
            lines.push(`           Border/Surround VERIFIED (target=${borderResult.targetVal}, border=${borderResult.borderVal}). ✓`);
        }
    }

    // --- Check sub-pattern extraction (T12) ---
    if (!ruleApply) {
        const subResult = trySubPatternExtraction(puzzle.training);
        if (subResult) {
            identifiedRule = `T12: Sub-Pattern Extraction (mode=${subResult.mode}${subResult.markerVal !== undefined ? ', marker=' + subResult.markerVal : ''})`;
            ruleApply = (grid) => applySubPatternExtraction(grid, subResult.mode, subResult.markerVal);
            lines.push(`           Sub-Pattern Extraction VERIFIED (mode=${subResult.mode}). ✓`);
        }
    }

    // --- Check height-rank colouring (T14) ---
    if (!ruleApply) {
        lines.push('  Step 6b — Testing Phase 3 conditional rules...');

        if (tryHeightRankColouring(puzzle.training)) {
            identifiedRule = 'T14: Height-Rank Colouring';
            ruleApply = applyHeightRankColouring;
            lines.push('           Height-Rank Colouring VERIFIED. ✓');
        }
    }

    // --- Check compound rules (T16) ---
    if (!ruleApply) {
        lines.push('  Step 7 — Testing compound rules (Phase 3)...');

        // Build the full list of simple transforms for compound testing
        const allSimpleTransforms: TransformCandidate[] = [
            { name: 'Horizontal Reflection', id: 'T02', apply: horizontalReflect },
            { name: 'Vertical Reflection', id: 'T03', apply: verticalReflect },
            { name: 'Rotation 90° CW', id: 'T04', apply: rotate90 },
            { name: 'Rotation 180°', id: 'T05', apply: rotate180 },
            { name: 'Rotation 270° CW', id: 'T06', apply: rotate270 },
            { name: 'Transposition', id: 'T07', apply: transpose },
            { name: 'Gravity Down', id: 'T08', apply: gravityDown },
            { name: 'Gravity Up', id: 'T08b', apply: gravityUp },
            { name: 'Gravity Left', id: 'T15a', apply: gravityLeft },
            { name: 'Gravity Right', id: 'T15b', apply: gravityRight },
        ];

        // Add value substitution if detected
        if (subMap) {
            allSimpleTransforms.push({
                name: 'Value Substitution',
                id: 'T01',
                apply: (grid) => applyValueSubstitution(grid, subMap)
            });
        }

        const compound = tryCompoundRules(puzzle.training, allSimpleTransforms);
        if (compound) {
            identifiedRule = compound.id + ': ' + compound.name;
            ruleApply = compound.apply;
            lines.push(`           Compound Rule VERIFIED: ${compound.name}. ✓`);
        } else {
            lines.push('           No compound rule matched.');
        }
    }

// --- END PHASE 3 TRANSFORMS ---
