import React, { useState, useMemo } from 'react';
import { Factory, Wrench, Eye, Package, Truck, ArrowLeftRight, Users, FileText, Shield, Cog, Cpu, CheckCircle2, AlertTriangle, Clock, Activity, ChevronDown, ChevronUp, Layers } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────

interface MachineStatus {
  id: string;
  name: string;
  type: 'mill' | 'lathe';
  model: string;
  status: 'running' | 'setup' | 'idle' | 'maintenance' | 'offline';
  currentJob?: string;
  operator?: string;
  utilization: number; // 0-100
  spindleHours: number;
  nextPM: string;
}

interface StationStatus {
  id: string;
  name: string;
  type: 'tooling' | 'deburr' | 'engineering' | 'assembly' | 'quality' | 'sales' | 'compliance' | 'shipping' | 'receiving' | 'outside';
  status: 'active' | 'idle' | 'busy';
  personnel: number;
  currentTasks: number;
}

// ─── Mock Data (Digital Twin would pull from real MES/ERP) ──────────

function generateMills(): MachineStatus[] {
  const models = ['VF-2', 'VF-3', 'VF-4', 'VF-6', 'VF-2SS', 'VF-3SS', 'UMC-750', 'UMC-500', 'DM-2', 'DM-1'];
  const statuses: MachineStatus['status'][] = ['running', 'running', 'running', 'setup', 'idle', 'running', 'running', 'maintenance', 'running', 'setup', 'running', 'running', 'idle', 'running', 'running', 'setup', 'running', 'running', 'running', 'offline'];
  const jobs = ['GOS-2847-OP10', 'GOS-2851-OP20', 'GOS-2849-OP10', '', 'GOS-2853-OP30', 'GOS-2847-OP20', '', 'GOS-2855-OP10', 'GOS-2851-OP30', '', 'GOS-2849-OP20', 'GOS-2853-OP10', '', 'GOS-2855-OP20', 'GOS-2847-OP30', '', 'GOS-2851-OP10', 'GOS-2849-OP30', 'GOS-2853-OP20', ''];
  const operators = ['J. Martinez', 'R. Thompson', 'M. Chen', 'D. Williams', 'A. Patel', 'S. Johnson', 'K. Lee', 'T. Brown', 'L. Garcia', 'P. Wilson'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `MACH${String(i + 1).padStart(2, '0')}`,
    name: `Mill ${i + 1}`,
    type: 'mill' as const,
    model: `HAAS ${models[i % models.length]}`,
    status: statuses[i],
    currentJob: statuses[i] === 'running' ? jobs[i] : statuses[i] === 'setup' ? jobs[i] || 'SETUP' : undefined,
    operator: statuses[i] !== 'offline' && statuses[i] !== 'idle' ? operators[i % operators.length] : undefined,
    utilization: statuses[i] === 'running' ? 70 + Math.floor(Math.random() * 25) : statuses[i] === 'setup' ? 30 + Math.floor(Math.random() * 20) : statuses[i] === 'maintenance' ? 0 : statuses[i] === 'idle' ? 5 + Math.floor(Math.random() * 10) : 0,
    spindleHours: 2000 + Math.floor(Math.random() * 8000),
    nextPM: `${Math.floor(Math.random() * 500) + 100} hrs`,
  }));
}

function generateLathes(): MachineStatus[] {
  const models = ['ST-20', 'ST-30', 'ST-10', 'ST-20Y', 'ST-35'];
  const statuses: MachineStatus['status'][] = ['running', 'running', 'setup', 'running', 'idle'];
  
  return Array.from({ length: 5 }, (_, i) => ({
    id: `LATHE${String(i + 1).padStart(2, '0')}`,
    name: `Lathe ${i + 1}`,
    type: 'lathe' as const,
    model: `HAAS ${models[i]}`,
    status: statuses[i],
    currentJob: statuses[i] === 'running' ? `GOS-28${50 + i}-OP10` : statuses[i] === 'setup' ? 'SETUP' : undefined,
    operator: statuses[i] !== 'idle' ? ['R. Nguyen', 'C. Davis', 'H. Kim', 'B. Anderson', 'F. Lopez'][i] : undefined,
    utilization: statuses[i] === 'running' ? 75 + Math.floor(Math.random() * 20) : statuses[i] === 'setup' ? 40 : 8,
    spindleHours: 3000 + Math.floor(Math.random() * 5000),
    nextPM: `${Math.floor(Math.random() * 400) + 50} hrs`,
  }));
}

