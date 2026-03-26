#!/usr/bin/env python3
"""
ARA Phase 2 Hardening — Automatic Patch Installer
===================================================
Applies Phase 2 patches to cognitiveLoop.ts:
  1. Injects the Pattern Recognition Doctrine into the LLM prompt construction
  2. Adds grid output self-verification after LLM response handling
  3. Verifies Phase 1 analytical branch is present (offers to re-apply if missing)
  4. Runs brace-balance and content verification checks

Usage:
    python3 ~/ara-phase2/phase2_apply.py --ara-dir ~/ara

Requirements:
    - Python 3.6+ (no external dependencies)
    - cognitiveLoop.ts must exist in the ARA directory
    - phase2_prompt_doctrine.ts and phase2_grid_verify.ts in the patch directory

Version: 2.0.0
"""

import os
import sys
import re
import shutil
import textwrap
from datetime import datetime

# =============================================================================
# Constants
# =============================================================================

VERSION = "2.0.0"
BACKUP_SUFFIX = ".phase2.backup"

# --- Doctrine prompt constant (extracted from phase2_prompt_doctrine.ts) ---
# This is the exact string that gets injected into the LLM prompt construction.
# Kept here so the installer is self-contained and does not require reading
# the .ts file at runtime (though it will verify against it if available).

DOCTRINE_CONST_NAME = "GRID_PUZZLE_DOCTRINE"

DOCTRINE_INJECTION_BLOCK = r'''
// --- BEGIN PHASE 2: DOCTRINE INJECTION ---
// Injected by phase2_apply.py v{version}
// When domain is 'check' or 'analytical', inject the Pattern Recognition
// Doctrine into the system prompt so the LLM follows structured steps.
const GRID_PUZZLE_DOCTRINE = `
=== PATTERN RECOGNITION DOCTRINE v2.1.0 ===
You are solving an ARC (Abstract Reasoning Challenge) grid puzzle.
Follow these steps IN ORDER. Do NOT skip steps. Do NOT guess.

STEP 1: PARSE TRAINING PAIRS
- Extract each training input grid and output grid.
- Record dimensions (rows x cols) for each.
- Note if dimensions change between input and output.

STEP 2: CHECK VALUE SUBSTITUTION
- For every cell (r,c), map input[r][c] -> output[r][c].
- If the mapping is consistent across ALL training pairs -> apply to test.
- If inconsistent -> move to Step 3.

STEP 3: CHECK SPATIAL TRANSFORMS (test each, pick the one that matches ALL training pairs)
CRITICAL DEFINITIONS:
  HORIZONTAL REFLECTION: reverse each ROW left-to-right. Row order unchanged.
    Formal: output[r][c] = input[r][cols-1-c]
  VERTICAL REFLECTION: reverse ROW ORDER top-to-bottom. Each row unchanged.
    Formal: output[r][c] = input[rows-1-r][c]
  90 CW ROTATION: output[c][rows-1-r] = input[r][c]
  180 ROTATION: output[rows-1-r][cols-1-c] = input[r][c]
  270 CW ROTATION: output[cols-1-c][r] = input[r][c]
  TRANSPOSITION: output[c][r] = input[r][c]
Test ALL six. Use the one that matches ALL training outputs.

STEP 4: CHECK GRAVITY
- Non-zero values fall to bottom (or top/left/right) of their column (or row).
- CRITICAL: gravity PRESERVES the count of each value per column.
- Test all four directions.

STEP 5: CHECK COMPOSITIONAL RULES
- Fractal Tiling: each non-zero cell -> COPY of input pattern (NOT solid fill).
  Output dims = input_rows^2 x input_cols^2. Zero cells -> zero blocks.
- Border/Surround: non-zero cells gain adjacent border of specific value.
- XOR/Intersection: input has two sub-grids separated by divider -> XOR, AND, or OR.
- Sub-Pattern Extraction: output is a sub-region of input.

STEP 6: CHECK CONDITIONAL RULES
- Uniform row detection: all-same rows -> value A, mixed rows -> value B.
- Height-rank colouring: columns ranked by non-zero count -> colour by rank.

STEP 7: CHECK COMPOUND RULES
- Try pairs of simple rules in sequence.

STEP 8: VERIFY ON ALL TRAINING EXAMPLES
- Apply rule to EVERY training input. Compare cell-by-cell.
- If ANY fails -> rule is WRONG. Go back and try next candidate.
- NEVER skip verification.

STEP 9: APPLY TO TEST INPUT
- Apply the verified rule. No modifications.

STEP 10: SELF-CHECK AND OUTPUT
- Verify output dimensions match training ratio.
- Verify all values in range 0-9.

=== KNOWN ERROR CATALOGUE ===
Puzzle 3c9b0459: Mirror axis confusion. FIX: Test BOTH reflections.
Puzzle 25ff71a9: Gravity value loss. FIX: Gravity NEVER reduces value count.
Puzzle 007bbfb7: Fractal solid fill. FIX: Copy ENTIRE input pattern into each non-zero cell.

=== OUTPUT FORMAT (MANDATORY) ===
You MUST output your final answer inside a \\\`\\\`\\\`grid\\\`\\\`\\\` code block.
Each row on its own line. Values separated by spaces. No trailing spaces.
Example:
\\\`\\\`\\\`grid
0 1 2
3 4 5
\\\`\\\`\\\`

Show your work briefly. After Step 8 verification, output the grid block.
`;
// --- END PHASE 2: DOCTRINE INJECTION ---
'''.strip()

