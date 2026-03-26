#!/usr/bin/env python3
"""
ARA Hardening — Automatic Patch Installer
==========================================
This script applies the buildAutonomousDecision patch to cognitiveLoop.ts.
It finds the generic "else" fallback block and replaces it with the
analytical reasoning branch + preserved fallback.

Usage:
    cd ~/ara
    python3 ~/ara-patch/apply_patches.py

Or from any directory:
    python3 apply_patches.py --ara-dir ~/ara

FIX LOG (v2):
    The original script used a brace-counting loop that started from the
    "} else {" line.  Because that line contains both a closing "}" and an
    opening "{", the net brace delta on line 0 of the scan is 0, which
    caused the loop to exit immediately (condition `brace_count <= 0 and
    i > else_line` was true on the very first iteration).  The closing brace
    of the else block was therefore never found, so only the first two lines
    were replaced and the remaining 5 lines (Steps 1-4 + closing brace) were
    left orphaned in the file — producing the syntax error at line 762.

    The fix uses a two-strategy approach:
      Strategy A (preferred): exact multi-line string match of the known
        7-line block.  This is immune to brace-counting edge cases.
      Strategy B (fallback): line-by-line scan that correctly skips the
        opening "} else {" line before beginning brace counting, so the
        counter starts at +1 (from the opening "{") and only reaches 0
        when the matching "}" is found.
"""

import os
import sys
import shutil
import re