const STATIONS: StationStatus[] = [
  { id: 'tooling', name: 'Tooling Crib', type: 'tooling', status: 'active', personnel: 2, currentTasks: 8 },
  { id: 'deburr', name: 'Deburr Station', type: 'deburr', status: 'busy', personnel: 3, currentTasks: 12 },
  { id: 'engineering', name: 'Engineering', type: 'engineering', status: 'active', personnel: 4, currentTasks: 6 },
  { id: 'assembly', name: 'Assembly', type: 'assembly', status: 'active', personnel: 5, currentTasks: 3 },
  { id: 'quality', name: 'Quality / CMM', type: 'quality', status: 'busy', personnel: 3, currentTasks: 9 },
  { id: 'sales', name: 'Sales / Quoting', type: 'sales', status: 'active', personnel: 2, currentTasks: 15 },
  { id: 'compliance', name: 'Compliance / AS9100', type: 'compliance', status: 'active', personnel: 1, currentTasks: 4 },
  { id: 'shipping', name: 'Shipping', type: 'shipping', status: 'active', personnel: 2, currentTasks: 7 },
  { id: 'receiving', name: 'Receiving', type: 'receiving', status: 'idle', personnel: 1, currentTasks: 2 },
  { id: 'outside', name: 'Outside Processes', type: 'outside', status: 'active', personnel: 1, currentTasks: 5 },
];

// ─── Status Colors ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  running: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', dot: 'bg-green-400' },
  setup: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-400' },
  idle: { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400', dot: 'bg-gray-400' },
  maintenance: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', dot: 'bg-red-400' },
  offline: { bg: 'bg-gray-800/40', border: 'border-gray-700/50', text: 'text-gray-600', dot: 'bg-gray-600' },
  active: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', dot: 'bg-green-400' },
  busy: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', dot: 'bg-cyan-400' },
};

const STATION_ICONS: Record<string, React.ReactNode> = {
  tooling: <Wrench className="w-4 h-4" />,
  deburr: <Cog className="w-4 h-4" />,
  engineering: <Cpu className="w-4 h-4" />,
  assembly: <Layers className="w-4 h-4" />,
  quality: <Eye className="w-4 h-4" />,
  sales: <Users className="w-4 h-4" />,
  compliance: <Shield className="w-4 h-4" />,
  shipping: <Truck className="w-4 h-4" />,
  receiving: <Package className="w-4 h-4" />,
  outside: <ArrowLeftRight className="w-4 h-4" />,
};

// ─── Machine Cell Component ─────────────────────────────────────────

function MachineCell({ machine, onClick, isSelected }: { machine: MachineStatus; onClick: () => void; isSelected: boolean }) {
  const colors = STATUS_COLORS[machine.status];
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded border transition-all duration-200 text-left w-full ${colors.bg} ${colors.border} ${isSelected ? 'ring-2 ring-cyan-400 scale-105' : 'hover:scale-102'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold text-foreground/90">{machine.id}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${machine.status === 'running' ? 'animate-pulse' : ''}`} />
      </div>
      <p className="text-[8px] text-muted-foreground truncate">{machine.model}</p>
      {machine.currentJob && (
        <p className="text-[7px] text-cyan-400 truncate mt-0.5">{machine.currentJob}</p>
      )}
      {/* Utilization bar */}
      <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${machine.utilization > 80 ? 'bg-green-400' : machine.utilization > 40 ? 'bg-amber-400' : 'bg-gray-500'}`}
          style={{ width: `${machine.utilization}%` }}
        />
      </div>
    </button>
  );
}

// ─── Station Cell Component ─────────────────────────────────────────

function StationCell({ station }: { station: StationStatus }) {
  const colors = STATUS_COLORS[station.status];
  return (
    <div className={`p-3 rounded border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={colors.text}>{STATION_ICONS[station.type]}</span>
        <span className="text-xs font-semibold text-foreground/90">{station.name}</span>
        <div className={`w-1.5 h-1.5 rounded-full ml-auto ${colors.dot}`} />
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>{station.personnel} staff</span>
        <span>{station.currentTasks} tasks</span>
        <span className={`uppercase text-[9px] font-medium ${colors.text}`}>{station.status}</span>
      </div>
    </div>
  );
}

