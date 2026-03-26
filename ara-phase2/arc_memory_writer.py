#!/usr/bin/env python3
"""
ARA Memory Writer — Learns from ARC Test Results
=================================================
Parses the ARC test log (arc_demo.log) and appends structured memory nodes
to us-complete.txt so ARA learns from each run.

Usage:
    python3 arc_memory_writer.py
    python3 arc_memory_writer.py --ara-dir ~/ara
    python3 arc_memory_writer.py --log ~/ara/arc_demo.log --memory ~/ara/us-complete.txt

What it does:
    1. Reads the ARC test log file
    2. Extracts per-puzzle results (puzzle ID, pattern, correct/incorrect, 
       what rule ARA tried, what the expected answer was)
    3. Builds structured memory nodes with lessons learned
    4. Appends them to us-complete.txt with timestamps
    5. Reports how many nodes were added

Memory node format matches ARA's existing memory structure so the Brain
engine can recall them during future puzzle attempts.
"""

import os
import sys
import re
import json
from datetime import datetime


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
        if os.path.isfile(os.path.join(d, 'us-complete.txt')):
            return d
    return None


def find_log_file(ara_dir):
    """Find the ARC test log file."""
    if '--log' in sys.argv:
        idx = sys.argv.index('--log')
        if idx + 1 < len(sys.argv):
            return sys.argv[idx + 1]
    candidates = [
        os.path.join(ara_dir, 'arc_demo.log'),
        os.path.join(ara_dir, 'arc_results.log'),
        os.path.join(ara_dir, 'arc_test.log'),
    ]
    for f in candidates:
        if os.path.isfile(f):
            return f
    return None


def find_memory_file(ara_dir):
    """Find the memory file."""
    if '--memory' in sys.argv:
        idx = sys.argv.index('--memory')
        if idx + 1 < len(sys.argv):
            return sys.argv[idx + 1]
    return os.path.join(ara_dir, 'us-complete.txt')


def parse_log(log_path):
    """
    Parse the ARC test log and extract puzzle results.
    Returns a list of dicts with puzzle info.
    """
    with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    puzzles = []
    
    # Split by puzzle headers
    # Pattern: "Puzzle : XXXXXXXX  [DIFFICULTY]"
    puzzle_sections = re.split(r'-{20,}\s*\n\s*Puzzle\s*:\s*', content)
    
    for section in puzzle_sections[1:]:  # Skip everything before first puzzle
        puzzle = {}
        
        # Extract puzzle ID and difficulty
        id_match = re.match(r'(\w+)\s*\[(\w+)\]', section)
        if id_match:
            puzzle['id'] = id_match.group(1)
            puzzle['difficulty'] = id_match.group(2)
        else:
            continue
        
        # Extract pattern description
        pattern_match = re.search(r'Pattern:\s*(.+?)(?:\n|$)', section)
        if pattern_match:
            puzzle['pattern'] = pattern_match.group(1).strip()
        else:
            puzzle['pattern'] = 'Unknown'
        
        # Check if CORRECT or INCORRECT
        correct_attempts = re.findall(r'CORRECT on attempt (\d+)', section)
        incorrect_attempts = re.findall(r'INCORRECT on attempt (\d+)', section)
        parse_warnings = re.findall(r'Could not parse a ```grid``` block', section)
        
        puzzle['correct'] = len(correct_attempts) > 0
        puzzle['correct_attempt'] = int(correct_attempts[0]) if correct_attempts else 0
        puzzle['incorrect_attempts'] = len(incorrect_attempts)
        puzzle['parse_failures'] = len(parse_warnings)
        
        # Extract ARA's reasoning (first response)
        reasoning_match = re.search(r'=== ARA RESPONSE ===\s*\n(.*?)(?:=== METRICS ===|$)', 
                                     section, re.DOTALL)
        if reasoning_match:
            reasoning = reasoning_match.group(1).strip()
            # Truncate to first 500 chars for memory
            puzzle['reasoning_summary'] = reasoning[:500] if len(reasoning) > 500 else reasoning
        else:
            puzzle['reasoning_summary'] = 'No reasoning captured'
        
        # Extract expected output if incorrect
        expected_match = re.search(r'Expected \((\d+x\d+)\):\s*\n((?:\s+[\d ]+\n)+)', section)
        if expected_match:
            puzzle['expected_dims'] = expected_match.group(1)
            puzzle['expected_grid'] = expected_match.group(2).strip()
        
        # Extract what ARA got if incorrect
        got_match = re.search(r'Got \((\d+x\d+)\):\s*\n((?:\s+[\d ]+\n)+)', section)
        if got_match:
            puzzle['got_dims'] = got_match.group(1)
            puzzle['got_grid'] = got_match.group(2).strip()
        
        # Extract which LLM provider responded
        provider_match = re.search(r'\[LLM\] (\w+) responded', section)
        if provider_match:
            puzzle['provider'] = provider_match.group(1)
        else:
            # Check if autonomous reasoning was used
            if 'autonomous reasoning engaged' in section:
                puzzle['provider'] = 'Autonomous'
            else:
                puzzle['provider'] = 'Unknown'
        
        # Extract metrics
        metrics_match = re.search(r'"ironScore":\s*([\d.]+)', section)
        if metrics_match:
            puzzle['iron_score'] = float(metrics_match.group(1))
        
        confidence_match = re.search(r'"confidence":\s*([\d.]+)', section)
        if confidence_match:
            puzzle['confidence'] = float(confidence_match.group(1))
        
        puzzles.append(puzzle)
    
    return puzzles


