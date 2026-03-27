#!/usr/bin/env python3
"""
ARA Phase 3 — runARC.py Live Learning Patch
=============================================
Patches ~/ara/runARC.py to add three critical capabilities:

  1. ENHANCED RETRY PROMPT: On attempt 2, include ARA's actual wrong grid
     alongside the expected correct grid so she can see exactly what she
     got wrong. The current RETRY_SUFFIX just says "your answer was
     incorrect" without showing the grids.

  2. LIVE MEMORY WRITING: After each puzzle attempt (correct or incorrect),
     append a structured memory node to ~/ara/us-complete.txt with:
       - Puzzle ID and difficulty
       - What rule ARA tried
       - Whether it was correct
       - If incorrect: what the correct answer was and what went wrong
       - A lesson learned

  3. POSTGRESQL LOGGING: After each puzzle, update the ara_puzzle_attempts
     table with the result. Uses environment variables from .env.

This script generates a patched version of runARC.py. It does NOT modify
the file directly — the phase3_apply.py installer handles that.

Usage:
    python3 runARC_patch.py                    # Print patch code to stdout
    python3 runARC_patch.py --apply ~/ara       # Apply directly (use phase3_apply.py instead)

Version: 3.0.0
"""

import os
import sys
import re
import json
from datetime import datetime

VERSION = "3.0.0"

# =============================================================================
# PATCH CODE BLOCKS — These are injected into runARC.py
# =============================================================================

# ---------------------------------------------------------------------------
# PATCH 1: Enhanced RETRY_SUFFIX with grid comparison
# ---------------------------------------------------------------------------
# Replaces the existing RETRY_SUFFIX constant with a function that builds
# a detailed retry prompt including the wrong grid and expected grid.

ENHANCED_RETRY_SUFFIX_CODE = r'''
# --- PHASE 3: Enhanced Retry Prompt ---
# Shows ARA her wrong grid alongside the expected grid so she can learn.
RETRY_SUFFIX_TEMPLATE = """
ATTEMPT {attempt} OF {max_attempts} -- YOUR PREVIOUS ANSWER WAS INCORRECT.

=== WHAT YOU GOT WRONG ===
Your previous grid output:
```grid
{wrong_grid}
```

The CORRECT expected output:
```grid
{expected_grid}
```

=== DIFFERENCES ===
{diff_summary}

=== INSTRUCTIONS ===
- Compare your grid to the expected grid cell by cell.
- Identify WHERE your transformation went wrong.
- Re-examine the training examples with fresh eyes.
- Follow the Pattern Recognition Doctrine steps IN ORDER.
- Do NOT repeat the same mistake. Apply the correction.
"""

def build_retry_suffix(attempt, max_attempts, wrong_grid_str, expected_grid_str):
    """Build a detailed retry prompt showing what went wrong."""
    # Compute diff summary
    diff_lines = []
    wrong_rows = [r.strip() for r in wrong_grid_str.strip().split('\n') if r.strip()]
    expected_rows = [r.strip() for r in expected_grid_str.strip().split('\n') if r.strip()]

    if len(wrong_rows) != len(expected_rows):
        diff_lines.append(f"DIMENSION MISMATCH: Your grid has {len(wrong_rows)} rows, expected {len(expected_rows)} rows.")
    else:
        mismatched_cells = 0
        total_cells = 0
        for r_idx, (wr, er) in enumerate(zip(wrong_rows, expected_rows)):
            wvals = wr.split()
            evals = er.split()
            if len(wvals) != len(evals):
                diff_lines.append(f"Row {r_idx}: column count mismatch ({len(wvals)} vs {len(evals)})")
                continue
            for c_idx, (wv, ev) in enumerate(zip(wvals, evals)):
                total_cells += 1
                if wv != ev:
                    mismatched_cells += 1
                    if mismatched_cells <= 10:  # Show first 10 mismatches
                        diff_lines.append(f"  Cell [{r_idx},{c_idx}]: you had {wv}, expected {ev}")
        if mismatched_cells > 10:
            diff_lines.append(f"  ... and {mismatched_cells - 10} more mismatched cells")
        if total_cells > 0:
            accuracy = 100 * (total_cells - mismatched_cells) / total_cells
            diff_lines.append(f"Cell accuracy: {total_cells - mismatched_cells}/{total_cells} ({accuracy:.0f}%)")

    diff_summary = '\n'.join(diff_lines) if diff_lines else "Could not compute diff."

    return RETRY_SUFFIX_TEMPLATE.format(
        attempt=attempt,
        max_attempts=max_attempts,
        wrong_grid=wrong_grid_str,
        expected_grid=expected_grid_str,
        diff_summary=diff_summary
    )
'''

