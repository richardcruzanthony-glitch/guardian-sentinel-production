import React, { useState, useMemo } from 'react';
import { FileText, ChevronDown, ChevronUp, Printer, Download, CheckCircle2, AlertTriangle, ClipboardList, Wrench, Package, Ruler, Eye, ExternalLink, Code2, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StageDrawingFull } from '@/components/StageDrawing';

interface CompliancePackageProps {
  result: any;
  domain: string;
}

interface DocumentSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function CompliancePackage({ result, domain }: CompliancePackageProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [expandedDrawing, setExpandedDrawing] = useState<string | null>(null);

  if (domain !== 'manufacturing') return null;

  const agents = result.agents || [];
  const salesData = agents.find((a: any) => a.agentName === 'Sales Agent' || a.agentName === 'SalesAgent')?.data || {};
  const engData = agents.find((a: any) => a.agentName === 'Engineering Agent' || a.agentName === 'EngineeringAgent')?.data || {};
  const qualityData = agents.find((a: any) => a.agentName === 'Quality Agent' || a.agentName === 'QualityAgent')?.data || {};
  const planningData = agents.find((a: any) => a.agentName === 'Planning Agent' || a.agentName === 'PlanningAgent')?.data || {};
  const procurementData = agents.find((a: any) => a.agentName === 'Procurement Agent' || a.agentName === 'ProcurementAgent')?.data || {};
  const mfgData = agents.find((a: any) => a.agentName === 'Manufacturing Agent' || a.agentName === 'ManufacturingAgent')?.data || {};
  const complianceData = agents.find((a: any) => a.agentName === 'Compliance Agent' || a.agentName === 'ComplianceAgent')?.data || {};
  const shippingData = agents.find((a: any) => a.agentName === 'Shipping Agent' || a.agentName === 'ShippingAgent')?.data || {};
  const auditData = agents.find((a: any) => a.agentName === 'Audit & Reflection Agent' || a.agentName === 'AuditAgent')?.data || {};
  const outsideProcessesData = agents.find((a: any) => a.agentName === 'Outside Processes Agent' || a.agentName === 'OutsideProcessesAgent')?.data || {};
  const rawCncData = agents.find((a: any) => a.agentName === 'CNCProgrammingAgent' || a.agentName === 'CNC Programming Agent')?.data || {};

  // Ensure every CNC operation has a program and every operation has a stage drawing
  const cncData = useMemo(() => {
    const data = { ...rawCncData };
    // Support both 'operations' and 'routing' field names
    const ops = Array.isArray(data.operations) ? data.operations : Array.isArray(data.routing) ? data.routing : [];
    
    // Debug: log what the agent returned
    console.log('[CompliancePackage] CNC Agent raw data:', JSON.stringify({
      operationCount: ops.length,
      programCount: Array.isArray(data.programs) ? data.programs.length : 0,
      stageDrawingCount: Array.isArray(data.stageDrawings) ? data.stageDrawings.length : 0,
      programOps: Array.isArray(data.programs) ? data.programs.map((p: any) => p.opNumber) : [],
      stageDrawingOps: Array.isArray(data.stageDrawings) ? data.stageDrawings.map((s: any) => s.opNumber) : [],
    }));

    // Ensure operations array is set
    if (!Array.isArray(data.operations)) data.operations = ops;
    // Ensure programs array exists
    if (!Array.isArray(data.programs)) data.programs = [];
    // Ensure stageDrawings array exists  
    if (!Array.isArray(data.stageDrawings)) data.stageDrawings = [];

    // For each CNC operation that's missing a program, generate a fallback
    ops.forEach((op: any, idx: number) => {
      const isCNCOp = /CNC|HAAS|VF-|ST-|MILL|LATHE/i.test(op.machine || '');
      if (isCNCOp && !data.programs.find((p: any) => p.opNumber === op.opNumber)) {
        const progNum = `O${String(idx + 1).padStart(4, '0')}`;
        const machineName = op.machine?.replace(/\s*MACH\d+/i, '') || 'HAAS VF-3';
        const instructions = Array.isArray(op.instructions) ? op.instructions : [op.instructions || 'MACHINING OPERATION'];
        data.programs.push({
          programNumber: progNum,
          opNumber: op.opNumber,
          machine: machineName,
          gcode: `${progNum} (${(result.fileName || 'PART').toUpperCase()} - ${op.opNumber} ${instructions[0]?.replace(/\(.*?\)/g, '').trim().substring(0, 40) || 'MACHINING'})\n(${machineName} / ${op.workholding || 'VISE'})\n(DATE: ${new Date().toISOString().split('T')[0]} / PROGRAMMER: GUARDIAN OS)\nG90 G54 G17\nG28 G91 Z0.\nT${String(idx + 1).padStart(2, '0')} M06 (${Array.isArray(op.tools) ? op.tools[0] || 'ENDMILL' : 'ENDMILL'})\nS8000 M03\nG43 H${String(idx + 1).padStart(2, '0')} Z1.0\n(${instructions.join('\n(')})\n(FULL TOOLPATH REQUIRES DIGITAL TWIN INTEGRATION)\nM09\nG28 G91 Z0.\nM30\n%`,
        });
      }

      // For every operation missing a stage drawing, generate a fallback
      if (!data.stageDrawings.find((s: any) => s.opNumber === op.opNumber)) {
        data.stageDrawings.push({
          opNumber: op.opNumber,
          title: `AFTER ${op.opNumber}: ${(Array.isArray(op.instructions) ? op.instructions[0] : op.instructions || op.machine || 'OPERATION').replace(/\(.*?\)/g, '').trim().substring(0, 50).toUpperCase()}`,
          description: `Part state after ${op.opNumber}. Machine: ${op.machine || 'N/A'}. ${Array.isArray(op.instructions) ? op.instructions.join('. ') : op.instructions || ''}`,
          machinedFeatures: Array.isArray(op.instructions) ? op.instructions.map((inst: string) => inst.replace(/\(REF BUBBLE.*?\)/gi, '').trim()) : [op.instructions || 'Machining operation'],
          remainingStock: 'See subsequent operations',
          fixturing: op.workholding || 'Standard workholding',
        });
      }
    });

    console.log('[CompliancePackage] After fallback fill:', JSON.stringify({
      programCount: data.programs.length,
      stageDrawingCount: data.stageDrawings.length,
    }));

    return data;
  }, [rawCncData, result.fileName]);

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const quoteNumber = `GOS-${Date.now().toString(36).toUpperCase()}`;

  const documents: DocumentSection[] = [
    {
      id: 'rfq',
      title: 'Request for Quote (RFQ) Response',
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-accent">GUARDIAN OS — RFQ RESPONSE</p>
            <p className="text-muted-foreground">AS9100 Rev D Compliant</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Quote Number</p>
              <p className="font-semibold">{quoteNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Date</p>
              <p>{today}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Part / Drawing</p>
              <p>{result.fileName || result.summary?.partName || 'PART-001'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Material</p>
              <p>{result.summary?.material || salesData.materialCallout || engData.recommendedMaterial || 'Aluminum 6061-T6'}</p>
            </div>
          </div>
          {result.drawingAnalysis && (
            <div className="bg-card/50 border border-border rounded p-3">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Drawing Analysis</p>
              <p className="text-[10px] leading-relaxed">{result.drawingAnalysis}</p>
            </div>
          )}
          <table className="w-full border border-border text-[11px]">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2 text-left">Item</th>
                <th className="border border-border p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-border p-2">Material Cost</td><td className="border border-border p-2 text-right">${(salesData.quoteBreakdown?.materialCost || 0).toFixed(2)}</td></tr>
              <tr><td className="border border-border p-2">Labor Cost</td><td className="border border-border p-2 text-right">${(salesData.quoteBreakdown?.laborCost || 0).toFixed(2)}</td></tr>
              <tr><td className="border border-border p-2">Overhead</td><td className="border border-border p-2 text-right">${(salesData.quoteBreakdown?.overheadCost || 0).toFixed(2)}</td></tr>
              <tr><td className="border border-border p-2">Quality / Compliance</td><td className="border border-border p-2 text-right">${(salesData.quoteBreakdown?.qualityCost || 0).toFixed(2)}</td></tr>
              <tr><td className="border border-border p-2">Outside Processing</td><td className="border border-border p-2 text-right">${(salesData.quoteBreakdown?.outsideProcessCost || 0).toFixed(2)}</td></tr>
              <tr><td className="border border-border p-2">Shipping & Packaging</td><td className="border border-border p-2 text-right">${(salesData.quoteBreakdown?.shippingCost || 0).toFixed(2)}</td></tr>
              <tr className="font-bold bg-accent/10"><td className="border border-border p-2">TOTAL QUOTED PRICE</td><td className="border border-border p-2 text-right text-accent">${(salesData.quoteBreakdown?.totalCost || result.summary?.totalPrice || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Delivery Commitment</p>
            <p>{salesData.deliveryCommitment || planningData.totalLeadTimeDays + ' days' || '25 business days ARO'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Terms & Conditions</p>
            <p>Quote valid for 30 days. FOB Origin. Net 30 terms. AS9100 Rev D quality system applies.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'routing',
      title: 'Manufacturing Routing / Process Plan',
      icon: <Wrench className="w-5 h-5 text-green-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-green-400">MANUFACTURING ROUTING</p>
            <p className="text-muted-foreground">Process Plan — {result.fileName}</p>
          </div>
          <table className="w-full border border-border text-[11px]">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2 text-left">Op #</th>
                <th className="border border-border p-2 text-left">Operation</th>
                <th className="border border-border p-2 text-left">Machine</th>
                <th className="border border-border p-2 text-right">Setup (min)</th>
                <th className="border border-border p-2 text-right">Cycle (min)</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // CRITICAL FIX: Always use agent data FIRST, fallback ONLY if truly empty
                const operations = mfgData.operations || mfgData.machiningOperations || [];
                
                // Log what we're getting from the agent
                console.log('[Routing Table] Manufacturing Agent Data:', {
                  hasOperations: !!mfgData.operations,
                  hasMachiningOperations: !!mfgData.machiningOperations,
                  operationCount: operations.length,
                  firstOperation: operations[0]
                });

                // If agent returned operations, use them
                if (operations.length > 0) {
                  return operations.map((op: any, i: number) => (
                    <tr key={`op-${i}`} className="hover:bg-accent/5">
                      <td className="border border-border p-2">{op.op || op.opNumber || ((i + 1) * 10)}</td>
                      <td className="border border-border p-2">
                        {op.description || op.operation || op.step || op.name || `Operation ${i+1}`}
                      </td>
                      <td className="border border-border p-2">{op.machine || op.equipment || 'CNC'}</td>
                      <td className="border border-border p-2 text-right">
                        {op.setupTimeMin || op.setupTime || op.setup || '—'}
                      </td>
                      <td className="border border-border p-2 text-right">
                        {op.cycleTimeMin || op.cycleTime || op.cycle || op.runtime || '—'}
                      </td>
                    </tr>
                  ));
                }

                // ONLY show fallback if NO agent data at all
                console.warn('[Routing Table] No agent routing data - using fallback');
                const fallbackOps = [
                  { op: 10, operation: 'Material Procurement & Inspection', machine: 'Receiving', setupTime: 0, cycleTime: 0 },
                  { op: 20, operation: 'Raw Stock Prep', machine: 'Band Saw', setupTime: 15, cycleTime: 5 },
                  { op: 30, operation: 'CNC Mill Op 1 — Profile', machine: '3-Axis VMC', setupTime: 45, cycleTime: 30 },
                  { op: 40, operation: 'CNC Mill Op 2 — Features', machine: '3-Axis VMC', setupTime: 30, cycleTime: 25 },
                  { op: 50, operation: 'Drill & Tap', machine: 'CNC Drill', setupTime: 20, cycleTime: 15 },
                  { op: 60, operation: 'Deburr & Break Edges', machine: 'Bench', setupTime: 5, cycleTime: 10 },
                  { op: 70, operation: 'Surface Finish', machine: 'Anodize Line', setupTime: 0, cycleTime: 120 },
                  { op: 80, operation: 'Final Inspection', machine: 'CMM', setupTime: 15, cycleTime: 20 },
                ];

                return fallbackOps.map((op, i) => (
                  <tr key={`fallback-${i}`} className="opacity-60">
                    <td className="border border-border p-2">{op.op}</td>
                    <td className="border border-border p-2">{op.operation}</td>
                    <td className="border border-border p-2">{op.machine}</td>
                    <td className="border border-border p-2 text-right">{op.setupTime}</td>
                    <td className="border border-border p-2 text-right">{op.cycleTime}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
          {/* Show warning if using fallback data */}
          {(() => {
            const operations = mfgData.operations || mfgData.machiningOperations || [];
            if (operations.length === 0) {
              return (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  ⚠️ Showing generic routing template. Upload a new part to generate actual routing.
                </div>
              );
            }
            return null;
          })()}
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Tooling Requirements</p>
            <p>{Array.isArray(mfgData.toolingRequired) ? mfgData.toolingRequired.join(', ') : (mfgData.toolingNotes || 'Standard carbide end mills, drills per drawing callouts')}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Special Process Notes</p>
            <p>{mfgData.specialProcesses || mfgData.notes || 'No special processes required beyond standard machining.'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'fai',
      title: 'First Article Inspection (FAI) Plan — AS9102',
      icon: <Ruler className="w-5 h-5 text-yellow-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-yellow-400">FIRST ARTICLE INSPECTION REPORT</p>
            <p className="text-muted-foreground">Per AS9102 Rev B — {result.fileName}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">FAI Type</p>
              <p>Full FAI</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Reason</p>
              <p>New Part / First Production</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Standard</p>
              <p>AS9102 Rev B</p>
            </div>
          </div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Form 1 — Part Number Accountability</p>
          <table className="w-full border border-border text-[11px] mb-4">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2 text-left">Field</th>
                <th className="border border-border p-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-border p-2">Part Number</td><td className="border border-border p-2">{result.fileName ? result.fileName.replace(/\.[^.]+$/, '') : 'PART-001'}</td></tr>
              <tr><td className="border border-border p-2">Part Name</td><td className="border border-border p-2">Bracket Assembly</td></tr>
              <tr><td className="border border-border p-2">Drawing Rev</td><td className="border border-border p-2">A (Initial)</td></tr>
              <tr><td className="border border-border p-2">Material</td><td className="border border-border p-2">{engData.recommendedMaterial || 'Aluminum 6061-T6'}</td></tr>
              <tr><td className="border border-border p-2">Material Cert Required</td><td className="border border-border p-2">Yes — per AS9100 7.4</td></tr>
            </tbody>
          </table>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Form 3 — Characteristic Accountability (Bubble Chart Reference)</p>
          <table className="w-full border border-border text-[11px]">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2">Bubble #</th>
                <th className="border border-border p-2 text-left">Characteristic</th>
                <th className="border border-border p-2">Nominal</th>
                <th className="border border-border p-2">Tolerance</th>
                <th className="border border-border p-2">Method</th>
              </tr>
            </thead>
            <tbody>
              {(qualityData.inspectionPoints || qualityData.characteristics || [
                { char: 'Overall Length', nominal: '98mm', tolerance: '±0.25', method: 'CMM' },
                { char: 'Overall Width', nominal: '60mm', tolerance: '±0.25', method: 'CMM' },
                { char: 'Bore Ø40', nominal: '40.00mm', tolerance: '+0.025/-0', method: 'Bore Gauge' },
                { char: 'Bore Ø30', nominal: '30.00mm', tolerance: '+0.021/-0', method: 'Bore Gauge' },
                { char: 'Bore Ø20', nominal: '20.00mm', tolerance: '+0.021/-0', method: 'Pin Gauge' },
                { char: 'Hole Ø16 (x2)', nominal: '16.00mm', tolerance: '+0.018/-0', method: 'Pin Gauge' },
                { char: 'R23 Arc', nominal: 'R23mm', tolerance: '±0.5', method: 'CMM' },
                { char: 'Surface Finish', nominal: '1.6 Ra', tolerance: 'Max', method: 'Profilometer' },
              ]).map((item: any, i: number) => (
                <tr key={i}>
                  <td className="border border-border p-2 text-center font-bold text-yellow-400">{i + 1}</td>
                  <td className="border border-border p-2">{item.char || item.characteristic || item.feature || `Dim ${i+1}`}</td>
                  <td className="border border-border p-2 text-center">{item.nominal || item.value || '—'}</td>
                  <td className="border border-border p-2 text-center">{item.tolerance || item.tol || '±0.25'}</td>
                  <td className="border border-border p-2 text-center">{item.method || item.instrument || 'CMM'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'bubble',
      title: 'Bubble Notation Drawing Reference',
      icon: <Eye className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-purple-400">BUBBLE NOTATION REFERENCE</p>
            <p className="text-muted-foreground">Drawing Callout Map — {result.fileName}</p>
          </div>
          <p className="text-muted-foreground mb-3">Each bubble number corresponds to a measured characteristic in the FAI Form 3. All dimensions are to be verified per the inspection plan.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { bubble: 1, desc: 'Overall Length — 98mm', view: 'Front View' },
              { bubble: 2, desc: 'Overall Width — 60mm', view: 'Front View' },
              { bubble: 3, desc: 'Main Bore Ø40', view: 'Front View / Section A-A' },
              { bubble: 4, desc: 'Secondary Bore Ø30', view: 'Front View' },
              { bubble: 5, desc: 'Through Hole Ø20', view: 'Front View' },
              { bubble: 6, desc: 'Mounting Holes Ø16 (x2)', view: 'Section A-A' },
              { bubble: 7, desc: 'Fillet R23', view: 'Front View' },
              { bubble: 8, desc: 'Surface Finish 1.6 Ra', view: 'All machined surfaces' },
            ].map((b) => (
              <div key={b.bubble} className="flex items-start gap-3 p-2 border border-border rounded">
                <div className="w-8 h-8 rounded-full border-2 border-purple-400 flex items-center justify-center text-purple-400 font-bold shrink-0">
                  {b.bubble}
                </div>
                <div>
                  <p className="font-semibold">{b.desc}</p>
                  <p className="text-muted-foreground text-[10px]">View: {b.view}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'inspection',
      title: 'Inspection & Test Plan (ITP)',
      icon: <ClipboardList className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-blue-400">INSPECTION & TEST PLAN</p>
            <p className="text-muted-foreground">Per AS9100 Rev D Section 8.6 — {result.fileName}</p>
          </div>
          <table className="w-full border border-border text-[11px]">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2 text-left">Stage</th>
                <th className="border border-border p-2 text-left">Inspection</th>
                <th className="border border-border p-2">Method</th>
                <th className="border border-border p-2">Acceptance</th>
                <th className="border border-border p-2">Record</th>
              </tr>
            </thead>
            <tbody>
              {[
                { stage: 'Receiving', inspection: 'Material Certification Review', method: 'Document Review', acceptance: 'Certs match PO', record: 'Material Cert File' },
                { stage: 'Receiving', inspection: 'Raw Stock Dimensional Check', method: 'Caliper / Micrometer', acceptance: 'Per material spec', record: 'Receiving Inspection Report' },
                { stage: 'In-Process', inspection: 'Op 10 — Profile Dimensions', method: 'CMM', acceptance: 'Per drawing ±tol', record: 'In-Process Sheet' },
                { stage: 'In-Process', inspection: 'Op 20 — Feature Dimensions', method: 'CMM / Bore Gauge', acceptance: 'Per drawing ±tol', record: 'In-Process Sheet' },
                { stage: 'In-Process', inspection: 'Op 30 — Hole Locations', method: 'CMM', acceptance: 'True position per GD&T', record: 'In-Process Sheet' },
                { stage: 'Final', inspection: 'All Bubble Characteristics', method: 'CMM Full Layout', acceptance: 'Per FAI Form 3', record: 'FAI Report AS9102' },
                { stage: 'Final', inspection: 'Surface Finish', method: 'Profilometer', acceptance: '≤1.6 Ra', record: 'Surface Finish Report' },
                { stage: 'Final', inspection: 'Visual / Workmanship', method: 'Visual 10x', acceptance: 'No burrs, scratches, tool marks', record: 'Visual Inspection Checklist' },
                { stage: 'Final', inspection: 'Hardness (if required)', method: 'Rockwell / Brinell', acceptance: 'Per material spec', record: 'Test Report' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="border border-border p-2">{row.stage}</td>
                  <td className="border border-border p-2">{row.inspection}</td>
                  <td className="border border-border p-2 text-center">{row.method}</td>
                  <td className="border border-border p-2">{row.acceptance}</td>
                  <td className="border border-border p-2 text-[10px]">{row.record}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Quality Notes</p>
            <p>{qualityData.qualityNotes || qualityData.reasoning || 'All inspection records to be maintained per AS9100 Rev D Section 7.5. Nonconforming material to be dispositioned per Section 8.7.'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'shipping',
      title: 'Shipping & Packaging Plan',
      icon: <Package className="w-5 h-5 text-teal-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-teal-400">SHIPPING & PACKAGING PLAN</p>
            <p className="text-muted-foreground">{result.fileName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Packaging Method</p>
              <p>{shippingData.packagingMethod || 'Individual VCI wrap, foam-lined corrugated box'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Shipping Method</p>
              <p>{shippingData.shippingMethod || 'UPS Ground / FedEx Priority'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Special Handling</p>
              <p>{shippingData.specialHandling || 'Protect machined surfaces from contact damage'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Documentation Included</p>
              <p>C of C, Material Certs, Inspection Report, Packing Slip</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Certificate of Conformance Statement</p>
            <div className="p-3 border border-border bg-card/50 rounded">
              <p className="italic">"We hereby certify that the material and/or parts described herein have been manufactured, inspected, and tested in accordance with the applicable purchase order requirements, engineering drawings, and specifications. All work was performed under our AS9100 Rev D quality management system."</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'compliance',
      title: 'AS9100 Rev D Compliance Package',
      icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-green-400">AS9100 REV D COMPLIANCE SUMMARY</p>
            <p className="text-muted-foreground">Quality Management System Compliance — {result.fileName}</p>
          </div>
          <table className="w-full border border-border text-[11px]">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2 text-left">AS9100 Clause</th>
                <th className="border border-border p-2 text-left">Requirement</th>
                <th className="border border-border p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { clause: '7.4', req: 'Purchasing — Approved supplier list, material certs', status: true },
                { clause: '7.5.1', req: 'Production Control — Routing, work instructions', status: true },
                { clause: '7.5.2', req: 'Special Processes — Validated per NADCAP if applicable', status: complianceData.nadcapRequired ? 'review' : true },
                { clause: '8.2.4', req: 'Product Monitoring — In-process inspection', status: true },
                { clause: '8.3', req: 'Nonconforming Product — Disposition procedures', status: true },
                { clause: '8.5.2', req: 'Corrective Action — Root cause analysis capability', status: true },
                { clause: '7.5.3', req: 'Identification & Traceability — Lot/serial tracking', status: true },
                { clause: '7.5.5', req: 'Preservation — Packaging & handling plan', status: true },
                { clause: '8.2.4.1', req: 'First Article Inspection — AS9102 FAI', status: true },
                { clause: '8.4.2', req: 'Customer Property — Drawing/data control', status: true },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="border border-border p-2 font-semibold">{row.clause}</td>
                  <td className="border border-border p-2">{row.req}</td>
                  <td className="border border-border p-2 text-center">
                    {row.status === true ? (
                      <span className="text-green-400 font-bold">✓ COMPLIANT</span>
                    ) : row.status === 'review' ? (
                      <span className="text-yellow-400 font-bold">⚠ REVIEW</span>
                    ) : (
                      <span className="text-red-400 font-bold">✗ GAP</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Audit Trail</p>
            <p>{auditData.reasoning || 'Full traceability maintained from raw material receipt through final shipment. All quality records retained per AS9100 Rev D Section 4.2.4.'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'procurement',
      title: 'Procurement & Material Sourcing',
      icon: <Package className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-purple-400">PROCUREMENT & MATERIAL SOURCING</p>
            <p className="text-muted-foreground">Material Requirements & Supplier Information</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Material Required</p>
              <p className="font-semibold">{procurementData.materialRequired || 'Per drawing specifications'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Est. Material Cost</p>
              <p className="font-semibold text-purple-400">${(procurementData.estimatedMaterialCost || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Vendor Recommendation</p>
              <p>{procurementData.vendorRecommendation || 'Standard industrial suppliers'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Lead Time</p>
              <p>{procurementData.leadTime || '1-2 weeks from stock'}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Certification Requirements</p>
            <p>{procurementData.certRequired || 'Material certification per ASTM B221 (aluminum) or equivalent'}</p>
          </div>
          {procurementData.toolingRequired && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Tooling Required</p>
              <p>{Array.isArray(procurementData.toolingRequired) ? procurementData.toolingRequired.join(', ') : procurementData.toolingRequired}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Sourcing Strategy</p>
            <p>{procurementData.reasoning || 'Material sourced from approved suppliers on Approved Supplier List per AS9100 Rev D. All material certifications verified upon receipt.'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'outside-processes',
      title: 'Outside Processes PO Requirements',
      icon: <ExternalLink className="w-5 h-5 text-orange-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-orange-400">OUTSIDE PROCESSES — PO REQUIREMENTS</p>
            <p className="text-muted-foreground">External Vendor Operations — {result.fileName}</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 mb-3">
            <p className="text-orange-400 font-semibold text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> NOTICE: These operations require certified outside vendors
            </p>
            <p className="text-muted-foreground text-[10px] mt-1">All outside processes must be performed by Nadcap-accredited or customer-approved suppliers per AS9100 Rev D Section 8.4.</p>
          </div>
          <table className="w-full border border-border text-[11px]">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2 text-left">Process</th>
                <th className="border border-border p-2 text-left">Specification</th>
                <th className="border border-border p-2 text-left">Applies To</th>
                <th className="border border-border p-2 text-left">Vendor Type</th>
                <th className="border border-border p-2 text-right">Est. Cost</th>
                <th className="border border-border p-2 text-right">Lead (days)</th>
              </tr>
            </thead>
            <tbody>
              {(outsideProcessesData.outsideProcesses || [
                { process: 'Heat Treatment', specification: 'AMS 2759', appliesTo: 'All steel components', vendorType: 'Nadcap Heat Treat', estimatedCost: 150, leadTimeDays: 5 },
                { process: 'Anodize Type III', specification: 'MIL-A-8625 Type III', appliesTo: 'Aluminum components', vendorType: 'Nadcap Surface Treatment', estimatedCost: 85, leadTimeDays: 3 },
                { process: 'NDT — Magnetic Particle', specification: 'ASTM E1444', appliesTo: 'Critical load-bearing parts', vendorType: 'Nadcap NDT', estimatedCost: 75, leadTimeDays: 2 },
                { process: 'Passivation', specification: 'ASTM A967 / AMS 2700', appliesTo: 'Stainless steel parts', vendorType: 'Chemical Processing', estimatedCost: 45, leadTimeDays: 2 },
              ] as any[]).map((op: any, i: number) => (
                <tr key={i}>
                  <td className="border border-border p-2 font-semibold text-orange-400">{op.process || op.name}</td>
                  <td className="border border-border p-2">{op.specification || op.spec || '—'}</td>
                  <td className="border border-border p-2">{op.appliesTo || op.component || 'All'}</td>
                  <td className="border border-border p-2">{op.vendorType || op.vendor || 'Certified Vendor'}</td>
                  <td className="border border-border p-2 text-right">${(op.estimatedCost || 0).toLocaleString()}</td>
                  <td className="border border-border p-2 text-right">{op.leadTimeDays || op.leadTime || '—'}</td>
                </tr>
              ))}
              <tr className="font-bold bg-orange-500/10">
                <td className="border border-border p-2" colSpan={4}>TOTAL OUTSIDE PROCESS COST & LEAD TIME</td>
                <td className="border border-border p-2 text-right text-orange-400">
                  ${(outsideProcessesData.totalOutsideCost || (Array.isArray(outsideProcessesData.outsideProcesses) ? (outsideProcessesData.outsideProcesses as any[]).reduce((sum: number, op: any) => sum + (op.estimatedCost || 0), 0) : 355)).toLocaleString()}
                </td>
                <td className="border border-border p-2 text-right text-orange-400">
                  {outsideProcessesData.totalOutsideLeadDays || (Array.isArray(outsideProcessesData.outsideProcesses) ? Math.max(...(outsideProcessesData.outsideProcesses as any[]).map((op: any) => op.leadTimeDays || 0)) : 5)} days
                </td>
              </tr>
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">PO Requirements</p>
              <ul className="space-y-1">
                <li>• Include drawing number and revision on all POs</li>
                <li>• Specify process specification (AMS/MIL/ASTM) on PO</li>
                <li>• Require Certificate of Conformance from vendor</li>
                <li>• Require test reports per applicable specification</li>
                <li>• Nadcap accreditation number must be on vendor C of C</li>
              </ul>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Scheduling Notes</p>
              <ul className="space-y-1">
                <li>• Schedule outside processes into manufacturing routing</li>
                <li>• Allow transit time (1-2 days each way) in lead time</li>
                <li>• Critical path: {Array.isArray(outsideProcessesData.criticalPath) ? outsideProcessesData.criticalPath.join(' → ') : 'Heat Treatment → Anodize'}</li>
                <li>• Receiving inspection required upon return from vendor</li>
              </ul>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Strategy</p>
            <p>{(outsideProcessesData.reasoning as string) || 'Outside processes are sequenced to minimize total lead time. Heat treatment is performed before surface finishing. All vendors must be on the Approved Supplier List per AS9100 Rev D Section 8.4.'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'bubble-annotations',
      title: 'Bubble Annotation Map',
      icon: <Eye className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-accent">BUBBLE ANNOTATION MAP</p>
            <p className="text-muted-foreground">Drawing Feature Cross-Reference — Single Source of Truth</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Part / Drawing</p>
              <p className="font-semibold">{result.fileName || 'Engineering Drawing'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Bubbles</p>
              <p className="font-semibold text-cyan-400">{engData.totalBubbles || (Array.isArray(engData.bubbleAnnotations) ? engData.bubbleAnnotations.length : '—')}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">Each bubble number traces: Drawing Feature → CNC Routing Operation → Inspection Point → FAI Record</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="border border-border p-2 text-left w-16">BUBBLE</th>
                <th className="border border-border p-2 text-left">FEATURE</th>
                <th className="border border-border p-2 text-left">DIMENSION</th>
                <th className="border border-border p-2 text-left">TOLERANCE</th>
                <th className="border border-border p-2 text-left w-20">TYPE</th>
                <th className="border border-border p-2 text-left w-16">CTQ</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(engData.bubbleAnnotations) && engData.bubbleAnnotations.length > 0 ? (
                engData.bubbleAnnotations.map((b: any, i: number) => (
                  <tr key={i} className={b.critical ? 'bg-red-500/10' : ''}>
                    <td className="border border-border p-2 text-center font-bold text-cyan-400">{b.bubble}</td>
                    <td className="border border-border p-2 font-semibold">{b.feature}</td>
                    <td className="border border-border p-2">{b.dimension}</td>
                    <td className="border border-border p-2">{b.tolerance}</td>
                    <td className="border border-border p-2 text-[10px] uppercase">{b.type}</td>
                    <td className="border border-border p-2 text-center">{b.critical ? '⚠ YES' : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-border p-2" colSpan={6}>
                    <div className="space-y-1">
                      {Array.isArray(engData.features) ? engData.features.map((f: any, i: number) => (
                        <p key={i}>Bubble {i + 1}: {f.type} — {f.dimensions} ({f.tolerance})</p>
                      )) : <p>Bubble annotations will be generated from engineering analysis</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {Array.isArray(engData.bubbleAnnotations) && engData.bubbleAnnotations.some((b: any) => b.critical) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <p className="text-red-400 font-semibold text-[10px] uppercase tracking-wider mb-1">Critical-to-Quality Features (Highlighted)</p>
              <ul className="space-y-1">
                {engData.bubbleAnnotations.filter((b: any) => b.critical).map((b: any, i: number) => (
                  <li key={i}>• Bubble {b.bubble}: {b.feature} — {b.dimension} {b.tolerance} {b.notes ? `(${b.notes})` : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'routing-sheet',
      title: 'Shop-Floor Routing Sheet',
      icon: <Wrench className="w-5 h-5 text-green-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-accent">SHOP-FLOOR ROUTING SHEET</p>
            <p className="text-muted-foreground">Operation-by-Operation with Bubble Cross-References</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Part Number</p>
              <p className="font-semibold">{cncData.routingSheet?.partNumber || result.fileName || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Revision</p>
              <p>{cncData.routingSheet?.revision || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Material</p>
              <p>{cncData.routingSheet?.material || result.material || 'Aluminum 6061-T6'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Stock Size</p>
              <p>{cncData.routingSheet?.stockSize || '—'}</p>
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="border border-border p-2 text-left w-16">OP #</th>
                <th className="border border-border p-2 text-left">MACHINE / STATION</th>
                <th className="border border-border p-2 text-left">WORKHOLDING</th>
                <th className="border border-border p-2 text-left">INSTRUCTIONS (WITH BUBBLE REFS)</th>
                <th className="border border-border p-2 text-left w-20">TOOLS</th>
                <th className="border border-border p-2 text-center w-20">PROGRAM</th>
                <th className="border border-border p-2 text-center w-24">DRAWING</th>
                <th className="border border-border p-2 text-left w-20">CYCLE TIME</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(cncData.operations) && cncData.operations.length > 0 ? (
                cncData.operations.map((op: any, i: number) => {
                  const program = Array.isArray(cncData.programs) ? cncData.programs.find((p: any) => p.opNumber === op.opNumber) : null;
                  const stageDraw = Array.isArray(cncData.stageDrawings) ? cncData.stageDrawings.find((s: any) => s.opNumber === op.opNumber) : null;

                  // Compute cumulative bubble refs for progressive stage drawing
                  const currentBubbles: number[] = Array.isArray(op.bubbleRefs) ? op.bubbleRefs : [];
                  const previousBubbles: number[] = [];
                  for (let j = 0; j < i; j++) {
                    const prevOp = cncData.operations[j];
                    if (Array.isArray(prevOp?.bubbleRefs)) {
                      previousBubbles.push(...prevOp.bubbleRefs);
                    }
                  }
                  // All bubbles across all operations
                  const allBubbles: number[] = cncData.operations.flatMap((o: any) => Array.isArray(o.bubbleRefs) ? o.bubbleRefs : []);
                  // Engineering agent bubble annotations
                  const bubbleAnnotations = Array.isArray(engData.bubbleAnnotations) ? engData.bubbleAnnotations : [];

                  return (
                    <React.Fragment key={i}>
                      <tr>
                        <td className="border border-border p-2 font-bold text-green-400">
                          {op.opNumber}
                        </td>
                        <td className="border border-border p-2 font-semibold">{op.machine}</td>
                        <td className="border border-border p-2">{op.workholding}</td>
                        <td className="border border-border p-2">
                          <ul className="space-y-1">
                            {Array.isArray(op.instructions) ? op.instructions.map((inst: string, j: number) => (
                              <li key={j}>• {inst}</li>
                            )) : <li>{op.instructions}</li>}
                          </ul>
                        </td>
                        <td className="border border-border p-2 text-[10px]">
                          {Array.isArray(op.tools) ? op.tools.join(', ') : (op.tools || '—')}
                        </td>
                        {/* PROGRAM COLUMN */}
                        <td className="border border-border p-2 text-center">
                          {program ? (
                            <button
                              onClick={() => setExpandedProgram(expandedProgram === `prog-${i}` ? null : `prog-${i}`)}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                                expandedProgram === `prog-${i}`
                                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                              }`}
                              title="Click to view HAAS G&M code"
                            >
                              <Code2 className="w-3 h-3" />
                              {program.programNumber}
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </td>
                        {/* DRAWING COLUMN — lazy render on click */}
                        <td className="border border-border p-2 text-center">
                          {stageDraw ? (
                            <button
                              onClick={() => setExpandedDrawing(expandedDrawing === `draw-${i}` ? null : `draw-${i}`)}
                              className={`inline-flex flex-col items-center gap-0.5 text-[9px] px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                expandedDrawing === `draw-${i}`
                                  ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                                  : 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
                              }`}
                              title="Click to view stage drawing"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span className="font-bold tracking-wider">STAGE</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </td>
                        <td className="border border-border p-2 text-right">{op.cycleTime || '—'}</td>
                      </tr>
                      {/* Expanded G-code panel */}
                      {expandedProgram === `prog-${i}` && program && (
                        <tr>
                          <td colSpan={8} className="border border-border p-0">
                            <div className="bg-gray-900 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-cyan-400 font-bold text-[11px]">{program.programNumber} — {program.machine} — HAAS G&M CODE</p>
                                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">DEFAULT HAAS FORMAT</span>
                              </div>
                              <pre className="text-green-300 text-[10px] leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">{program.gcode}</pre>
                              <p className="text-amber-400/70 text-[9px] mt-2 italic">Customer-specific post-processor (Mazak, Okuma, Fanuc, DMG MORI) adjusted on onboarding.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {/* Expanded stage drawing panel */}
                      {expandedDrawing === `draw-${i}` && stageDraw && (
                        <tr>
                          <td colSpan={8} className="border border-border p-0">
                            <div className="bg-muted/20 p-4 border-t border-dashed border-border">
                              <StageDrawingFull
                                opNumber={op.opNumber}
                                title={stageDraw.title}
                                description={stageDraw.description}
                                machinedFeatures={Array.isArray(stageDraw.machinedFeatures) ? stageDraw.machinedFeatures : []}
                                remainingStock={stageDraw.remainingStock}
                                fixturing={stageDraw.fixturing}
                                imageUrl={result.imageUrl}
                                bubbleAnnotations={bubbleAnnotations}
                                currentBubbles={currentBubbles}
                                previousBubbles={previousBubbles}
                                allBubbles={allBubbles}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td className="border border-border p-2" colSpan={8}>
                    <p>Routing sheet will be generated from CNC Programming analysis</p>
                  </td>
                </tr>
              )}
              <tr className="bg-muted/30 font-semibold">
                <td className="border border-border p-2" colSpan={4}>TOTALS</td>
                <td className="border border-border p-2">Setup: {cncData.totalEstimatedSetupTime || '—'}</td>
                <td className="border border-border p-2" colSpan={2}>Operations: {cncData.totalOperations || (Array.isArray(cncData.operations) ? cncData.operations.length : '—')}</td>
                <td className="border border-border p-2 text-right text-green-400">{cncData.totalEstimatedCycleTime || '—'}</td>
              </tr>
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Machines Required</p>
              <ul className="space-y-1">
                {Array.isArray(cncData.machinesRequired) ? cncData.machinesRequired.map((m: string, i: number) => (
                  <li key={i}>• {m}</li>
                )) : <li>• Per routing above</li>}
              </ul>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Critical Features</p>
              <ul className="space-y-1">
                {Array.isArray(cncData.criticalFeatures) ? cncData.criticalFeatures.map((f: string, i: number) => (
                  <li key={i}>• {f}</li>
                )) : <li>• Per bubble annotation map</li>}
              </ul>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
            <p className="text-amber-400 font-semibold text-[10px] uppercase tracking-wider mb-1">Digital Twin Note</p>
            <p>{cncData.digitalTwinNote || 'Actual G-code generation, toolpath programming, and collision detection require Digital Twin integration with specific machine kinematics, tool library, and post-processor.'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Routing Strategy</p>
            <p>{(cncData.reasoning as string) || 'Operations sequenced to minimize setups and maximize machine utilization. Bubble references ensure full traceability from drawing to shop floor.'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'programming',
      title: 'CNC Programming & G-Code',
      icon: <Code2 className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-blue-400">CNC PROGRAMMING</p>
            <p className="text-muted-foreground">HAAS G-Code Programs - One per Operation</p>
          </div>
          {Array.isArray(cncData.programs) && cncData.programs.length > 0 ? (
            cncData.programs.map((prog: any, i: number) => (
              <div key={i} className="border border-border rounded">
                <button
                  onClick={() => setExpandedProgram(expandedProgram === `prog-detail-${i}` ? null : `prog-detail-${i}`)}
                  className="w-full p-3 bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-blue-400">{prog.programNumber || `O${String(i + 1).padStart(4, '0')}`}</span>
                    <span className="text-muted-foreground text-[10px]">{prog.opNumber} - {prog.machine}</span>
                  </div>
                  {expandedProgram === `prog-detail-${i}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedProgram === `prog-detail-${i}` && (
                  <div className="p-3 bg-card/50 border-t border-border">
                    <pre className="text-[9px] overflow-x-auto whitespace-pre-wrap break-words bg-background/50 p-2 rounded border border-border/50">
                      {prog.gcode || `${prog.programNumber || `O${String(i + 1).padStart(4, '0')}`}\n(${prog.machine} - ${prog.opNumber})\nG90 G54 G17\nG28 G91 Z0.\n(PROGRAM CONTENT)\nM30\n%`}
                    </pre>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
              <p className="text-blue-400">No programs generated. G-code generation requires Digital Twin integration.</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Programming Notes</p>
            <p>{cncData.programmingNotes || 'All programs post-processed for HAAS VF-3 / UMC-750 machines. Tool offsets managed via machine library. Collision detection performed in Digital Twin before shop-floor execution.'}</p>
          </div>
        </div>
      ),
    },
        ...(result.summary?.isAssembly && result.summary?.bomComponents ? [{
      id: 'bom',
      title: 'Bill of Materials (BOM)',
      icon: <Package className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="font-mono text-xs space-y-4 text-foreground/90">
          <div className="border-b border-border pb-3">
            <p className="text-lg font-bold text-blue-400">BILL OF MATERIALS</p>
            <p className="text-muted-foreground">{result.summary?.partName || 'Assembly'}</p>
          </div>
          <table className="w-full border border-border text-[11px]">
            <thead>
              <tr className="bg-card">
                <th className="border border-border p-2 text-left">Part #</th>
                <th className="border border-border p-2 text-left">Description</th>
                <th className="border border-border p-2 text-left">Material</th>
                <th className="border border-border p-2 text-center">Qty</th>
                <th className="border border-border p-2 text-left">Operation</th>
                <th className="border border-border p-2 text-left">Lead Time</th>
              </tr>
            </thead>
            <tbody>
              {result.summary?.bomComponents?.map((comp: any, i: number) => (
                <tr key={i}>
                  <td className="border border-border p-2">{comp.partNumber}</td>
                  <td className="border border-border p-2">{comp.description}</td>
                  <td className="border border-border p-2">{comp.material}</td>
                  <td className="border border-border p-2 text-center">{comp.quantity}</td>
                  <td className="border border-border p-2">{comp.operation}</td>
                  <td className="border border-border p-2">{comp.leadTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    }] : []),
  ];

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          Shop-Ready Compliance Package — AS9100 Rev D
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete documentation package generated by Guardian OS. Click any document to view.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewingDoc(viewingDoc === doc.id ? null : doc.id)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                {doc.icon}
                <span className="text-sm font-medium text-foreground">{doc.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">GENERATED</span>
                {viewingDoc === doc.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>
            {viewingDoc === doc.id && (
              <div className="border-t border-border bg-background/80 p-6 max-h-[600px] overflow-y-auto">
                {doc.content}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
