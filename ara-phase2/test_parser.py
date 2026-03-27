#!/usr/bin/env python3
"""
Test the Phase 2.1 extractPuzzleData parser logic in Python
before embedding it as TypeScript in the installer.

This validates the regex patterns and parsing logic against
the actual runARC.py puzzle format.
"""

import re
import json

SAMPLE_INPUT = r"""
======================================================================
              ARC-AGI-2  REASONING  TEST
======================================================================

COMPETITION RULES & SCORING -- read carefully before answering:
  1. This is an official ARC-AGI-2 reasoning test puzzle.
  2. You have up to 2 attempts to predict the correct output grid.
  [...]

======================================================================
PUZZLE ID : 0d3d703e
DIFFICULTY: EASY  (Colour mapping / substitution)
======================================================================

TRAINING EXAMPLES (study these to discover the rule):

  -- Train Example 1  (input 3x3  ->  output 3x3) --
  Input:
  3 1 2
  3 1 2
  3 1 2

  Output:
  4 5 6
  4 5 6
  4 5 6

  -- Train Example 2  (input 3x3  ->  output 3x3) --
  Input:
  2 3 8
  2 3 8
  2 3 8

  Output:
  6 4 9
  6 4 9
  6 4 9

======================================================================
TEST INPUT -- predict the output for this grid:
  (3x3)
  8 1 3
  8 1 3
  8 1 3
======================================================================
"""

# Additional test: minimal format
SAMPLE_MINIMAL = """
-- Train Example 1 --
Input:
1 2
3 4

Output:
5 6
7 8

TEST INPUT
1 0
0 1
"""

# Additional test: more examples, different dimensions
SAMPLE_COMPLEX = """
======================================================================
PUZZLE ID : abc12345
======================================================================

TRAINING EXAMPLES (study these to discover the rule):

  -- Train Example 1  (input 2x2  ->  output 2x2) --
  Input:
  0 1
  1 0

  Output:
  1 0
  0 1

  -- Train Example 2  (input 2x2  ->  output 2x2) --
  Input:
  2 3
  4 5

  Output:
  3 2
  5 4

  -- Train Example 3  (input 2x2  ->  output 2x2) --
  Input:
  6 7
  8 9

  Output:
  7 6
  9 8

======================================================================
TEST INPUT -- predict the output for this grid:
  (2x2)
  1 2
  3 4
======================================================================
"""


def is_grid_line(line: str) -> bool:
    """Check if a line looks like a grid row (contains only digits and whitespace)."""
    stripped = line.strip()
    if not stripped:
        return False
    # Filter out separator lines
    if re.match(r'^[=\-*~#]{3,}$', stripped):
        return False
    # Filter out lines that are clearly labels/headers
    if re.match(r'^(Input|Output|Train|Test|TRAINING|PUZZLE|DIFFICULTY|COMPETITION|RULES|ANSWER)', stripped):
        return False
    # Filter out dimension annotations like (3x3)
    if re.match(r'^\(\d+x\d+\)$', stripped):
        return False
    # Filter out lines starting with common non-grid patterns
    if stripped.startswith('[') and not any(c.isdigit() for c in stripped):
        return False
    # A grid line should be mostly digits and spaces
    cleaned = re.sub(r'[\[\],]', ' ', stripped)
    tokens = cleaned.split()
    if not tokens:
        return False
    digit_tokens = [t for t in tokens if re.match(r'^\d+$', t)]
    return len(digit_tokens) == len(tokens) and len(digit_tokens) > 0


def parse_grid(text: str) -> list:
    """Parse a text block into a 2D grid of integers."""
    rows = []
    for line in text.strip().split('\n'):
        stripped = line.strip()
        if not is_grid_line(stripped):
            continue
        cleaned = re.sub(r'[\[\],]', ' ', stripped).strip()
        values = [int(v) for v in cleaned.split() if re.match(r'^\d+$', v)]
        if values:
            rows.append(values)
    return rows