# ---------------------------------------------------------------------------
# PATCH 2: Live Memory Writer — appends to us-complete.txt after each puzzle
# ---------------------------------------------------------------------------

LIVE_MEMORY_WRITER_CODE = r'''
# --- PHASE 3: Live Memory Writer ---
# Appends structured memory nodes to us-complete.txt after each puzzle attempt.

import os as _p3_os
from datetime import datetime as _p3_datetime

def _p3_generate_lesson(pattern, correct, wrong_grid_str=None, expected_grid_str=None, reasoning=''):
    """Generate a specific lesson from a puzzle attempt."""
    pattern_lower = pattern.lower() if pattern else ''
    reasoning_lower = reasoning.lower() if reasoning else ''

    if correct:
        return f"Successfully solved '{pattern}' puzzle. Rule identification and grid execution were both correct. Reinforce this approach."

    # Pattern-specific failure lessons
    if 'mirror' in pattern_lower or 'reflect' in pattern_lower:
        return ("MIRROR AXIS ERROR: Test BOTH horizontal (reverse each row) and vertical "
                "(reverse row order) reflections. Compare against ALL training outputs. "
                "The one that matches ALL training pairs is correct.")

    if 'gravity' in pattern_lower or 'stack' in pattern_lower or 'fall' in pattern_lower:
        return ("GRAVITY ERROR: Count non-zero values per column BEFORE gravity. "
                "Verify SAME count AFTER. Gravity NEVER reduces value count. "
                "Every non-zero value in input must appear in output. "
                "If column has [2,0,5,2,0], output must have [0,0,2,5,2] — both 2s preserved.")

    if 'fractal' in pattern_lower or 'tiling' in pattern_lower or 'self-similar' in pattern_lower:
        return ("FRACTAL TILING ERROR: Each non-zero cell becomes a COPY of the entire "
                "input pattern, NOT a solid block of that value. Zero cells become "
                "zero-filled blocks of the same size. Output dims = input_rows^2 x input_cols^2.")

    if 'surround' in pattern_lower or 'border' in pattern_lower or 'ring' in pattern_lower:
        return ("SURROUND/BORDER ERROR: Find each cell with the target value. Place the "
                "border value in ALL 8 adjacent cells (up, down, left, right, and 4 diagonals). "
                "Don't go outside grid bounds. Don't overwrite existing non-zero non-target values.")

    if 'height' in pattern_lower or 'rank' in pattern_lower:
        return ("HEIGHT-RANK ERROR: Count non-zero cells in each column to get height. "
                "Rank columns by height (tallest=1, next=2, etc.). Replace each non-zero "
                "cell with its column's rank value.")

    if 'sub-pattern' in pattern_lower or 'extract' in pattern_lower or 'bounding' in pattern_lower:
        return ("SUB-PATTERN EXTRACTION ERROR: Find the smallest bounding box containing "
                "all non-zero cells. Extract that region. If multiple distinct regions exist, "
                "identify which one is marked or highlighted.")

    if 'mosaic' in pattern_lower or 'tiled' in pattern_lower or 'region' in pattern_lower:
        return ("TILED MOSAIC ERROR: The input contains a repeating tiled pattern with one "
                "unique region. Find the non-repeating region and extract it.")

    if 'uniform' in pattern_lower or 'detection' in pattern_lower:
        return ("UNIFORM ROW DETECTION ERROR: Check if ALL values in a row are identical. "
                "If yes, output one value; if mixed, output another. Apply to EVERY row independently.")

    if 'substitution' in pattern_lower or 'mapping' in pattern_lower or 'colour' in pattern_lower:
        return ("VALUE SUBSTITUTION ERROR: Build mapping table from ALL training pairs. "
                "Each input value must consistently map to the same output value across all examples.")

    if 'xor' in pattern_lower or 'intersection' in pattern_lower:
        return ("XOR/INTERSECTION ERROR: Find the divider row or column. Split input into "
                "two halves. Apply XOR (cells that differ), AND (cells that match), or OR (union).")

    # Generic lesson with diff analysis
    if wrong_grid_str and expected_grid_str:
        wrong_rows = wrong_grid_str.strip().split('\n')
        expected_rows = expected_grid_str.strip().split('\n')
        if len(wrong_rows) != len(expected_rows):
            return (f"DIMENSION MISMATCH: Produced {len(wrong_rows)} rows, expected "
                    f"{len(expected_rows)}. Check dimension ratio from training examples.")
        return (f"Wrong cell values on '{pattern}' pattern. The transformation rule was "
                f"likely identified but applied incorrectly. Re-verify on ALL training pairs "
                f"cell-by-cell before applying to test.")

    return (f"Failed on '{pattern}' pattern. Follow doctrine steps 1-10 in order. "
            f"Verify rule on ALL training pairs before applying to test.")


def write_live_memory(puzzle_id, difficulty, pattern, correct, attempt_num,
                      wrong_grid_str=None, expected_grid_str=None,
                      reasoning='', rule_tried='Unknown',
                      memory_file=None):
    """Append a structured memory node to us-complete.txt after each puzzle attempt."""
    if memory_file is None:
        ara_dir = _p3_os.path.expanduser('~/ara')
        memory_file = _p3_os.path.join(ara_dir, 'us-complete.txt')

    timestamp = _p3_datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    ts_compact = timestamp.replace(' ', '_').replace(':', '').replace('-', '')

    lesson = _p3_generate_lesson(pattern, correct, wrong_grid_str, expected_grid_str, reasoning)

    result_str = f"CORRECT on attempt {attempt_num}" if correct else f"INCORRECT on attempt {attempt_num}"
    node_type = "ARC_PUZZLE_SUCCESS" if correct else "ARC_PUZZLE_FAILURE"

    node_lines = [
        '',
        '---',
        f'[ARC_LIVE_{puzzle_id}_{ts_compact}]',
        f'TYPE: {node_type}',
        f'TIMESTAMP: {timestamp}',
        f'PUZZLE_ID: {puzzle_id}',
        f'DIFFICULTY: {difficulty}',
        f'PATTERN: {pattern}',
        f'RESULT: {result_str}',
        f'RULE_TRIED: {rule_tried}',
    ]

    if not correct and expected_grid_str:
        node_lines.append(f'EXPECTED_GRID_PREVIEW: {expected_grid_str[:200]}')
    if not correct and wrong_grid_str:
        node_lines.append(f'MY_WRONG_GRID_PREVIEW: {wrong_grid_str[:200]}')

    node_lines.extend([
        f'LESSON: {lesson}',
        f'ACTION: {"Reinforce this approach for similar patterns." if correct else "On next encounter, apply corrective steps BEFORE submitting."}',
        '---',
        '',
    ])

    node_text = '\n'.join(node_lines)

    try:
        with open(memory_file, 'a', encoding='utf-8') as f:
            f.write(node_text)
        print(f"  [MEMORY] Written live node for {puzzle_id} ({result_str})")
    except Exception as e:
        print(f"  [MEMORY] WARNING: Could not write to {memory_file}: {e}")

    return node_text
'''

