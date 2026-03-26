// =============================================================================
// ARA PHASE 2 HARDENING — Grid Output Self-Verification
// =============================================================================
// FILE:    cognitiveLoop.ts (or a new utility imported by cognitiveLoop.ts)
// TARGET:  Post-LLM response processing — verify the grid output before
//          returning it as the final answer.
//
// PURPOSE: The LLM (Groq) sometimes returns grids with wrong dimensions,
//          invalid values, or malformed formatting. This function parses the
//          ```grid``` block from the LLM response, validates it against
//          training-pair expectations, and appends warnings if checks fail.
//
// INSTALL: The phase2_apply.py script handles insertion automatically.
//          Manual install: import or paste this function, then call it after
//          receiving the LLM response and before returning the final answer.
//
// USAGE:
//   const verified = verifyGridOutput(llmResponse, job.input);
//   if (verified.warnings.length > 0) {
//     // Append warnings to the response
//     finalResponse = llmResponse + '\n\n' + verified.warnings.join('\n');
//   }
// =============================================================================


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GridVerificationResult {
  /** Whether a ```grid``` block was found in the response */
  gridFound: boolean;
  /** The parsed grid (empty array if not found or unparseable) */
  parsedGrid: number[][];
  /** Dimensions of the parsed grid: [rows, cols] */
  dimensions: [number, number];
  /** Whether all checks passed */
  valid: boolean;
  /** List of warning messages for failed checks */
  warnings: string[];
  /** The raw grid text extracted from the code block */
  rawGridText: string;
}

interface TrainingDims {
  inputRows: number;
  inputCols: number;
  outputRows: number;
  outputCols: number;
}


// ---------------------------------------------------------------------------
// Main verification function
// ---------------------------------------------------------------------------

/**
 * Verify the LLM's grid output against training-pair expectations.
 *
 * Checks performed:
 *   (a) A ```grid``` code block exists in the response
 *   (b) The grid is parseable as rows of space-separated integers
 *   (c) All values are in the valid range 0-9
 *   (d) All rows have the same number of columns (rectangular grid)
 *   (e) Dimensions are consistent with the ratio from training examples
 *
 * @param llmResponse - The full text response from the LLM
 * @param jobInput    - The original job.input containing training examples
 * @returns GridVerificationResult with parsed grid, validity, and warnings
 */
