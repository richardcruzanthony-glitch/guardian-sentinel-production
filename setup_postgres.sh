#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# ARA HARDENING — PostgreSQL Setup Script for Termux
# =============================================================================
# This script installs, initializes, and configures PostgreSQL on Termux
# for ARA's iteration persistence layer. It creates the 'ara' database,
# sets up the puzzle attempt tracking tables, and updates .env if needed.
#
# USAGE:
#   chmod +x setup_postgres.sh
#   ./setup_postgres.sh
#
# PREREQUISITES:
#   - Termux installed on Android
#   - Internet connection (for pkg install)
#   - ~/ara/.env file exists (optional — will be created/updated)
#
# IDEMPOTENT: Safe to run multiple times. Will skip steps already completed.
# =============================================================================

set -euo pipefail

# --- Configuration ---
ARA_HOME="$HOME/ara"
ENV_FILE="$ARA_HOME/.env"
DB_NAME="ara"
DB_USER=$(whoami)  # Termux default user (typically u0_a201 or similar)
PG_DATA="$PREFIX/var/lib/postgresql"

echo "=============================================="
echo "  ARA PostgreSQL Setup — Termux"
echo "=============================================="
echo "  User:     $DB_USER"
echo "  Database: $DB_NAME"
echo "  Data dir: $PG_DATA"
echo "  .env:     $ENV_FILE"
echo "=============================================="
echo ""

# --- Step 1: Install PostgreSQL ---
echo "[1/7] Installing PostgreSQL..."
if command -v pg_isready &> /dev/null; then
    echo "  PostgreSQL is already installed. Skipping."
else
    pkg update -y
    pkg install -y postgresql
    echo "  PostgreSQL installed successfully."
fi
echo ""

# --- Step 2: Initialize the database cluster ---
echo "[2/7] Initializing database cluster..."
if [ -d "$PG_DATA" ] && [ -f "$PG_DATA/PG_VERSION" ]; then
    echo "  Database cluster already exists at $PG_DATA. Skipping."
else
    mkdir -p "$PG_DATA"
    initdb -D "$PG_DATA"
    echo "  Database cluster initialized."
fi
echo ""

# --- Step 3: Start PostgreSQL ---
echo "[3/7] Starting PostgreSQL..."
if pg_isready -q 2>/dev/null; then
    echo "  PostgreSQL is already running."
else
    # Start PostgreSQL in the background
    pg_ctl -D "$PG_DATA" -l "$PREFIX/var/lib/postgresql/logfile" start
    # Wait for it to be ready
    for i in $(seq 1 10); do
        if pg_isready -q 2>/dev/null; then
            echo "  PostgreSQL started successfully."
            break
        fi
        echo "  Waiting for PostgreSQL to start... ($i/10)"
        sleep 1
    done
    if ! pg_isready -q 2>/dev/null; then
        echo "  ERROR: PostgreSQL failed to start. Check $PG_DATA/logfile"
        exit 1
    fi
fi
echo ""

# --- Step 4: Create the 'ara' database ---
echo "[4/7] Creating database '$DB_NAME'..."
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "  Database '$DB_NAME' already exists. Skipping."
else
    createdb "$DB_NAME"
    echo "  Database '$DB_NAME' created."
fi
echo ""

# --- Step 5: Create puzzle attempt tracking tables ---
echo "[5/7] Creating puzzle tracking tables..."
psql -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'

-- Table: ara_puzzle_attempts
-- Stores every attempt at solving a puzzle, enabling iterative learning.
CREATE TABLE IF NOT EXISTS ara_puzzle_attempts (
    puzzle_id       TEXT NOT NULL,
    attempt_number  INTEGER NOT NULL,
    rule_tried      TEXT NOT NULL,
    result_grid     JSONB,
    expected_grid   JSONB,
    correct         BOOLEAN NOT NULL DEFAULT FALSE,
    confidence      TEXT CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
    notes           TEXT,
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (puzzle_id, attempt_number)
);