// ─── Main Digital Twin Component ────────────────────────────────────

export function DigitalTwin() {
  const [selectedMachine, setSelectedMachine] = useState<MachineStatus | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(true);

  const mills = useMemo(() => generateMills(), []);
  const lathes = useMemo(() => generateLathes(), []);
  const allMachines = useMemo(() => [...mills, ...lathes], [mills, lathes]);

  // ─── Summary Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const running = allMachines.filter(m => m.status === 'running').length;
    const setup = allMachines.filter(m => m.status === 'setup').length;
    const idle = allMachines.filter(m => m.status === 'idle').length;
    const maintenance = allMachines.filter(m => m.status === 'maintenance').length;
    const offline = allMachines.filter(m => m.status === 'offline').length;
    const avgUtil = Math.round(allMachines.reduce((s, m) => s + m.utilization, 0) / allMachines.length);
    const totalJobs = allMachines.filter(m => m.currentJob && m.currentJob !== 'SETUP').length;
    return { running, setup, idle, maintenance, offline, avgUtil, totalJobs, total: allMachines.length };
  }, [allMachines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading gradient-text">Digital Twin — Shop Floor Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time machine status, utilization, and work center monitoring
          </p>
        </div>
        <button
          onClick={() => setShowFloorPlan(!showFloorPlan)}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showFloorPlan ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showFloorPlan ? 'Collapse' : 'Expand'} Floor Plan
        </button>
      </div>

      {/* KPI Dashboard Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3 rounded border border-border bg-card/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Machines</p>
          <p className="text-xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="p-3 rounded border border-green-500/30 bg-green-500/10">
          <p className="text-[10px] text-green-400 uppercase tracking-wider">Running</p>
          <p className="text-xl font-bold text-green-400">{stats.running}</p>
        </div>
        <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10">
          <p className="text-[10px] text-amber-400 uppercase tracking-wider">Setup</p>
          <p className="text-xl font-bold text-amber-400">{stats.setup}</p>
        </div>
        <div className="p-3 rounded border border-gray-500/30 bg-gray-500/10">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Idle</p>
          <p className="text-xl font-bold text-gray-400">{stats.idle}</p>
        </div>
        <div className="p-3 rounded border border-red-500/30 bg-red-500/10">
          <p className="text-[10px] text-red-400 uppercase tracking-wider">Maintenance</p>
          <p className="text-xl font-bold text-red-400">{stats.maintenance}</p>
        </div>
        <div className="p-3 rounded border border-gray-700/30 bg-gray-800/30">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Offline</p>
          <p className="text-xl font-bold text-gray-500">{stats.offline}</p>
        </div>
        <div className="p-3 rounded border border-cyan-500/30 bg-cyan-500/10">
          <p className="text-[10px] text-cyan-400 uppercase tracking-wider">Avg Utilization</p>
          <p className="text-xl font-bold text-cyan-400">{stats.avgUtil}%</p>
        </div>
        <div className="p-3 rounded border border-accent/30 bg-accent/10">
          <p className="text-[10px] text-accent uppercase tracking-wider">Active Jobs</p>
          <p className="text-xl font-bold text-accent">{stats.totalJobs}</p>
        </div>
      </div>

      {showFloorPlan && (
        <>
          {/* Floor Plan Grid */}
          <div className="border border-border rounded-lg p-4 bg-card/30 space-y-4">
            {/* Shop Floor Title Bar */}
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <Factory className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Shop Floor Layout</span>
              <span className="text-[9px] text-muted-foreground ml-auto">Click any machine for details</span>
            </div>

            {/* CNC Mill Bay — 4 rows x 5 columns */}
            <div>
              <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider mb-2">CNC Mill Bay — 20 HAAS Vertical Machining Centers</p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {mills.map((m) => (
                  <MachineCell
                    key={m.id}
                    machine={m}
                    onClick={() => setSelectedMachine(selectedMachine?.id === m.id ? null : m)}
                    isSelected={selectedMachine?.id === m.id}
                  />
                ))}
              </div>
            </div>

            {/* CNC Lathe Bay */}
            <div>
              <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-2">CNC Lathe Bay — 5 HAAS Turning Centers</p>
              <div className="grid grid-cols-5 gap-1.5 max-w-md">
                {lathes.map((m) => (
                  <MachineCell
                    key={m.id}
                    machine={m}
                    onClick={() => setSelectedMachine(selectedMachine?.id === m.id ? null : m)}
                    isSelected={selectedMachine?.id === m.id}
                  />
                ))}
              </div>
            </div>

            {/* Support Stations */}
            <div>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-2">Support Departments & Work Centers</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {STATIONS.map((s) => (
                  <StationCell key={s.id} station={s} />
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Status:</span>
              {Object.entries(STATUS_COLORS).filter(([k]) => !['active', 'busy'].includes(k)).map(([status, colors]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className={`text-[9px] capitalize ${colors.text}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Machine Detail Panel */}
          {selectedMachine && (
            <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[selectedMachine.status].dot} ${selectedMachine.status === 'running' ? 'animate-pulse' : ''}`} />
                  <h3 className="text-sm font-bold text-foreground">{selectedMachine.id} — {selectedMachine.model}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-medium ${STATUS_COLORS[selectedMachine.status].bg} ${STATUS_COLORS[selectedMachine.status].text} border ${STATUS_COLORS[selectedMachine.status].border}`}>
                    {selectedMachine.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMachine(null)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Type</p>
                  <p className="font-semibold">{selectedMachine.type === 'mill' ? 'Vertical Machining Center' : 'Turning Center'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Current Job</p>
                  <p className="font-semibold text-cyan-400">{selectedMachine.currentJob || 'None'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Operator</p>
                  <p className="font-semibold">{selectedMachine.operator || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Utilization</p>
                  <p className="font-semibold">{selectedMachine.utilization}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Spindle Hours</p>
                  <p className="font-semibold">{selectedMachine.spindleHours.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Next PM</p>
                  <p className="font-semibold">{selectedMachine.nextPM}</p>
                </div>
              </div>
              {/* Utilization bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Machine Utilization</span>
                  <span>{selectedMachine.utilization}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${selectedMachine.utilization > 80 ? 'bg-green-400' : selectedMachine.utilization > 40 ? 'bg-amber-400' : 'bg-gray-500'}`}
                    style={{ width: `${selectedMachine.utilization}%` }}
                  />
                </div>
              </div>
              <p className="text-[9px] text-amber-400/70 mt-3 italic">
                Live machine data requires MES/ERP integration via Digital Twin onboarding. Displayed data is representative.
              </p>
            </div>
          )}
        </>
      )}

      {/* Digital Twin Upsell Note */}
      <div className="border border-accent/30 rounded-lg p-4 bg-accent/5">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Digital Twin — Enterprise Integration</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect Guardian OS to your shop floor for real-time machine monitoring, automated job scheduling, 
              predictive maintenance alerts, and customer-specific post-processor selection (Mazak, Okuma, Fanuc, DMG MORI). 
              The Digital Twin learns your shop's capacity, bottlenecks, and optimal routing over time — 
              turning the manager board from a snapshot into a live operating system.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent border border-accent/30">MES Integration</span>
              <span className="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent border border-accent/30">ERP Sync</span>
              <span className="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent border border-accent/30">IoT Sensors</span>
              <span className="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent border border-accent/30">Predictive PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