def extract_puzzle_data(text: str) -> dict:
    """
    Parse ARC puzzle data from the runARC.py format.
    
    Handles:
    - "-- Train Example N (input RxC -> output RxC) --" format
    - "Input:" and "Output:" labels within examples
    - "TEST INPUT -- predict the output for this grid:" section
    - Indented grid lines
    - Non-grid lines (headers, rules, dimension annotations)
    """
    training = []
    test_input = []

    # ---------------------------------------------------------------
    # Strategy A: Split on "-- Train Example N" pattern
    # ---------------------------------------------------------------
    # This matches: "-- Train Example 1  (input 3x3  ->  output 3x3) --"
    # Also matches: "-- Train Example 1 --" (without dimensions)
    # Also matches: "-- Training Example 1 --"
    example_pattern = r'--\s*Train(?:ing)?\s*Example\s*\d+'
    example_splits = re.split(example_pattern, text, flags=re.IGNORECASE)

    if len(example_splits) > 1:
        # First element is everything before the first example (headers, rules)
        for i in range(1, len(example_splits)):
            section = example_splits[i]

            # Remove the trailing " --" and dimension annotation from the start
            # The section starts right after "-- Train Example N"
            # It may begin with " (input 3x3 -> output 3x3) --\n"
            section = re.sub(r'^[^-]*--', '', section, count=1)

            # Split on "Output:" to separate input and output grids
            io_parts = re.split(r'Output\s*:', section, flags=re.IGNORECASE)
            if len(io_parts) >= 2:
                # Input part: everything before "Output:", after "Input:" label
                input_text = re.sub(r'Input\s*:', '', io_parts[0], flags=re.IGNORECASE)
                
                # Output part: everything after "Output:" until end of section
                # Truncate at TEST INPUT, separator lines, or next section
                output_text = io_parts[1]
                # Cut off at TEST INPUT or heavy separator lines
                output_text = re.split(
                    r'(?:TEST\s+INPUT|={10,})',
                    output_text,
                    flags=re.IGNORECASE
                )[0]
                
                input_grid = parse_grid(input_text)
                output_grid = parse_grid(output_text)

                if input_grid and output_grid:
                    training.append({
                        'input': input_grid,
                        'output': output_grid
                    })

    # ---------------------------------------------------------------
    # Strategy B: Extract test input after "TEST INPUT"
    # ---------------------------------------------------------------
    # Match "TEST INPUT" followed by anything (no colon required)
    test_pattern = r'TEST\s+INPUT'
    test_splits = re.split(test_pattern, text, flags=re.IGNORECASE)

    if len(test_splits) > 1:
        # Take the last section after "TEST INPUT"
        test_section = test_splits[-1]
        # Remove everything after "TEST OUTPUT", "EXPECTED", "ANSWER", or end separator
        test_section = re.split(
            r'(?:TEST\s*OUTPUT|EXPECTED\s*OUTPUT|ANSWER|={10,})',
            test_section,
            flags=re.IGNORECASE
        )[0]
        test_input = parse_grid(test_section)

    # ---------------------------------------------------------------
    # Strategy C: Fallback — grid blocks separated by blank lines
    # ---------------------------------------------------------------
    if not training:
        grid_blocks = []
        block_texts = re.split(r'\n\s*\n', text)
        for block in block_texts:
            grid = parse_grid(block)
            if grid and grid[0]:
                grid_blocks.append(grid)
        # Assume pairs: input, output, input, output, ..., test_input
        for i in range(0, len(grid_blocks) - 1, 2):
            if i + 1 < len(grid_blocks) - 1 or (len(grid_blocks) % 2 == 0):
                training.append({
                    'input': grid_blocks[i],
                    'output': grid_blocks[i + 1]
                })
        if grid_blocks and len(grid_blocks) % 2 == 1 and not test_input:
            test_input = grid_blocks[-1]

    return {
        'training': training,
        'testInput': test_input
    }