# ---------------------------------------------------------------------------
# PATCH 3: PostgreSQL Logger — logs each puzzle attempt to database
# ---------------------------------------------------------------------------

POSTGRES_LOGGER_CODE = r'''
# --- PHASE 3: PostgreSQL Puzzle Logger ---
# Logs each puzzle attempt to the ara_puzzle_attempts table.

def _p3_load_env(env_file=None):
    """Load environment variables from .env file."""
    if env_file is None:
        import os as _os
        env_file = _os.path.join(_os.path.expanduser('~/ara'), '.env')
    env = {}
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, _, val = line.partition('=')
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    env[key] = val
    except FileNotFoundError:
        pass
    return env


def log_puzzle_to_postgres(puzzle_id, attempt_number, rule_tried, result_grid_str,
                           correct, difficulty='', pattern='', notes=''):
    """Log a puzzle attempt to PostgreSQL ara_puzzle_attempts table."""
    import os as _os

    # Load env vars
    env = _p3_load_env()

    pg_host = _os.environ.get('PGHOST', env.get('PGHOST', 'localhost'))
    pg_port = _os.environ.get('PGPORT', env.get('PGPORT', '5432'))
    pg_user = _os.environ.get('PGUSER', env.get('PGUSER', 'ara'))
    pg_db = _os.environ.get('PGDATABASE', env.get('PGDATABASE', 'ara'))
    pg_pass = _os.environ.get('PGPASSWORD', env.get('PGPASSWORD', ''))

    try:
        import psycopg2
    except ImportError:
        try:
            # Fallback: try pg8000 (pure Python)
            import pg8000
            conn = pg8000.connect(
                host=pg_host, port=int(pg_port),
                user=pg_user, database=pg_db,
                password=pg_pass if pg_pass else None
            )
            cursor = conn.cursor()

            # Create table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ara_puzzle_attempts (
                    id SERIAL PRIMARY KEY,
                    puzzle_id VARCHAR(64) NOT NULL,
                    attempt_number INTEGER NOT NULL,
                    rule_tried VARCHAR(256),
                    result_grid TEXT,
                    correct BOOLEAN NOT NULL,
                    difficulty VARCHAR(32),
                    pattern VARCHAR(256),
                    notes TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            cursor.execute("""
                INSERT INTO ara_puzzle_attempts
                    (puzzle_id, attempt_number, rule_tried, result_grid, correct,
                     difficulty, pattern, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (puzzle_id, attempt_number, rule_tried, result_grid_str,
                  correct, difficulty, pattern, notes))

            conn.commit()
            cursor.close()
            conn.close()
            print(f"  [PG] Logged attempt for {puzzle_id} (attempt {attempt_number}, correct={correct})")
            return True

        except Exception as e2:
            print(f"  [PG] WARNING: pg8000 fallback failed: {e2}")
            # Final fallback: use subprocess psql
            return _p3_log_via_psql(puzzle_id, attempt_number, rule_tried,
                                     result_grid_str, correct, difficulty, pattern, notes,
                                     pg_host, pg_port, pg_user, pg_db, pg_pass)

    # Primary path: psycopg2
    try:
        conn = psycopg2.connect(
            host=pg_host, port=int(pg_port),
            user=pg_user, dbname=pg_db,
            password=pg_pass if pg_pass else None
        )
        cursor = conn.cursor()

        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ara_puzzle_attempts (
                id SERIAL PRIMARY KEY,
                puzzle_id VARCHAR(64) NOT NULL,
                attempt_number INTEGER NOT NULL,
                rule_tried VARCHAR(256),
                result_grid TEXT,
                correct BOOLEAN NOT NULL,
                difficulty VARCHAR(32),
                pattern VARCHAR(256),
                notes TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            INSERT INTO ara_puzzle_attempts
                (puzzle_id, attempt_number, rule_tried, result_grid, correct,
                 difficulty, pattern, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (puzzle_id, attempt_number, rule_tried, result_grid_str,
              correct, difficulty, pattern, notes))

        conn.commit()
        cursor.close()
        conn.close()
        print(f"  [PG] Logged attempt for {puzzle_id} (attempt {attempt_number}, correct={correct})")
        return True

    except Exception as e:
        print(f"  [PG] WARNING: Could not log to PostgreSQL: {e}")
        return False


def _p3_log_via_psql(puzzle_id, attempt_number, rule_tried, result_grid_str,
                      correct, difficulty, pattern, notes,
                      pg_host, pg_port, pg_user, pg_db, pg_pass):
    """Fallback: log via psql command line."""
    import subprocess
    import os as _os

    env = _os.environ.copy()
    if pg_pass:
        env['PGPASSWORD'] = pg_pass

    # Create table
    create_sql = """
    CREATE TABLE IF NOT EXISTS ara_puzzle_attempts (
        id SERIAL PRIMARY KEY,
        puzzle_id VARCHAR(64) NOT NULL,
        attempt_number INTEGER NOT NULL,
        rule_tried VARCHAR(256),
        result_grid TEXT,
        correct BOOLEAN NOT NULL,
        difficulty VARCHAR(32),
        pattern VARCHAR(256),
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    # Escape single quotes in strings
    def esc(s):
        return str(s).replace("'", "''") if s else ''

    correct_str = 'TRUE' if correct else 'FALSE'
    insert_sql = (
        f"INSERT INTO ara_puzzle_attempts "
        f"(puzzle_id, attempt_number, rule_tried, result_grid, correct, difficulty, pattern, notes) "
        f"VALUES ('{esc(puzzle_id)}', {attempt_number}, '{esc(rule_tried)}', "
        f"'{esc(result_grid_str[:2000])}', {correct_str}, '{esc(difficulty)}', "
        f"'{esc(pattern)}', '{esc(notes)}');"
    )

    full_sql = create_sql + '\n' + insert_sql

    try:
        result = subprocess.run(
            ['psql', '-h', pg_host, '-p', str(pg_port), '-U', pg_user, '-d', pg_db,
             '-c', full_sql],
            capture_output=True, text=True, timeout=10, env=env
        )
        if result.returncode == 0:
            print(f"  [PG] Logged via psql for {puzzle_id}")
            return True
        else:
            print(f"  [PG] psql failed: {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"  [PG] psql fallback failed: {e}")
        return False
'''