-- Table: ara_puzzle_rules
-- Tracks the state of each puzzle: solved status, eliminated rules, attempt count.
CREATE TABLE IF NOT EXISTS ara_puzzle_rules (
    puzzle_id       TEXT PRIMARY KEY,
    solved          BOOLEAN DEFAULT FALSE,
    correct_rule    TEXT,
    eliminated      TEXT[] DEFAULT '{}',
    attempts_total  INTEGER DEFAULT 0,
    last_attempt    TIMESTAMPTZ,
    notes           TEXT
);

-- Table: ara_playbook_stats
-- Tracks playbook performance metrics for the analytical-reasoning domain.
CREATE TABLE IF NOT EXISTS ara_playbook_stats (
    domain          TEXT PRIMARY KEY,
    missions        INTEGER DEFAULT 0,
    success_rate    REAL DEFAULT 0.0,
    iteration_count INTEGER DEFAULT 0,
    last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial stats for analytical-reasoning domain
INSERT INTO ara_playbook_stats (domain, missions, success_rate, iteration_count)
VALUES ('analytical-reasoning', 0, 0.0, 0)
ON CONFLICT (domain) DO NOTHING;

-- Index for fast lookup of failed attempts per puzzle
CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_puzzle_id
    ON ara_puzzle_attempts (puzzle_id);

-- Index for finding unsolved puzzles
CREATE INDEX IF NOT EXISTS idx_puzzle_rules_unsolved
    ON ara_puzzle_rules (solved) WHERE solved = FALSE;

-- Seed the initial ARC-AGI run results
INSERT INTO ara_puzzle_rules (puzzle_id, solved, correct_rule, eliminated, attempts_total, last_attempt, notes)
VALUES
    ('0d3d703e', TRUE, 'T01: Value Substitution', '{}', 1, NOW(), 'CORRECT on attempt 1. Colour mapping 3→4, 1→5, 2→6.'),
    ('25d8a9c8', TRUE, 'T13: Uniform Row Detection', '{}', 1, NOW(), 'CORRECT on attempt 1. Uniform rows → 5, mixed → 0.'),
    ('3c9b0459', FALSE, NULL, ARRAY['T02'], 1, NOW(), 'INCORRECT. Applied horizontal reflection instead of vertical. Need to try T03.'),
    ('25ff71a9', FALSE, NULL, ARRAY['T08-broken'], 1, NOW(), 'INCORRECT. Gravity collapsed rows. Need to retry with count-preserving gravity.'),
    ('007bbfb7', FALSE, NULL, ARRAY['T09-solid-fill'], 1, NOW(), 'INCORRECT. Filled solid blocks. Need to retry with pattern-copy fractal.'),
    ('dc1df850', FALSE, NULL, '{}', 1, NOW(), 'INCORRECT. Surround pattern not yet implemented.'),
    ('0520fde7', FALSE, NULL, '{}', 1, NOW(), 'INCORRECT. XOR mask — divider detection failed.'),
    ('08ed6ac7', FALSE, NULL, '{}', 1, NOW(), 'INCORRECT. Height-rank colouring not yet implemented.'),
    ('6ecd11f4', FALSE, NULL, '{}', 1, NOW(), 'INCORRECT. Sub-pattern extraction — region identification failed.'),
    ('ff805c23', FALSE, NULL, '{}', 1, NOW(), 'INCORRECT. Tiled mosaic — compound rule not yet detected.')
ON CONFLICT (puzzle_id) DO NOTHING;

-- Seed the attempt log for the initial run
INSERT INTO ara_puzzle_attempts (puzzle_id, attempt_number, rule_tried, correct, confidence, notes)
VALUES
    ('0d3d703e', 1, 'T01: Value Substitution', TRUE, 'HIGH', 'Built mapping 3→4, 1→5, 2→6. Verified on all training pairs.'),
    ('25d8a9c8', 1, 'T13: Uniform Row Detection', TRUE, 'HIGH', 'Uniform rows → 5, non-uniform → 0. Verified on all training pairs.'),
    ('3c9b0459', 1, 'T02: Horizontal Reflection', FALSE, 'MEDIUM', 'Flipped left-right. Correct answer was top-bottom (T03 vertical reflection).'),
    ('25ff71a9', 1, 'T08: Gravity Down (broken)', FALSE, 'LOW', 'Collapsed two rows of 2s into one. Did not preserve value count per column.'),
    ('007bbfb7', 1, 'T09: Fractal Tiling (solid fill)', FALSE, 'LOW', 'Filled solid blocks instead of copying input pattern into each non-zero cell.'),
    ('dc1df850', 1, 'T10: Border/Surround (incomplete)', FALSE, 'LOW', 'Border detection not fully implemented.'),
    ('0520fde7', 1, 'T11: XOR Mask (incomplete)', FALSE, 'LOW', 'Divider detection failed.'),
    ('08ed6ac7', 1, 'T14: Height-Rank (incomplete)', FALSE, 'LOW', 'Ranking logic not implemented.'),
    ('6ecd11f4', 1, 'T12: Sub-Pattern Extraction (incomplete)', FALSE, 'LOW', 'Region identification failed.'),
    ('ff805c23', 1, 'Compound (unknown)', FALSE, 'LOW', 'Could not identify the transformation type.')
ON CONFLICT (puzzle_id, attempt_number) DO NOTHING;

SQL

echo "  Tables created and seeded with ARC-AGI run data."
echo ""

# --- Step 6: Update .env file ---
echo "[6/7] Updating .env file..."
mkdir -p "$ARA_HOME"

# Function to set or update a key in .env
set_env_var() {
    local key="$1"
    local value="$2"
    if [ -f "$ENV_FILE" ] && grep -q "^${key}=" "$ENV_FILE"; then
        # Key exists — update it
        sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        echo "  Updated $key in .env"
    else
        # Key does not exist — append it
        echo "${key}=${value}" >> "$ENV_FILE"
        echo "  Added $key to .env"
    fi
}

set_env_var "PGUSER" "$DB_USER"
set_env_var "PGDATABASE" "$DB_NAME"
set_env_var "PGHOST" "localhost"
set_env_var "PGPORT" "5432"

echo ""

# --- Step 7: Verify ---
echo "[7/7] Verifying setup..."
echo ""

# Test connection
if psql -d "$DB_NAME" -c "SELECT COUNT(*) AS total_puzzles FROM ara_puzzle_rules;" 2>/dev/null; then
    echo ""
    echo "  Connection verified. ✓"
else
    echo "  WARNING: Could not verify connection. Check PostgreSQL status."
fi

# Show puzzle status
echo ""
echo "  Puzzle tracking status:"
psql -d "$DB_NAME" -c "SELECT puzzle_id, solved, correct_rule, attempts_total FROM ara_puzzle_rules ORDER BY puzzle_id;" 2>/dev/null || true

echo ""
echo "=============================================="
echo "  ARA PostgreSQL Setup Complete"
echo "=============================================="
echo ""
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "  Tables:   ara_puzzle_attempts, ara_puzzle_rules, ara_playbook_stats"
echo "  Puzzles:  10 seeded from ARC-AGI run"
echo ""
echo "  To start PostgreSQL after reboot:"
echo "    pg_ctl -D $PG_DATA -l $PG_DATA/logfile start"
echo ""
echo "  To connect manually:"
echo "    psql -d $DB_NAME"
echo ""
echo "  To add to Termux boot (optional):"
echo "    mkdir -p ~/.termux/boot"
echo "    echo 'pg_ctl -D $PG_DATA -l $PG_DATA/logfile start' > ~/.termux/boot/start-postgres.sh"
echo "    chmod +x ~/.termux/boot/start-postgres.sh"
echo ""