def extract_run_info(log_path):
    """Extract run-level info (run number, mode, timestamp)."""
    with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    info = {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'runs': []
    }
    
    # Find run headers
    run_matches = re.findall(
        r'MODE:\s*Run\s*(\d+)\s*--\s*(.+?)(?:\s*=+)', content
    )
    for run_num, mode in run_matches:
        info['runs'].append({
            'number': int(run_num),
            'mode': mode.strip()
        })
    
    # Find scoreboard if present
    score_match = re.search(
        r'Run\s*1.*?:\s*(\d+)/(\d+)', content
    )
    if score_match:
        info['run1_score'] = f"{score_match.group(1)}/{score_match.group(2)}"
    
    score_match2 = re.search(
        r'Run\s*2.*?:\s*(\d+)/(\d+)', content
    )
    if score_match2:
        info['run2_score'] = f"{score_match2.group(1)}/{score_match2.group(2)}"
    
    return info


def build_memory_nodes(puzzles, run_info):
    """Build memory node text from parsed puzzle results."""
    timestamp = run_info['timestamp']
    nodes = []
    
    # Summary node
    correct_count = sum(1 for p in puzzles if p['correct'])
    total_count = len(puzzles)
    
    if total_count == 0:
        return []
    
    summary_node = f"""
---
[ARC_RUN_{timestamp.replace(' ', '_').replace(':', '')}]
TYPE: ARC_TEST_RESULT_SUMMARY
TIMESTAMP: {timestamp}
TOTAL_PUZZLES: {total_count}
CORRECT: {correct_count}
ACCURACY: {correct_count}/{total_count} ({100*correct_count/total_count:.0f}%)
PROVIDERS_USED: {', '.join(set(p.get('provider', 'Unknown') for p in puzzles))}
LESSON: ARA scored {correct_count}/{total_count} on ARC-AGI-2 benchmark. {'Improvement detected.' if correct_count > 3 else 'More work needed on grid execution accuracy.'}
PATTERNS_SOLVED: {', '.join(p['pattern'] for p in puzzles if p['correct'])}
PATTERNS_FAILED: {', '.join(p['pattern'] for p in puzzles if not p['correct'])}
---"""
    nodes.append(summary_node)
    
    # Per-puzzle nodes (only for failures — successes don't need correction)
    for p in puzzles:
        if p['correct']:
            # Brief success node
            node = f"""
---
[ARC_PUZZLE_{p['id']}_{timestamp.replace(' ', '_').replace(':', '')}]
TYPE: ARC_PUZZLE_SUCCESS
PUZZLE_ID: {p['id']}
DIFFICULTY: {p.get('difficulty', 'Unknown')}
PATTERN: {p['pattern']}
RESULT: CORRECT on attempt {p['correct_attempt']}
PROVIDER: {p.get('provider', 'Unknown')}
LESSON: Successfully solved {p['pattern']} puzzle. Rule identification and grid execution were both correct. Reinforce this approach for similar patterns.
---"""
            nodes.append(node)
        else:
            # Detailed failure node with lessons
            lesson = generate_failure_lesson(p)
            
            node = f"""
---
[ARC_PUZZLE_{p['id']}_{timestamp.replace(' ', '_').replace(':', '')}]
TYPE: ARC_PUZZLE_FAILURE
PUZZLE_ID: {p['id']}
DIFFICULTY: {p.get('difficulty', 'Unknown')}
PATTERN: {p['pattern']}
RESULT: INCORRECT ({p['incorrect_attempts']} failed attempts, {p['parse_failures']} parse failures)
PROVIDER: {p.get('provider', 'Unknown')}
REASONING_EXCERPT: {p.get('reasoning_summary', 'None captured')[:300]}
{f"EXPECTED_DIMS: {p['expected_dims']}" if 'expected_dims' in p else ""}
{f"GOT_DIMS: {p['got_dims']}" if 'got_dims' in p else ""}
LESSON: {lesson}
ACTION: On next encounter with '{p['pattern']}' pattern, apply corrective steps before submitting.
---"""
            nodes.append(node)
    
    return nodes