# ---------------------------------------------------------------------------
# The exact text of the generic else block we need to replace.
# Defined here so both the detection logic and the unit test use the same
# source of truth.  Leading/trailing whitespace on each line is preserved
# as it appears in cognitiveLoop.ts.
# ---------------------------------------------------------------------------
ELSE_BLOCK_VARIANTS = [
    # Variant A — 2-space indent (most common in the codebase)
    (
        "  } else {\n"
        "    lines.push('AUTONOMOUS ASSESSMENT:');\n"
        "    lines.push('  Step 1 \u2014 Identify the primary threat vector.');\n"
        "    lines.push('  Step 2 \u2014 Apply economy of force \u2014 minimum resources to secondary threats.');\n"
        "    lines.push('  Step 3 \u2014 Escalate to human authority immediately.');\n"
        "    lines.push('  Step 4 \u2014 Iron holds. No action that violates principles.');\n"
        "  }"
    ),
    # Variant B — 4-space indent
    (
        "    } else {\n"
        "      lines.push('AUTONOMOUS ASSESSMENT:');\n"
        "      lines.push('  Step 1 \u2014 Identify the primary threat vector.');\n"
        "      lines.push('  Step 2 \u2014 Apply economy of force \u2014 minimum resources to secondary threats.');\n"
        "      lines.push('  Step 3 \u2014 Escalate to human authority immediately.');\n"
        "      lines.push('  Step 4 \u2014 Iron holds. No action that violates principles.');\n"
        "    }"
    ),
    # Variant C — tab indent
    (
        "\t} else {\n"
        "\t\tlines.push('AUTONOMOUS ASSESSMENT:');\n"
        "\t\tlines.push('  Step 1 \u2014 Identify the primary threat vector.');\n"
        "\t\tlines.push('  Step 2 \u2014 Apply economy of force \u2014 minimum resources to secondary threats.');\n"
        "\t\tlines.push('  Step 3 \u2014 Escalate to human authority immediately.');\n"
        "\t\tlines.push('  Step 4 \u2014 Iron holds. No action that violates principles.');\n"
        "\t}"
    ),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def find_ara_dir():
    """Find the ARA directory."""
    if '--ara-dir' in sys.argv:
        idx = sys.argv.index('--ara-dir')
        if idx + 1 < len(sys.argv):
            return sys.argv[idx + 1]
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
    """Find the patch files directory."""
    home = os.path.expanduser('~')
    candidates = [
        os.path.join(home, 'ara-patch'),
        os.path.join(home, 'ara'),
        os.path.dirname(os.path.abspath(__file__)),
    ]
    for d in candidates:
        if os.path.isfile(os.path.join(d, 'buildAutonomousDecision_patch.ts')):
            return d
    return None


def extract_patch_code(patch_path):
    """
    Read the patch file and extract the code block that replaces the else
    block.  Returns the raw string starting at the first
    '} else if (job.domain' line and ending just before the
    '// --- END OF PATCH ---' marker.
    """
    with open(patch_path, 'r', encoding='utf-8') as f:
        patch_lines = f.readlines()

    code_start = None
    for i, line in enumerate(patch_lines):
        if line.strip().startswith('} else if (job.domain'):
            code_start = i
            break

    if code_start is None:
        raise ValueError(
            "Could not find '} else if (job.domain' in the patch file. "
            "Check that buildAutonomousDecision_patch.ts is the correct file."
        )

    code_end = len(patch_lines)
    for i in range(len(patch_lines) - 1, -1, -1):
        if 'END OF PATCH' in patch_lines[i]:
            code_end = i
            break

    return ''.join(patch_lines[code_start:code_end])


# ---------------------------------------------------------------------------
# Strategy A — exact multi-line string replacement
# ---------------------------------------------------------------------------

def try_exact_replace(original, patch_code):
    """
    Try to replace the else block using exact multi-line string matching.
    Returns (new_content, matched_variant_index) or (None, -1) if no match.
    """
    for idx, variant in enumerate(ELSE_BLOCK_VARIANTS):
        if variant in original:
            new_content = original.replace(variant, patch_code, 1)
            return new_content, idx
    return None, -1


# ---------------------------------------------------------------------------
# Strategy B — line-by-line scan with correct brace counting
# ---------------------------------------------------------------------------

def try_scan_replace(original, patch_code):
    """
    Scan the file line-by-line to find the else block.

    The key fix over the original script:
      - We locate the "} else {" line (else_line).
      - We start brace counting AFTER that line (i.e., from else_line + 1).
      - We initialise brace_count = 1 (the opening "{" on the else line).
      - We scan forward, adding +1 for each "{" and -1 for each "}".
      - When brace_count reaches 0, we have found the matching closing "}".

    This correctly handles the fact that the "} else {" line itself has a
    net brace delta of 0 (one "}" closes the previous branch, one "{"
    opens the else body), so the body brace count starts at 1 after that
    line, not 0.
    """
    lines = original.split('\n')

    # Step 1: find the 'AUTONOMOUS ASSESSMENT:' push line
    target_line = -1
    for i, line in enumerate(lines):
        if "'AUTONOMOUS ASSESSMENT:'" in line and 'lines.push' in line:
            target_line = i
            break

    if target_line == -1:
        return None, "Could not find 'AUTONOMOUS ASSESSMENT:' in cognitiveLoop.ts"

    # Step 2: walk backward from target_line to find "} else {"
    else_line = -1
    for i in range(target_line - 1, max(target_line - 15, -1), -1):
        stripped = lines[i].strip()
        if stripped == '} else {':
            else_line = i
            break

    if else_line == -1:
        return None, (
            "Could not find '} else {' in the 15 lines before "
            "'AUTONOMOUS ASSESSMENT:' (found at line " + str(target_line + 1) + ")"
        )

    # Step 3: walk forward from else_line + 1 with brace_count starting at 1
    # (the "{" on the else_line opened the block).
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
        return None, (
            f"Could not find closing '}}' of the else block that starts at "
            f"line {else_line + 1} (scanned 30 lines forward)"
        )

    # Report what we found
    found_block_lines = lines[else_line:close_line + 1]
    print(f"  Found else block: lines {else_line + 1}–{close_line + 1}")
    print("  Block content:")
    for ln in found_block_lines:
        print(f"    | {ln}")

    # Step 4: splice the patch in
    new_lines = lines[:else_line] + [patch_code] + lines[close_line + 1:]
    return '\n'.join(new_lines), None


# ---------------------------------------------------------------------------
# Main patch function
# ---------------------------------------------------------------------------

def apply_cognitive_loop_patch(ara_dir, patch_dir):
    """Apply the buildAutonomousDecision patch to cognitiveLoop.ts."""
    cl_path = os.path.join(ara_dir, 'cognitiveLoop.ts')
    patch_path = os.path.join(patch_dir, 'buildAutonomousDecision_patch.ts')

    if not os.path.isfile(cl_path):
        print(f"  ERROR: cognitiveLoop.ts not found at {cl_path}")
        return False
    if not os.path.isfile(patch_path):
        print(f"  ERROR: Patch file not found at {patch_path}")
        return False

    # Backup original (only once — don't overwrite an existing backup)
    backup_path = cl_path + '.backup'
    if not os.path.isfile(backup_path):
        shutil.copy2(cl_path, backup_path)
        print(f"  Backup created: {backup_path}")
    else:
        print(f"  Backup already exists: {backup_path}")

    # Read original file
    with open(cl_path, 'r', encoding='utf-8') as f:
        original = f.read()

    # Guard: already patched?
    if "job.domain === 'check'" in original or "job.domain === 'analytical'" in original:
        print("  INFO: Patch appears to have already been applied (analytical branch found).")
        print("  If you need to re-apply, restore from backup first:")
        print(f"    cp {backup_path} {cl_path}")
        return True

    # Extract the replacement code from the patch file
    try:
        patch_code = extract_patch_code(patch_path)
    except ValueError as e:
        print(f"  ERROR: {e}")
        return False

    # --- Strategy A: exact multi-line string match ---
    print("  Attempting Strategy A (exact string match)...")
    new_content, variant_idx = try_exact_replace(original, patch_code)
    if new_content is not None:
        print(f"  Strategy A succeeded (matched variant {variant_idx + 1}).")
    else:
        # --- Strategy B: line-by-line scan with corrected brace counting ---
        print("  Strategy A: no exact match found (indent may differ).")
        print("  Attempting Strategy B (line scan with corrected brace counting)...")
        new_content, err = try_scan_replace(original, patch_code)
        if new_content is None:
            print(f"  ERROR: Strategy B failed — {err}")
            print()
            print("  MANUAL FALLBACK:")
            print("  Open cognitiveLoop.ts and find this block:")
            print("  -----------------------------------------------")
            for v in ELSE_BLOCK_VARIANTS:
                print(v)
                print("  -----------------------------------------------")
            print("  Replace the entire block (including the final '}') with")
            print("  the contents of buildAutonomousDecision_patch.ts")
            print("  (starting from the '} else if (job.domain' line).")
            return False
        print("  Strategy B succeeded.")

    # Sanity check: the patch must be present in the new content
    if "job.domain === 'check'" not in new_content:
        print("  ERROR: Sanity check failed — analytical branch not found in patched file.")
        print("  The original file has NOT been modified.")
        return False

    # Sanity check: the original generic fallback must still be present
    # (the patch preserves it as the final else)
    if "'AUTONOMOUS ASSESSMENT:'" not in new_content:
        print("  ERROR: Sanity check failed — original fallback not found in patched file.")
        print("  The original file has NOT been modified.")
        return False

    # Write the patched file
    with open(cl_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    original_lines = original.count('\n')
    new_lines = new_content.count('\n')
    print(f"  SUCCESS: cognitiveLoop.ts patched.")
    print(f"  Line count: {original_lines} → {new_lines} (+{new_lines - original_lines} lines)")
    return True


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def verify_patch(ara_dir):
    """Verify the patch was applied correctly."""
    cl_path = os.path.join(ara_dir, 'cognitiveLoop.ts')
    with open(cl_path, 'r', encoding='utf-8') as f:
        content = f.read()

    checks = {
        'Analytical branch exists':         "job.domain === 'check'" in content,
        'Grid parser exists':               'parseGrid' in content,
        'Value substitution check':         'tryValueSubstitution' in content,
        'Horizontal reflection':            'horizontalReflect' in content,
        'Vertical reflection':              'verticalReflect' in content,
        'Gravity down (count-preserving)':  'gravityDown' in content,
        'Fractal tiling (copy pattern)':    'fractalTile' in content,
        'XOR mask check':                   'tryXorMask' in content,
        'Grid output format (```grid```)':  '```grid' in content,
        'Original fallback preserved':      "'AUTONOMOUS ASSESSMENT:'" in content,
        'Self-check step':                  'Self-check' in content,
        'AXIOM_03 escalation':              'AXIOM_03' in content,
    }

    print("\n  Verification results:")
    all_pass = True
    for check, result in checks.items():
        status = '✓' if result else '✗'
        print(f"    {status}  {check}")
        if not result:
            all_pass = False

    return all_pass


# ---------------------------------------------------------------------------
# Brace-balance check — catches the original bug class
# ---------------------------------------------------------------------------

def check_brace_balance(ara_dir):
    """
    Rough brace-balance check on cognitiveLoop.ts.
    Counts '{' and '}' in non-string, non-comment context.
    A perfect balance is not guaranteed by this check (strings/templates
    can contain braces), but a significant imbalance is a clear signal
    that something went wrong.
    """
    cl_path = os.path.join(ara_dir, 'cognitiveLoop.ts')
    with open(cl_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Strip single-line comments
    content_no_comments = re.sub(r'//[^\n]*', '', content)
    # Strip template literals and strings (rough approximation)
    # We only need a rough count, not a perfect parse
    opens = content_no_comments.count('{')
    closes = content_no_comments.count('}')
    delta = opens - closes

    if delta == 0:
        print(f"  ✓  Brace balance: {opens} open, {closes} close — balanced")
        return True
    else:
        print(f"  ✗  Brace balance: {opens} open, {closes} close — delta {delta:+d}")
        print("     (Note: template literals and strings may contribute false positives)")
        # A delta of ±1 or ±2 may be from template literals; larger is a real problem
        if abs(delta) > 5:
            print("     LIKELY SYNTAX ERROR — review the patched file manually.")
            return False
        else:
            print("     Small delta — likely from template literals. Verify with tsc.")
            return True


# ---------------------------------------------------------------------------
# Self-test — validates the detection logic against a synthetic snippet
# ---------------------------------------------------------------------------

def self_test():
    """
    Run a quick self-test to verify that the replacement strategies work
    correctly on a synthetic cognitiveLoop.ts snippet before touching the
    real file.
    """
    print("  Running self-test on synthetic snippet...")

    # Build a minimal synthetic file that contains the else block
    synthetic = (
        "function buildAutonomousDecision(reasoning: any, job: JobInput): string {\n"
        "  const lines: string[] = [];\n"
        "  if (job.domain === 'defense') {\n"
        "    lines.push('DEFENSE');\n"
        "  } else {\n"
        "    lines.push('AUTONOMOUS ASSESSMENT:');\n"
        "    lines.push('  Step 1 \u2014 Identify the primary threat vector.');\n"
        "    lines.push('  Step 2 \u2014 Apply economy of force \u2014 minimum resources to secondary threats.');\n"
        "    lines.push('  Step 3 \u2014 Escalate to human authority immediately.');\n"
        "    lines.push('  Step 4 \u2014 Iron holds. No action that violates principles.');\n"
        "  }\n"
        "  return lines.join('\\n');\n"
        "}\n"
    )

    fake_patch = (
        "} else if (job.domain === 'check') {\n"
        "    lines.push('ANALYTICAL');\n"
        "} else {\n"
        "    lines.push('AUTONOMOUS ASSESSMENT:');\n"
        "    lines.push('  Step 1 \u2014 Identify the primary threat vector.');\n"
        "    lines.push('  Step 2 \u2014 Apply economy of force \u2014 minimum resources to secondary threats.');\n"
        "    lines.push('  Step 3 \u2014 Escalate to human authority immediately.');\n"
        "    lines.push('  Step 4 \u2014 Iron holds. No action that violates principles.');\n"
        "}"
    )

    # Test Strategy A
    new_content, idx = try_exact_replace(synthetic, fake_patch)
    if new_content is not None:
        if "job.domain === 'check'" in new_content and "'AUTONOMOUS ASSESSMENT:'" in new_content:
            print("  ✓  Strategy A self-test passed")
        else:
            print("  ✗  Strategy A self-test: replacement produced unexpected content")
            return False
    else:
        # Strategy A won't match because the synthetic uses 2-space indent on "} else {"
        # but the variant list uses "  } else {" — they should match; if not, fall through
        print("  ~  Strategy A self-test: no match (checking Strategy B)")

    # Test Strategy B
    result, err = try_scan_replace(synthetic, fake_patch)
    if result is None:
        print(f"  ✗  Strategy B self-test failed: {err}")
        return False
    if "job.domain === 'check'" not in result:
        print("  ✗  Strategy B self-test: analytical branch missing from result")
        return False
    if "'AUTONOMOUS ASSESSMENT:'" not in result:
        print("  ✗  Strategy B self-test: original fallback missing from result")
        return False
    # Verify the orphaned lines problem is gone — "Iron holds" must appear exactly once
    iron_count = result.count('Iron holds')
    if iron_count != 1:
        print(f"  ✗  Strategy B self-test: 'Iron holds' appears {iron_count} times (expected 1)")
        return False
    print("  ✓  Strategy B self-test passed")
    return True


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  ARA HARDENING — Automatic Patch Installer v2")
    print("=" * 60)
    print()

    # Run self-test first
    print("[0/5] Self-test (validates detection logic)...")
    if not self_test():
        print("  FAILED — aborting to protect your files.")
        sys.exit(1)
    print()

    ara_dir = find_ara_dir()
    if not ara_dir:
        print("ERROR: Could not find ARA directory (cognitiveLoop.ts).")
        print("Usage: python3 apply_patches.py --ara-dir ~/ara")
        sys.exit(1)
    print(f"  ARA directory:   {ara_dir}")

    patch_dir = find_patch_dir()
    if not patch_dir:
        print("ERROR: Could not find patch files (buildAutonomousDecision_patch.ts).")
        print("Make sure you cloned the ara-hardening branch.")
        sys.exit(1)
    print(f"  Patch directory: {patch_dir}")
    print()

    # Step 1: Apply cognitiveLoop.ts patch
    print("[1/5] Patching cognitiveLoop.ts...")
    if not apply_cognitive_loop_patch(ara_dir, patch_dir):
        print("  FAILED — aborting.")
        sys.exit(1)

    # Step 2: Brace balance check
    print("\n[2/5] Brace balance check...")
    check_brace_balance(ara_dir)

    # Step 3: Verify patch content
    print("\n[3/5] Verifying patch content...")
    if not verify_patch(ara_dir):
        print("  WARNING: Some checks failed. Review cognitiveLoop.ts manually.")
    else:
        print("  All checks passed!")

    # Step 4: Check playbook
    print("\n[4/5] Checking playbook...")
    pb_path = os.path.join(ara_dir, 'playbooks', 'analytical-reasoning.json')
    if os.path.isfile(pb_path):
        print(f"  ✓  Playbook found: {pb_path}")
    else:
        src = os.path.join(patch_dir, 'playbooks', 'analytical-reasoning.json')
        if os.path.isfile(src):
            os.makedirs(os.path.join(ara_dir, 'playbooks'), exist_ok=True)
            shutil.copy2(src, pb_path)
            print(f"  ✓  Playbook copied to: {pb_path}")
        else:
            print(f"  ✗  Playbook not found. Copy manually from the patch directory.")

    # Step 5: Check memory additions
    print("\n[5/5] Checking memory additions...")
    mem_path = os.path.join(ara_dir, 'us-complete.txt')
    if os.path.isfile(mem_path):
        with open(mem_path, 'r', encoding='utf-8') as f:
            content = f.read()
        already_applied = (
            'PATTERN_DOCTRINE_001' in content or
            'ARC_RUN_LOG_001' in content or
            'Pattern Recognition Doctrine' in content
        )
        if already_applied:
            print(f"  ✓  Memory additions already applied to {mem_path}")
        else:
            mem_add = os.path.join(patch_dir, 'memory_additions.txt')
            if not os.path.isfile(mem_add):
                mem_add = os.path.join(ara_dir, 'memory_additions.txt')
            if os.path.isfile(mem_add):
                with open(mem_path, 'a', encoding='utf-8') as f:
                    with open(mem_add, 'r', encoding='utf-8') as m:
                        f.write('\n' + m.read())
                print(f"  ✓  Memory additions appended to {mem_path}")
            else:
                print(f"  ✗  memory_additions.txt not found. Append manually.")
    else:
        print(f"  ✗  us-complete.txt not found at {mem_path}")

    print()
    print("=" * 60)
    print("  HARDENING COMPLETE")
    print("=" * 60)
    print()
    print("  Next steps:")
    print("    1. Run setup_postgres.sh to set up the database")
    print("    2. Compile: npx tsc --noEmit cognitiveLoop.ts")
    print("    3. Run the ARC test: python3 runARC.py")
    print("    4. Compare results with baseline (2/10 LLM, 0/10 pure)")
    print()
    print("  To rollback:")
    ara_backup = os.path.join(ara_dir, 'cognitiveLoop.ts.backup')
    ara_cl = os.path.join(ara_dir, 'cognitiveLoop.ts')
    print(f"    cp {ara_backup} {ara_cl}")
    print()


if __name__ == '__main__':
    main()