# ---------------------------------------------------------------------------
# PATCH 4: Integration hooks — called from the main test loop
# ---------------------------------------------------------------------------

INTEGRATION_HOOKS_CODE = r'''
# --- PHASE 3: Integration Hooks ---
# These functions are called from the main test loop in runARC.py.

def phase3_on_attempt_complete(puzzle_id, difficulty, pattern, attempt_num,
                                correct, ara_grid_str, expected_grid_str,
                                reasoning='', rule_tried='Unknown'):
    """Called after each puzzle attempt (correct or incorrect).
    Handles: memory writing, PostgreSQL logging."""

    # 1. Write live memory node
    write_live_memory(
        puzzle_id=puzzle_id,
        difficulty=difficulty,
        pattern=pattern,
        correct=correct,
        attempt_num=attempt_num,
        wrong_grid_str=ara_grid_str if not correct else None,
        expected_grid_str=expected_grid_str if not correct else None,
        reasoning=reasoning,
        rule_tried=rule_tried,
    )

    # 2. Log to PostgreSQL
    notes = f"{'Correct' if correct else 'Incorrect'} on attempt {attempt_num}"
    if not correct and ara_grid_str:
        notes += f". Grid diff available."
    log_puzzle_to_postgres(
        puzzle_id=puzzle_id,
        attempt_number=attempt_num,
        rule_tried=rule_tried,
        result_grid_str=ara_grid_str or '',
        correct=correct,
        difficulty=difficulty,
        pattern=pattern,
        notes=notes,
    )


def phase3_build_retry_prompt(attempt, max_attempts, wrong_grid_str, expected_grid_str):
    """Build the enhanced retry prompt for attempt 2+."""
    return build_retry_suffix(attempt, max_attempts, wrong_grid_str, expected_grid_str)
'''

