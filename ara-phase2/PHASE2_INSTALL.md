# ARA Phase 2 Hardening — Installation Guide

This package contains the Phase 2 hardening patches for the ARA (Autonomous Reasoning Agent) system running on Termux. 

## Overview of Phase 2

While Phase 1 introduced the autonomous analytical branch (which fires when all LLMs fail), Phase 2 focuses on improving the primary LLM path (Groq) which runs most of the time.

**Key Improvements:**
1. **Doctrine Injection:** Injects the 10-step Pattern Recognition Doctrine directly into the LLM system prompt when solving grid puzzles. This forces the LLM to follow a structured elimination protocol instead of free-forming.
2. **Error Prevention:** Explicitly defines spatial transforms (horizontal vs vertical reflection), gravity rules (count preservation), and fractal tiling (pattern copying) to prevent known errors from the ARC benchmark.
3. **Grid Output Verification:** Adds a self-verification step that parses the LLM's ```grid``` output, checks dimensions against training expectations, validates value ranges (0-9), and appends warnings if the LLM hallucinates invalid formats.
4. **Phase 1 Restoration:** The installer automatically checks if the Phase 1 analytical branch is present and offers to restore it if it was accidentally overwritten.

## Files Included

- `phase2_prompt_doctrine.ts`: The TypeScript snippet containing the 10-step doctrine and prompt injection logic.
- `phase2_grid_verify.ts`: The TypeScript self-verification function for validating LLM grid outputs.
- `phase2_apply.py`: The robust Python installer script that automatically applies the patches to `cognitiveLoop.ts`.
- `PHASE2_INSTALL.md`: This guide.

## Installation Instructions (Termux)

Follow these steps to apply the Phase 2 patches on your Termux environment.

### Step 1: Prepare the Patch Directory

Ensure all Phase 2 files are in a directory named `ara-phase2` in your home folder.

```bash
cd ~
ls -l ara-phase2/
```
You should see `phase2_apply.py`, `phase2_prompt_doctrine.ts`, and `phase2_grid_verify.ts`.

### Step 2: Run the Installer

The installer script is designed to be robust. It will automatically create backups, find the correct injection points in `cognitiveLoop.ts`, and verify the results.

```bash
python3 ~/ara-phase2/phase2_apply.py --ara-dir ~/ara
```

**What the installer does:**
1. Runs a self-test to ensure its injection logic works.
2. Creates a backup of `cognitiveLoop.ts` (named `cognitiveLoop.ts.phase2.backup`).
3. Checks if the Phase 1 analytical branch is present (and offers to re-apply it if missing).
4. Injects the Doctrine constant and guard into the LLM prompt construction section.
5. Injects the Grid Verification block after the LLM response handling.
6. Runs verification checks to ensure all components are present.
7. Performs a brace-balance check to ensure no syntax errors were introduced.

### Step 3: Verify Compilation

After the installer finishes successfully, verify that the TypeScript code still compiles without errors:

```bash
cd ~/ara
npx tsc --noEmit cognitiveLoop.ts
```

If this command returns no output, the compilation was successful.

### Step 4: Run the ARC Benchmark

Test the hardened system against the ARC benchmark:

```bash
python3 runARC.py
```

You should observe the LLM following the 10-step doctrine in its reasoning output, and any malformed grids should now trigger a `GRID_VERIFY WARNING`.

## Troubleshooting & Rollback

If you encounter any issues (e.g., syntax errors or unexpected behavior), you can easily roll back to the pre-Phase 2 state.

**To rollback Phase 2:**
```bash
cd ~/ara
cp cognitiveLoop.ts.phase2.backup cognitiveLoop.ts
```

**To rollback completely (pre-Phase 1):**
```bash
cd ~/ara
cp cognitiveLoop.ts.backup cognitiveLoop.ts
```

## Manual Installation (Fallback)

If the automatic installer fails to find the correct injection points (which can happen if `cognitiveLoop.ts` has been heavily modified), the script will append the patches to the end of the file and provide instructions for manual placement.

1. Open `~/ara/cognitiveLoop.ts` in your preferred editor (e.g., `nano` or `vim`).
2. Locate the `GRID_PUZZLE_DOCTRINE` constant at the top of the file.
3. Find where your LLM system prompt is constructed (e.g., `systemPrompt += ...` or `messages.push({role: 'system'...})`).
4. Insert the domain guard:
   ```typescript
   if (job.domain === 'check' || job.domain === 'analytical') {
       systemPrompt += '\n' + GRID_PUZZLE_DOCTRINE;
   }
   ```
5. Locate where the LLM response is received (e.g., `const response = await callLLM(...)`).
6. Call the verification function:
   ```typescript
   if (job.domain === 'check' || job.domain === 'analytical') {
       response = verifyAndAnnotateGrid(response);
   }
   ```
7. Save and compile.
