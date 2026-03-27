#!/usr/bin/env python3
"""
ARA Phase 2.1 Hotfix — Automatic Patch Installer
==================================================
Applies Phase 2.1 hotfix patches to cognitiveLoop.ts:

  BUG 1 (CRITICAL): Rewrites extractPuzzleData() to handle the actual
         runARC.py puzzle format ("-- Train Example N ..." with no colon).
         Also updates parseGrid() to filter non-grid lines more robustly.

  BUG 2 (HIGH):     Adds a conciseness instruction to GRID_PUZZLE_DOCTRINE
         so LLM responses stay under 4000 chars and avoid router rejection.

  BUG 3 (LOW):      Documented only — creativity engine variable extraction
         for grid puzzles. No code change in this release.

Usage:
    python3 ~/ara-phase2/phase21_apply.py --ara-dir ~/ara

Requirements:
    - Python 3.6+ (no external dependencies)
    - cognitiveLoop.ts must exist in the ARA directory

Version: 2.1.0
"""

import os
import sys
import re
import shutil
from datetime import datetime

# =============================================================================
# Constants
# =============================================================================

VERSION = "2.1.0"
BACKUP_SUFFIX = ".phase21.backup"

# =============================================================================
# BUG 1 FIX: New extractPuzzleData() and updated parseGrid()
# =============================================================================
# This is the TypeScript replacement code for the broken parser.
# It handles the actual runARC.py format:
#   - "-- Train Example N (input RxC -> output RxC) --"
#   - "Input:" / "Output:" labels within examples
#   - "TEST INPUT -- predict the output for this grid:"
#   - Indented grid lines, dimension annotations, headers, etc.

NEW_PARSE_GRID = r'''    function parseGrid(text: string): number[][] {
        const rows = text.trim().split('\n')
            .map(line => line.trim())
            .filter(line => {
                if (line.length === 0) return false;
                // Filter separator lines
                if (/^[=\-*~#]{3,}$/.test(line)) return false;
                // Filter label/header lines
                if (/^(Input|Output|Train|Test|TRAINING|PUZZLE|DIFFICULTY|COMPETITION|RULES|ANSWER)/i.test(line)) return false;
                // Filter dimension annotations like (3x3)
                if (/^\(\d+x\d+\)$/.test(line)) return false;
                // A grid line must be entirely digits (and separators like [ ] ,)
                const cleaned = line.replace(/[\[\],]/g, ' ').trim();
                const tokens = cleaned.split(/\s+/);
                if (tokens.length === 0) return false;
                return tokens.every(t => /^\d+$/.test(t));
            });
        return rows.map(row => {
            const cleaned = row.replace(/[\[\],]/g, '').trim();
            const separator = cleaned.includes(',') ? ',' : /\s+/;
            return cleaned.split(separator).map(v => parseInt(v.toString().trim(), 10)).filter(v => !isNaN(v));
        }).filter(row => row.length > 0);
    }'''