# =============================================================================
# INJECTION POINT PATTERNS — Where to inject into runARC.py
# =============================================================================

# Pattern to find the existing RETRY_SUFFIX
RETRY_SUFFIX_PATTERNS = [
    r'RETRY_SUFFIX\s*=\s*["\']',
    r'RETRY_SUFFIX\s*=\s*"""',
    r"RETRY_SUFFIX\s*=\s*'''",
    r'ATTEMPT\s+2\s+OF\s+2\s*--\s*YOUR\s+PREVIOUS\s+ANSWER\s+WAS\s+INCORRECT',
]

# Pattern to find where RETRY_SUFFIX is used (the retry logic)
RETRY_USAGE_PATTERNS = [
    r'RETRY_SUFFIX',
    r'prompt\s*\+?=.*retry',
    r'attempt\s*==?\s*2',
    r'attempt.*[>]=?\s*2',
]

# Pattern to find where correctness is checked
CORRECTNESS_CHECK_PATTERNS = [
    r'CORRECT',
    r'correct.*attempt',
    r'INCORRECT',
    r'grid.*match',
    r'expected.*output',
]


# =============================================================================
# Patch Application Logic
# =============================================================================

def get_all_patch_code():
    """Return all patch code blocks concatenated."""
    return '\n'.join([
        ENHANCED_RETRY_SUFFIX_CODE,
        LIVE_MEMORY_WRITER_CODE,
        POSTGRES_LOGGER_CODE,
        INTEGRATION_HOOKS_CODE,
    ])


