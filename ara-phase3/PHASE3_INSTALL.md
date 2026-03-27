# ARA Phase 3 Installation Guide

This guide provides step-by-step instructions for installing the Phase 3 patches for the ARA AI system's ARC puzzle solving capability on Termux.

## Overview of Phase 3 Patches

Phase 3 introduces critical enhancements to ARA's learning and reasoning capabilities:

1. **Live Learning Enhancement (`runARC.py`)**: 
   - Enhanced retry prompts showing ARA her exact wrong grid alongside the expected grid.
   - Live memory writing to `us-complete.txt` after each puzzle attempt.
   - PostgreSQL logging of all puzzle attempts to the `ara_puzzle_attempts` table.
2. **Expanded Autonomous Transforms (`cognitiveLoop.ts`)**: 
   - Adds new transforms: Border/Surround, Sub-Pattern Extraction, Height-Rank Colouring, Gravity Left/Right, and Compound Rules.
3. **Enhanced Doctrine (`cognitiveLoop.ts`)**: 
   - Injects puzzle-specific algorithms for complex puzzles (Gravity, Fractal, Surround, Height-Rank, Sub-Pattern, Tiled Mosaic).

## Prerequisites

- Termux environment with Python 3.6+ and Node.js installed.
- ARA system located at `~/ara` (or know the path to your ARA directory).
- PostgreSQL running and configured (for database logging).
- Phase 2 patches should ideally be applied, though the installer is robust enough to handle various states.

## Installation Steps

### Step 1: Transfer the Phase 3 Files

Ensure the following files are present in a directory on your Termux device (e.g., `~/ara-phase3`):

- `phase3_apply.py` (The installer script)
- `runARC_patch.py` (Patch code for `runARC.py`)
- `phase3_transforms.ts` (Patch code for autonomous transforms)
- `phase3_doctrine.ts` (Patch code for enhanced doctrine)

### Step 2: Run the Installer

Navigate to the directory containing the Phase 3 files and run the installer script. The script will automatically detect your ARA directory if it's located at `~/ara`.

```bash
cd ~/ara-phase3
python3 phase3_apply.py
```

If your ARA directory is located elsewhere, specify it using the `--ara-dir` flag:

```bash
python3 phase3_apply.py --ara-dir /path/to/your/ara
```

### Step 3: Review the Output

The installer will output its progress. It performs the following actions:
- Creates timestamped backups of `runARC.py` and `cognitiveLoop.ts`.
- Applies the live learning patches to `runARC.py`.
- Injects the expanded transforms and enhanced doctrine into `cognitiveLoop.ts`.
- Runs verification checks to ensure the patches were applied correctly.

Look for the `PHASE 3 PATCH INSTALLATION COMPLETE` message and ensure there are no critical warnings.

### Step 4: Verify the Installation

1. **Run an ARC Test**: Execute the test harness to see the new capabilities in action.
   ```bash
   cd ~/ara
   python3 runARC.py
   ```
2. **Check Live Memory**: Verify that ARA is writing to her memory file after attempts.
   ```bash
   tail -n 50 ~/ara/us-complete.txt
   ```
   You should see new nodes starting with `[ARC_LIVE_...`.
3. **Check PostgreSQL Logging**: Verify that attempts are being logged to the database.
   ```bash
   psql -d ara -c "SELECT * FROM ara_puzzle_attempts ORDER BY timestamp DESC LIMIT 5;"
   ```

## Rollback Instructions

If you encounter issues and need to revert to the pre-Phase 3 state, the installer created backups of your original files.

1. Locate the backup files in your ARA directory:
   ```bash
   ls ~/ara/*.phase3.*.backup
   ```
2. Copy the backup files over the patched files:
   ```bash
   cp ~/ara/runARC.py.phase3.<timestamp>.backup ~/ara/runARC.py
   cp ~/ara/cognitiveLoop.ts.phase3.<timestamp>.backup ~/ara/cognitiveLoop.ts
   ```

## Troubleshooting

- **"Could not find ARA directory"**: Ensure you are running the script on the device where ARA is installed, or use the `--ara-dir` flag to point to the correct location.
- **"WARNING: Some patches may need manual integration"**: The installer uses robust injection strategies, but if your files have been heavily modified, it might fail to find the correct injection points. Review the installer output to see which specific patch failed, and manually integrate the code from the corresponding patch file (`runARC_patch.py`, `phase3_transforms.ts`, or `phase3_doctrine.ts`).
