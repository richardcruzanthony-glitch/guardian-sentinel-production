# ARA Phase 2.1 Hotfix Installation Guide

This document outlines the Phase 2.1 hotfix for the ARA AI system's ARC puzzle solving capability. It addresses critical parsing and LLM routing issues discovered during Phase 2 testing.

## Overview of Fixes

### BUG 1: Autonomous Parser Failure (CRITICAL)
**Issue:** The `extractPuzzleData()` function in the autonomous branch failed to parse the actual puzzle format sent by `runARC.py`. It expected colon-delimited labels (e.g., `Training Example 1:`), but the actual format uses dash-delimited headers (e.g., `-- Train Example 1 (input 3x3 -> output 3x3) --`). This caused the autonomous solver to score 0/10 because it couldn't extract the grids.
**Fix:** Rewrote `extractPuzzleData()` to use robust regex splitting on the actual format. Updated `parseGrid()` to aggressively filter out non-grid lines like headers, rules, and dimension annotations.

### BUG 2: LLM Router Rejection (HIGH)
**Issue:** The LLM (Groq) was generating overly verbose responses (e.g., 9512 characters), causing the router to reject the response and fail the attempt.
**Fix:** Injected a strict conciseness instruction into the `GRID_PUZZLE_DOCTRINE` prompt, limiting reasoning to 1-2 sentences per step and capping the total response at 4000 characters.

### BUG 3: Creativity Engine Variables (LOW)
**Issue:** The creativity engine extracts 0 variables from grid puzzles because it lacks a grid-aware variable extractor for the `check` domain.
**Fix:** Documented as a known limitation. A full fix requires adding a new variable extractor module, which is deferred to Phase 2.2.

## Installation Instructions

The hotfix is applied automatically using the provided Python installer script.

### Prerequisites
- Python 3.6+
- The `cognitiveLoop.ts` file must exist in your ARA directory (typically `~/ara/cognitiveLoop.ts`).
- Phase 2 patches should ideally be applied first, though the parser fix will work regardless.

### Running the Installer

1. Navigate to the patch directory:
   ```bash
   cd ~/ara-phase2
   ```

2. Run the installer script:
   ```bash
   python3 phase21_apply.py --ara-dir ~/ara
   ```
   *(If your ARA directory is located elsewhere, adjust the `--ara-dir` path accordingly.)*

3. The script will:
   - Run a self-test to validate the new parser logic.
   - Create a timestamped backup of `cognitiveLoop.ts`.
   - Inject the new `extractPuzzleData()` and `parseGrid()` functions.
   - Inject the conciseness instruction into the doctrine.
   - Verify the patches and check brace balance.

## Verification

After installation, verify the fixes by running the ARC test suite:

```bash
cd ~/ara
python3 runARC.py
```

**Expected Outcomes:**
- **Autonomous Branch:** You should see logs indicating `Parsed N training pair(s)` instead of failing to find the test input.
- **LLM Branch:** Responses should be noticeably shorter, and router rejection errors due to length should no longer occur.

## Rollback Instructions

If you encounter issues and need to revert to the pre-hotfix state, the installer creates a backup file in the same directory as `cognitiveLoop.ts`.

To restore the backup:
```bash
cd ~/ara
cp cognitiveLoop.ts.phase21.backup cognitiveLoop.ts
```
*(Note: If multiple backups exist, the script uses a timestamped format like `cognitiveLoop.ts.phase21.YYYYMMDD_HHMMSS.backup`.)*