def find_injection_point_imports(content):
    """Find the best place to inject imports (near top of file, after existing imports)."""
    lines = content.split('\n')
    last_import = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import ') or line.strip().startswith('from '):
            last_import = i
    return last_import + 1


def find_retry_suffix_location(content):
    """Find the RETRY_SUFFIX constant definition."""
    for pattern in RETRY_SUFFIX_PATTERNS:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.start()
    return None


def find_retry_usage(content):
    """Find where RETRY_SUFFIX is used in the test loop."""
    locations = []
    for pattern in RETRY_USAGE_PATTERNS:
        for match in re.finditer(pattern, content, re.IGNORECASE):
            locations.append(match.start())
    return sorted(set(locations))


def find_correctness_checks(content):
    """Find where correctness is checked (CORRECT/INCORRECT)."""
    locations = []
    for pattern in CORRECTNESS_CHECK_PATTERNS:
        for match in re.finditer(pattern, content, re.IGNORECASE):
            locations.append(match.start())
    return sorted(set(locations))


def apply_patch(content):
    """
    Apply all Phase 3 patches to runARC.py content.

    Strategy:
    1. Inject patch code block near the top (after imports)
    2. Replace RETRY_SUFFIX usage with enhanced version
    3. Add phase3_on_attempt_complete() calls after correctness checks

    Returns (patched_content, success, messages)
    """
    messages = []
    modified = content

    # Check if already patched
    if 'PHASE 3' in content and 'phase3_on_attempt_complete' in content:
        return content, True, ["Phase 3 patches already applied."]

    # --- Step 1: Inject patch code after imports ---
    import_line = find_injection_point_imports(modified)
    lines = modified.split('\n')
    patch_block = get_all_patch_code()
    lines.insert(import_line, '\n# ===== PHASE 3 PATCHES — Live Learning =====')
    lines.insert(import_line + 1, patch_block)
    lines.insert(import_line + 2, '# ===== END PHASE 3 PATCHES =====\n')
    modified = '\n'.join(lines)
    messages.append(f"Injected Phase 3 patch code after line {import_line}")

    # --- Step 2: Enhance RETRY_SUFFIX usage ---
    # Find where RETRY_SUFFIX is appended to the prompt
    # Replace simple string append with enhanced version
    retry_patterns = [
        # Pattern: prompt += RETRY_SUFFIX or prompt = prompt + RETRY_SUFFIX
        (r'(prompt\s*\+?=\s*)RETRY_SUFFIX',
         r'\1phase3_build_retry_prompt(attempt, MAX_ATTEMPTS, last_ara_grid, expected_grid_str)'),
        # Pattern: + RETRY_SUFFIX at end of string concat
        (r'\+\s*RETRY_SUFFIX',
         r'+ phase3_build_retry_prompt(attempt, MAX_ATTEMPTS, last_ara_grid, expected_grid_str)'),
    ]

    retry_patched = False
    for pattern, replacement in retry_patterns:
        if re.search(pattern, modified):
            modified = re.sub(pattern, replacement, modified, count=1)
            messages.append(f"Replaced RETRY_SUFFIX usage with enhanced retry prompt")
            retry_patched = True
            break

    if not retry_patched:
        # Fallback: find RETRY_SUFFIX definition and add a comment
        messages.append("WARNING: Could not find RETRY_SUFFIX usage pattern. "
                       "Manual integration needed for enhanced retry prompt.")

    # --- Step 3: Add tracking variables ---
    # We need last_ara_grid and expected_grid_str variables
    # Find the main test loop and add variable initialization
    loop_patterns = [
        r'for\s+.*puzzle.*in\s+',
        r'for\s+.*idx.*in\s+',
        r'def\s+run_test',
        r'def\s+main',
    ]

    for pattern in loop_patterns:
        match = re.search(pattern, modified)
        if match:
            # Find the line
            line_start = modified.rfind('\n', 0, match.start()) + 1
            line = modified[line_start:modified.find('\n', match.start())]
            indent = len(line) - len(line.lstrip())
            indent_str = ' ' * (indent + 4)

            # Add variable init after the loop start
            loop_line_end = modified.find('\n', match.start())
            if loop_line_end > 0:
                init_code = (
                    f"\n{indent_str}last_ara_grid = ''  # Phase 3: track last grid for retry"
                    f"\n{indent_str}expected_grid_str = ''  # Phase 3: track expected grid"
                )
                # Only inject if not already present
                if 'last_ara_grid' not in modified:
                    modified = modified[:loop_line_end] + init_code + modified[loop_line_end:]
                    messages.append("Added tracking variables (last_ara_grid, expected_grid_str)")
            break

    # --- Step 4: Add phase3_on_attempt_complete() calls ---
    # Find CORRECT/INCORRECT print statements and add hooks after them
    correct_patterns = [
        # After "CORRECT on attempt N" print
        (r"(print\s*\(.*CORRECT on attempt.*\))",
         r"\1\n        phase3_on_attempt_complete(puzzle_id, difficulty, pattern, attempt, True, ara_grid_str, expected_grid_str, reasoning=ara_response[:500], rule_tried='LLM-identified')"),
        # After "INCORRECT on attempt N" print
        (r"(print\s*\(.*INCORRECT on attempt.*\))",
         r"\1\n        phase3_on_attempt_complete(puzzle_id, difficulty, pattern, attempt, False, ara_grid_str, expected_grid_str, reasoning=ara_response[:500], rule_tried='LLM-identified')"),
    ]

    hooks_added = 0
    for pattern, replacement in correct_patterns:
        if re.search(pattern, modified, re.IGNORECASE):
            modified = re.sub(pattern, replacement, modified, count=0, flags=re.IGNORECASE)
            hooks_added += 1

    if hooks_added > 0:
        messages.append(f"Added {hooks_added} phase3_on_attempt_complete() hook(s)")
    else:
        messages.append("WARNING: Could not auto-inject completion hooks. "
                       "Manual integration needed.")

    success = not any("WARNING" in m for m in messages)
    return modified, success, messages


