// =============================================================================
// ARA HARDENING PATCH — buildIronQuery domain queries + safe word extraction
// =============================================================================
// FILE:    research.ts
// TARGET:  buildIronQuery function
//
// CHANGES:
//   1. Add 'check' and 'analytical' entries to domainQueries map
//   2. Fix extractSafeWords to skip separator lines (=== lines, --- lines)
//      and extract meaningful content words from actual puzzle data
//   3. Add puzzle-specific query augmentation for grid-based problems
//
// INSTALL: Apply the two patches below to the buildIronQuery function in
//          research.ts. See INSTALL_INSTRUCTIONS.md for exact locations.
// =============================================================================


// =============================================================================
// PATCH 1: Add to the domainQueries map (or equivalent object)
// =============================================================================
// Find the domainQueries map/object in buildIronQuery. It will look something
// like:
//
//   const domainQueries: Record<string, string> = {
//       defense: "...",
//       medical: "...",
//       billing: "...",
//       ...
//   };
//
// Add these two entries:

/*
    check: "pattern recognition grid transformation logical reasoning ARC puzzle rule inference",
    analytical: "abstract reasoning pattern detection rule inference grid transformation spatial logic",
*/

// Full context — here is what the patched map should include (add to existing):
const domainQueries_PATCH: Record<string, string> = {
    // ... existing entries (defense, medical, billing, etc.) remain unchanged ...

    // NEW: Analytical reasoning domains
    check: "pattern recognition grid transformation logical reasoning ARC puzzle rule inference",
    analytical: "abstract reasoning pattern detection rule inference grid transformation spatial logic",
};


// =============================================================================
// PATCH 2: Replace the extractSafeWords function (or equivalent word extractor)
// =============================================================================
// The current implementation does not skip separator lines like "===" or "---"
// and may extract noise instead of meaningful content words.
//
// Find the function that extracts keywords from the input text for query
// building. It may be called extractSafeWords, extractKeywords, or similar.
// Replace it with the version below.

/**
 * Extract meaningful content words from input text, skipping separator lines,
 * grid formatting artifacts, and common stop words. Designed to work with
 * both natural language inputs and grid-based puzzle data.
 *
 * @param text - Raw input text from job.input
 * @param maxWords - Maximum number of keywords to return (default: 12)
 * @returns Array of meaningful content words for query construction
 */
function extractSafeWords(text: string, maxWords: number = 12): string[] {
    if (!text || text.trim().length === 0) return [];

    const lines = text.split('\n');
    const contentLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed.length === 0) continue;

        // Skip separator lines: ===, ---, ***, ~~~, ###
        if (/^[=\-*~#]{3,}$/.test(trimmed)) continue;

        // Skip lines that are purely numeric grid data (e.g., "0 1 2 3 0 1")
        // These contain puzzle data but not useful search keywords
        if (/^[\d\s,\[\]]+$/.test(trimmed)) continue;

        // Skip lines that are just labels like "Input:", "Output:", "Training 1:"
        if (/^(input|output|test|training|example)\s*\d*\s*:?\s*$/i.test(trimmed)) continue;

        contentLines.push(trimmed);
    }

    // Join remaining content lines and extract words
    const rawText = contentLines.join(' ');

    // Common stop words to filter out
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
        'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
        'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
        'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
        'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
        'and', 'but', 'or', 'if', 'while', 'that', 'this', 'it', 'its',
        'what', 'which', 'who', 'whom', 'these', 'those', 'i', 'me', 'my',
        'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they',
        'them', 'their',
    ]);

    // Extract words: lowercase, alpha-only, 3+ chars, not stop words
    const words = rawText
        .toLowerCase()
        .split(/[^a-zA-Z]+/)
        .filter(w => w.length >= 3 && !stopWords.has(w));

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const w of words) {
        if (!seen.has(w)) {
            seen.add(w);
            unique.push(w);
        }
    }

    return unique.slice(0, maxWords);
}


// =============================================================================
// PATCH 3: Augment buildIronQuery to handle grid puzzle context
// =============================================================================
// In the buildIronQuery function, after the domain query is selected and
// safe words are extracted, add this block to augment the query when the
// domain is 'check' or 'analytical':

