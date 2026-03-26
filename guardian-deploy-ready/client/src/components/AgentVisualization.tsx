import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Zap, Activity } from 'lucide-react';

export interface AgentStatus {
  name: string;
  department: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
  confidence?: number;
  errorReason?: string;
}

interface AgentVisualizationProps {
  agents: AgentStatus[];
  totalDuration?: number;
  sequentialEstimate?: number;
  speedMultiplier?: number;
  agentCount?: number;
  isProcessing?: boolean;
}

const DEPARTMENT_COLORS: Record<string, string> = {
  'Sales': '#00D9FF',
  'Engineering': '#00FF41',
  'Quality': '#FFD700',
  'Planning': '#FF6B35',
  'Procurement': '#A855F7',
  'Manufacturing': '#00D9FF',
  'Shipping': '#06B6D4',
  'Compliance': '#EF4444',
  'Audit': '#F59E0B',
  'Reflection & Adjust': '#10B981',
};

export function AgentVisualization({
  agents,
  totalDuration,
  sequentialEstimate,
  speedMultiplier,
  agentCount,
  isProcessing,
}: AgentVisualizationProps) {
  const [animatedAgents, setAnimatedAgents] = useState<AgentStatus[]>([]);

  // Animate agents appearing one by one during processing
  useEffect(() => {
    if (isProcessing && agents.length === 0) {
      // Show pending state
      return;
    }
    setAnimatedAgents(agents);
  }, [agents, isProcessing]);

  const completedCount = animatedAgents.filter(a => a.status === 'completed').length;
  const failedCount = animatedAgents.filter(a => a.status === 'failed').length;
  const totalCount = animatedAgents.length || agentCount || 0;

  return (
    <div className="space-y-6">
      {/* Header with timing comparison */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Ara — {totalCount} Departments Coordinated
          </h3>
          <p className="text-sm text-muted-foreground">
            Ara is coordinating all departments simultaneously
          </p>
        </div>

        {totalDuration && (
          <div className="flex gap-6">
            {/* Parallel time (actual) */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Guardian (Parallel)</p>
              <p className="text-2xl font-bold text-accent">{(totalDuration / 1000).toFixed(1)}s</p>
            </div>

            {/* Sequential estimate */}
            {sequentialEstimate && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Traditional (Sequential)</p>
                <p className="text-2xl font-bold text-muted-foreground line-through">
                  {(sequentialEstimate / 1000).toFixed(1)}s
                </p>
              </div>
            )}

            {/* Speed multiplier */}
            {speedMultiplier && speedMultiplier > 1 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Speed Gain</p>
                <p className="text-2xl font-bold" style={{ color: '#00FF41' }}>
                  {speedMultiplier}x faster
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parallel execution visualization — all agents side by side */}
      <div className="relative">
        {/* Timeline bar showing parallel execution */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))` }}>
          {animatedAgents.map((agent) => {
            const color = DEPARTMENT_COLORS[agent.department] || '#00D9FF';
            const isComplete = agent.status === 'completed';
            const isFailed = agent.status === 'failed';

            return (
              <div
                key={agent.name}
                className="relative p-3 rounded-lg border transition-all duration-500"
                style={{
                  borderColor: isComplete ? color : isFailed ? '#EF4444' : 'var(--border)',
                  backgroundColor: isComplete ? `${color}10` : 'transparent',
                  boxShadow: isComplete ? `0 0 12px ${color}30` : 'none',
                }}
              >
                {/* Department label */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                    {agent.department}
                  </span>
                </div>

                {/* Agent name */}
                <p className="text-xs font-medium text-foreground mb-2 truncate">
                  {agent.name.replace('Agent', '')}
                </p>

                {/* Status */}
                <div className="flex items-center justify-between">
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color }} />
                  ) : isFailed ? (
                    <Activity className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-current animate-pulse" style={{ borderColor: color }} />
                  )}

                  {agent.duration !== undefined && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {(agent.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>

                {/* Recalibrating indicator — no technical details exposed */}
                {isFailed && (
                  <p className="text-[9px] text-muted-foreground mt-1 truncate">
                    Recalibrating...
                  </p>
                )}

                {/* Confidence bar */}
                {agent.confidence !== undefined && agent.confidence > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${color}20` }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${agent.confidence * 100}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{(agent.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* If any agents failed, show a subtle note — no technical details exposed */}
      {failedCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/30">
          <Activity className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground font-medium">Ara is recalibrating {failedCount} department{failedCount > 1 ? 's' : ''}</p>
            <p className="text-xs text-muted-foreground">{completedCount} of {totalCount} departments completed analysis. Remaining departments will complete on next cycle.</p>
          </div>
        </div>
      )}

      {/* Summary bar */}
      {completedCount > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm text-foreground font-medium">
              {completedCount}/{totalCount} departments completed
            </span>
          </div>
          {failedCount > 0 && (
            <span className="text-sm text-destructive">
              {failedCount} recalibrating
            </span>
          )}
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            Ara coordinated all departments in parallel
          </span>
        </div>
      )}
    </div>
  );
}