def generate_failure_lesson(puzzle):
    """Generate a specific lesson from a puzzle failure."""
    pattern = puzzle.get('pattern', '').lower()
    reasoning = puzzle.get('reasoning_summary', '').lower()
    
    # Check for known failure patterns
    if 'mirror' in pattern or 'reflect' in pattern:
        if 'horizontal' in reasoning and 'vertical' not in reasoning:
            return "MIRROR AXIS ERROR: Only tested one reflection axis. MUST test BOTH horizontal (reverse each row) and vertical (reverse row order) and compare against ALL training outputs."
        elif 'vertical' in reasoning and 'horizontal' not in reasoning:
            return "MIRROR AXIS ERROR: Only tested one reflection axis. MUST test BOTH horizontal and vertical reflection."
        else:
            return "Reflection puzzle failed. Verify: horizontal = reverse each ROW left-to-right. Vertical = reverse ORDER of rows top-to-bottom. Test both on ALL training pairs."
    
    elif 'gravity' in pattern or 'stack' in pattern or 'fall' in pattern:
        return "GRAVITY ERROR: Values may have been lost during stacking. CRITICAL: count non-zero values per column BEFORE gravity, verify same count AFTER. Gravity NEVER reduces value count."
    
    elif 'fractal' in pattern or 'tiling' in pattern or 'self-similar' in pattern:
        return "FRACTAL TILING ERROR: Each non-zero cell becomes a COPY of the entire input pattern, NOT a solid block of that value. Zero cells become zero-filled blocks of the same size."
    
    elif 'surround' in pattern or 'border' in pattern or 'ring' in pattern:
        return "BORDER/SURROUND ERROR: Only surround the TARGET value (usually 2) with the border value (usually 1). Do NOT wrap other values like 7 or 5. Check which values get borders by examining ALL training examples."
    
    elif 'uniform' in pattern or 'detection' in pattern:
        return "UNIFORM ROW DETECTION ERROR: Check if ALL values in a row are identical. If yes, output one value; if mixed, output another. Apply to EVERY row independently."
    
    elif 'substitution' in pattern or 'mapping' in pattern or 'colour' in pattern:
        return "VALUE SUBSTITUTION ERROR: Build mapping table from ALL training pairs. Each input value must consistently map to the same output value across all examples. If inconsistent, this is NOT pure substitution."
    
    elif puzzle.get('parse_failures', 0) > 0:
        return "PARSE FAILURE: ARA's response did not include a ```grid``` code block. The answer MUST be formatted inside ```grid``` markers with space-separated values, one row per line."
    
    elif 'expected_dims' in puzzle and 'got_dims' in puzzle:
        if puzzle['expected_dims'] != puzzle['got_dims']:
            return f"DIMENSION MISMATCH: Expected {puzzle['expected_dims']} but produced {puzzle['got_dims']}. Check dimension ratio from training examples and apply consistently to test input."
        else:
            return f"CORRECT DIMENSIONS ({puzzle['expected_dims']}) but wrong cell values. The transformation rule was likely identified correctly but applied incorrectly. Re-verify rule on ALL training examples cell-by-cell before applying to test."
    
    else:
        return f"Failed on '{puzzle.get('pattern', 'unknown')}' pattern. Review training examples more carefully. Follow doctrine steps 1-10 in order. Verify rule on ALL training pairs before applying to test."