# =============================================================================
# Standalone execution
# =============================================================================

def main():
    """Print patch code or apply to file."""
    if '--apply' in sys.argv:
        idx = sys.argv.index('--apply')
        ara_dir = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else os.path.expanduser('~/ara')
        runarc_path = os.path.join(ara_dir, 'runARC.py')

        if not os.path.isfile(runarc_path):
            print(f"ERROR: {runarc_path} not found")
            sys.exit(1)

        with open(runarc_path, 'r', encoding='utf-8') as f:
            content = f.read()

        patched, success, messages = apply_patch(content)

        for msg in messages:
            print(f"  {msg}")

        if success:
            # Backup
            backup = runarc_path + f'.phase3.{datetime.now().strftime("%Y%m%d_%H%M%S")}.backup'
            import shutil
            shutil.copy2(runarc_path, backup)
            print(f"\n  Backup: {backup}")

            with open(runarc_path, 'w', encoding='utf-8') as f:
                f.write(patched)
            print(f"  Patched: {runarc_path}")
        else:
            print("\n  WARNING: Some patches may need manual integration.")
            print("  Review messages above.")

    else:
        # Print patch code to stdout
        print("# " + "=" * 70)
        print("# ARA Phase 3 — runARC.py Patch Code")
        print("# " + "=" * 70)
        print("# Inject this code into runARC.py near the top (after imports).")
        print("# Then integrate the hooks into the test loop.")
        print("# Use phase3_apply.py for automatic installation.")
        print("# " + "=" * 70)
        print()
        print(get_all_patch_code())


if __name__ == '__main__':
    main()