NEW_EXTRACT_PUZZLE_DATA = r'''    function extractPuzzleData(text: string): ParsedPuzzle {
        const training: GridPair[] = [];
        let testInput: number[][] = [];

        // ---------------------------------------------------------------
        // Strategy A: Split on "-- Train Example N" pattern
        // Matches: "-- Train Example 1  (input 3x3  ->  output 3x3) --"
        //          "-- Train Example 1 --"
        //          "-- Training Example 1 --"
        // ---------------------------------------------------------------
        const examplePattern = /--\s*Train(?:ing)?\s*Example\s*\d+/gi;
        const exampleSplits = text.split(examplePattern);

        if (exampleSplits.length > 1) {
            for (let i = 1; i < exampleSplits.length; i++) {
                let section = exampleSplits[i];
                // Remove leading dimension annotation and trailing "--"
                // e.g. "  (input 3x3  ->  output 3x3) --\n..."
                section = section.replace(/^[^-]*--/, '');

                // Split on "Output:" to separate input and output grids
                const ioParts = section.split(/Output\s*:/i);
                if (ioParts.length >= 2) {
                    const inputText = ioParts[0].replace(/Input\s*:/i, '');
                    // Truncate output at TEST INPUT or heavy separator lines
                    let outputText = ioParts[1];
                    outputText = outputText.split(/(?:TEST\s+INPUT|={10,})/i)[0];

                    const inputGrid = parseGrid(inputText);
                    const outputGrid = parseGrid(outputText);
                    if (inputGrid.length > 0 && outputGrid.length > 0) {
                        training.push({ input: inputGrid, output: outputGrid });
                    }
                }
            }
        }

        // ---------------------------------------------------------------
        // Strategy B (fallback): Try old-style "Training Example N:" with colon
        // ---------------------------------------------------------------
        if (training.length === 0) {
            const colonSections = text.split(/(?:training\s*(?:example\s*)?\d*\s*:|example\s*\d+\s*:)/i);
            if (colonSections.length > 1) {
                for (let i = 1; i < colonSections.length; i++) {
                    const section = colonSections[i];
                    const ioParts = section.split(/(?:output\s*:)/i);
                    if (ioParts.length >= 2) {
                        const inputGrid = parseGrid(ioParts[0].replace(/input\s*:/i, ''));
                        let outputText = ioParts[1].split(/(?:test\s+input|={10,})/i)[0];
                        const outputGrid = parseGrid(outputText);
                        if (inputGrid.length > 0 && outputGrid.length > 0) {
                            training.push({ input: inputGrid, output: outputGrid });
                        }
                    }
                }
            }
        }

        // ---------------------------------------------------------------
        // Extract test input: match "TEST INPUT" (no colon required)
        // ---------------------------------------------------------------
        const testSplits = text.split(/TEST\s+INPUT/i);
        if (testSplits.length > 1) {
            let testSection = testSplits[testSplits.length - 1];
            // Truncate at end markers
            testSection = testSection.split(/(?:TEST\s*OUTPUT|EXPECTED\s*OUTPUT|ANSWER|={10,})/i)[0];
            testInput = parseGrid(testSection);
        }

        // ---------------------------------------------------------------
        // Strategy C (last resort): grid blocks separated by blank lines
        // ---------------------------------------------------------------
        if (training.length === 0) {
            const gridBlocks: number[][][] = [];
            const blockTexts = text.split(/\n\s*\n/).filter(b => b.trim().length > 0);
            for (const block of blockTexts) {
                const grid = parseGrid(block);
                if (grid.length > 0 && grid[0].length > 0) {
                    gridBlocks.push(grid);
                }
            }
            for (let i = 0; i + 1 < gridBlocks.length - 1; i += 2) {
                training.push({ input: gridBlocks[i], output: gridBlocks[i + 1] });
            }
            if (gridBlocks.length > 0 && gridBlocks.length % 2 === 1 && testInput.length === 0) {
                testInput = gridBlocks[gridBlocks.length - 1];
            }
        }

        return { training, testInput };
    }'''

# The old parseGrid function signature to find
OLD_PARSE_GRID_SIGNATURES = [
    # Exact match for the known broken version
    "function parseGrid(text: string): number[][] {",
]

# The old extractPuzzleData function signature to find
OLD_EXTRACT_SIGNATURES = [
    "function extractPuzzleData(text: string): ParsedPuzzle {",
]

# =============================================================================
# BUG 2 FIX: Conciseness instruction for GRID_PUZZLE_DOCTRINE
# =============================================================================

CONCISENESS_INSTRUCTION = (
    "\nIMPORTANT: Be CONCISE. Limit your reasoning to 1-2 sentences per step. "
    "The total response must be under 4000 characters. "
    "Focus on the grid answer, not lengthy explanations.\n"
)

# Where to inject the conciseness instruction (after the last line of the doctrine)
DOCTRINE_INJECTION_MARKERS = [
    # After the "Show your work" line
    "Show your work: for each step, briefly state what you tested and the result.",
    "Show your work briefly. After Step 8 verification, output the grid block.",
    # After the output format block
    "After Step 8 verification passes, output the answer in the grid block above.",
    # After the closing backticks of the grid example
    "After Step 8 verification",
]

# Alternative: look for the end of the doctrine template literal
DOCTRINE_END_MARKERS = [
    "`;",  # End of template literal
    "// --- END PHASE 2: DOCTRINE INJECTION ---",
    "// --- END PHASE 2 DOCTRINE INJECTION ---",
]


# =============================================================================
# Helpers
# =============================================================================

def log(msg, indent=0):
    """Print a log message with optional indent."""
    prefix = "  " * indent
    print(f"{prefix}{msg}")