def count_existing_nodes(memory_path):
    """Count existing memory nodes in the file."""
    if not os.path.isfile(memory_path):
        return 0
    with open(memory_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    # Count nodes by counting section markers
    return content.count('[ARC_')


def main():
    print("=" * 60)
    print("  ARA Memory Writer — Learn from ARC Results")
    print("=" * 60)
    print()
    
    # Find directories and files
    ara_dir = find_ara_dir()
    if not ara_dir:
        print("ERROR: Could not find ARA directory.")
        print("Usage: python3 arc_memory_writer.py --ara-dir ~/ara")
        sys.exit(1)
    print(f"  ARA directory: {ara_dir}")
    
    log_path = find_log_file(ara_dir)
    if not log_path:
        print("ERROR: Could not find ARC test log file.")
        print("  Looked for: arc_demo.log, arc_results.log, arc_test.log")
        print("  Use --log to specify: python3 arc_memory_writer.py --log path/to/log")
        sys.exit(1)
    print(f"  Log file:      {log_path}")
    
    memory_path = find_memory_file(ara_dir)
    print(f"  Memory file:   {memory_path}")
    print()
    
    # Parse the log
    print("[1/4] Parsing ARC test log...")
    puzzles = parse_log(log_path)
    run_info = extract_run_info(log_path)
    
    if len(puzzles) == 0:
        print("  WARNING: No puzzle results found in the log.")
        print("  Make sure the ARC test has completed and the log file is correct.")
        sys.exit(1)
    
    correct = sum(1 for p in puzzles if p['correct'])
    print(f"  Found {len(puzzles)} puzzle results: {correct} correct, {len(puzzles) - correct} incorrect")
    print()
    
    # Show summary
    print("[2/4] Puzzle results:")
    for p in puzzles:
        status = "CORRECT" if p['correct'] else "INCORRECT"
        provider = p.get('provider', '?')
        print(f"  {p['id']}  [{p.get('difficulty', '?'):6s}]  {status:9s}  ({provider})  {p['pattern']}")
    print()
    
    # Build memory nodes
    print("[3/4] Building memory nodes...")
    nodes = build_memory_nodes(puzzles, run_info)
    print(f"  Built {len(nodes)} memory nodes ({len(puzzles)} puzzles + 1 summary)")
    print()
    
    # Check for duplicates
    existing_arc_nodes = count_existing_nodes(memory_path)
    print(f"  Existing ARC memory nodes: {existing_arc_nodes}")
    
    # Count current memory nodes
    if os.path.isfile(memory_path):
        with open(memory_path, 'r', encoding='utf-8', errors='replace') as f:
            current_content = f.read()
        current_node_count = current_content.count('---')
        
        # Check if this exact run was already written
        run_marker = f"ARC_RUN_{run_info['timestamp'].replace(' ', '_').replace(':', '')}"
        if run_marker in current_content:
            print(f"  WARNING: This run's results appear to already be in memory.")
            print(f"  Marker found: {run_marker}")
            print(f"  Skipping to avoid duplicates.")
            sys.exit(0)
    
    # Append to memory file
    print("[4/4] Appending to memory file...")
    
    header = f"\n\n# ===== ARC TEST RESULTS — {run_info['timestamp']} =====\n"
    header += f"# Score: {correct}/{len(puzzles)} ({100*correct/len(puzzles):.0f}%)\n"
    header += f"# Providers: {', '.join(set(p.get('provider', 'Unknown') for p in puzzles))}\n"
    
    full_text = header + '\n'.join(nodes) + '\n'
    
    with open(memory_path, 'a', encoding='utf-8') as f:
        f.write(full_text)
    
    # Verify
    with open(memory_path, 'r', encoding='utf-8', errors='replace') as f:
        new_content = f.read()
    new_node_count = new_content.count('---')
    lines_added = full_text.count('\n')
    
    print(f"  Appended {lines_added} lines to {memory_path}")
    print(f"  Memory nodes: {current_node_count if 'current_node_count' in dir() else '?'} → {new_node_count}")
    print()
    
    print("=" * 60)
    print("  MEMORY UPDATE COMPLETE")
    print("=" * 60)
    print()
    print(f"  ARA will now recall these {len(nodes)} nodes on future puzzle attempts.")
    print(f"  Lessons learned from {len(puzzles) - correct} failures have been recorded.")
    print(f"  Success patterns from {correct} correct puzzles reinforced.")
    print()
    print("  To verify, run:")
    print(f"    grep 'ARC_PUZZLE_' {memory_path} | wc -l")
    print()


if __name__ == '__main__':
    main()