DOCTRINE_GUARD_BLOCK_TEMPLATE = (
    "    // --- PHASE 2: Inject doctrine for puzzle domains ---\n"
    "    if (job.domain === 'check' || job.domain === 'analytical') {\n"
    "      __SYSTEM_VAR__ += '\\n' + GRID_PUZZLE_DOCTRINE;\n"
    "    }"
)

# --- Grid verification injection block ---
def build_grid_verify_block(response_var_name):
    """Build the grid verification injection block with the correct response variable."""
    return (
        "    // --- BEGIN PHASE 2: GRID OUTPUT VERIFICATION ---\n"
        "    // Injected by phase2_apply.py v" + VERSION + "\n"
        "    if (job.domain === 'check' || job.domain === 'analytical') {\n"
        "      // Parse ```grid``` block from LLM response\n"
        "      const gridBlockMatch = " + response_var_name + ".match(/```grid\\s*\\n([\\s\\S]*?)```/);\n"
        "      if (gridBlockMatch && gridBlockMatch[1]) {\n"
        "        const gridText = gridBlockMatch[1].trim();\n"
        "        const gridRows = gridText.split('\\n').map((r: string) => r.trim()).filter((r: string) => r.length > 0);\n"
        "        const warnings: string[] = [];\n"
        "\n"
        "        // Check: all values in range 0-9\n"
        "        let allValid = true;\n"
        "        for (const row of gridRows) {\n"
        "          const vals = row.replace(/[\\[\\],]/g, ' ').trim().split(/\\s+/);\n"
        "          for (const v of vals) {\n"
        "            const n = parseInt(v, 10);\n"
        "            if (isNaN(n) || n < 0 || n > 9) { allValid = false; break; }\n"
        "          }\n"
        "          if (!allValid) break;\n"
        "        }\n"
        "        if (!allValid) {\n"
        "          warnings.push('GRID_VERIFY WARNING: Some values outside range 0-9.');\n"
        "        }\n"
        "\n"
        "        // Check: rectangular grid (all rows same length)\n"
        "        const colCounts = gridRows.map((r: string) => r.replace(/[\\[\\],]/g, ' ').trim().split(/\\s+/).length);\n"
        "        const uniqueCols = [...new Set(colCounts)];\n"
        "        if (uniqueCols.length > 1) {\n"
        "          warnings.push('GRID_VERIFY WARNING: Grid is not rectangular. Row lengths: ' + colCounts.join(', '));\n"
        "        }\n"
        "\n"
        "        // Append warnings if any\n"
        "        if (warnings.length > 0) {\n"
        "          " + response_var_name + " += '\\n\\n=== GRID VERIFICATION REPORT ===\\n' + warnings.join('\\n') + '\\n=== END VERIFICATION REPORT ===';\n"
        "        }\n"
        "      } else {\n"
        "        // No grid block found\n"
        "        " + response_var_name + " += '\\n\\nGRID_VERIFY WARNING: No ```grid``` code block found in response.';\n"
        "      }\n"
        "    }\n"
        "    // --- END PHASE 2: GRID OUTPUT VERIFICATION ---"
    )


# =============================================================================
# Phase 1 analytical branch signature (for re-verification)
# =============================================================================

PHASE1_SIGNATURES = [
    "job.domain === 'check'",
    "job.domain === 'analytical'",
    "AUTONOMOUS ANALYTICAL ASSESSMENT",
]

PHASE1_GENERIC_FALLBACK = "AUTONOMOUS ASSESSMENT:"


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


def find_patch_dir():
    """Find the Phase 2 patch files directory."""
    home = os.path.expanduser('~')
    candidates = [
        os.path.join(home, 'ara-phase2'),
        os.path.join(home, 'ara-patch'),
        os.path.dirname(os.path.abspath(__file__)),
    ]
    for d in candidates:
        if os.path.isfile(os.path.join(d, 'phase2_prompt_doctrine.ts')):
            return d
    # Fallback: script's own directory (the .ts files might not exist if
    # the installer is self-contained)
    return os.path.dirname(os.path.abspath(__file__))