def find_ara_dir():
    """Find the ARA directory from CLI args or common locations."""
    if '--ara-dir' in sys.argv:
        idx = sys.argv.index('--ara-dir')
        if idx + 1 < len(sys.argv):
            path = os.path.expanduser(sys.argv[idx + 1])
            return path
    home = os.path.expanduser('~')
    candidates = [
        os.path.join(home, 'ara'),
        os.getcwd(),
    ]
    for d in candidates:
        if os.path.isfile(os.path.join(d, 'cognitiveLoop.ts')):
            return d
    return None


def backup_file(filepath):
    """Create a timestamped backup of a file."""
    backup_path = filepath + BACKUP_SUFFIX
    if os.path.isfile(backup_path):
        # Create a timestamped version instead
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = filepath + f".phase21.{ts}.backup"
    shutil.copy2(filepath, backup_path)
    log(f"Backup created: {backup_path}", 1)
    return backup_path


def read_file(filepath):
    """Read a file and return its content."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def write_file(filepath, content):
    """Write content to a file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


# =============================================================================
# Patch 1: Replace extractPuzzleData() and parseGrid()
# =============================================================================

def find_function_bounds(content, func_signature):
    """
    Find the start line and end line of a function in the content.
    Uses brace counting to find the matching closing brace.
    Returns (start_line_idx, end_line_idx) or (None, None).
    """
    lines = content.split('\n')
    start = None
    for i, line in enumerate(lines):
        if func_signature in line:
            start = i
            break

    if start is None:
        return None, None

    # Count braces from the start line
    brace_count = 0
    found_open = False
    for i in range(start, len(lines)):
        for ch in lines[i]:
            if ch == '{':
                brace_count += 1
                found_open = True
            elif ch == '}':
                brace_count -= 1
        if found_open and brace_count == 0:
            return start, i
    return start, None


def apply_parser_fix(content):
    """
    Replace the broken extractPuzzleData() and parseGrid() functions
    with the fixed versions.

    Strategy A: Find function by exact signature, replace using brace counting.
    Strategy B: Find function by regex pattern, replace.
    Strategy C: If function not found, append with warning.

    Returns (new_content, success, message).
    """
    messages = []
    modified = content

    # --- Fix parseGrid ---
    log("Patching parseGrid()...", 1)

    pg_start, pg_end = find_function_bounds(modified, "function parseGrid(text: string): number[][]")
    if pg_start is not None and pg_end is not None:
        lines = modified.split('\n')
        old_pg = '\n'.join(lines[pg_start:pg_end + 1])
        modified = modified.replace(old_pg, NEW_PARSE_GRID)
        messages.append(f"parseGrid(): replaced lines {pg_start+1}-{pg_end+1} (Strategy A: exact signature + brace counting)")
        log(f"  Replaced parseGrid() at lines {pg_start+1}-{pg_end+1}", 2)
    else:
        # Strategy B: regex-based search
        pg_match = re.search(
            r'function parseGrid\s*\(text:\s*string\)\s*:\s*number\[\]\[\]\s*\{',
            modified
        )
        if pg_match:
            # Find matching brace from the match position
            start_pos = pg_match.start()
            brace_count = 0
            end_pos = None
            for i in range(pg_match.end() - 1, len(modified)):
                if modified[i] == '{':
                    brace_count += 1
                elif modified[i] == '}':
                    brace_count -= 1
                if brace_count == 0:
                    end_pos = i + 1
                    break
            if end_pos:
                old_func = modified[start_pos:end_pos]
                modified = modified[:start_pos] + NEW_PARSE_GRID + modified[end_pos:]
                messages.append("parseGrid(): replaced (Strategy B: regex + brace counting)")
                log("  Replaced parseGrid() via regex", 2)
            else:
                messages.append("parseGrid(): WARNING — found signature but couldn't find closing brace")
                log("  WARNING: parseGrid() closing brace not found", 2)
        else:
            messages.append("parseGrid(): WARNING — function not found. May need manual patching.")
            log("  WARNING: parseGrid() not found in file", 2)

    # --- Fix extractPuzzleData ---
    log("Patching extractPuzzleData()...", 1)

    ep_start, ep_end = find_function_bounds(modified, "function extractPuzzleData(text: string): ParsedPuzzle")
    if ep_start is not None and ep_end is not None:
        lines = modified.split('\n')
        old_ep = '\n'.join(lines[ep_start:ep_end + 1])
        modified = modified.replace(old_ep, NEW_EXTRACT_PUZZLE_DATA)
        messages.append(f"extractPuzzleData(): replaced lines {ep_start+1}-{ep_end+1} (Strategy A)")
        log(f"  Replaced extractPuzzleData() at lines {ep_start+1}-{ep_end+1}", 2)
    else:
        # Strategy B: regex
        ep_match = re.search(
            r'function extractPuzzleData\s*\(text:\s*string\)\s*:\s*ParsedPuzzle\s*\{',
            modified
        )
        if ep_match:
            start_pos = ep_match.start()
            brace_count = 0
            end_pos = None
            for i in range(ep_match.end() - 1, len(modified)):
                if modified[i] == '{':
                    brace_count += 1
                elif modified[i] == '}':
                    brace_count -= 1
                if brace_count == 0:
                    end_pos = i + 1
                    break
            if end_pos:
                modified = modified[:start_pos] + NEW_EXTRACT_PUZZLE_DATA + modified[end_pos:]
                messages.append("extractPuzzleData(): replaced (Strategy B)")
                log("  Replaced extractPuzzleData() via regex", 2)
            else:
                messages.append("extractPuzzleData(): WARNING — found signature but couldn't find closing brace")
        else:
            messages.append("extractPuzzleData(): WARNING — function not found. May need manual patching.")
            log("  WARNING: extractPuzzleData() not found in file", 2)

    success = "WARNING" not in ' '.join(messages)
    return modified, success, '; '.join(messages)


