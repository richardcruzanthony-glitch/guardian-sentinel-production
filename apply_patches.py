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
"""

import os
import sys
import shutil
import re

def find_ara_dir():
    """Find the ARA directory."""
    # Check command line arg
    if '--ara-dir' in sys.argv:
        idx = sys.argv.index('--ara-dir')
        if idx + 1 < len(sys.argv):
            return sys.argv[idx + 1]
    
    # Check common locations
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
    
    # Backup original
    backup_path = cl_path + '.backup'
    if not os.path.isfile(backup_path):
        shutil.copy2(cl_path, backup_path)
        print(f"  Backup created: {backup_path}")
    else:
        print(f"  Backup already exists: {backup_path}")
    
    # Read original file
    with open(cl_path, 'r') as f:
        original = f.read()
    
    # Read patch file — extract just the code (skip comment header)
    with open(patch_path, 'r') as f:
        patch_lines = f.readlines()
    
    # Find the start of actual code (after the comment header)
    code_start = 0
    for i, line in enumerate(patch_lines):
        if line.strip().startswith('} else if (job.domain'):
            code_start = i
            break
    
    # Find the end of the patch (before "// --- END OF PATCH ---")
    code_end = len(patch_lines)
    for i in range(len(patch_lines) - 1, -1, -1):
        if 'END OF PATCH' in patch_lines[i]:
            code_end = i
            break
    
    patch_code = ''.join(patch_lines[code_start:code_end])
    
    # Find the target: the generic "else" block in buildAutonomousDecision
    # We need to find the pattern:
    #   } else {
    #     lines.push('AUTONOMOUS ASSESSMENT:');
    #     lines.push('  Step 1 — Identify the primary threat vector.');
    #     lines.push('  Step 2 — Apply economy of force — minimum resources to secondary threats.');
    #     lines.push('  Step 3 — Escalate to human authority immediately.');
    #     lines.push('  Step 4 — Iron holds. No action that violates principles.');
    #   }
    
    # Strategy: find "AUTONOMOUS ASSESSMENT:" and work backwards to find "} else {"
    # then forward to find the closing "}"
    
    lines = original.split('\n')
    
    # Find the line with 'AUTONOMOUS ASSESSMENT:'
    target_line = -1
    for i, line in enumerate(lines):
        if "'AUTONOMOUS ASSESSMENT:'" in line and 'lines.push' in line:
            target_line = i
            break
    
    if target_line == -1:
        print("  ERROR: Could not find 'AUTONOMOUS ASSESSMENT:' in cognitiveLoop.ts")
        print("  The generic else block may have already been patched or has different text.")
        return False
    
    # Find the "} else {" before it
    else_line = -1
    for i in range(target_line - 1, max(target_line - 10, 0), -1):
        if '} else {' in lines[i]:
            else_line = i
            break
    
    if else_line == -1:
        print("  ERROR: Could not find '} else {' before 'AUTONOMOUS ASSESSMENT:'")
        return False
    
    # Find the closing "}" after the 4 steps
    close_line = -1
    brace_count = 0
    for i in range(else_line, min(else_line + 20, len(lines))):
        brace_count += lines[i].count('{') - lines[i].count('}')
        if brace_count <= 0 and i > else_line:
            close_line = i
            break
    
    if close_line == -1:
        # Fallback: find "Iron holds" line and look for next "}"
        for i in range(target_line, min(target_line + 10, len(lines))):
            if 'Iron holds' in lines[i]:
                for j in range(i + 1, min(i + 5, len(lines))):
                    stripped = lines[j].strip()
                    if stripped == '}':
                        close_line = j
                        break
                break
    
    if close_line == -1:
        print("  ERROR: Could not find closing '}' of the generic else block")
        return False
    
    print(f"  Found generic else block: lines {else_line + 1} to {close_line + 1}")
    print(f"  Original block:")
    for i in range(else_line, close_line + 1):
        print(f"    {i + 1}: {lines[i]}")
    
    # Replace the block
    # The patch includes its own "} else if ..." and ends with "} else { ... }"
    # So we replace from else_line to close_line (inclusive)
    new_lines = lines[:else_line] + [patch_code] + lines[close_line + 1:]
    
    new_content = '\n'.join(new_lines)
    
    with open(cl_path, 'w') as f:
        f.write(new_content)
    
    print(f"  SUCCESS: Patched cognitiveLoop.ts")
    print(f"  Replaced lines {else_line + 1}-{close_line + 1} with analytical reasoning branch ({len(patch_code.split(chr(10)))} lines)")
    return True

def verify_patch(ara_dir):
    """Verify the patch was applied correctly."""
    cl_path = os.path.join(ara_dir, 'cognitiveLoop.ts')
    with open(cl_path, 'r') as f:
        content = f.read()
    
    checks = {
        'Analytical branch exists': "job.domain === 'check'" in content,
        'Grid parser exists': 'parseGrid' in content,
        'Value substitution': 'tryValueSubstitution' in content,
        'Horizontal reflection': 'horizontalReflect' in content,
        'Vertical reflection': 'verticalReflect' in content,
        'Gravity down': 'gravityDown' in content,
        'Fractal tiling': 'fractalTile' in content,
        'Grid output format': '```grid' in content,
        'Original fallback preserved': 'AUTONOMOUS ASSESSMENT:' in content,
        'Self-check step': 'Self-check' in content,
    }
    
    print("\n  Verification:")
    all_pass = True
    for check, result in checks.items():
        status = '✓' if result else '✗'
        print(f"    {status} {check}")
        if not result:
            all_pass = False
    
    return all_pass

def main():
    print("=" * 60)
    print("  ARA HARDENING — Automatic Patch Installer")
    print("=" * 60)
    print()
    
    ara_dir = find_ara_dir()
    if not ara_dir:
        print("ERROR: Could not find ARA directory (cognitiveLoop.ts).")
        print("Usage: python3 apply_patches.py --ara-dir ~/ara")
        sys.exit(1)
    print(f"  ARA directory: {ara_dir}")
    
    patch_dir = find_patch_dir()
    if not patch_dir:
        print("ERROR: Could not find patch files (buildAutonomousDecision_patch.ts).")
        print("Make sure you cloned the ara-hardening branch.")
        sys.exit(1)
    print(f"  Patch directory: {patch_dir}")
    print()
    
    # Step 1: Apply cognitiveLoop.ts patch
    print("[1/4] Patching cognitiveLoop.ts...")
    if not apply_cognitive_loop_patch(ara_dir, patch_dir):
        print("  FAILED — aborting.")
        sys.exit(1)
    
    # Step 2: Verify
    print("\n[2/4] Verifying patch...")
    if not verify_patch(ara_dir):
        print("  WARNING: Some checks failed. Review cognitiveLoop.ts manually.")
    else:
        print("  All checks passed!")
    
    # Step 3: Check playbook
    print("\n[3/4] Checking playbook...")
    pb_path = os.path.join(ara_dir, 'playbooks', 'analytical-reasoning.json')
    if os.path.isfile(pb_path):
        print(f"  ✓ Playbook found: {pb_path}")
    else:
        # Try to copy from patch dir
        src = os.path.join(patch_dir, 'playbooks', 'analytical-reasoning.json')
        if os.path.isfile(src):
            os.makedirs(os.path.join(ara_dir, 'playbooks'), exist_ok=True)
            shutil.copy2(src, pb_path)
            print(f"  ✓ Playbook copied to: {pb_path}")
        else:
            print(f"  ✗ Playbook not found. Copy manually.")
    
    # Step 4: Check memory
    print("\n[4/4] Checking memory additions...")
    mem_path = os.path.join(ara_dir, 'us-complete.txt')
    if os.path.isfile(mem_path):
        with open(mem_path, 'r') as f:
            content = f.read()
        if 'PATTERN RECOGNITION DOCTRINE' in content or 'ARC-AGI RUN LOG' in content:
            print(f"  ✓ Memory additions already applied to {mem_path}")
        else:
            mem_add = os.path.join(patch_dir, 'memory_additions.txt')
            if not os.path.isfile(mem_add):
                mem_add = os.path.join(ara_dir, 'memory_additions.txt')
            if os.path.isfile(mem_add):
                with open(mem_path, 'a') as f:
                    with open(mem_add, 'r') as m:
                        f.write('\n' + m.read())
                print(f"  ✓ Memory additions appended to {mem_path}")
            else:
                print(f"  ✗ memory_additions.txt not found. Append manually.")
    else:
        print(f"  ✗ us-complete.txt not found at {mem_path}")
    
    print()
    print("=" * 60)
    print("  HARDENING COMPLETE")
    print("=" * 60)
    print()
    print("  Next steps:")
    print("    1. Run setup_postgres.sh to set up the database")
    print("    2. Run the ARC test again: python runARC.py")
    print("    3. Compare results with baseline (2/10 LLM, 0/10 pure)")
    print()
    print("  To rollback:")
    print("    cp ~/ara/cognitiveLoop.ts.backup ~/ara/cognitiveLoop.ts")
    print()

if __name__ == '__main__':
    main()