def backup_file(filepath):
    """Create a timestamped backup of a file if not already backed up."""
    backup_path = filepath + BACKUP_SUFFIX
    if os.path.isfile(backup_path):
        log(f"Phase 2 backup already exists: {backup_path}", 1)
        return backup_path

    # Also check for Phase 1 backup
    phase1_backup = filepath + '.backup'
    if not os.path.isfile(phase1_backup):
        # No Phase 1 backup either — create one
        shutil.copy2(filepath, phase1_backup)
        log(f"Phase 1 backup created: {phase1_backup}", 1)

    shutil.copy2(filepath, backup_path)
    log(f"Phase 2 backup created: {backup_path}", 1)
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
# Injection Point Detection
# =============================================================================

def find_prompt_construction(content):
    """
    Find the LLM prompt construction section in cognitiveLoop.ts.

    Searches for common patterns:
      - systemPrompt assignment/concatenation
      - messages.push({ role: 'system' ...
      - prompt = ... or contextBlock = ...
      - buildSystemPrompt or buildPrompt function calls

    Returns (line_number, variable_name) or (None, None) if not found.
    """
    lines = content.split('\n')

    # Strategy 1: Look for systemPrompt or system prompt variable
    prompt_patterns = [
        (r'(let|const|var)\s+(systemPrompt|system_prompt|sysPrompt)\s*[=+]', 'assignment'),
        (r'(systemPrompt|system_prompt|sysPrompt)\s*\+=', 'concatenation'),
        (r'(systemPrompt|system_prompt|sysPrompt)\s*=\s*.*buildSystemPrompt', 'builder'),
        (r'role\s*:\s*[\'"]system[\'"]', 'messages_array'),
        (r'(let|const|var)\s+(prompt|contextBlock|fullPrompt)\s*[=+]', 'generic_prompt'),
        (r'(prompt|contextBlock|fullPrompt)\s*\+=', 'generic_concat'),
    ]

    for pattern, ptype in prompt_patterns:
        for i, line in enumerate(lines):
            if re.search(pattern, line):
                # Extract the variable name
                var_match = re.search(
                    r'(systemPrompt|system_prompt|sysPrompt|prompt|contextBlock|fullPrompt)',
                    line
                )
                var_name = var_match.group(1) if var_match else 'systemPrompt'
                return i, var_name

    return None, None


def find_llm_response_handling(content):
    """
    Find where the LLM response is received and processed.

    Searches for patterns like:
      - const response = await ...
      - let result = await callLLM(...)
      - .then(response => ...)
      - response = await groq.chat(...)

    Returns (line_number, variable_name) or (None, None) if not found.
    """
    lines = content.split('\n')

    response_patterns = [
        (r'(let|const|var)\s+(response|llmResponse|result|answer|completion)\s*=\s*await\s', 'await_assign'),
        (r'(response|llmResponse|result|answer|completion)\s*=\s*await\s', 'reassign_await'),
        (r'\.then\s*\(\s*(response|result|res)\s*=>', 'then_callback'),
        (r'(let|const|var)\s+(responseText|responseContent|text|content)\s*=\s*(response|result|completion)', 'extract'),
        (r'(groq|openai|llm|provider)\.(chat|complete|generate)', 'api_call'),
    ]

    # Find the last match (closest to where response is used)
    best_line = None
    best_var = None

    for pattern, ptype in response_patterns:
        for i, line in enumerate(lines):
            if re.search(pattern, line):
                var_match = re.search(
                    r'(response|llmResponse|result|answer|completion|responseText|responseContent|text|content)',
                    line
                )
                var_name = var_match.group(1) if var_match else 'response'
                if best_line is None or i > best_line:
                    best_line = i
                    best_var = var_name

    return best_line, best_var


def find_function_boundary(content, start_line):
    """
    From a given line, find the end of the enclosing function by brace counting.
    Returns the line number of the closing brace, or None.
    """
    lines = content.split('\n')
    brace_count = 0
    found_open = False

    # Walk backward to find the function start
    for i in range(start_line, max(start_line - 100, -1), -1):
        for ch in lines[i]:
            if ch == '{':
                brace_count += 1
                found_open = True
            elif ch == '}':
                brace_count -= 1

    # Now walk forward from start_line to find where braces balance
    brace_count = 0
    for i in range(start_line, min(start_line + 500, len(lines))):
        for ch in lines[i]:
            if ch == '{':
                brace_count += 1
            elif ch == '}':
                brace_count -= 1
        if brace_count <= 0 and i > start_line:
            return i

    return None