def run_test(name: str, text: str, expected_training_count: int,
             expected_training: list = None, expected_test: list = None):
    """Run a single parser test."""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    
    result = extract_puzzle_data(text)
    
    passed = True
    
    # Check training count
    actual_count = len(result['training'])
    if actual_count == expected_training_count:
        print(f"  ✓ Training pairs: {actual_count} (expected {expected_training_count})")
    else:
        print(f"  ✗ Training pairs: {actual_count} (expected {expected_training_count})")
        passed = False
    
    # Check training content
    if expected_training:
        for idx, (expected, actual) in enumerate(zip(expected_training, result['training'])):
            if actual['input'] == expected['input']:
                print(f"  ✓ Training pair {idx+1} input matches")
            else:
                print(f"  ✗ Training pair {idx+1} input mismatch:")
                print(f"    Expected: {expected['input']}")
                print(f"    Got:      {actual['input']}")
                passed = False
            
            if actual['output'] == expected['output']:
                print(f"  ✓ Training pair {idx+1} output matches")
            else:
                print(f"  ✗ Training pair {idx+1} output mismatch:")
                print(f"    Expected: {expected['output']}")
                print(f"    Got:      {actual['output']}")
                passed = False
    
    # Check test input
    if expected_test is not None:
        if result['testInput'] == expected_test:
            print(f"  ✓ Test input matches: {result['testInput']}")
        else:
            print(f"  ✗ Test input mismatch:")
            print(f"    Expected: {expected_test}")
            print(f"    Got:      {result['testInput']}")
            passed = False
    else:
        print(f"  Test input: {result['testInput']}")
    
    if passed:
        print(f"\n  >>> TEST PASSED <<<")
    else:
        print(f"\n  >>> TEST FAILED <<<")
    
    return passed


if __name__ == '__main__':
    all_passed = True
    
    # Test 1: Main sample (the actual runARC.py format)
    all_passed &= run_test(
        "Main ARC format (0d3d703e)",
        SAMPLE_INPUT,
        expected_training_count=2,
        expected_training=[
            {
                'input': [[3,1,2],[3,1,2],[3,1,2]],
                'output': [[4,5,6],[4,5,6],[4,5,6]]
            },
            {
                'input': [[2,3,8],[2,3,8],[2,3,8]],
                'output': [[6,4,9],[6,4,9],[6,4,9]]
            }
        ],
        expected_test=[[8,1,3],[8,1,3],[8,1,3]]
    )
    
    # Test 2: Minimal format
    all_passed &= run_test(
        "Minimal format",
        SAMPLE_MINIMAL,
        expected_training_count=1,
        expected_training=[
            {
                'input': [[1,2],[3,4]],
                'output': [[5,6],[7,8]]
            }
        ],
        expected_test=[[1,0],[0,1]]
    )
    
    # Test 3: Complex format (3 training examples)
    all_passed &= run_test(
        "Complex format (3 examples)",
        SAMPLE_COMPLEX,
        expected_training_count=3,
        expected_training=[
            {'input': [[0,1],[1,0]], 'output': [[1,0],[0,1]]},
            {'input': [[2,3],[4,5]], 'output': [[3,2],[5,4]]},
            {'input': [[6,7],[8,9]], 'output': [[7,6],[9,8]]},
        ],
        expected_test=[[1,2],[3,4]]
    )
    
    # Test 4: is_grid_line filter tests
    print(f"\n{'='*60}")
    print("TEST: is_grid_line filter")
    print(f"{'='*60}")
    
    filter_tests = [
        ("3 1 2", True),
        ("  3 1 2  ", True),
        ("======", False),
        ("------", False),
        ("Input:", False),
        ("Output:", False),
        ("(3x3)", False),
        ("TRAINING EXAMPLES (study these to discover the rule):", False),
        ("PUZZLE ID : 0d3d703e", False),
        ("DIFFICULTY: EASY  (Colour mapping / substitution)", False),
        ("COMPETITION RULES & SCORING -- read carefully before answering:", False),
        ("  1. This is an official ARC-AGI-2 reasoning test puzzle.", False),
        ("  2. You have up to 2 attempts to predict the correct output grid.", False),
        ("TEST INPUT -- predict the output for this grid:", False),
        ("0 0 0", True),
        ("9", True),
        ("[1, 2, 3]", True),
    ]
    
    for text, expected in filter_tests:
        actual = is_grid_line(text)
        status = "✓" if actual == expected else "✗"
        if actual != expected:
            all_passed = False
        print(f"  {status} is_grid_line({repr(text)}) = {actual} (expected {expected})")
    
    print(f"\n{'='*60}")
    if all_passed:
        print("ALL TESTS PASSED")
    else:
        print("SOME TESTS FAILED")
    print(f"{'='*60}")
