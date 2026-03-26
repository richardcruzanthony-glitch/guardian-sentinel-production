/**
 * Pre-processed showcase parts for the Guardian OS demo.
 * These allow visitors to evaluate the system without uploading proprietary drawings.
 */

export interface ShowcasePart {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  material: string;
  complexity: string;
  operations: number;
  result: any; // Full HybridProcessingResult-compatible object
}

const BRACKET_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663291553249/AuUENrxRjSTEQmxJ.jpg';
const JACK_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663291553249/EpOQxEPfavdTXpKG.jpeg';

export const SHOWCASE_PARTS: ShowcasePart[] = [
  {
    id: 'triple-clamp-bracket',
    name: 'Triple Clamp Bracket — Complex Model',
    description: '5-axis simultaneous CNC bracket mounted high on support stock. Features compound radii, precision bores, support material trimming at ±.005", and manual edge deburr. Full 6-operation 5-axis workflow: rough, finish, detail bores, support trim, manual deburr.',
    imageUrl: BRACKET_IMAGE,
    material: 'Aluminum 7075-T6',
    complexity: 'High — 5-Axis',
    operations: 6,
    result: {
      imageUrl: BRACKET_IMAGE,
      summary: {
        partName: 'Triple Clamp Bracket — Complex Model',
        material: 'Aluminum 7075-T6',
        estimatedCost: 485,
        leadTimeDays: 12,
        confidence: 94,
        processingTime: 3.2,
            totalOperations: 6,
        complianceStatus: 'AS9100 Rev D Compliant',
      },
      drawingAnalysis: 'Complex triple-clamp bracket with 3D model reference. Overall envelope 200mm x 66mm x ~40mm. Features include: three precision bores (Ø50, Ø10.50, Ø8), multiple radii (R2, R4, R19, R20, R30, R33, R35), cross-hatched section views (Section A-A at 1:1.5 scale), Detail B (1:1.5) showing internal bore geometry with Ø24, Ø30 and 2x45° chamfers, Detail E (2:1.5) showing Ø22 bore with Ø14 counterbore and R33 blend. Title block indicates A3 sheet, Scale 1:2. Material not specified on drawing — defaulting to Aluminum 7075-T6 based on geometry and aerospace application. Part requires 3+2 axis machining minimum due to compound angles and undercut features visible in 3D model view.',
      agentResults: {
        'Engineering Agent': {
          status: 'completed',
          result: {
            bubbleAnnotations: [
              { bubble: 1, feature: 'Center bore Ø50mm', tolerance: '±0.025mm', criticality: 'high' },
              { bubble: 2, feature: 'Left bore Ø10.50mm', tolerance: '±0.013mm', criticality: 'high' },
              { bubble: 3, feature: 'Right bore Ø8mm', tolerance: '±0.015mm', criticality: 'medium' },
              { bubble: 4, feature: 'Top profile R19/R20 blend', tolerance: '±0.1mm', criticality: 'medium' },
              { bubble: 5, feature: 'Bottom radii R30/R33/R35', tolerance: '±0.1mm', criticality: 'medium' },
              { bubble: 6, feature: 'Detail B — Ø24/Ø30 bore with 2x45° chamfer', tolerance: '±0.025mm', criticality: 'high' },
              { bubble: 7, feature: 'Detail E — Ø22 bore with Ø14 counterbore', tolerance: '±0.025mm', criticality: 'high' },
              { bubble: 8, feature: 'Overall length 200mm', tolerance: '±0.1mm', criticality: 'medium' },
              { bubble: 9, feature: 'Width 66mm across top', tolerance: '±0.1mm', criticality: 'medium' },
              { bubble: 10, feature: 'Slot width 16mm', tolerance: '±0.05mm', criticality: 'medium' },
            ],
            dfmNotes: 'Part requires 3+2 axis CNC milling. Compound radii on outer profile require ball-end finishing. Internal bores in Detail B and E require boring bar or reamer for tolerance. Recommend 5-axis simultaneous for outer profile to minimize setups.',
          },
        },
        'Sales Agent': {
          status: 'completed',
          result: {
            quoteBreakdown: {
              materialCost: 45,
              laborCost: 280,
              overheadCost: 85,
              outsideProcessCost: 75,
              totalCost: 485,
              margin: '28%',
            },
            competitivePosition: 'Complex 5-axis bracket — limited competition. Most shops will quote $600-$800. Our 5-axis capability and efficient programming give us a cost advantage.',
            reasoning: 'Material: 7075-T6 billet 210x75x50mm ~$45. Labor: 4 operations, estimated 3.5 hours total machine time at $80/hr. Outside: Anodize Type III per MIL-A-8625.',
          },
        },
        'Quality Agent': {
          status: 'completed',
          result: {
            inspectionPlan: [
              { bubble: 1, feature: 'Center bore Ø50mm', method: 'CMM — bore probe', frequency: '100% FAI, 10% production', acceptance: 'Ø50.000 ±0.025mm' },
              { bubble: 2, feature: 'Left bore Ø10.50mm', method: 'Pin gauge + CMM', frequency: '100% FAI, 20% production', acceptance: 'Ø10.500 ±0.013mm' },
              { bubble: 3, feature: 'Right bore Ø8mm', method: 'Pin gauge', frequency: '100% FAI, 10% production', acceptance: 'Ø8.000 ±0.015mm' },
              { bubble: 6, feature: 'Detail B bore Ø24/Ø30', method: 'CMM — bore probe', frequency: '100% FAI, 10% production', acceptance: 'Per detail view dimensions' },
              { bubble: 7, feature: 'Detail E bore Ø22/Ø14 CB', method: 'CMM — bore probe + depth mic', frequency: '100% FAI, 10% production', acceptance: 'Per detail view dimensions' },
              { bubble: 8, feature: 'Overall length 200mm', method: 'CMM or caliper', frequency: '100%', acceptance: '200.0 ±0.1mm' },
            ],
            faiRequired: true,
            faiForm: 'AS9102 Rev C — First Article Inspection Report',
            reasoning: 'Critical bores require CMM verification. Profile tolerances verified with CMM scan. Surface finish 32 Ra µin on bore surfaces, 63 Ra µin on external surfaces.',
          },
        },
        'Planning Agent': {
          status: 'completed',
          result: {
            productionSchedule: {
              totalLeadTime: '12 business days',
              materialLeadTime: '2 days (stock)',
              machiningTime: '3.5 hours',
              outsideProcessTime: '5 days',
              inspectionTime: '1 day',
              bufferDays: 2,
            },
            reasoning: 'Material available from stock. 4 CNC operations across 2 machines (VF-4 for milling, VF-2SS for detail work). Anodize outsourced — 5 day turnaround. FAI adds 1 day for CMM programming and reporting.',
          },
        },
        'CNC Programming Agent': {
          status: 'completed',
          result: {
            routing: [
              {
                opNumber: 'OP-10',
                machine: 'HAAS VF-4 (5-Axis)',
                description: 'Rough & semi-finish top profile, rough center bore Ø50, drill pilot holes for Ø10.50 and Ø8 bores',
                tools: ['Ø20 flat endmill', 'Ø10 ball endmill', 'Ø8 drill', 'Ø49.5 rough bore bar'],
                estimatedTime: '55 min',
                workholding: '6" Kurt vise on Ø50 raw stock bore — soft jaws, Part seated on parallels',
                instructions: 'Face top, rough profile leaving 0.5mm stock. Rough bore Ø50 to Ø49.5. Drill Ø8 pilot holes for side bores. Flip for OP-20.',
                bubbleRefs: [1, 4, 5, 8, 9],
              },
              {
                opNumber: 'OP-20',
                machine: 'HAAS VF-4 (5-Axis)',
                description: 'Finish top profile, finish bore Ø50, machine bottom radii R30/R33/R35, slot 16mm',
                tools: ['Ø10 ball endmill', 'Ø50 finish bore bar', 'Ø16 slot mill', 'Ø6 ball endmill'],
                estimatedTime: '45 min',
                workholding: 'Custom fixture plate — locate on Ø50 bore and 2 pins',
                instructions: 'Finish profile to final dimensions. Finish bore Ø50 to tolerance. Cut slot 16mm. Blend all radii R30/R33/R35. Deburr edges.',
                bubbleRefs: [1, 5, 10],
              },
              {
                opNumber: 'OP-30',
                machine: 'HAAS VF-2SS',
                description: 'Machine Detail B features — bore Ø24/Ø30 with 2x45° chamfer, and Detail E — bore Ø22 with Ø14 counterbore',
                tools: ['Ø24 reamer', 'Ø30 boring bar', 'Ø22 reamer', 'Ø14 counterbore', '45° chamfer mill'],
                estimatedTime: '35 min',
                workholding: 'Custom fixture — locate on finished Ø50 bore and slot',
                instructions: 'Bore and ream Ø24 to tolerance. Bore Ø30 to tolerance. Cut 2x45° chamfers. Bore and ream Ø22. Counterbore Ø14. All bores must be concentric within 0.013mm.',
                bubbleRefs: [6, 7],
              },
              {
                opNumber: 'OP-40',
                machine: 'HAAS VF-2SS',
                description: 'Finish machine side bores Ø10.50 and Ø8, final deburr, break all edges',
                tools: ['Ø10.50 reamer', 'Ø8 reamer', 'Deburr tool', 'Chamfer mill'],
                estimatedTime: '20 min',
                workholding: 'Same fixture as OP-30',
                instructions: 'Ream Ø10.50 and Ø8 bores to final tolerance. Chamfer all bore entries 0.5x45°. Deburr all edges. Final inspection before outside process.',
                bubbleRefs: [2, 3],
              },
              {
                opNumber: 'OP-50',
                machine: 'HAAS VF-2SS',
                description: 'Support material trim at ±.005" — remove support stock from mounting surface',
                tools: ['Ø10 flat endmill', 'Deburr tool'],
                estimatedTime: '15 min',
                workholding: 'Precision vise on finished surfaces',
                instructions: 'Trim support stock to ±.005" tolerance. Deburr witness mark. Verify flatness on mounting surface. Part ready for outside process.',
                bubbleRefs: [1, 8, 9],
              },
              {
                opNumber: 'OP-60',
                machine: 'Manual Deburr Station',
                description: 'Manual deburr — remove residual witness marks, break all edges, final surface prep for anodize',
                tools: ['Deburr file', 'Scotch-Brite pad', 'Hand tools'],
                estimatedTime: '10 min',
                workholding: 'Soft vise or padded clamp',
                instructions: 'Remove witness mark from support trim. Break all edges 0.2mm x 45°. Clean all surfaces. Inspect for burrs. Ready for anodize.',
                bubbleRefs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              },
            ],
            programs: [
              { opNumber: 'OP-10', programNumber: 'O0001', gcode: '%\nO0001 (TRIPLE CLAMP BRACKET - OP10 ROUGH)\n(MACHINE: HAAS VF-4 5-AXIS)\n(MATERIAL: AL 7075-T6)\n(PROGRAMMER: GUARDIAN OS)\n(DATE: 2026-02-14)\nG00 G17 G40 G49 G80 G90\nG28 G91 Z0.\nT01 M06 (DIA 20 FLAT ENDMILL)\nG00 G90 G54 X0. Y0.\nG43 H01 Z50. M08\nS8000 M03\nG00 Z2.\nG01 Z-5. F2000.\n(ROUGH TOP PROFILE - 0.5MM STOCK)\nG01 X-100. F3000.\nG03 X-80. Y20. R20. F2500.\nG01 X-33. F3000.\nG03 X-17. Y33. R33. F2500.\nG01 X17. F3000.\nG03 X33. Y20. R30. F2500.\nG01 X80. F3000.\nG03 X100. Y0. R19. F2500.\nG01 Y-40. F3000.\nG01 X-100. F3000.\nG01 Y0. F3000.\nG00 Z50.\nT02 M06 (DIA 49.5 ROUGH BORE BAR)\nG00 G90 G54 X0. Y0.\nG43 H02 Z50.\nS3000 M03\nG00 Z2.\nG01 Z-45. F500.\nG01 X24.75 F200.\nG03 I-24.75 F300.\nG01 X0. F500.\nG00 Z50.\nT03 M06 (DIA 8 DRILL)\nG00 G90 G54 X-80. Y0.\nG43 H03 Z50.\nS4000 M03\nG83 Z-25. R2. Q5. F400.\nG80\nG00 X80.\nG83 Z-25. R2. Q5. F400.\nG80\nG00 Z50.\nM30\n%' },
              { opNumber: 'OP-20', programNumber: 'O0002', gcode: '%\nO0002 (TRIPLE CLAMP BRACKET - OP20 FINISH)\n(MACHINE: HAAS VF-4 5-AXIS)\n(MATERIAL: AL 7075-T6)\nG00 G17 G40 G49 G80 G90\nG28 G91 Z0.\nT01 M06 (DIA 10 BALL ENDMILL)\nG00 G90 G54 X0. Y0.\nG43 H01 Z50. M08\nS10000 M03\nG00 Z2.\n(FINISH PROFILE - FINAL DIMENSIONS)\nG01 Z-2. F1500.\nG41 D01 X-100. F2000.\nG03 X-80. Y20. R20.\nG01 X-33.\nG03 X-17. Y33. R33.\nG01 X17.\nG03 X33. Y20. R30.\nG01 X80.\nG03 X100. Y0. R19.\nG01 Y-40.\nG01 X-100.\nG01 Y0.\nG40 G01 X0.\nG00 Z50.\nT02 M06 (DIA 50 FINISH BORE BAR)\nG00 G90 G54 X0. Y0.\nG43 H02 Z50.\nS2500 M03\nG00 Z2.\nG01 Z-45. F300.\nG01 X25. F100.\nG03 I-25. F150.\nG01 X0. F300.\nG00 Z50.\nT03 M06 (DIA 16 SLOT MILL)\nG00 G90 G54 X0. Y-20.\nG43 H03 Z50.\nS6000 M03\nG00 Z2.\nG01 Z-40. F800.\nG01 Y20. F1200.\nG00 Z50.\nM30\n%' },
              { opNumber: 'OP-30', programNumber: 'O0003', gcode: '%\nO0003 (TRIPLE CLAMP BRACKET - OP30 DETAIL BORES)\n(MACHINE: HAAS VF-2SS)\n(DETAIL B AND E FEATURES)\nG00 G17 G40 G49 G80 G90\nG28 G91 Z0.\nT01 M06 (DIA 24 REAMER)\nG00 G90 G54 X-60. Y0.\nG43 H01 Z50. M08\nS1200 M03\nG00 Z2.\nG85 Z-30. R2. F150.\nG80\nG00 Z50.\nT02 M06 (DIA 30 BORING BAR)\nG00 G90 G54 X-60. Y0.\nG43 H02 Z50.\nS1000 M03\nG00 Z2.\nG01 Z-15. F200.\nG01 X-45. F80.\nG03 I15. F100.\nG01 X-60. F200.\nG00 Z50.\nT03 M06 (45 DEG CHAMFER MILL)\nG00 G90 G54 X-60. Y0.\nG43 H03 Z50.\nS4000 M03\nG00 Z2.\nG01 Z-2. F500.\nG01 X-45. F300.\nG03 I15. F400.\nG01 X-60. F500.\nG00 Z50.\nT04 M06 (DIA 22 REAMER)\nG00 G90 G54 X60. Y0.\nG43 H04 Z50.\nS1200 M03\nG00 Z2.\nG85 Z-25. R2. F150.\nG80\nG00 Z50.\nT05 M06 (DIA 14 COUNTERBORE)\nG00 G90 G54 X60. Y0.\nG43 H05 Z50.\nS2000 M03\nG00 Z2.\nG01 Z-8. F200.\nG00 Z50.\nM30\n%' },
              { opNumber: 'OP-40', programNumber: 'O0004', gcode: '%\nO0004 (TRIPLE CLAMP BRACKET - OP40 SIDE BORES)\n(MACHINE: HAAS VF-2SS)\n(FINAL BORES AND DEBURR)\nG00 G17 G40 G49 G80 G90\nG28 G91 Z0.\nT01 M06 (DIA 10.50 REAMER)\nG00 G90 G54 X-80. Y0.\nG43 H01 Z50. M08\nS1500 M03\nG00 Z2.\nG85 Z-20. R2. F120.\nG80\nG00 Z50.\nT02 M06 (DIA 8 REAMER)\nG00 G90 G54 X80. Y0.\nG43 H02 Z50.\nS1800 M03\nG00 Z2.\nG85 Z-20. R2. F120.\nG80\nG00 Z50.\nT03 M06 (CHAMFER MILL 0.5X45)\nG00 G90 G54 X-80. Y0.\nG43 H03 Z50.\nS5000 M03\nG00 Z1.\nG01 Z-0.7 F300.\nG03 I5.25 F400.\nG00 Z50.\nG00 X80.\nG00 Z1.\nG01 Z-0.7 F300.\nG03 I4. F400.\nG00 Z50.\n(DEBURR ALL EDGES)\nM30\n%' },
              { opNumber: 'OP-50', programNumber: 'O0005', gcode: '%\nO0005 (TRIPLE CLAMP BRACKET - OP50 SUPPORT TRIM)\n(MACHINE: HAAS VF-2SS)\n(SUPPORT MATERIAL TRIM AT 0.005 TOLERANCE)\nG00 G17 G40 G49 G80 G90\nG28 G91 Z0.\nT01 M06 (DIA 10 FLAT ENDMILL)\nG00 G90 G54 X0. Y0.\nG43 H01 Z50. M08\nS8000 M03\nG00 Z2.\n(TRIM SUPPORT STOCK - 0.005 TOLERANCE)\nG01 Z-0.127 F500.\nG01 X-100. F2000.\nG01 Y40. F2000.\nG01 X100. F2000.\nG01 Y0. F2000.\nG00 Z50.\nM30\n%' },
              { opNumber: 'OP-60', programNumber: 'N/A', gcode: '(MANUAL DEBURR - NO CNC PROGRAM)\n(DEBURR STATION)\n(1) Remove witness mark from support trim\n(2) Break all edges 0.2mm x 45°\n(3) Clean all surfaces\n(4) Final inspection\n(5) Ready for anodize' },
            ],
            stageDrawings: [
              { opNumber: 'OP-10', description: 'Raw billet faced and rough profiled. Center bore Ø50 roughed to Ø49.5. Pilot holes drilled for side bores. Top profile rough-cut with 0.5mm stock remaining on all surfaces. Part held in vise on parallels.', machinedFeatures: ['Top profile rough', 'Center bore rough Ø49.5', 'Pilot holes Ø8 (2x)'], remainingStock: 'All surfaces have 0.5mm stock. Bottom not machined. Side bores are pilot only.', workholding: '6" Kurt vise, soft jaws, seated on parallels' },
              { opNumber: 'OP-20', description: 'Profile finished to final dimensions. Center bore Ø50 finished to tolerance. Slot 16mm cut through. All radii R30/R33/R35 blended. Part fixtured on Ø50 bore and 2 locating pins.', machinedFeatures: ['Profile finish', 'Center bore Ø50 finish', 'Slot 16mm', 'Radii blend R30/R33/R35'], remainingStock: 'Detail B and E bores not started. Side bores still pilot holes.', workholding: 'Custom fixture plate — Ø50 bore + 2 pin locate' },
              { opNumber: 'OP-30', description: 'Detail B features machined: bore Ø24 reamed, Ø30 bored, 2x45° chamfers cut. Detail E features machined: bore Ø22 reamed, Ø14 counterbored. All detail bores concentric within 0.013mm.', machinedFeatures: ['Detail B — Ø24/Ø30 bore + chamfer', 'Detail E — Ø22 bore + Ø14 counterbore'], remainingStock: 'Side bores Ø10.50 and Ø8 still at pilot diameter. Deburr not complete.', workholding: 'Custom fixture — Ø50 bore + slot locate' },
              { opNumber: 'OP-40', description: 'Side bores Ø10.50 and Ø8 reamed to final tolerance. All bore entries chamfered 0.5x45°. All edges deburred. Part complete — ready for outside process (anodize).', machinedFeatures: ['Side bore Ø10.50 reamed', 'Side bore Ø8 reamed', 'All chamfers 0.5x45°', 'Full deburr'], remainingStock: 'None — part complete. Ready for outside process.', workholding: 'Same fixture as OP-30' },
              { opNumber: 'OP-50', description: 'Support material trimmed at ±.005" tolerance. Witness mark removed. Mounting surface cleaned and deburred. Part ready for anodize.', machinedFeatures: ['Support trim ±.005"', 'Witness mark removed', 'Mounting surface cleaned'], remainingStock: 'None — ready for anodize.', workholding: 'Precision vise on finished surfaces' },
              { opNumber: 'OP-60', description: 'Manual deburr complete. All edges broken 0.2mm x 45°. All surfaces cleaned. Final inspection passed. Part ready for anodize and shipment.', machinedFeatures: ['Manual deburr', 'Edge breaks', 'Surface clean', 'Final inspection'], remainingStock: 'None — part complete and ready for anodize.', workholding: 'Soft vise' },
            ],
          },
        },
        'Procurement Agent': {
          status: 'completed',
          result: {
            materialRequired: 'Aluminum 7075-T6 billet, 210mm x 75mm x 50mm',
            estimatedMaterialCost: 45,
            vendorRecommendation: 'Kaiser Aluminum or Alcoa — certified to AMS 4078',
            certRequired: 'Mill test report per AMS 4078, traceable to heat lot',
            leadTime: '2 days from stock, 5 days if ordering',
            toolingRequired: ['Ø50 finish boring bar (verify in crib)', 'Ø10.50 reamer (order if not in stock)', 'Custom fixture plate for OP-20/30/40'],
            reasoning: 'Standard 7075-T6 billet available from multiple distributors. Recommend keeping 3-5 billets in stock for repeat orders. Custom fixture amortized over production run.',
          },
        },
        'Compliance Agent': {
          status: 'completed',
          result: {
            standard: 'AS9100 Rev D',
            status: 'Compliant',
            requirements: [
              'First Article Inspection per AS9102 Rev C',
              'Material certification per AMS 4078 (7075-T6)',
              'Process control per AS9100 Section 8.5',
              'Calibrated instruments for all measurements',
              'Traceability — heat lot to finished part',
            ],
            documentation: ['FAI Report (AS9102 Form 1, 2, 3)', 'Material Cert', 'Process Traveler', 'CMM Report', 'Certificate of Conformance'],
            reasoning: 'Aerospace bracket requires full AS9100 compliance. All critical dimensions verified by CMM. Material traceability maintained from raw stock through finished part.',
          },
        },
        'Shipping Agent': {
          status: 'completed',
          result: {
            packagingRequirements: 'Individual VCI bag, foam-lined box, "FRAGILE — PRECISION MACHINED PART" label',
            shippingMethod: 'UPS Next Day Air or FedEx Priority',
            estimatedShippingCost: 25,
            documentation: ['Packing slip', 'Certificate of Conformance', 'FAI Report (if first article)', 'Material cert copy'],
            reasoning: 'Anodized aluminum bracket — protect from scratches and moisture. VCI bag prevents oxidation. Foam insert prevents movement during transit.',
          },
        },
        'Outside Processes Agent': {
          status: 'completed',
          result: {
            outsideProcesses: [
              { process: 'Anodize Type III (Hard Anodize)', specification: 'MIL-A-8625 Type III, Class 1', appliesTo: 'All surfaces except bores (mask Ø50, Ø24, Ø30, Ø22, Ø14, Ø10.50, Ø8)', vendorType: 'Nadcap Surface Treatment', estimatedCost: 75, leadTimeDays: 5 },
            ],
            totalOutsideCost: 75,
            totalOutsideLeadDays: 5,
            criticalPath: ['Machine Complete', 'Anodize Type III', 'Final Inspection', 'Ship'],
            reasoning: 'Hard anodize for wear resistance and corrosion protection. All precision bores must be masked to maintain tolerances. Vendor must be on Approved Supplier List and Nadcap certified.',
          },
        },
        'Audit & Reflection Agent': {
          status: 'completed',
          result: {
            auditFindings: 'All agents aligned. Routing is efficient — 4 operations with logical fixture progression. Cost estimate competitive. Compliance documentation complete.',
            recommendations: [
              'Consider 5-axis simultaneous for OP-10/OP-20 to reduce setup time',
              'Ø10.50 reamer may not be standard — verify stock or order with 3-day lead',
              'Custom fixture cost ($800-$1200) should be amortized over minimum 10-piece run',
            ],
            riskAssessment: 'Low risk. Standard aerospace aluminum bracket. Main risk: fixture design for OP-20 must ensure concentricity of all bores.',
          },
        },
      },
    },
  },
  {
    id: 'machinists-jack',
    name: "Machinist's Jack Assembly — Steel AISI 1020",
    description: '6-component assembly: base, swivel, bolt, standard nut, lock nut, screw. Requires both CNC lathe and mill operations. Steel AISI 1020, 7900 kg/m³.',
    imageUrl: JACK_IMAGE,
    material: 'Steel AISI 1020',
    complexity: 'Medium — Multi-Component Assembly',
    operations: 6,
    result: {
      imageUrl: JACK_IMAGE,
      summary: {
        partName: "Machinist's Jack Assembly — 6 Components",
        material: 'Steel AISI 1020',
        estimatedCost: 640,
        leadTimeDays: 8,
        confidence: 96,
        processingTime: 2.8,
        totalOperations: 6,
        complianceStatus: 'ISO 9001:2015 Compliant',
        isAssembly: true,
        bomComponents: [
          { partNumber: 'JA-001', description: 'Base', material: 'Steel AISI 1020', quantity: 1, unitPrice: 12.50, operation: 'OP-10/OP-20 (Mill + Tap)', leadTime: '3 days' },
          { partNumber: 'JA-002', description: 'Swivel', material: 'Steel AISI 1020', quantity: 1, unitPrice: 8.75, operation: 'OP-30/OP-40 (Lathe + Knurl)', leadTime: '3 days' },
          { partNumber: 'JA-003', description: 'Bolt M20x2.5', material: 'Steel AISI 1020', quantity: 1, unitPrice: 3.50, operation: 'OP-50 (Lathe)', leadTime: '2 days' },
          { partNumber: 'JA-004', description: 'Standard Nut M16x2.0', material: 'Steel', quantity: 1, unitPrice: 1.25, operation: 'Purchased', leadTime: '1 day' },
          { partNumber: 'JA-005', description: 'Lock Nut', material: 'Steel', quantity: 1, unitPrice: 0.95, operation: 'Purchased', leadTime: '1 day' },
          { partNumber: 'JA-006', description: 'Screw M20x2.5', material: 'Steel AISI 1020', quantity: 1, unitPrice: 1.05, operation: 'OP-60 (Assembly)', leadTime: '1 day' },
        ],
      },
      drawingAnalysis: "Machinist's jack assembly drawing — CAD/CAM tutorial by Mahtabalam. 6-component BOM: (1) Base, (2) Swivel, (3) Bolt M20x2.5, (4) Standard Nut M16x2.0, (5) Lock Nut, (6) Screw. Material: Steel AISI 1020, density 7900 kg/m³. Base component: 68mm height, 25mm width, M16x2.0 tapped hole, Section A-A shows 32mm x 34mm internal pocket with Ø16 through-hole and R22 radius. Swivel: 54mm length, Ø16 bore, R5 radius, knurled surface, Section D-D shows Ø45 with Ø10.5 bore. Bolt: M20x2.5 thread, 75mm length, Ø16 head with 2M6x Ø16 cross-holes, R20 radius. Notes: All dimensions in millimeters, chamfer 1x45° unless stated, general tolerance ±0.1. Scale 1:1.5, A3 sheet.",
      agentResults: {
        'Engineering Agent': {
          status: 'completed',
          result: {
            bubbleAnnotations: [
              { bubble: 1, feature: 'Base — overall 68mm x 25mm, M16x2.0 tapped hole', tolerance: '±0.1mm general', criticality: 'high' },
              { bubble: 2, feature: 'Swivel — 54mm length, Ø16 bore, knurled surface', tolerance: '±0.1mm', criticality: 'medium' },
              { bubble: 3, feature: 'Bolt M20x2.5 — 75mm length, Ø16 head', tolerance: 'Thread class 6g', criticality: 'high' },
              { bubble: 4, feature: 'Standard Nut M16x2.0', tolerance: 'Thread class 6H', criticality: 'medium' },
              { bubble: 5, feature: 'Lock Nut', tolerance: 'Thread class 6H', criticality: 'medium' },
              { bubble: 6, feature: 'Screw — knurled head, M20x2.5 thread', tolerance: 'Thread class 6g', criticality: 'medium' },
            ],
            dfmNotes: 'Multi-component assembly requiring both CNC lathe and mill. Base requires milling + tapping. Swivel and bolt are primarily lathe operations with knurling. Standard nut and lock nut can be purchased or machined. Recommend machining base and swivel in-house, purchasing standard hardware (nut, lock nut, screw) unless customer requires all custom.',
          },
        },
        'Sales Agent': {
          status: 'completed',
          result: {
            quoteBreakdown: {
              materialCost: 28,
              laborCost: 195,
              overheadCost: 62,
              outsideProcessCost: 355,
              totalCost: 640,
              margin: '25%',
            },
            competitivePosition: 'Standard toolroom fixture — competitive market. Differentiate on quality and lead time. Most shops quote $350-$450 for complete assembly.',
            reasoning: 'Material: AISI 1020 bar stock and billet ~$28 total for all components. Labor: 6 operations across lathe and mill, ~2.5 hours total. Outside: Heat treatment ($150) + Anodize ($85) + NDT ($75) + Passivation ($45) = $355 total.',
          },
        },
        'Quality Agent': {
          status: 'completed',
          result: {
            inspectionPlan: [
              { bubble: 1, feature: 'Base M16x2.0 tapped hole', method: 'Thread gauge (Go/No-Go)', frequency: '100%', acceptance: 'M16x2.0 6H' },
              { bubble: 2, feature: 'Swivel Ø16 bore', method: 'Pin gauge', frequency: '100%', acceptance: 'Ø16.000 +0.018/-0.000' },
              { bubble: 3, feature: 'Bolt M20x2.5 thread', method: 'Thread ring gauge', frequency: '100%', acceptance: 'M20x2.5 6g' },
              { bubble: 3, feature: 'Bolt overall length 75mm', method: 'Caliper', frequency: '100%', acceptance: '75.0 ±0.1mm' },
            ],
            faiRequired: false,
            faiForm: 'Standard inspection report — ISO 9001',
            reasoning: 'Toolroom fixture — standard inspection. Thread gauges for all threaded features. Dimensional check on critical assembly interfaces. Functional test: assemble all 6 components, verify smooth operation and load-bearing capability.',
          },
        },
        'Planning Agent': {
          status: 'completed',
          result: {
            productionSchedule: {
              totalLeadTime: '8 business days',
              materialLeadTime: '1 day (stock)',
              machiningTime: '2.5 hours',
              outsideProcessTime: '3 days',
              inspectionTime: '0.5 days',
              bufferDays: 1,
            },
            reasoning: 'AISI 1020 available from stock. 6 operations: 3 lathe, 3 mill. Base and swivel are critical path. Bolt is straightforward lathe work. Black oxide finish outsourced — 3 day turnaround. Assembly and functional test on return.',
          },
        },
        'CNC Programming Agent': {
          status: 'completed',
          result: {
            routing: [
              {
                opNumber: 'OP-10',
                machine: 'HAAS ST-20 (CNC Lathe)',
                description: 'Turn bolt — M20x2.5 thread, Ø16 head, 75mm OAL, R20 radius under head',
                tools: ['OD rough turning tool', 'OD finish turning tool', 'M20x2.5 threading insert', 'Parting tool'],
                estimatedTime: '25 min',
                workholding: '3-jaw chuck on Ø25 bar stock, face and turn',
                instructions: 'Face end. Turn OD to Ø20 for 56mm length. Turn Ø16 head section. Cut R20 radius under head. Thread M20x2.5 for 50mm length. Chamfer thread entry 1x45°. Part off at 75mm.',
                bubbleRefs: [3],
              },
              {
                opNumber: 'OP-20',
                machine: 'HAAS ST-20 (CNC Lathe)',
                description: 'Turn swivel — Ø45 body, Ø16 bore, knurled surface, 54mm length',
                tools: ['OD rough turning tool', 'OD finish turning tool', 'Ø16 drill', 'Boring bar', 'Knurling tool'],
                estimatedTime: '30 min',
                workholding: '3-jaw chuck on Ø50 bar stock',
                instructions: 'Face end. Turn OD to Ø45. Drill Ø16 through bore. Bore to tolerance. Knurl OD surface (diamond pattern, medium pitch). Profile R5 radius on nose. Part off at 54mm.',
                bubbleRefs: [2],
              },
              {
                opNumber: 'OP-30',
                machine: 'HAAS ST-20 (CNC Lathe)',
                description: 'Turn screw — knurled head, M20x2.5 thread body',
                tools: ['OD turning tool', 'M20x2.5 threading insert', 'Knurling tool', 'Parting tool'],
                estimatedTime: '20 min',
                workholding: '3-jaw chuck on Ø30 bar stock',
                instructions: 'Face end. Turn Ø20 thread section. Knurl head OD. Thread M20x2.5. Chamfer 1x45°. Part off.',
                bubbleRefs: [6],
              },
              {
                opNumber: 'OP-40',
                machine: 'HAAS VF-2 (CNC Mill)',
                description: 'Mill base — profile 68mm x 25mm, internal pocket, M16x2.0 tapped hole, Ø16 through-hole',
                tools: ['Ø12 flat endmill', 'Ø8 flat endmill', 'Ø14 drill', 'M16x2.0 tap', 'Ø16 reamer'],
                estimatedTime: '35 min',
                workholding: '6" Kurt vise, billet clamped on raw faces',
                instructions: 'Face top. Profile exterior 68x25mm. Mill internal pocket 32x34mm per Section A-A. Drill and tap M16x2.0 through. Drill and ream Ø16 through-hole. Chamfer all edges 1x45°. Flip and face bottom.',
                bubbleRefs: [1],
              },
              {
                opNumber: 'OP-50',
                machine: 'HAAS VF-2 (CNC Mill)',
                description: 'Mill bolt cross-holes — 2x M6 cross-holes in Ø16 head section',
                tools: ['Ø5 drill', 'M6x1.0 tap', 'Spot drill'],
                estimatedTime: '10 min',
                workholding: 'V-block fixture, bolt held horizontal',
                instructions: 'Spot drill 2 locations on Ø16 head, 90° apart. Drill Ø5 through. Tap M6x1.0 both holes. Deburr.',
                bubbleRefs: [3],
              },
              {
                opNumber: 'OP-60',
                machine: 'Bench',
                description: 'Assembly — assemble all 6 components, functional test, final inspection',
                tools: ['Wrench set', 'Thread locker (optional)', 'Torque wrench'],
                estimatedTime: '15 min',
                workholding: 'Bench vise',
                instructions: 'Assemble: screw into base (M16x2.0). Thread bolt (M20x2.5) through swivel. Install lock nut and standard nut. Verify smooth operation — jack should raise and lower smoothly. Test load-bearing: apply 500 lb test load. Final clean and package.',
                bubbleRefs: [1, 2, 3, 4, 5, 6],
              },
            ],
            programs: [
              { opNumber: 'OP-10', programNumber: 'O1001', gcode: '%\nO1001 (MACHINISTS JACK - BOLT M20x2.5)\n(MACHINE: HAAS ST-20 CNC LATHE)\n(MATERIAL: AISI 1020 STEEL)\nG00 G18 G40 G80 G99\nG28 U0. W0.\nT0101 (OD ROUGH TURNING)\nG00 G97 S1200 M03\nG00 X26. Z2. M08\nG71 U1.5 R0.5\nG71 P10 Q20 U0.3 W0.1 F0.25\nN10 G00 X16.\nG01 Z0. F0.15\nG01 X16. Z-15.\nG03 X20. Z-35. R20.\nG01 Z-75.\nN20 G01 X26.\nG00 X100. Z50.\nT0202 (OD FINISH TURNING)\nG00 G96 S200 M03\nG00 X26. Z2.\nG70 P10 Q20\nG00 X100. Z50.\nT0303 (M20x2.5 THREADING)\nG00 G97 S800 M03\nG00 X22. Z5.\nG76 P011060 Q100 R0.05\nG76 X17.294 Z-55. P1353 Q300 F2.5\nG00 X100. Z50.\nT0404 (PARTING TOOL)\nG00 G97 S600 M03\nG00 X26. Z-75.\nG01 X0. F0.08\nM30\n%' },
              { opNumber: 'OP-20', programNumber: 'O1002', gcode: '%\nO1002 (MACHINISTS JACK - SWIVEL)\n(MACHINE: HAAS ST-20 CNC LATHE)\n(MATERIAL: AISI 1020 STEEL)\nG00 G18 G40 G80 G99\nG28 U0. W0.\nT0101 (OD ROUGH TURNING)\nG00 G97 S1000 M03\nG00 X52. Z2. M08\nG71 U2.0 R0.5\nG71 P10 Q20 U0.3 W0.1 F0.3\nN10 G00 X40.\nG01 Z0. F0.15\nG02 X45. Z-5. R5.\nG01 Z-54.\nN20 G01 X52.\nG00 X100. Z50.\nT0202 (OD FINISH)\nG00 G96 S180 M03\nG70 P10 Q20\nG00 X100. Z50.\nT0505 (DIA 16 DRILL)\nG00 G97 S800 M03\nG00 X0. Z5.\nG83 Z-56. R2. Q8. F0.12\nG80\nG00 X100. Z50.\nT0606 (BORING BAR)\nG00 G97 S1200 M03\nG00 X14. Z2.\nG01 Z-54. F0.1\nG01 X16.018 F0.05\nG01 Z2. F0.15\nG00 X100. Z50.\nT0707 (KNURLING TOOL)\nG00 G97 S60 M03\nG00 X45. Z-8.\nG01 X43.5 F0.5\nG01 Z-48. F1.0\nG00 X50.\nG00 X100. Z50.\nM30\n%' },
              { opNumber: 'OP-40', programNumber: 'O1004', gcode: '%\nO1004 (MACHINISTS JACK - BASE)\n(MACHINE: HAAS VF-2 CNC MILL)\n(MATERIAL: AISI 1020 STEEL)\nG00 G17 G40 G49 G80 G90\nG28 G91 Z0.\nT01 M06 (DIA 12 FLAT ENDMILL)\nG00 G90 G54 X0. Y0.\nG43 H01 Z50. M08\nS3000 M03\n(FACE TOP)\nG01 Z0. F800.\nG01 X-40. F1200.\nG01 Y20.\nG01 X40.\nG01 Y-20.\nG01 X-40.\nG00 Z2.\n(PROFILE EXTERIOR 68x25)\nG01 Z-25. F600.\nG41 D01 X-34. Y-12.5 F800.\nG01 X34.\nG01 Y12.5\nG01 X-34.\nG01 Y-12.5\nG40 G01 X0. Y0.\nG00 Z2.\nT02 M06 (DIA 8 ENDMILL)\nG43 H02 Z50.\nS4000 M03\n(INTERNAL POCKET 32x34 PER SECTION A-A)\nG01 Z-20. F400.\nG01 X-16. Y-17. F600.\nG01 X16.\nG01 Y17.\nG01 X-16.\nG01 Y-17.\nG00 Z2.\nT03 M06 (DIA 14 DRILL)\nG43 H03 Z50.\nS1500 M03\nG00 X0. Y0.\nG83 Z-30. R2. Q5. F200.\nG80\nG00 Z50.\nT04 M06 (M16x2.0 TAP)\nG43 H04 Z50.\nS400 M03\nG00 X0. Y0. Z5.\nG84 Z-25. R2. F800.\nG80\nG00 Z50.\nM30\n%' },
            ],
            stageDrawings: [
              { opNumber: 'OP-10', description: 'Bolt turned from Ø25 bar stock. OD profiled to Ø20 body with Ø16 head section. R20 radius under head formed. M20x2.5 thread cut for 50mm. Parted off at 75mm OAL.', machinedFeatures: ['OD profile Ø20/Ø16', 'R20 radius', 'M20x2.5 thread', 'Part-off'], remainingStock: 'Cross-holes not drilled (OP-50). Deburr pending.', workholding: '3-jaw chuck on Ø25 bar stock' },
              { opNumber: 'OP-20', description: 'Swivel turned from Ø50 bar stock. OD profiled to Ø45 with R5 nose radius. Ø16 bore drilled and bored to tolerance. Diamond knurl applied to OD. Parted off at 54mm.', machinedFeatures: ['OD profile Ø45', 'R5 nose radius', 'Ø16 bore', 'Diamond knurl'], remainingStock: 'Complete — ready for finish.', workholding: '3-jaw chuck on Ø50 bar stock' },
              { opNumber: 'OP-30', description: 'Screw turned from Ø30 bar stock. Head knurled. M20x2.5 thread cut on body. Chamfered 1x45°. Parted off.', machinedFeatures: ['Knurled head', 'M20x2.5 thread', 'Chamfer 1x45°'], remainingStock: 'Complete — ready for finish.', workholding: '3-jaw chuck on Ø30 bar stock' },
              { opNumber: 'OP-40', description: 'Base milled from billet. Exterior profiled to 68x25mm. Internal pocket 32x34mm machined per Section A-A. M16x2.0 hole drilled and tapped through. All edges chamfered 1x45°.', machinedFeatures: ['Exterior profile 68x25', 'Internal pocket 32x34', 'M16x2.0 tapped hole', 'Edge chamfers'], remainingStock: 'Complete — ready for finish.', workholding: '6" Kurt vise, billet clamped' },
              { opNumber: 'OP-50', description: 'Bolt cross-holes machined. 2x M6 holes drilled and tapped in Ø16 head section, 90° apart. Deburred.', machinedFeatures: ['2x M6x1.0 cross-holes', 'Deburr'], remainingStock: 'Complete — ready for finish.', workholding: 'V-block fixture, bolt horizontal' },
              { opNumber: 'OP-60', description: 'All 6 components assembled. Screw threaded into base. Bolt threaded through swivel. Lock nut and standard nut installed. Functional test: smooth operation verified. 500 lb load test passed.', machinedFeatures: ['Assembly complete', 'Functional test passed', 'Load test 500 lb'], remainingStock: 'None — assembly complete. Ready for packaging.', workholding: 'Bench vise' },
            ],
          },
        },
        'Procurement Agent': {
          status: 'completed',
          result: {
            materialRequired: 'AISI 1020 steel: Ø25 bar (bolt), Ø50 bar (swivel), Ø30 bar (screw), billet 75x30x30 (base), M16 nut (2x purchase)',
            estimatedMaterialCost: 28,
            vendorRecommendation: 'Metal Supermarkets or Ryerson — AISI 1020 cold-rolled',
            certRequired: 'Material cert per ASTM A108',
            leadTime: '1 day from stock',
            toolingRequired: ['M20x2.5 threading insert (verify)', 'Knurling tool — diamond pattern', 'M16x2.0 tap', 'M6x1.0 tap'],
            reasoning: 'Common steel — readily available. Standard hardware (nuts) can be purchased from McMaster-Carr or Fastenal. In-house machining for base, swivel, bolt, and screw.',
          },
        },
        'Compliance Agent': {
          status: 'completed',
          result: {
            standard: 'ISO 9001:2015',
            status: 'Compliant',
            requirements: [
              'Dimensional inspection per drawing',
              'Thread gauge verification (Go/No-Go)',
              'Material certification per ASTM A108',
              'Functional assembly test',
              'Load test documentation',
            ],
            documentation: ['Inspection Report', 'Material Cert', 'Assembly Test Record', 'Certificate of Conformance'],
            reasoning: 'Toolroom fixture — ISO 9001 standard applies. No aerospace or defense requirements. Standard inspection and documentation sufficient.',
          },
        },
        'Shipping Agent': {
          status: 'completed',
          result: {
            packagingRequirements: 'Assembled unit in foam-lined box with VCI paper. Include assembly instructions and load rating card.',
            shippingMethod: 'UPS Ground or FedEx Ground',
            estimatedShippingCost: 12,
            documentation: ['Packing slip', 'Certificate of Conformance', 'Assembly instructions'],
            reasoning: 'Steel assembly — durable but protect finish. VCI paper prevents rust during transit. Ground shipping adequate for non-critical timeline.',
          },
        },
        'Outside Processes Agent': {
          status: 'completed',
          result: {
            outsideProcesses: [
              { process: 'Black Oxide', specification: 'MIL-DTL-13924, Class 1', appliesTo: 'All machined components (base, swivel, bolt, screw)', vendorType: 'Chemical Processing', estimatedCost: 35, leadTimeDays: 3 },
            ],
            totalOutsideCost: 35,
            totalOutsideLeadDays: 3,
            criticalPath: ['Machine All Components', 'Black Oxide', 'Assembly', 'Test', 'Ship'],
            reasoning: 'Black oxide for corrosion resistance and appearance. All components processed together in one batch. Mask threads if specified by customer.',
          },
        },
        'Audit & Reflection Agent': {
          status: 'completed',
          result: {
            auditFindings: 'Efficient routing — lathe operations grouped, mill operations grouped. Assembly operation properly sequenced after all machining and finishing. Cost estimate competitive.',
            recommendations: [
              'Consider purchasing standard M16 nuts instead of machining — saves 15 min and $8',
              'Knurling tool condition critical — worn tool produces poor pattern. Verify before production.',
              'V-block fixture for cross-holes (OP-50) must be verified for concentricity',
            ],
            riskAssessment: 'Low risk. Standard toolroom work. Main risk: thread fit between components — verify with assembly test before shipping.',
          },
        },
      },
    },
  },
];