export function verifyGridOutput(
  llmResponse: string,
  jobInput: string
): GridVerificationResult {
  const result: GridVerificationResult = {
    gridFound: false,
    parsedGrid: [],
    dimensions: [0, 0],
    valid: true,
    warnings: [],
    rawGridText: '',
  };

  // --- (a) Extract the ```grid``` code block ---
  const gridBlockRegex = /```grid\s*\n([\s\S]*?)```/;
  const match = llmResponse.match(gridBlockRegex);

  if (!match || !match[1]) {
    // Fallback: try generic code block that looks like a grid
    const fallbackRegex = /```\s*\n((?:\s*\d[\d\s]*\n)+)\s*```/;
    const fallbackMatch = llmResponse.match(fallbackRegex);

    if (fallbackMatch && fallbackMatch[1]) {
      result.rawGridText = fallbackMatch[1].trim();
      result.warnings.push(
        'GRID_VERIFY WARNING: No ```grid``` block found. ' +
        'Extracted grid from generic code block. Verify format.'
      );
    } else {
      result.gridFound = false;
      result.valid = false;
      result.warnings.push(
        'GRID_VERIFY ERROR: No ```grid``` code block found in LLM response. ' +
        'The LLM did not follow the output format instruction. ' +
        'Response may contain the answer in plain text — manual extraction needed.'
      );
      return result;
    }
  } else {
    result.rawGridText = match[1].trim();
  }

  result.gridFound = true;

  // --- (b) Parse the grid ---
  const lines = result.rawGridText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    result.valid = false;
    result.warnings.push(
      'GRID_VERIFY ERROR: ```grid``` block is empty.'
    );
    return result;
  }

  const parsedRows: number[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Handle space-separated, comma-separated, or mixed formats
    const cleaned = line.replace(/[\[\],]/g, ' ').trim();
    const values = cleaned.split(/\s+/).map(v => {
      const n = parseInt(v, 10);
      return isNaN(n) ? -1 : n;
    });

    if (values.some(v => v === -1)) {
      result.valid = false;
      result.warnings.push(
        `GRID_VERIFY ERROR: Row ${i + 1} contains non-integer values: "${line}"`
      );
      // Still add what we can parse for dimension checking
      parsedRows.push(values.filter(v => v !== -1));
    } else {
      parsedRows.push(values);
    }
  }

  result.parsedGrid = parsedRows;
  result.dimensions = [
    parsedRows.length,
    parsedRows.length > 0 ? parsedRows[0].length : 0,
  ];

  // --- (c) Check all values are in range 0-9 ---
  for (let r = 0; r < parsedRows.length; r++) {
    for (let c = 0; c < parsedRows[r].length; c++) {
      const v = parsedRows[r][c];
      if (v < 0 || v > 9) {
        result.valid = false;
        result.warnings.push(
          `GRID_VERIFY ERROR: Value ${v} at row ${r + 1}, col ${c + 1} ` +
          `is outside valid range 0-9.`
        );
        break; // One warning per issue type is enough
      }
    }
    if (!result.valid && result.warnings.some(w => w.includes('outside valid range'))) {
      break;
    }
  }

  // --- (d) Check rectangular (all rows same length) ---
  const colCounts = parsedRows.map(row => row.length);
  const uniqueColCounts = [...new Set(colCounts)];
  if (uniqueColCounts.length > 1) {
    result.valid = false;
    result.warnings.push(
      `GRID_VERIFY ERROR: Grid is not rectangular. ` +
      `Row lengths: ${colCounts.join(', ')}. ` +
      `Expected all rows to have ${colCounts[0]} columns.`
    );
  }

  // --- (e) Check dimensions against training pair ratio ---
  const trainingDims = extractTrainingDimensions(jobInput);
  if (trainingDims) {
    const rowRatio = trainingDims.outputRows / trainingDims.inputRows;
    const colRatio = trainingDims.outputCols / trainingDims.inputCols;

    // Try to extract test input dimensions
    const testDims = extractTestInputDimensions(jobInput);
    if (testDims) {
      const expectedRows = Math.round(testDims.rows * rowRatio);
      const expectedCols = Math.round(testDims.cols * colRatio);

      if (result.dimensions[0] !== expectedRows) {
        result.valid = false;
        result.warnings.push(
          `GRID_VERIFY WARNING: Expected ${expectedRows} rows ` +
          `(test ${testDims.rows} × ratio ${rowRatio.toFixed(2)}), ` +
          `got ${result.dimensions[0]}. Dimension mismatch.`
        );
      }
      if (result.dimensions[1] !== expectedCols && result.dimensions[1] > 0) {
        result.valid = false;
        result.warnings.push(
          `GRID_VERIFY WARNING: Expected ${expectedCols} cols ` +
          `(test ${testDims.cols} × ratio ${colRatio.toFixed(2)}), ` +
          `got ${result.dimensions[1]}. Dimension mismatch.`
        );
      }
    }

    // Also check if output dimensions match training output dimensions directly
    // (many puzzles have fixed output size regardless of input)
    if (
      result.dimensions[0] !== trainingDims.outputRows ||
      result.dimensions[1] !== trainingDims.outputCols
    ) {
      // Only warn if ratio-based check also failed or wasn't possible
      if (!testDims) {
        result.warnings.push(
          `GRID_VERIFY INFO: Output is ${result.dimensions[0]}×${result.dimensions[1]}, ` +
          `training outputs were ${trainingDims.outputRows}×${trainingDims.outputCols}. ` +
          `Verify this is expected for the test input.`
        );
      }
    }
  }

  return result;
}


// ---------------------------------------------------------------------------
// Helper: Extract training pair dimensions from job.input
// ---------------------------------------------------------------------------