# =============================================================================
# Patch Application: Doctrine Injection
# =============================================================================

def apply_doctrine_injection(content):
    """
    Inject the GRID_PUZZLE_DOCTRINE constant and the domain-guarded injection
    into the LLM prompt construction section.

    Strategy A: Find the exact prompt construction point and inject there.
    Strategy B: Find any function that builds/sends the LLM prompt and inject
                the constant at the top of the file + guard at the prompt point.
    Strategy C: Inject the constant at module level (before the first export or
                function) and add a comment for manual guard placement.

    Returns (new_content, success, message).
    """
    # Check if already injected
    if 'GRID_PUZZLE_DOCTRINE' in content:
        return content, True, "Doctrine injection already present."

    lines = content.split('\n')
    doctrine_block = DOCTRINE_INJECTION_BLOCK.format(version=VERSION)

    # --- Strategy A: Find prompt construction point ---
    log("Strategy A: Searching for LLM prompt construction...", 1)
    prompt_line, prompt_var = find_prompt_construction(content)

    if prompt_line is not None:
        log(f"Found prompt variable '{prompt_var}' at line {prompt_line + 1}.", 1)

        # Insert the constant BEFORE the prompt construction
        # Find a good insertion point: before the function containing the prompt line
        insert_line = prompt_line

        # Walk backward to find function start or a blank line
        for i in range(prompt_line - 1, max(prompt_line - 50, -1), -1):
            stripped = lines[i].strip()
            if stripped == '' or stripped.startswith('//') or stripped.startswith('/*'):
                insert_line = i + 1
                break
            if re.match(r'(export\s+)?(async\s+)?function\s', stripped):
                insert_line = i
                break

        # Insert the doctrine constant before the function
        guard_block = DOCTRINE_GUARD_BLOCK_TEMPLATE.replace('__SYSTEM_VAR__', prompt_var)

        # Find where to insert the guard (right after the prompt variable assignment)
        guard_insert = prompt_line + 1
        # Skip any continuation lines (multi-line assignment)
        while guard_insert < len(lines) and lines[guard_insert].strip().endswith('+'):
            guard_insert += 1
        # Skip to after the semicolon
        for i in range(prompt_line, min(prompt_line + 10, len(lines))):
            if ';' in lines[i]:
                guard_insert = i + 1
                break

        new_lines = (
            lines[:insert_line]
            + [doctrine_block, '']
            + lines[insert_line:guard_insert]
            + ['', guard_block, '']
            + lines[guard_insert:]
        )

        return '\n'.join(new_lines), True, (
            f"Strategy A: Injected doctrine constant at line {insert_line + 1} "
            f"and guard after line {guard_insert + 1}."
        )

    # --- Strategy B: Find any LLM-related function and inject at top ---
    log("Strategy A: No prompt construction found.", 1)
    log("Strategy B: Searching for LLM call patterns...", 1)

    llm_patterns = [
        r'(groq|openai|llm|provider)\.',
        r'callLLM|sendToLLM|queryLLM|askLLM',
        r'chat\.completions\.create',
        r'generateResponse|getCompletion',
    ]

    llm_line = None
    for pattern in llm_patterns:
        for i, line in enumerate(lines):
            if re.search(pattern, line):
                llm_line = i
                break
        if llm_line is not None:
            break

    if llm_line is not None:
        log(f"Found LLM call pattern at line {llm_line + 1}.", 1)

        # Insert doctrine constant near the top of the file (after imports)
        import_end = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith('import ') or stripped.startswith('from '):
                import_end = i + 1
            elif stripped and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*'):
                if i > import_end:
                    break

        new_lines = (
            lines[:import_end]
            + ['', doctrine_block, '']
            + lines[import_end:]
        )

        # Recalculate llm_line offset
        offset = 2 + doctrine_block.count('\n') + 1
        adjusted_llm_line = llm_line + offset

        # Add a comment near the LLM call pointing to manual guard insertion
        comment = (
            "    // PHASE 2 TODO: Add doctrine guard before this LLM call:\n"
            "    // if (job.domain === 'check' || job.domain === 'analytical') {\n"
            "    //   systemPrompt += '\\n' + GRID_PUZZLE_DOCTRINE;\n"
            "    // }"
        )
        new_lines.insert(adjusted_llm_line, comment)

        return '\n'.join(new_lines), True, (
            f"Strategy B: Injected doctrine constant after imports (line {import_end + 1}). "
            f"Added TODO comment at line {adjusted_llm_line + 1} for manual guard placement."
        )

    # --- Strategy C: Inject at module level with manual instructions ---
    log("Strategy B: No LLM call pattern found.", 1)
    log("Strategy C: Injecting at module level with manual instructions...", 1)

    # Find end of imports
    import_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('import ') or stripped.startswith('from '):
            import_end = i + 1

    new_lines = (
        lines[:import_end]
        + [
            '',
            doctrine_block,
            '',
            '// PHASE 2 MANUAL STEP REQUIRED:',
            '// Find where the LLM system prompt is constructed and add:',
            '//   if (job.domain === \'check\' || job.domain === \'analytical\') {',
            '//     systemPrompt += \'\\n\' + GRID_PUZZLE_DOCTRINE;',
            '//   }',
            '',
        ]
        + lines[import_end:]
    )

    return '\n'.join(new_lines), True, (
        f"Strategy C: Injected doctrine constant after imports (line {import_end + 1}). "
        "MANUAL STEP REQUIRED: Add the domain guard near the LLM prompt construction."
    )