# =============================================================================
# Patch 2: Add conciseness instruction to GRID_PUZZLE_DOCTRINE
# =============================================================================

def apply_conciseness_fix(content):
    """
    Add the conciseness instruction to the GRID_PUZZLE_DOCTRINE constant.

    Strategy A: Find a known marker line and inject after it.
    Strategy B: Find the end of the template literal and inject before it.
    Strategy C: Use regex to find the doctrine block and inject.

    Returns (new_content, success, message).
    """
    # Check if already applied
    if "Be CONCISE" in content or "under 4000 characters" in content:
        return content, True, "Conciseness instruction already present."

    # Check if doctrine exists at all
    if "GRID_PUZZLE_DOCTRINE" not in content:
        return content, False, "GRID_PUZZLE_DOCTRINE not found in file. Apply Phase 2 first."

    modified = content

    # --- Strategy A: Find a known marker line ---
    for marker in DOCTRINE_INJECTION_MARKERS:
        if marker in modified:
            # Inject the conciseness instruction after this marker line
            injection = marker + CONCISENESS_INSTRUCTION
            modified = modified.replace(marker, injection, 1)
            return modified, True, f"Strategy A: Injected after '{marker[:50]}...'"

    # --- Strategy B: Find the end of the doctrine template literal ---
    # Look for the closing `; of the GRID_PUZZLE_DOCTRINE constant
    # Pattern: the doctrine ends with "`;" on its own line (possibly with whitespace)
    doctrine_match = re.search(
        r'(const\s+GRID_PUZZLE_DOCTRINE\s*=\s*`)([\s\S]*?)(`\s*;)',
        modified
    )
    if doctrine_match:
        # Inject before the closing backtick
        old_end = doctrine_match.group(3)
        new_end = CONCISENESS_INSTRUCTION.rstrip() + '\n' + old_end
        start = doctrine_match.start(3)
        end = doctrine_match.end(3)
        modified = modified[:start] + new_end + modified[end:]
        return modified, True, "Strategy B: Injected before closing backtick of doctrine template literal."

    # --- Strategy C: Find any doctrine-like block and append ---
    # Look for "PATTERN RECOGNITION DOCTRINE" and inject after the block
    if "PATTERN RECOGNITION DOCTRINE" in modified:
        # Find the last line of the doctrine block
        lines = modified.split('\n')
        doctrine_end = None
        for i, line in enumerate(lines):
            if 'PATTERN RECOGNITION DOCTRINE' in line:
                # Scan forward for the closing backtick
                for j in range(i + 1, min(i + 200, len(lines))):
                    if '`;' in lines[j]:
                        doctrine_end = j
                        break
                break

        if doctrine_end is not None:
            lines.insert(doctrine_end, CONCISENESS_INSTRUCTION.strip())
            modified = '\n'.join(lines)
            return modified, True, f"Strategy C: Injected at line {doctrine_end + 1} before doctrine closing."

    return modified, False, "Could not find injection point for conciseness instruction."