/*
    // --- BEGIN PATCH: Grid puzzle query augmentation ---
    if (domain === 'check' || domain === 'analytical') {
        const inputText: string = job.input || '';

        // Detect if input contains grid data (rows of numbers)
        const hasGridData = /^\s*[\d\s,\[\]]+$/m.test(inputText);

        if (hasGridData) {
            // Count grid dimensions to add context
            const gridLines = inputText.split('\n')
                .map(l => l.trim())
                .filter(l => /^[\d\s,\[\]]+$/.test(l) && l.length > 0);

            if (gridLines.length > 0) {
                const firstRow = gridLines[0].replace(/[\[\],]/g, ' ').trim().split(/\s+/);
                const gridInfo = `${gridLines.length}x${firstRow.length} grid`;

                // Detect specific patterns to refine the search query
                const uniqueValues = new Set<string>();
                for (const line of gridLines) {
                    const vals = line.replace(/[\[\],]/g, ' ').trim().split(/\s+/);
                    vals.forEach(v => uniqueValues.add(v));
                }

                let patternHint = '';
                if (uniqueValues.size <= 3) {
                    patternHint = 'binary or ternary pattern';
                } else if (uniqueValues.size <= 5) {
                    patternHint = 'colour mapping pattern';
                } else {
                    patternHint = 'complex multi-value pattern';
                }

                // Append grid context to the query
                queryParts.push(gridInfo);
                queryParts.push(patternHint);
            }
        }

        // If we have training pairs, add transformation-type hints
        if (inputText.toLowerCase().includes('training') || inputText.toLowerCase().includes('example')) {
            queryParts.push('training example rule inference');
        }
    }
    // --- END PATCH: Grid puzzle query augmentation ---
*/


// =============================================================================
// FULL FUNCTION REFERENCE (for context — shows where patches integrate)
// =============================================================================
// This is a reference showing how the patched buildIronQuery should look.
// Adapt to match your actual function signature and variable names.

function buildIronQuery_REFERENCE(job: { domain: string; input: string; query?: string }): string {
    const domain = job.domain || 'general';
    const existingQuery = job.query || '';

    // Domain-specific base queries
    const domainQueries: Record<string, string> = {
        defense: "threat assessment tactical analysis security protocol",
        medical: "medical diagnosis treatment protocol clinical guidelines",
        billing: "billing code compliance invoice processing financial audit",
        // ... other existing domains ...

        // PATCH 1: New analytical domains
        check: "pattern recognition grid transformation logical reasoning ARC puzzle rule inference",
        analytical: "abstract reasoning pattern detection rule inference grid transformation spatial logic",
    };

    const baseQuery = domainQueries[domain] || "general analysis assessment";
    const queryParts: string[] = [baseQuery];

    // Add existing query if present
    if (existingQuery.trim().length > 0) {
        queryParts.push(existingQuery.trim());
    }

    // PATCH 2: Extract safe words using the fixed function
    const safeWords = extractSafeWords(job.input);
    if (safeWords.length > 0) {
        queryParts.push(safeWords.join(' '));
    }

    // PATCH 3: Grid puzzle query augmentation
    if (domain === 'check' || domain === 'analytical') {
        const inputText: string = job.input || '';
        const hasGridData = /^\s*[\d\s,\[\]]+$/m.test(inputText);

        if (hasGridData) {
            const gridLines = inputText.split('\n')
                .map(l => l.trim())
                .filter(l => /^[\d\s,\[\]]+$/.test(l) && l.length > 0);

            if (gridLines.length > 0) {
                const firstRow = gridLines[0].replace(/[\[\],]/g, ' ').trim().split(/\s+/);
                queryParts.push(`${gridLines.length}x${firstRow.length} grid`);

                const uniqueValues = new Set<string>();
                for (const line of gridLines) {
                    line.replace(/[\[\],]/g, ' ').trim().split(/\s+/).forEach(v => uniqueValues.add(v));
                }

                if (uniqueValues.size <= 3) queryParts.push('binary or ternary pattern');
                else if (uniqueValues.size <= 5) queryParts.push('colour mapping pattern');
                else queryParts.push('complex multi-value pattern');
            }
        }

        if (inputText.toLowerCase().includes('training') || inputText.toLowerCase().includes('example')) {
            queryParts.push('training example rule inference');
        }
    }

    // Build final query string
    const finalQuery = queryParts.join(' ').trim();

    // Truncate to reasonable length for Brave Search API
    const maxLength = 400;
    if (finalQuery.length > maxLength) {
        return finalQuery.substring(0, maxLength).trim();
    }

    return finalQuery;
}

// =============================================================================
// END OF PATCH
// =============================================================================