# =============================================================================
# Patch Application: Grid Verification
# =============================================================================

def apply_grid_verification(content):
    """
    Inject the grid verification block after the LLM response handling.

    Strategy A: Find the LLM response variable and inject verification after it.
    Strategy B: Find the return statement in the LLM path and inject before it.
    Strategy C: Inject at the end of the main function with manual instructions.

    Returns (new_content, success, message).
    """
    # Check if already injected
    if 'GRID_VERIFY' in content or 'GRID OUTPUT VERIFICATION' in content:
        return content, True, "Grid verification already present."

    lines = content.split('\n')

    # --- Strategy A: Find LLM response handling ---
    log("Strategy A: Searching for LLM response handling...", 1)
    response_line, response_var = find_llm_response_handling(content)

    if response_line is not None:
        log(f"Found response variable '{response_var}' at line {response_line + 1}.", 1)

        verify_block = build_grid_verify_block(response_var)

        # Find a good insertion point: after the response assignment
        # Skip any immediate processing of the response (next few lines)
        insert_line = response_line + 1

        # Look for the next blank line or return statement within 20 lines
        for i in range(response_line + 1, min(response_line + 20, len(lines))):
            stripped = lines[i].strip()
            if stripped == '' or stripped.startswith('return ') or stripped.startswith('return;'):
                insert_line = i
                break

        new_lines = (
            lines[:insert_line]
            + ['', verify_block, '']
            + lines[insert_line:]
        )

        return '\n'.join(new_lines), True, (
            f"Strategy A: Injected grid verification after line {insert_line + 1} "
            f"(response var: '{response_var}')."
        )

    # --- Strategy B: Find return in LLM path ---
    log("Strategy A: No LLM response handling found.", 1)
    log("Strategy B: Searching for return statement in LLM path...", 1)

    # Look for a return statement that returns a response-like variable
    return_patterns = [
        r'return\s+(response|llmResponse|result|answer|completion)',
        r'return\s+.*\.join\(',
        r'return\s+.*\.content',
    ]

    return_line = None
    return_var = 'response'
    for pattern in return_patterns:
        for i, line in enumerate(lines):
            if re.search(pattern, line):
                var_match = re.search(
                    r'(response|llmResponse|result|answer|completion)',
                    line
                )
                if var_match:
                    return_var = var_match.group(1)
                return_line = i
                # Don't break — we want the last match in the LLM path

    if return_line is not None:
        log(f"Found return statement at line {return_line + 1}.", 1)

        verify_block = build_grid_verify_block(return_var)

        new_lines = (
            lines[:return_line]
            + ['', verify_block, '']
            + lines[return_line:]
        )

        return '\n'.join(new_lines), True, (
            f"Strategy B: Injected grid verification before return at line {return_line + 1}."
        )

    # --- Strategy C: Module-level injection with manual instructions ---
    log("Strategy B: No suitable return statement found.", 1)
    log("Strategy C: Injecting as standalone function with manual instructions...", 1)

    standalone_block = '''
// --- BEGIN PHASE 2: GRID VERIFICATION FUNCTION ---
// Injected by phase2_apply.py v{version}
// MANUAL STEP: Call this function after receiving the LLM response.
//   if (job.domain === 'check' || job.domain === 'analytical') {{
//     response = verifyAndAnnotateGrid(response);
//   }}
function verifyAndAnnotateGrid(response: string): string {{
  const gridBlockMatch = response.match(/```grid\\s*\\n([\\s\\S]*?)```/);
  if (gridBlockMatch && gridBlockMatch[1]) {{
    const gridText = gridBlockMatch[1].trim();
    const gridRows = gridText.split('\\n').map((r: string) => r.trim()).filter((r: string) => r.length > 0);
    const warnings: string[] = [];
    let allValid = true;
    for (const row of gridRows) {{
      const vals = row.replace(/[\\[\\],]/g, ' ').trim().split(/\\s+/);
      for (const v of vals) {{
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 0 || n > 9) {{ allValid = false; break; }}
      }}
      if (!allValid) break;
    }}
    if (!allValid) warnings.push('GRID_VERIFY WARNING: Some values outside range 0-9.');
    const colCounts = gridRows.map((r: string) => r.replace(/[\\[\\],]/g, ' ').trim().split(/\\s+/).length);
    const uniqueCols = [...new Set(colCounts)];
    if (uniqueCols.length > 1) warnings.push('GRID_VERIFY WARNING: Grid not rectangular.');
    if (warnings.length > 0) {{
      response += '\\n\\n=== GRID VERIFICATION REPORT ===\\n' + warnings.join('\\n') + '\\n=== END VERIFICATION REPORT ===';
    }}
  }} else {{
    response += '\\nGRID_VERIFY WARNING: No ```grid``` code block found in response.';
  }}
  return response;
}}
// --- END PHASE 2: GRID VERIFICATION FUNCTION ---
'''.format(version=VERSION)

    # Append to end of file
    return content + '\n' + standalone_block, True, (
        "Strategy C: Appended standalone verification function at end of file. "
        "MANUAL STEP REQUIRED: Call verifyAndAnnotateGrid() after LLM response."
    )