# =============================================================================
# Verification
# =============================================================================

def verify_phase21(content):
    """Run verification checks on the patched cognitiveLoop.ts."""
    checks = {
        # Parser fix checks
        'BUG 1: New parseGrid with grid-line filter':
            "tokens.every(t => /^\\d+$/.test(t))" in content or
            'tokens.every' in content,
        'BUG 1: New extractPuzzleData with Train Example pattern':
            "Train(?:ing)?\\s*Example\\s*\\d+" in content or
            "Train(?:ing)?\\\\s*Example" in content or
            "examplePattern" in content,
        'BUG 1: Strategy A (dash-delimited examples)':
            "exampleSplits" in content or "examplePattern" in content,
        'BUG 1: Strategy B (colon-delimited fallback)':
            "colonSections" in content or "training\\s*(?:example" in content,
        'BUG 1: TEST INPUT split (no colon required)':
            "TEST\\s+INPUT" in content or "TEST\\\\s+INPUT" in content,
        'BUG 1: Output boundary truncation':
            "={10,}" in content,

        # Conciseness fix checks
        'BUG 2: Conciseness instruction present':
            "Be CONCISE" in content or "under 4000 characters" in content,

        # Existing Phase 2 checks (should still pass)
        'Phase 2: Doctrine constant exists':
            'GRID_PUZZLE_DOCTRINE' in content,
        'Phase 2: Analytical branch exists':
            "job.domain === 'check'" in content or
            'job.domain === "check"' in content,
    }

    all_pass = True
    for check, result in checks.items():
        status = '\u2713' if result else '\u2717'
        log(f"{status}  {check}", 2)
        if not result:
            all_pass = False

    return all_pass


def check_brace_balance(content):
    """Rough brace-balance check."""
    # Strip comments
    content_stripped = re.sub(r'//[^\n]*', '', content)
    content_stripped = re.sub(r'/\*[\s\S]*?\*/', '', content_stripped)

    opens = content_stripped.count('{')
    closes = content_stripped.count('}')
    delta = opens - closes

    if delta == 0:
        log(f"\u2713  Brace balance: {opens} open, {closes} close — balanced", 2)
        return True
    else:
        log(f"\u2717  Brace balance: {opens} open, {closes} close — delta {delta:+d}", 2)
        if abs(delta) > 5:
            log("LIKELY SYNTAX ERROR — review the patched file manually.", 2)
            return False
        else:
            log("Small delta — likely from template literals. Verify with tsc.", 2)
            return True


# =============================================================================
# Self-Test: Validate parser logic on sample input
# =============================================================================

