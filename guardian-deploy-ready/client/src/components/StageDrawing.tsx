import React, { useMemo } from 'react';
import { Eye, CheckCircle2, Clock, Wrench } from 'lucide-react';

interface BubbleAnnotation {
  bubble: number;
  feature: string;
  dimension: string;
  tolerance: string;
  type: string;
  surfaceFinish?: string | null;
  critical?: boolean;
  notes?: string;
}

interface StageDrawingFullProps {
  opNumber: string;
  title?: string;
  description?: string;
  machinedFeatures?: string[];
  remainingStock?: string;
  fixturing?: string;
  imageUrl?: string;
  bubbleAnnotations?: BubbleAnnotation[];
  currentBubbles?: number[];      // Bubbles machined in THIS operation
  previousBubbles?: number[];     // Bubbles machined in PREVIOUS operations
  allBubbles?: number[];          // All bubble numbers total
}

/**
 * Stage Drawing — shows the ACTUAL uploaded engineering drawing
 * with progressive bubble annotation overlays.
 * 
 * Green  = features machined in THIS operation
 * Cyan   = features already machined in previous operations
 * Dim    = features not yet machined (upcoming operations)
 */
export function StageDrawingFull({
  opNumber,
  title,
  description,
  machinedFeatures = [],
  remainingStock,
  fixturing,
  imageUrl,
  bubbleAnnotations = [],
  currentBubbles = [],
  previousBubbles = [],
  allBubbles = [],
}: StageDrawingFullProps) {
  // Categorize each bubble annotation
  const categorized = useMemo(() => {
    const current: BubbleAnnotation[] = [];
    const previous: BubbleAnnotation[] = [];
    const upcoming: BubbleAnnotation[] = [];
    const unassigned: BubbleAnnotation[] = [];

    for (const ann of bubbleAnnotations) {
      if (currentBubbles.includes(ann.bubble)) {
        current.push(ann);
      } else if (previousBubbles.includes(ann.bubble)) {
        previous.push(ann);
      } else if (allBubbles.includes(ann.bubble)) {
        upcoming.push(ann);
      } else {
        unassigned.push(ann);
      }
    }
    return { current, previous, upcoming, unassigned };
  }, [bubbleAnnotations, currentBubbles, previousBubbles, allBubbles]);

  const hasImage = imageUrl && imageUrl.length > 0;
  const hasBubbles = bubbleAnnotations.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded text-green-400 font-bold text-xs tracking-wider">
          {opNumber}
        </div>
        <p className="text-sm font-bold text-foreground">{title || `AFTER ${opNumber}`}</p>
      </div>

      <div className="flex gap-6">
        {/* LEFT: Actual Drawing with overlay legend */}
        <div className="shrink-0 space-y-2">
          {hasImage ? (
            <div className="relative border border-border rounded overflow-hidden bg-white" style={{ width: 360, maxHeight: 280 }}>
              <img
                src={imageUrl}
                alt={`Engineering drawing - ${opNumber}`}
                className="w-full h-full object-contain"
                style={{ maxHeight: 280 }}
              />
              {/* Operation label overlay */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 rounded text-[10px] font-bold text-green-400 border border-green-500/50">
                {opNumber} — STAGE VIEW
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center border border-dashed border-border rounded bg-muted/10" style={{ width: 360, height: 200 }}>
              <div className="text-center text-muted-foreground">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Drawing image not available</p>
                <p className="text-[10px] mt-1">Upload an engineering drawing to see stage views</p>
              </div>
            </div>
          )}

          {/* Bubble legend bar */}
          {hasBubbles && (
            <div className="flex items-center gap-4 text-[9px] font-mono px-1">
              {categorized.current.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-green-400">THIS OP ({categorized.current.length})</span>
                </span>
              )}
              {categorized.previous.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  <span className="text-cyan-400">DONE ({categorized.previous.length})</span>
                </span>
              )}
              {categorized.upcoming.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                  <span className="text-zinc-500">REMAINING ({categorized.upcoming.length})</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Bubble annotation breakdown + operation details */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Clamping Position — Part C Drawing */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2.5">
            <p className="text-[9px] text-blue-400 uppercase tracking-wider font-bold mb-1.5">Part C — Clamping Position</p>
            <p className="text-[10px] text-foreground/80 leading-relaxed">{fixturing || 'Workholding setup for this operation'}</p>
          </div>

          {/* Description */}
          <p className="text-[11px] text-foreground/80 leading-relaxed">{description}</p>

          {/* MACHINING THIS OPERATION — green */}
          {categorized.current.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wrench className="w-3 h-3 text-green-400" />
                <p className="text-[9px] text-green-400 uppercase tracking-wider font-bold">Machining This Operation</p>
              </div>
              <div className="grid gap-1">
                {categorized.current.map((ann) => (
                  <div key={ann.bubble} className="flex items-start gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-green-500 text-black text-[9px] font-bold flex items-center justify-center mt-0.5">
                      {ann.bubble}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-green-300">{ann.feature}</p>
                      <p className="text-[9px] text-green-400/70">
                        {ann.dimension}{ann.tolerance ? ` ${ann.tolerance}` : ''}{ann.surfaceFinish ? ` / ${ann.surfaceFinish}` : ''}
                        {ann.critical && <span className="ml-1 text-red-400 font-bold">★ CRITICAL</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREVIOUSLY MACHINED — cyan */}
          {categorized.previous.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                <p className="text-[9px] text-cyan-400 uppercase tracking-wider font-bold">Previously Machined</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {categorized.previous.map((ann) => (
                  <div key={ann.bubble} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-cyan-500 text-black text-[8px] font-bold flex items-center justify-center">
                      {ann.bubble}
                    </span>
                    <span className="text-[9px] text-cyan-300">{ann.feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REMAINING — dim */}
          {categorized.upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3 h-3 text-zinc-500" />
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Remaining Operations</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {categorized.upcoming.map((ann) => (
                  <div key={ann.bubble} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/30">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-zinc-700 text-zinc-400 text-[8px] font-bold flex items-center justify-center">
                      {ann.bubble}
                    </span>
                    <span className="text-[9px] text-zinc-500">{ann.feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fixturing & remaining stock details */}
          <div className="flex gap-4 pt-1 border-t border-border/30">
            {fixturing && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Workholding</p>
                <p className="text-[10px] mt-0.5 text-foreground/70">{fixturing}</p>
              </div>
            )}
            {remainingStock && (
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Remaining Stock</p>
                <p className="text-[10px] mt-0.5 text-amber-400/80">{remainingStock}</p>
              </div>
            )}
          </div>

          {/* Machined features list (from agent) */}
          {machinedFeatures.length > 0 && !hasBubbles && (
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Machined Features</p>
              <ul className="mt-1 space-y-0.5">
                {machinedFeatures.map((f, i) => (
                  <li key={i} className="text-[10px] text-green-400">• {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Thumbnail version for the DRAWING column — just shows a small icon.
 * Kept for backward compatibility but no longer used for full rendering.
 */
export function StageDrawing({ opNumber }: { opNumber: string }) {
  return (
    <div className="w-16 h-12 rounded border border-accent/20 bg-muted/10 flex items-center justify-center">
      <span className="text-[8px] font-mono text-accent/60">{opNumber}</span>
    </div>
  );
}