# =============================================================================
# Phase 1 Verification and Re-application
# =============================================================================

def check_phase1_branch(content):
    """
    Check if the Phase 1 analytical branch is present in cognitiveLoop.ts.
    Returns (present, details).
    """
    checks = {}
    for sig in PHASE1_SIGNATURES:
        checks[sig] = sig in content

    all_present = all(checks.values())
    has_generic = PHASE1_GENERIC_FALLBACK in content

    return all_present, checks, has_generic


def offer_phase1_reapply(ara_dir, content):
    """
    If Phase 1 analytical branch is missing, offer to re-apply it.
    Looks for the Phase 1 patch file in common locations.
    """
    home = os.path.expanduser('~')
    patch_locations = [
        os.path.join(home, 'ara-patch', 'buildAutonomousDecision_patch.ts'),
        os.path.join(home, 'ara-phase2', 'buildAutonomousDecision_patch.ts'),
        os.path.join(home, 'ara', 'buildAutonomousDecision_patch.ts'),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'buildAutonomousDecision_patch.ts'),
    ]

    patch_path = None
    for p in patch_locations:
        if os.path.isfile(p):
            patch_path = p
            break

    if patch_path is None:
        log("Phase 1 patch file (buildAutonomousDecision_patch.ts) not found.", 2)
        log("Cannot auto-apply Phase 1 patch. Please run Phase 1 installer first:", 2)
        log("  python3 ~/ara-patch/apply_patches.py --ara-dir ~/ara", 2)
        return content, False

    log(f"Found Phase 1 patch at: {patch_path}", 2)

    # Ask user
    print()
    try:
        answer = input("  Apply Phase 1 analytical branch now? [y/N] ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        answer = 'n'

    if answer != 'y':
        log("Skipping Phase 1 re-application. Phase 2 patches will still be applied.", 2)
        return content, False

    # Extract patch code from Phase 1 file
    try:
        with open(patch_path, 'r', encoding='utf-8') as f:
            patch_lines = f.readlines()

        code_start = None
        for i, line in enumerate(patch_lines):
            if line.strip().startswith('} else if (job.domain'):
                code_start = i
                break

        if code_start is None:
            log("ERROR: Could not find '} else if (job.domain' in Phase 1 patch.", 2)
            return content, False

        code_end = len(patch_lines)
        for i in range(len(patch_lines) - 1, -1, -1):
            if 'END OF PATCH' in patch_lines[i]:
                code_end = i
                break

        patch_code = ''.join(patch_lines[code_start:code_end])
    except Exception as e:
        log(f"ERROR reading Phase 1 patch: {e}", 2)
        return content, False

    # Find the generic else block and replace it
    # Strategy: look for 'AUTONOMOUS ASSESSMENT:' and its surrounding else block
    lines = content.split('\n')
    target_line = -1
    for i, line in enumerate(lines):
        if "'AUTONOMOUS ASSESSMENT:'" in line and 'lines.push' in line:
            target_line = i
            break

    if target_line == -1:
        log("ERROR: Could not find 'AUTONOMOUS ASSESSMENT:' in cognitiveLoop.ts.", 2)
        return content, False

    # Walk backward to find "} else {"
    else_line = -1
    for i in range(target_line - 1, max(target_line - 15, -1), -1):
        stripped = lines[i].strip()
        if stripped == '} else {':
            else_line = i
            break

    if else_line == -1:
        log("ERROR: Could not find '} else {' before 'AUTONOMOUS ASSESSMENT:'.", 2)
        return content, False

    # Walk forward with brace counting
    brace_count = 1
    close_line = -1
    for i in range(else_line + 1, min(else_line + 30, len(lines))):
        for ch in lines[i]:
            if ch == '{':
                brace_count += 1
            elif ch == '}':
                brace_count -= 1
        if brace_count == 0:
            close_line = i
            break

    if close_line == -1:
        log("ERROR: Could not find closing brace of else block.", 2)
        return content, False

    # Splice
    new_lines = lines[:else_line] + [patch_code] + lines[close_line + 1:]
    new_content = '\n'.join(new_lines)

    # Verify
    if "job.domain === 'check'" in new_content:
        log("Phase 1 analytical branch re-applied successfully.", 2)
        return new_content, True
    else:
        log("ERROR: Phase 1 re-application failed sanity check.", 2)
        return content, False


# =============================================================================
# Verification
# =============================================================================

def verify_phase2(content):
    """Run verification checks on the patched cognitiveLoop.ts."""
    checks = {
        # Phase 1 checks
        'Phase 1: Analytical branch':
            "job.domain === 'check'" in content,
        'Phase 1: Grid parser':
            'parseGrid' in content,
        'Phase 1: Original fallback preserved':
            "'AUTONOMOUS ASSESSMENT:'" in content,

        # Phase 2 checks
        'Phase 2: Doctrine constant':
            'GRID_PUZZLE_DOCTRINE' in content,
        'Phase 2: Doctrine content (Step 1)':
            'PARSE TRAINING PAIRS' in content,
        'Phase 2: Doctrine content (Step 8)':
            'VERIFY ON ALL TRAINING' in content or 'VERIFY' in content,
        'Phase 2: Error catalogue':
            '3c9b0459' in content or 'Mirror axis' in content,
        'Phase 2: Output format instruction':
            'grid' in content and 'code block' in content.lower(),
        'Phase 2: Grid verification':
            'GRID_VERIFY' in content or 'GRID OUTPUT VERIFICATION' in content,
        'Phase 2: Domain guard (doctrine)':
            ("job.domain === 'check'" in content and
             'GRID_PUZZLE_DOCTRINE' in content),
    }

    all_pass = True
    for check, result in checks.items():
        status = '\u2713' if result else '\u2717'
        log(f"{status}  {check}", 2)
        if not result:
            all_pass = False

    return all_pass


def check_brace_balance(content):
    """
    Rough brace-balance check. Counts { and } in non-comment context.
    """
    # Strip single-line comments
    content_stripped = re.sub(r'//[^\n]*', '', content)
    # Strip multi-line comments
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
# Self-Test
# =============================================================================

def self_test():
    """
    Quick self-test to verify injection logic on a synthetic snippet.
    """
    log("Running self-test on synthetic snippet...", 1)

    synthetic = textwrap.dedent("""\
        import { something } from './utils';

        async function runCognitiveLoop(job: any) {
          const mergedContext = await contextMerge(job);
          let systemPrompt = buildSystemPrompt(mergedContext);

          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: job.input },
          ];

          const response = await callLLM(messages);

          return response;
        }
    """)

    # Test doctrine injection
    new_content, success, msg = apply_doctrine_injection(synthetic)
    if not success:
        log(f"\u2717  Doctrine injection self-test failed: {msg}", 1)
        return False
    if 'GRID_PUZZLE_DOCTRINE' not in new_content:
        log("\u2717  Doctrine injection self-test: constant not found in result", 1)
        return False
    log("\u2713  Doctrine injection self-test passed", 1)

    # Test grid verification injection
    new_content2, success2, msg2 = apply_grid_verification(new_content)
    if not success2:
        log(f"\u2717  Grid verification self-test failed: {msg2}", 1)
        return False
    if 'GRID_VERIFY' not in new_content2 and 'GRID OUTPUT VERIFICATION' not in new_content2:
        log("\u2717  Grid verification self-test: verification block not found in result", 1)
        return False
    log("\u2713  Grid verification self-test passed", 1)

    return True


# =============================================================================
# Main
# =============================================================================

def main():
    print("=" * 64)
    print("  ARA PHASE 2 HARDENING — Automatic Patch Installer v" + VERSION)
    print("=" * 64)
    print()

    # --- Step 0: Self-test ---
    print("[0/7] Self-test (validates injection logic)...")
    if not self_test():
        log("FAILED — aborting to protect your files.", 1)
        sys.exit(1)
    print()

    # --- Find directories ---
    ara_dir = find_ara_dir()
    if not ara_dir:
        print("ERROR: Could not find ARA directory (cognitiveLoop.ts).")
        print("Usage: python3 ~/ara-phase2/phase2_apply.py --ara-dir ~/ara")
        sys.exit(1)
    log(f"ARA directory:   {ara_dir}")

    patch_dir = find_patch_dir()
    log(f"Patch directory: {patch_dir}")
    print()

    cl_path = os.path.join(ara_dir, 'cognitiveLoop.ts')
    if not os.path.isfile(cl_path):
        print(f"ERROR: cognitiveLoop.ts not found at {cl_path}")
        sys.exit(1)

    # --- Step 1: Backup ---
    print("[1/7] Creating backup...")
    backup_file(cl_path)
    print()

    # --- Step 2: Read current file ---
    print("[2/7] Reading cognitiveLoop.ts...")
    content = read_file(cl_path)
    original_lines = content.count('\n')
    log(f"File size: {len(content)} bytes, {original_lines} lines", 1)
    print()

    # --- Step 3: Check Phase 1 analytical branch ---
    print("[3/7] Checking Phase 1 analytical branch...")
    phase1_present, phase1_checks, has_generic = check_phase1_branch(content)

    for sig, present in phase1_checks.items():
        status = '\u2713' if present else '\u2717'
        log(f"{status}  {sig}", 1)

    if not phase1_present:
        log("WARNING: Phase 1 analytical branch is MISSING or INCOMPLETE.", 1)
        content, reapplied = offer_phase1_reapply(ara_dir, content)
        if reapplied:
            log("Phase 1 branch restored. Continuing with Phase 2.", 1)
        else:
            log("Continuing without Phase 1 branch. Phase 2 patches will still be applied.", 1)
            log("The autonomous analytical solver will NOT work until Phase 1 is applied.", 1)
    else:
        log("Phase 1 analytical branch is present. Good.", 1)
    print()

    # --- Step 4: Apply doctrine injection ---
    print("[4/7] Applying doctrine injection...")
    content, doctrine_ok, doctrine_msg = apply_doctrine_injection(content)
    log(doctrine_msg, 1)
    if not doctrine_ok:
        log("WARNING: Doctrine injection may require manual steps.", 1)
    print()

    # --- Step 5: Apply grid verification ---
    print("[5/7] Applying grid verification...")
    content, verify_ok, verify_msg = apply_grid_verification(content)
    log(verify_msg, 1)
    if not verify_ok:
        log("WARNING: Grid verification injection may require manual steps.", 1)
    print()

    # --- Write the patched file ---
    write_file(cl_path, content)
    new_lines = content.count('\n')
    log(f"File written: {len(content)} bytes, {new_lines} lines (+{new_lines - original_lines})", 1)
    print()

    # --- Step 6: Verify ---
    print("[6/7] Verifying Phase 2 patches...")
    all_pass = verify_phase2(content)
    if all_pass:
        log("All verification checks passed!", 1)
    else:
        log("Some checks failed. Review cognitiveLoop.ts manually.", 1)
    print()

    # --- Step 7: Brace balance ---
    print("[7/7] Brace balance check...")
    check_brace_balance(content)
    print()

    # --- Summary ---
    print("=" * 64)
    print("  PHASE 2 HARDENING COMPLETE")
    print("=" * 64)
    print()
    print("  What was applied:")
    print("    1. Pattern Recognition Doctrine injected into LLM prompt")
    print("       (activates only for 'check' and 'analytical' domains)")
    print("    2. Grid output self-verification added after LLM response")
    print("       (checks dimensions, value range, rectangular format)")
    print("    3. Phase 1 analytical branch verified/restored")
    print()
    print("  Expected improvements:")
    print("    - LLM (Groq) follows structured 10-step doctrine")
    print("    - Mirror axis errors (3c9b0459) prevented by explicit definitions")
    print("    - Gravity value loss (25ff71a9) prevented by count-preservation rule")
    print("    - Fractal solid fill (007bbfb7) prevented by copy-pattern instruction")
    print("    - Grid output validated before returning to user")
    print()
    print("  Next steps:")
    print("    1. Verify TypeScript compiles: npx tsc --noEmit cognitiveLoop.ts")
    print("    2. Run ARC test: python3 runARC.py")
    print("    3. Compare results with Phase 1 baseline (3/10 with LLM)")
    print()
    print("  To rollback Phase 2:")
    backup_path = cl_path + BACKUP_SUFFIX
    print(f"    cp {backup_path} {cl_path}")
    print()
    print("  To rollback to original (pre-Phase 1):")
    original_backup = cl_path + '.backup'
    print(f"    cp {original_backup} {cl_path}")
    print()


if __name__ == '__main__':
    main()