def self_test():
    """
    Run the parser logic (in Python) against the sample ARC puzzle format
    to verify the regex patterns work correctly before applying to TypeScript.
    """
    log("Running parser self-test on sample ARC puzzle...", 1)

    sample = (
        "======================================================================\n"
        "              ARC-AGI-2  REASONING  TEST\n"
        "======================================================================\n"
        "\n"
        "COMPETITION RULES & SCORING -- read carefully before answering:\n"
        "  1. This is an official ARC-AGI-2 reasoning test puzzle.\n"
        "  2. You have up to 2 attempts to predict the correct output grid.\n"
        "\n"
        "======================================================================\n"
        "PUZZLE ID : 0d3d703e\n"
        "DIFFICULTY: EASY  (Colour mapping / substitution)\n"
        "======================================================================\n"
        "\n"
        "TRAINING EXAMPLES (study these to discover the rule):\n"
        "\n"
        "  -- Train Example 1  (input 3x3  ->  output 3x3) --\n"
        "  Input:\n"
        "  3 1 2\n"
        "  3 1 2\n"
        "  3 1 2\n"
        "\n"
        "  Output:\n"
        "  4 5 6\n"
        "  4 5 6\n"
        "  4 5 6\n"
        "\n"
        "  -- Train Example 2  (input 3x3  ->  output 3x3) --\n"
        "  Input:\n"
        "  2 3 8\n"
        "  2 3 8\n"
        "  2 3 8\n"
        "\n"
        "  Output:\n"
        "  6 4 9\n"
        "  6 4 9\n"
        "  6 4 9\n"
        "\n"
        "======================================================================\n"
        "TEST INPUT -- predict the output for this grid:\n"
        "  (3x3)\n"
        "  8 1 3\n"
        "  8 1 3\n"
        "  8 1 3\n"
        "======================================================================\n"
    )

    import re as _re

    def _is_grid_line(line):
        stripped = line.strip()
        if not stripped:
            return False
        if _re.match(r'^[=\-*~#]{3,}$', stripped):
            return False
        if _re.match(r'^(Input|Output|Train|Test|TRAINING|PUZZLE|DIFFICULTY|COMPETITION|RULES|ANSWER)', stripped):
            return False
        if _re.match(r'^\(\d+x\d+\)$', stripped):
            return False
        cleaned = _re.sub(r'[\[\],]', ' ', stripped)
        tokens = cleaned.split()
        if not tokens:
            return False
        return all(_re.match(r'^\d+$', t) for t in tokens)

    def _parse_grid(text):
        rows = []
        for line in text.strip().split('\n'):
            if not _is_grid_line(line):
                continue
            cleaned = _re.sub(r'[\[\],]', ' ', line.strip()).strip()
            values = [int(v) for v in cleaned.split() if _re.match(r'^\d+$', v)]
            if values:
                rows.append(values)
        return rows

    def _extract(text):
        training = []
        test_input = []

        splits = _re.split(r'--\s*Train(?:ing)?\s*Example\s*\d+', text, flags=_re.IGNORECASE)
        if len(splits) > 1:
            for i in range(1, len(splits)):
                section = splits[i]
                section = _re.sub(r'^[^-]*--', '', section, count=1)
                io = _re.split(r'Output\s*:', section, flags=_re.IGNORECASE)
                if len(io) >= 2:
                    inp_text = _re.sub(r'Input\s*:', '', io[0], flags=_re.IGNORECASE)
                    out_text = _re.split(r'(?:TEST\s+INPUT|={10,})', io[1], flags=_re.IGNORECASE)[0]
                    ig = _parse_grid(inp_text)
                    og = _parse_grid(out_text)
                    if ig and og:
                        training.append({'input': ig, 'output': og})

        ts = _re.split(r'TEST\s+INPUT', text, flags=_re.IGNORECASE)
        if len(ts) > 1:
            tsec = _re.split(r'(?:TEST\s*OUTPUT|EXPECTED|ANSWER|={10,})', ts[-1], flags=_re.IGNORECASE)[0]
            test_input = _parse_grid(tsec)

        return {'training': training, 'testInput': test_input}

    result = _extract(sample)

    # Verify
    ok = True

    if len(result['training']) != 2:
        log(f"\u2717  Expected 2 training pairs, got {len(result['training'])}", 2)
        ok = False
    else:
        log(f"\u2713  Training pairs: {len(result['training'])}", 2)

    expected_pairs = [
        {'input': [[3,1,2],[3,1,2],[3,1,2]], 'output': [[4,5,6],[4,5,6],[4,5,6]]},
        {'input': [[2,3,8],[2,3,8],[2,3,8]], 'output': [[6,4,9],[6,4,9],[6,4,9]]},
    ]
    for idx, (exp, act) in enumerate(zip(expected_pairs, result['training'])):
        if act['input'] == exp['input'] and act['output'] == exp['output']:
            log(f"\u2713  Training pair {idx+1} matches expected", 2)
        else:
            log(f"\u2717  Training pair {idx+1} mismatch", 2)
            ok = False

    expected_test = [[8,1,3],[8,1,3],[8,1,3]]
    if result['testInput'] == expected_test:
        log(f"\u2713  Test input matches expected", 2)
    else:
        log(f"\u2717  Test input mismatch: {result['testInput']}", 2)
        ok = False

    if ok:
        log("\u2713  Parser self-test PASSED", 1)
    else:
        log("\u2717  Parser self-test FAILED — aborting to protect your files", 1)

    return ok


# =============================================================================
# Main
# =============================================================================