function extractTrainingDimensions(jobInput: string): TrainingDims | null {
  if (!jobInput) return null;

  // Look for the first training pair's input and output grids
  const sections = jobInput.split(
    /(?:training\s*(?:example\s*)?\d*\s*:|example\s*\d+\s*:)/i
  );

  if (sections.length < 2) return null;

  const firstSection = sections[1];
  const ioParts = firstSection.split(/(?:output\s*:)/i);
  if (ioParts.length < 2) return null;

  const inputText = ioParts[0].replace(/input\s*:/i, '');
  const outputText = ioParts[1].split(
    /(?:training|example|test)\s*(?:example\s*)?\d*\s*:/i
  )[0];

  const inputGrid = parseGridLines(inputText);
  const outputGrid = parseGridLines(outputText);

  if (inputGrid.length === 0 || outputGrid.length === 0) return null;

  return {
    inputRows: inputGrid.length,
    inputCols: inputGrid[0],
    outputRows: outputGrid.length,
    outputCols: outputGrid[0],
  };
}


// ---------------------------------------------------------------------------
// Helper: Extract test input dimensions from job.input
// ---------------------------------------------------------------------------

function extractTestInputDimensions(
  jobInput: string
): { rows: number; cols: number } | null {
  if (!jobInput) return null;

  const testMatch = jobInput.split(/(?:test\s*(?:input\s*)?:)/i);
  if (testMatch.length < 2) return null;

  const testSection = testMatch[testMatch.length - 1].split(
    /(?:test\s*output|expected|answer)/i
  )[0];

  const gridLines = parseGridLines(testSection);
  if (gridLines.length === 0) return null;

  return { rows: gridLines.length, cols: gridLines[0] };
}


// ---------------------------------------------------------------------------
// Helper: Parse grid lines and return array of column counts per row
// ---------------------------------------------------------------------------

function parseGridLines(text: string): number[] {
  const lines = text.trim().split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length === 0) return false;
      if (/^[=\-*~#]{3,}$/.test(line)) return false;
      if (/^(input|output|test|training|example)\s*\d*\s*:?\s*$/i.test(line)) return false;
      // Must contain at least one digit to be a grid row
      return /\d/.test(line);
    });

  const colCounts: number[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/[\[\],]/g, ' ').trim();
    const values = cleaned.split(/\s+/).filter(v => /^\d+$/.test(v));
    if (values.length > 0) {
      colCounts.push(values.length);
    }
  }

  return colCounts;
}


// ---------------------------------------------------------------------------
// Convenience: Format verification result as appendable text
// ---------------------------------------------------------------------------

/**
 * Format the verification result as a human-readable block that can be
 * appended to the LLM response before returning to the user.
 *
 * @param result - The GridVerificationResult from verifyGridOutput
 * @returns Formatted string, or empty string if all checks passed
 */
export function formatVerificationReport(
  result: GridVerificationResult
): string {
  if (result.valid && result.warnings.length === 0) {
    return ''; // All good, nothing to append
  }

  const lines: string[] = [];
  lines.push('');
  lines.push('=== GRID VERIFICATION REPORT ===');

  if (!result.gridFound) {
    lines.push('STATUS: FAILED — No grid block found in response.');
  } else if (!result.valid) {
    lines.push('STATUS: WARNINGS DETECTED — Review output carefully.');
    lines.push(`Grid dimensions: ${result.dimensions[0]}×${result.dimensions[1]}`);
  }

  for (const warning of result.warnings) {
    lines.push(`  ${warning}`);
  }

  lines.push('=== END VERIFICATION REPORT ===');

  return lines.join('\n');
}


// ---------------------------------------------------------------------------
// Integration snippet — paste after the LLM response is received
// ---------------------------------------------------------------------------

/*
  USAGE IN cognitiveLoop.ts:

  // After receiving LLM response...
  let llmResponse = await callLLM(messages);

  // PHASE 2: Verify grid output for puzzle domains
  if (job.domain === 'check' || job.domain === 'analytical') {
    const verification = verifyGridOutput(llmResponse, job.input);
    const report = formatVerificationReport(verification);
    if (report.length > 0) {
      llmResponse += report;
    }
  }

  // Continue with existing response handling...
*/


// --- END PHASE 2 GRID VERIFICATION ---