def main():
    print("=" * 64)
    print("  ARA PHASE 2.1 HOTFIX — Automatic Patch Installer v" + VERSION)
    print("=" * 64)
    print()
    print("  Fixes:")
    print("    BUG 1: extractPuzzleData() parser rewrite (CRITICAL)")
    print("    BUG 2: Doctrine conciseness instruction (HIGH)")
    print("    BUG 3: Creativity engine variables (documented only)")
    print()

    # --- Step 0: Self-test ---
    print("[0/6] Self-test (validates parser logic on sample puzzle)...")
    if not self_test():
        log("FAILED — aborting to protect your files.", 1)
        sys.exit(1)
    print()

    # --- Find ARA directory ---
    ara_dir = find_ara_dir()
    if not ara_dir:
        print("ERROR: Could not find ARA directory (cognitiveLoop.ts).")
        print("Usage: python3 ~/ara-phase2/phase21_apply.py --ara-dir ~/ara")
        sys.exit(1)
    log(f"ARA directory: {ara_dir}")

    cl_path = os.path.join(ara_dir, 'cognitiveLoop.ts')
    if not os.path.isfile(cl_path):
        print(f"ERROR: cognitiveLoop.ts not found at {cl_path}")
        sys.exit(1)
    print()

    # --- Step 1: Backup ---
    print("[1/6] Creating backup...")
    backup_path = backup_file(cl_path)
    print()

    # --- Step 2: Read current file ---
    print("[2/6] Reading cognitiveLoop.ts...")
    content = read_file(cl_path)
    original_lines = content.count('\n')
    original_size = len(content)
    log(f"File size: {original_size} bytes, {original_lines} lines", 1)
    print()

    # --- Step 3: Apply BUG 1 fix (parser rewrite) ---
    print("[3/6] Applying BUG 1 fix: extractPuzzleData() parser rewrite...")
    content, parser_ok, parser_msg = apply_parser_fix(content)
    log(parser_msg, 1)
    if not parser_ok:
        log("WARNING: Parser fix may be incomplete. Check messages above.", 1)
    print()

    # --- Step 4: Apply BUG 2 fix (conciseness instruction) ---
    print("[4/6] Applying BUG 2 fix: doctrine conciseness instruction...")
    content, concise_ok, concise_msg = apply_conciseness_fix(content)
    log(concise_msg, 1)
    if not concise_ok:
        log("WARNING: Conciseness fix may require manual application.", 1)
    print()

    # --- Step 5: Write patched file ---
    print("[5/6] Writing patched file...")
    write_file(cl_path, content)
    new_lines = content.count('\n')
    new_size = len(content)
    log(f"File written: {new_size} bytes, {new_lines} lines", 1)
    log(f"Delta: {new_size - original_size:+d} bytes, {new_lines - original_lines:+d} lines", 1)
    print()

    # --- Step 6: Verify ---
    print("[6/6] Verification...")
    all_pass = verify_phase21(content)
    print()
    check_brace_balance(content)
    print()

    # --- Summary ---
    print("=" * 64)
    print("  PHASE 2.1 HOTFIX COMPLETE")
    print("=" * 64)
    print()
    print("  What was applied:")
    print("    BUG 1 (CRITICAL): extractPuzzleData() rewritten to handle")
    print("      '-- Train Example N (input RxC -> output RxC) --' format")
    print("      parseGrid() updated with robust non-grid-line filtering")
    print()
    print("    BUG 2 (HIGH): Conciseness instruction added to doctrine")
    print("      LLM responses now requested under 4000 chars")
    print("      Should prevent router rejection of verbose responses")
    print()
    print("    BUG 3 (LOW): Documented only — creativity engine variable")
    print("      extraction for grid puzzles deferred to Phase 2.2")
    print()
    print("  Expected improvements:")
    print("    - Autonomous branch: 0/10 -> should now parse all puzzles")
    print("    - LLM branch: 2/10 -> fewer router rejections from verbosity")
    print()
    print("  To rollback:")
    print(f"    cp {backup_path} {cl_path}")
    print()
    print("  Next steps:")
    print("    1. Run ARC test: python3 runARC.py")
    print("    2. Check autonomous branch logs for 'Parsed N training pair(s)'")
    print("    3. Check LLM branch logs for response size < 4000 chars")
    print()

    if not all_pass:
        print("  WARNINGS: Some verification checks failed.")
        print("  Review the output above and check cognitiveLoop.ts manually.")
        print()
        sys.exit(1)


if __name__ == '__main__':
    main()
