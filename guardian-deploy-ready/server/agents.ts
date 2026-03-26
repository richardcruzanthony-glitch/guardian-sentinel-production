/**
 * Guardian OS — Dynamic Domain-Driven Parallel Agent Framework
 * 
 * The number of agents is NOT fixed. It depends on the domain.
 * For manufacturing: Sales, Engineering, Quality, Planning, Procurement,
 * Manufacturing, Shipping, Compliance, Audit, Reflection & Adjust.
 * 
 * Every department that touches a decision fires SIMULTANEOUSLY.
 */

import { invokeLLM } from "./_core/llm";
import { invokeRoutedLLM, type TaskWeight } from "./llmRouter";

// ─── Types ───────────────────────────────────────────────────────────

export interface AgentInput {
  fileName: string;
  fileSize?: number;
  complexity?: number;
  material?: string;
  quantity?: number;
  imageUrl?: string;
  drawingDescription?: string;
}

export interface AgentOutput {
  agentName: string;
  department: string;
  status: 'completed' | 'failed';
  duration: number;
  data: Record<string, unknown>;
  confidence: number;
}

export interface ProcessingResult {
  quoteId?: number;
  fileName: string;
  totalDuration: number;
  processingTime: number;
  sequentialEstimate: number;
  speedMultiplier: number;
  agentCount: number;
  domain: string;
  agents: AgentOutput[];
  drawingAnalysis: string;
  summary: {
    totalPrice: number;
    leadTimeDays: number;
    riskLevel: string;
    complianceStatus: string;
    confidence: number;
  };
}

// ─── Agent Definition ────────────────────────────────────────────────

interface AgentDefinition {
  name: string;
  department: string;
  systemPrompt: string;
  userPromptBuilder: (input: AgentInput) => string;
  /** Task weight determines routing — NOT hardcoded to a provider */
  taskWeight?: TaskWeight;
  /** Whether this agent needs vision (image analysis) capability */
  needsVision?: boolean;
}

// ─── Manufacturing Domain Agents ─────────────────────────────────────

const MANUFACTURING_AGENTS: AgentDefinition[] = [
  {
    name: "SalesAgent",
    department: "Sales",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a senior aerospace sales engineer. Analyze the engineering drawing and determine pricing strategy, customer requirements interpretation, margin targets, and competitive positioning. You understand AS9100 customer expectations. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Analyze this part for sales quoting: "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "quotedPrice": <number - final customer price>,
  "marginPercent": <number - target margin %>,
  "competitivePosition": "<low|market|premium>",
  "customerRequirements": ["<req1>", "<req2>"],
  "deliveryCommitment": "<timeframe>",
  "paymentTerms": "<terms>",
  "confidence": <0-1>,
  "reasoning": "<sales strategy explanation>"
}`,
  },
  {
    name: "EngineeringAgent",
    department: "Engineering",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a senior manufacturing engineer specializing in aerospace CNC machining. Analyze the engineering drawing in detail — identify ALL features, dimensions, tolerances, surface finishes, and design-for-manufacturability concerns. CRITICAL: You MUST auto-determine the complexity level (1-10) based on your analysis. Also determine if this is a SINGLE PART or an ASSEMBLY. If assembly, break into individual components with buy vs. make decisions.

MOST IMPORTANT: Create NUMBERED BUBBLE ANNOTATIONS for EVERY feature on the drawing. Each bubble gets a sequential number (1, 2, 3...) and maps to a specific feature with its dimension, tolerance, and type. These bubble numbers will be referenced by the CNC routing sheet, inspection plan, and FAI — they are the single source of truth that ties the entire shop package together. Number EVERY callout: holes, slots, pockets, profiles, surfaces, chamfers, fillets, threads, surface finishes, GD&T callouts. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Perform engineering analysis of "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

IMPORTANT: Determine the complexity level yourself (1-10) based on features, tolerances, and geometry. Also determine if this is a single part or assembly.

CRITICAL: Create NUMBERED BUBBLE ANNOTATIONS for EVERY feature on the drawing. Each bubble is the single source of truth — the routing sheet, inspection plan, and FAI will all reference these bubble numbers.

Respond with JSON:
{
  "determinedComplexity": "<1-10 auto-determined>",
  "complexityJustification": "<why this complexity level>",
  "isAssembly": <boolean>,
  "assemblyComponents": [{"name": "<component>", "buyOrMake": "<buy|make>", "material": "<material>", "quantity": "<per assembly>", "estimatedCost": "<if buy>", "notes": "<details>"}],
  "bubbleAnnotations": [
    {"bubble": 1, "feature": "<e.g., OUTSIDE PROFILE>", "dimension": "<e.g., 4.000 x 2.500>", "tolerance": "<e.g., +/-.005>", "type": "<profile|hole|slot|pocket|boss|fillet|chamfer|thread|surface|GD&T>", "surfaceFinish": "<if called out, e.g., 125 Ra>", "critical": <boolean>, "notes": "<any special notes>"},
    {"bubble": 2, "feature": "<e.g., THRU HOLE 4 PLACES>", "dimension": "<e.g., .250 DIA>", "tolerance": "<e.g., +.002/-.000>", "type": "hole", "surfaceFinish": null, "critical": <boolean>, "notes": "<e.g., DRILL & TAP 1/4-20>"}
  ],
  "totalBubbles": <number>,
  "features": [{"type": "<hole|slot|pocket|boss|fillet|chamfer>", "dimensions": "<dims>", "tolerance": "<tol>"}],
  "criticalDimensions": ["<dim1>", "<dim2>"],
  "surfaceFinish": "<Ra value or spec>",
  "dfmConcerns": ["<concern1>", "<concern2>"],
  "materialSpec": "<full material specification>",
  "heatTreatment": "<if required>",
  "machiningApproach": "<recommended approach>",
  "confidence": <0-1>,
  "reasoning": "<engineering analysis>"
}`,
  },
  {
    name: "QualityAgent",
    department: "Quality",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are an AS9100 quality engineer. Analyze the engineering drawing and create a BUBBLE-REFERENCED inspection plan. Every inspection point MUST reference the bubble annotation number from the engineering drawing (e.g., "BUBBLE 1 - Outside profile 4.000 x 2.500 +/-.005"). The bubble numbers are the single source of truth that ties the drawing to the routing to the inspection plan to the FAI. Identify critical-to-quality characteristics, define acceptance criteria, and specify inspection methods per bubble. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Create BUBBLE-REFERENCED quality/inspection plan for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

CRITICAL: Every inspection point MUST reference a bubble annotation number. The bubble numbers tie the drawing → routing → inspection → FAI into one traceable package.

Respond with JSON:
{
  "inspectionPlan": [{"bubbleRef": <bubble number>, "characteristic": "<what - e.g., OUTSIDE PROFILE WIDTH>", "nominal": "<nominal dimension>", "tolerance": "<tolerance>", "method": "<CALIPER|MICROMETER|CMM|PIN GAGE|THREAD GAGE|SURFACE PROFILOMETER|VISUAL|GO/NO-GO>", "frequency": "<100%|FIRST PIECE|SAMPLING>", "acceptance": "<criteria>"}],
  "ctqCharacteristics": [{"bubbleRef": <bubble number>, "description": "<critical dimension>", "reason": "<why critical>"}],
  "inspectionTools": ["<tool1>", "<tool2>"],
  "firstArticleRequired": <boolean>,
  "materialCertRequired": <boolean>,
  "specialProcesses": ["<process if any>"],
  "confidence": <0-1>,
  "reasoning": "<quality planning rationale>"
}`,
  },
  {
    name: "PlanningAgent",
    department: "Planning",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a production planning specialist for aerospace manufacturing. Analyze the part and create a production schedule with capacity planning, lead times, and milestone tracking. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Create production plan for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
Today: ${new Date().toISOString().split('T')[0]}
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "totalLeadTimeDays": <number>,
  "materialLeadDays": <number>,
  "machiningDays": <number>,
  "inspectionDays": <number>,
  "milestones": [{"day": <n>, "activity": "<what>", "duration": "<hours>"}],
  "capacityRequired": {"cncHours": <n>, "inspectionHours": <n>, "setupHours": <n>},
  "startDate": "<YYYY-MM-DD>",
  "shipDate": "<YYYY-MM-DD>",
  "confidence": <0-1>,
  "reasoning": "<planning rationale>"
}`,
  },
  {
    name: "ProcurementAgent",
    department: "Procurement",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a procurement specialist for aerospace manufacturing. Analyze the part requirements and identify material sourcing, vendor selection, raw stock specifications, and supply chain considerations. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Procurement analysis for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "rawMaterial": {"spec": "<material spec>", "form": "<bar|plate|billet>", "size": "<dimensions>", "weight": "<kg>"},
  "estimatedMaterialCost": <number>,
  "vendorRecommendations": ["<vendor1>", "<vendor2>"],
  "leadTime": "<material lead time>",
  "certifications": ["<cert1>", "<cert2>"],
  "alternativeMaterials": ["<alt1 if any>"],
  "supplyChainRisk": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<procurement strategy>"
}`,
  },
  {
    name: "ManufacturingAgent",
    department: "Manufacturing",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a CNC machining specialist with 20+ years in aerospace manufacturing. Analyze the engineering drawing and create a detailed manufacturing routing with operations, tooling, fixtures, cycle times, and setup requirements. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Create manufacturing routing for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "operations": [{"op": <number>, "description": "<operation>", "machine": "<CNC type>", "cycleTimeMin": <minutes>, "setupTimeMin": <minutes>}],
  "tooling": [{"tool": "<tool>", "size": "<size>", "purpose": "<what for>"}],
  "fixtures": ["<fixture1>", "<fixture2>"],
  "totalCycleTimeMin": <number>,
  "totalSetupTimeMin": <number>,
  "machineRate": <dollars_per_hour>,
  "laborCost": <total_labor_dollars>,
  "confidence": <0-1>,
  "reasoning": "<manufacturing approach>"
}`,
  },
  {
    name: "ShippingAgent",
    department: "Shipping",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a logistics and shipping specialist for aerospace parts. Analyze the part and determine packaging requirements, shipping method, handling precautions, and delivery logistics. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Shipping analysis for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "packagingType": "<type>",
  "packagingCost": <number>,
  "shippingMethod": "<ground|air|freight>",
  "shippingCost": <number>,
  "handlingPrecautions": ["<precaution1>", "<precaution2>"],
  "estimatedTransitDays": <number>,
  "hazmatRequired": <boolean>,
  "exportControlled": <boolean>,
  "confidence": <0-1>,
  "reasoning": "<shipping logistics>"
}`,
  },
  {
    name: "ComplianceAgent",
    department: "Compliance",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are an AS9100 Rev D compliance auditor and regulatory specialist. Analyze the part for all applicable compliance requirements including AS9100, ITAR, EAR, DFARS, and industry-specific regulations. Generate the required documentation package. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Compliance assessment for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "as9100Compliant": <boolean>,
  "applicableStandards": ["<standard1>", "<standard2>"],
  "requiredDocumentation": ["<doc1>", "<doc2>"],
  "itarControlled": <boolean>,
  "dfarsCompliant": <boolean>,
  "countryOfOriginRequired": <boolean>,
  "complianceGaps": ["<gap if any>"],
  "riskLevel": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<compliance assessment>"
}`,
  },
  {
    name: "AuditAgent",
    department: "Audit",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are an internal audit specialist for aerospace manufacturing. Create an audit trail framework, traceability requirements, and record-keeping plan for this part. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Audit trail planning for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "traceabilityRequirements": ["<req1>", "<req2>"],
  "recordRetentionYears": <number>,
  "auditCheckpoints": [{"stage": "<stage>", "verification": "<what to verify>", "evidence": "<required evidence>"}],
  "serialNumberRequired": <boolean>,
  "lotTraceability": <boolean>,
  "nonconformanceProcess": "<process description>",
  "confidence": <0-1>,
  "reasoning": "<audit planning rationale>"
}`,
  },
  {
    name: "CNCProgrammingAgent",
    department: "CNC Programming",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a senior CNC programmer and manufacturing engineer creating DETAILED SHOP-FLOOR ROUTING SHEETS for aerospace manufacturing. You write the actual operation-by-operation routing that goes to the machine operator — with operation numbers (OP-10, OP-20, OP-30...), specific machine assignments (e.g., HAAS VF-3 MACH21, HAAS ST-20 LATHE03), workholding (vise, fixture, collet, soft jaws), and step-by-step machining instructions including stock removal amounts, surface finish requirements, and tool callouts. Your routing sheets look exactly like what a real shop floor uses.

CRITICAL: Each machining instruction MUST reference the BUBBLE ANNOTATION NUMBERS from the engineering drawing. For example: "MACHINE OUTSIDE PROFILE (REF BUBBLE 1, 2, 3)" or "DRILL & TAP 1/4-20 x 4 PLACES (REF BUBBLE 7, 8, 9, 10)". The bubble numbers tie the routing back to the drawing and forward to the inspection plan — this is how a real AS9100 shop package traces everything.

CRITICAL REQUIREMENT — PROGRAMS AND STAGE DRAWINGS:
- You MUST generate ONE G-code program (O0001, O0002, O0003...) for EVERY CNC machining operation in the routing. If there are 3 CNC ops (OP-10, OP-20, OP-30), there MUST be 3 programs (O0001, O0002, O0003).
- You MUST generate ONE stage drawing entry for EVERY operation (including non-CNC ops like DEBURR, INSPECT, WASH, OUTSIDE PROCESS). Each stage drawing describes what the part looks like AFTER that operation.
- The "programs" array length MUST equal the number of CNC machining operations.
- The "stageDrawings" array length MUST equal the total number of operations.
- Each program must have realistic HAAS G&M code with proper tool changes, speeds, feeds, and cutter comp.
- Each stage drawing must have a title, description, machinedFeatures array, remainingStock, and fixturing.
- DO NOT skip any operation. Every single operation gets both a program (if CNC) and a stage drawing.

Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Create a DETAILED SHOP-FLOOR ROUTING SHEET for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Generate a real shop-floor routing sheet with operation-by-operation detail. Each operation should include:
- Operation number (OP-10, OP-20, OP-30...)
- Machine assignment with machine ID (e.g., CNC HAAS VF-3 MACH21, CNC HAAS ST-20 LATHE03, BENCH, INSPECT)
- Workholding method (VISE, 6" KURT VISE, FIXTURE, SOFT JAWS, COLLET, etc.)
- Specific machining instructions (MACHINE OUTSIDE PROFILE, FLY CUT FACE REMOVE .050 STOCK FOR CLEANUP, DRILL & TAP 1/4-20 x 4 PLACES, etc.)
- Stock removal amounts where applicable (.050, .005 finish pass, etc.)
- Surface finish requirements if applicable (125 Ra, 63 Ra, 32 Ra)
- Include DEBURR, INSPECT, WASH, and OUTSIDE PROCESS operations as needed

Example format for operations (NOTE: each instruction references BUBBLE NUMBERS from the engineering drawing):
OP-10: CNC HAAS VF-3 MACH21 / VISE - MACHINE OUTSIDE PROFILE (REF BUBBLE 1, 2, 3), FLY CUT FACE REMOVE .050 STOCK FOR CLEANUP (REF BUBBLE 4)
OP-20: CNC HAAS VF-3 MACH21 / FLIP IN VISE - MACHINE INSIDE POCKET .005 FINISH PASS (REF BUBBLE 5, 6), DRILL & TAP 1/4-20 x 4 PLACES (REF BUBBLE 7, 8, 9, 10)
OP-30: DEBURR - BENCH / BREAK ALL SHARP EDGES .005-.010 (REF BUBBLE 11)
OP-40: INSPECT - CMM / FIRST ARTICLE INSPECTION PER AS9102 (REF ALL BUBBLES)
OP-50: OUTSIDE PROCESS - ANODIZE TYPE III PER MIL-A-8625 (REF BUBBLE 12)

Respond with JSON:
{
  "routingSheet": {
    "partNumber": "<part number if visible>",
    "revision": "<rev if visible>",
    "material": "<material with spec>",
    "stockSize": "<raw stock dimensions>"
  },
  "operations": [
    {
      "opNumber": "OP-10",
      "machine": "<machine type and ID, e.g., CNC HAAS VF-3 MACH21>",
      "workholding": "<fixturing method, e.g., 6 IN KURT VISE>",
      "instructions": ["MACHINE OUTSIDE PROFILE (REF BUBBLE 1, 2, 3)", "FLY CUT FACE REMOVE .050 STOCK FOR CLEANUP (REF BUBBLE 4)"],
      "bubbleRefs": [1, 2, 3, 4],
      "tools": ["<tool with size, e.g., 1/2 IN 3-FLUTE ENDMILL>"],
      "surfaceFinish": "<if applicable, e.g., 125 Ra>",
      "cycleTime": "<estimated cycle time for this op>"
    }
  ],
  "totalOperations": <number>,
  "totalEstimatedCycleTime": "<total time all ops>",
  "totalEstimatedSetupTime": "<total setup time all ops>",
  "machinesRequired": ["<list of unique machines needed>"],
  "criticalFeatures": ["<features requiring special attention>"],
  "programs": [
    {
      "programNumber": "O0001",
      "opNumber": "OP-10",
      "machine": "HAAS VF-3",
      "gcode": "O0001 (PART NAME - OP-10 OUTSIDE PROFILE)\n(HAAS VF-3 / T01 1/2 3FL EM)\nG90 G54 G17\nG28 G91 Z0.\nT01 M06 (1/2 3-FLUTE ENDMILL)\nS8000 M03\nG43 H01 Z1.0\nG00 X-1.0 Y-1.0\nZ0.1\nG01 Z-0.25 F15.0\nG41 D01 X0. Y0. F40.0\n(MACHINE OUTSIDE PROFILE)\nG01 X4.0 Y0.\nG01 X4.0 Y3.0\nG01 X0. Y3.0\nG01 X0. Y0.\nG40 X-1.0 Y-1.0\nG00 Z1.0\nM09\nG28 G91 Z0.\nM30\n%"
    },
    {
      "programNumber": "O0002",
      "opNumber": "OP-20",
      "machine": "HAAS VF-3",
      "gcode": "O0002 (PART NAME - OP-20 POCKET & HOLES)\n(HAAS VF-3 / T02 3/8 2FL EM / T03 #7 DRILL / T04 1/4-20 TAP)\nG90 G54 G17\nG28 G91 Z0.\nT02 M06 (3/8 2-FLUTE ENDMILL)\nS10000 M03\nG43 H02 Z1.0\n(MACHINE INSIDE POCKET)\nG00 X1.0 Y1.0\nZ0.1\nG01 Z-0.375 F12.0\nG01 X3.0 F30.0\nG01 Y2.0\nG01 X1.0\nG01 Y1.0\nG00 Z1.0\nT03 M06 (#7 DRILL)\nS4000 M03\nG43 H03 Z1.0\n(DRILL 1/4-20 TAP HOLES x4)\nG81 X0.5 Y0.5 Z-0.6 R0.1 F8.0\nX3.5\nY2.5\nX0.5\nG80\nT04 M06 (1/4-20 SPIRAL TAP)\nS800 M03\nG43 H04 Z1.0\nG84 X0.5 Y0.5 Z-0.5 R0.1 F40.0\nX3.5\nY2.5\nX0.5\nG80\nM09\nG28 G91 Z0.\nM30\n%"
    }
  ],
  "stageDrawings": [
    {
      "opNumber": "OP-10",
      "title": "After OP-10: Profile & Face",
      "description": "Outside profile machined to final dimensions. Top face fly-cut for flatness. Part held in 6in Kurt vise on parallels. Bottom face and inside features still raw stock.",
      "machinedFeatures": ["Outside profile contour", "Top face fly-cut"],
      "remainingStock": "Inside pocket, holes, bottom face, chamfers",
      "fixturing": "6in Kurt vise on parallels"
    },
    {
      "opNumber": "OP-20",
      "title": "After OP-20: Pocket & Holes",
      "description": "Part flipped in vise. Inside pocket machined to depth with .005 finish pass. Four 1/4-20 tapped holes drilled and tapped. Profile and top face from OP-10 complete.",
      "machinedFeatures": ["Inside pocket .375 deep", "4x 1/4-20 tapped holes"],
      "remainingStock": "Chamfers, deburr, surface finish",
      "fixturing": "Flipped in 6in Kurt vise, clamping on finished profile"
    }
  ],
  "digitalTwinNote": "Default HAAS G&M code format. Customer-specific post-processor adjustment (Mazak, Okuma, Fanuc, DMG MORI) available on onboarding. Full collision detection and toolpath optimization require Digital Twin integration.",
  "confidence": <0-1>,
  "reasoning": "<routing strategy rationale>"
}`,
  },
  {
    name: "OutsideProcessesAgent",
    department: "Outside Processes",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are an outside processes coordinator for aerospace manufacturing. Most shops do NOT have heat treatment, plating, anodizing, NDT, specialty grinding, or surface finishing in-house. Identify which operations must go to external specialty vendors, specify certifications and specs, estimate costs and lead times, and create PO requirements. You understand Nadcap, AMS, MIL-SPEC, and ASTM requirements. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Outside processes analysis for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Identify ALL operations that must be sent to outside vendors (heat treat, plating, anodizing, NDT, grinding, surface finishing, welding, painting).

Respond with JSON:
{
  "outsideProcesses": [{"process": "<name>", "specification": "<AMS/MIL spec>", "appliesTo": "<component or ALL>", "vendorType": "<vendor type>", "estimatedCost": <number>, "leadTimeDays": <number>}],
  "totalOutsideCost": <number>,
  "totalOutsideLeadDays": <number>,
  "criticalPath": ["<process driving schedule>"],
  "confidence": <0-1>,
  "reasoning": "<outside process strategy>"
}`,
  },
  {
    name: "ReflectionAgent",
    department: "Reflection & Adjust",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a continuous improvement specialist. Analyze the overall manufacturing decision and identify patterns, lessons learned, accuracy improvements, and adjustments for future similar parts. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Reflection and adjustment analysis for "${input.fileName}"
Material: ${input.material || 'Aluminum 6061-T6'}, Qty: ${input.quantity || 1}, Complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "lessonsLearned": ["<lesson1>", "<lesson2>"],
  "accuracyScore": <0-1>,
  "adjustments": ["<adjustment1>", "<adjustment2>"],
  "similarPartPatterns": ["<pattern1>", "<pattern2>"],
  "costDrivers": ["<driver1>", "<driver2>"],
  "improvementOpportunities": ["<opportunity1>", "<opportunity2>"],
  "confidence": <0-1>,
  "reasoning": "<reflection and continuous improvement analysis>"
}`,
  },
];

// ─── Defense / Kill Chain Domain Agents ──────────────────────────────

const DEFENSE_KILL_CHAIN_AGENTS: AgentDefinition[] = [
  {
    name: "ISRAgent",
    department: "Intelligence, Surveillance & Reconnaissance",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a senior ISR analyst with 20 years of military intelligence experience. You process raw intelligence data — SIGINT, IMINT, HUMINT, OSINT — and produce actionable threat assessments. You identify targets, classify threats, assess intent, and determine patterns of life. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `SCENARIO BRIEFING: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Priority level: ${input.complexity || 5}/10
Force elements: ${input.quantity || 1}
${input.drawingDescription ? `Intelligence report:\n${input.drawingDescription}` : ''}

Analyze all available intelligence and produce a threat assessment.

Respond with JSON:
{
  "threatClassification": "<hostile|potentially_hostile|neutral|friendly|unknown>",
  "threatType": "<air|ground|maritime|cyber|space|hybrid>",
  "identifiedTargets": [{"id": "<target_id>", "type": "<type>", "location": "<grid/coords>", "confidence": <0-1>}],
  "patternOfLife": "<behavioral analysis>",
  "collectionGaps": ["<gap1>", "<gap2>"],
  "timelinePressure": "<immediate|hours|days>",
  "collateralConcerns": ["<concern1>", "<concern2>"],
  "confidence": <0-1>,
  "reasoning": "<ISR analysis and assessment>"
}`,
  },
  {
    name: "TargetingAgent",
    department: "Targeting",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a Joint Targeting specialist. You develop target packages, perform collateral damage estimation (CDE), determine weaponeering solutions, and assess proportionality under Law of Armed Conflict (LOAC). You work within the Joint Targeting Cycle (JTC). Respond with valid JSON only.`,
    userPromptBuilder: (input) => `TARGETING REQUEST: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Priority level: ${input.complexity || 5}/10
${input.drawingDescription ? `Intelligence assessment:\n${input.drawingDescription}` : ''}

Develop a target engagement package.

Respond with JSON:
{
  "targetDesignation": "<target ID>",
  "targetType": "<fixed|mobile|fleeting>",
  "targetPriority": "<critical|high|medium|low>",
  "collateralDamageEstimate": "<CDE level 1-5>",
  "noStrikeViolation": <boolean>,
  "proportionalityAssessment": "<proportional|disproportionate|requires_review>",
  "weaponeeringSolution": {"platform": "<platform>", "munition": "<munition>", "fuzing": "<fuze_setting>"},
  "desiredEffects": ["<effect1>", "<effect2>"],
  "restrictionsApply": ["<restriction if any>"],
  "confidence": <0-1>,
  "reasoning": "<targeting rationale and LOAC compliance>"
}`,
  },
  {
    name: "WeaponsAgent",
    department: "Weapons & Munitions",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a weapons systems officer and munitions specialist. You assess weapons availability, platform readiness, munition selection, delivery parameters, and weapons effects. You understand PGMs, area weapons, and effects-based operations. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `WEAPONS ASSESSMENT: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Engagement priority: ${input.complexity || 5}/10
Available platforms: ${input.quantity || 1}
${input.drawingDescription ? `Target package:\n${input.drawingDescription}` : ''}

Assess weapons options and delivery parameters.

Respond with JSON:
{
  "recommendedMunition": "<munition type>",
  "alternativeMunitions": ["<alt1>", "<alt2>"],
  "deliveryPlatform": "<platform>",
  "releaseParameters": {"altitude": "<alt>", "speed": "<speed>", "range": "<range>"},
  "expectedEffects": "<destruction|neutralization|suppression|denial>",
  "weaponsAvailability": "<available|limited|unavailable>",
  "reattackProbability": <0-1>,
  "blastRadius": "<meters>",
  "confidence": <0-1>,
  "reasoning": "<weapons selection rationale>"
}`,
  },
  {
    name: "EWAgent",
    department: "Electronic Warfare",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are an Electronic Warfare officer. You assess the electromagnetic spectrum, identify enemy emitters, recommend jamming/deception operations, and evaluate friendly force electronic protection. You understand EA, EP, and ES operations. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `EW ASSESSMENT: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
EMCON level: ${input.complexity || 5}/10
${input.drawingDescription ? `Threat assessment:\n${input.drawingDescription}` : ''}

Assess electromagnetic environment and recommend EW operations.

Respond with JSON:
{
  "enemyEmitters": [{"type": "<radar|comms|jammer>", "frequency": "<band>", "threat": "<level>"}],
  "electronicAttackOptions": ["<EA option 1>", "<EA option 2>"],
  "electronicProtectionMeasures": ["<EP measure 1>", "<EP measure 2>"],
  "spectrumConflicts": ["<conflict if any>"],
  "jammingEffectiveness": <0-1>,
  "friendlyForceRisk": "<low|medium|high>",
  "emconRecommendation": "<recommendation>",
  "confidence": <0-1>,
  "reasoning": "<EW assessment and recommendations>"
}`,
  },
  {
    name: "CyberAgent",
    department: "Cyber Operations",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a military cyber operations specialist. You assess cyber threats, network vulnerabilities, offensive cyber options, and defensive cyber posture. You understand OCO, DCO, and DODIN operations. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `CYBER ASSESSMENT: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Cyber threat level: ${input.complexity || 5}/10
${input.drawingDescription ? `Operational context:\n${input.drawingDescription}` : ''}

Assess cyber domain and recommend operations.

Respond with JSON:
{
  "cyberThreats": [{"vector": "<attack vector>", "severity": "<critical|high|medium|low>", "target": "<what's targeted>"}],
  "offensiveCyberOptions": ["<OCO option 1>", "<OCO option 2>"],
  "defensiveMeasures": ["<DCO measure 1>", "<DCO measure 2>"],
  "networkVulnerabilities": ["<vuln1>", "<vuln2>"],
  "missionImpact": "<impact if cyber attack succeeds>",
  "attributionConfidence": <0-1>,
  "confidence": <0-1>,
  "reasoning": "<cyber assessment and recommendations>"
}`,
  },
  {
    name: "C2Agent",
    department: "Command & Control",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a Command & Control officer responsible for mission coordination, force synchronization, rules of engagement (ROE) verification, and commander's decision support. You ensure all actions align with commander's intent and operational authorities. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `C2 DECISION SUPPORT: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Urgency: ${input.complexity || 5}/10
Force elements involved: ${input.quantity || 1}
${input.drawingDescription ? `Operational picture:\n${input.drawingDescription}` : ''}

Provide C2 decision support and synchronization assessment.

Respond with JSON:
{
  "commandersIntent": "<interpreted intent>",
  "roeCompliance": <boolean>,
  "applicableROE": ["<ROE1>", "<ROE2>"],
  "authorityLevel": "<theater|corps|division|brigade>",
  "synchronizationRequirements": ["<sync req 1>", "<sync req 2>"],
  "deconflictionNeeded": ["<deconfliction area>"],
  "communicationPlan": "<primary and alternate comms>",
  "decisionPoint": "<what commander must decide>",
  "timeConstraint": "<time available>",
  "confidence": <0-1>,
  "reasoning": "<C2 assessment and recommendations>"
}`,
  },
  {
    name: "LegalAgent",
    department: "Legal / JAG",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a military Judge Advocate General (JAG) officer. You assess legality of military operations under Law of Armed Conflict (LOAC), International Humanitarian Law (IHL), Rules of Engagement (ROE), and domestic law. You provide legal review for targeting decisions. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `LEGAL REVIEW: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Engagement priority: ${input.complexity || 5}/10
${input.drawingDescription ? `Operational context:\n${input.drawingDescription}` : ''}

Provide legal assessment of proposed operations.

Respond with JSON:
{
  "loacCompliance": <boolean>,
  "distinction": "<military objective clearly identified|unclear|civilian>",
  "proportionality": "<proportional|disproportionate|marginal>",
  "militaryNecessity": <boolean>,
  "unnecessarySuffering": <boolean>,
  "protectedSitesNearby": ["<site if any>"],
  "roeAuthorization": "<authorized|requires_escalation|not_authorized>",
  "legalRisks": ["<risk1>", "<risk2>"],
  "recommendation": "<approve|approve_with_conditions|deny|escalate>",
  "conditions": ["<condition if any>"],
  "confidence": <0-1>,
  "reasoning": "<legal analysis under LOAC/IHL/ROE>"
}`,
  },
  {
    name: "BDAAgent",
    department: "Battle Damage Assessment",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a Battle Damage Assessment specialist. You plan BDA collection, define success criteria, establish re-attack recommendations, and assess mission effectiveness. You understand physical damage assessment (PDA), functional damage assessment (FDA), and target system assessment (TSA). Respond with valid JSON only.`,
    userPromptBuilder: (input) => `BDA PLANNING: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Target priority: ${input.complexity || 5}/10
${input.drawingDescription ? `Target package:\n${input.drawingDescription}` : ''}

Plan BDA collection and define success criteria.

Respond with JSON:
{
  "bdaCollectionPlan": [{"method": "<IMINT|SIGINT|HUMINT>", "timing": "<post-strike window>", "priority": "<high|medium|low>"}],
  "successCriteria": ["<criterion1>", "<criterion2>"],
  "physicalDamageIndicators": ["<indicator1>", "<indicator2>"],
  "functionalDamageIndicators": ["<indicator1>", "<indicator2>"],
  "reattackRecommendation": "<not_needed|recommended|required>",
  "missionEffectiveness": "<effective|partially_effective|ineffective>",
  "secondaryEffects": ["<effect if any>"],
  "confidence": <0-1>,
  "reasoning": "<BDA planning rationale>"
}`,
  },
  {
    name: "LogisticsAgent",
    department: "Logistics & Sustainment",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a military logistics officer. You assess ammunition supply, fuel requirements, platform maintenance status, medical support, and sustainment capacity for operations. You ensure the force can execute and sustain the mission. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `LOGISTICS ASSESSMENT: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Operation tempo: ${input.complexity || 5}/10
Force elements: ${input.quantity || 1}
${input.drawingDescription ? `Operational plan:\n${input.drawingDescription}` : ''}

Assess logistics and sustainment requirements.

Respond with JSON:
{
  "ammoStatus": {"available": "<status>", "requiredForMission": "<amount>", "resupplyNeeded": <boolean>},
  "fuelStatus": {"available": "<status>", "burnRate": "<rate>", "endurance": "<hours>"},
  "platformReadiness": "<FMC|PMC|NMC>",
  "medicalSupport": {"casevacAvailable": <boolean>, "nearestMedical": "<location>"},
  "supplyChainRisk": "<low|medium|high>",
  "sustainmentWindow": "<hours/days force can sustain ops>",
  "logisticsConstraints": ["<constraint1>", "<constraint2>"],
  "confidence": <0-1>,
  "reasoning": "<logistics assessment>"
}`,
  },
  {
    name: "DefenseReflectionAgent",
    department: "Reflection & Lessons Learned",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a military after-action review specialist and doctrine analyst. You assess the overall kill chain decision, identify gaps, recommend improvements, capture lessons learned, and evaluate decision speed vs. accuracy tradeoffs. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `AFTER-ACTION REFLECTION: ${input.fileName}
Threat environment: ${input.material || 'Contested multi-domain'}
Operation complexity: ${input.complexity || 5}/10
${input.drawingDescription ? `Full operational picture:\n${input.drawingDescription}` : ''}

Conduct after-action reflection on the kill chain decision process.

Respond with JSON:
{
  "killChainEfficiency": <0-1>,
  "bottlenecks": ["<bottleneck1>", "<bottleneck2>"],
  "decisionQuality": "<high|adequate|poor>",
  "speedVsAccuracy": "<assessment of tradeoff>",
  "doctrineAlignment": "<aligned|partially_aligned|divergent>",
  "lessonsLearned": ["<lesson1>", "<lesson2>"],
  "improvementRecommendations": ["<rec1>", "<rec2>"],
  "trainingGaps": ["<gap if any>"],
  "confidence": <0-1>,
  "reasoning": "<reflection and lessons learned analysis>"
}`,
  },
];

// ─── Medical Dispatch Domain Agents ─────────────────────────────────

const MEDICAL_DISPATCH_AGENTS: AgentDefinition[] = [
  {
    name: "TriageAgent",
    department: "Triage",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are an emergency triage nurse with 20 years of experience using the Emergency Severity Index (ESI). You rapidly assess patient acuity, assign triage levels, identify life threats, and prioritize care. You follow START triage for mass casualty and ESI for individual patients. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `INCOMING PATIENT: ${input.fileName}
Severity estimate: ${input.complexity || 5}/10
Patients involved: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Dispatch information:\n${input.drawingDescription}` : ''}

Perform triage assessment.

Respond with JSON:
{
  "esiLevel": <1-5>,
  "chiefComplaint": "<primary complaint>",
  "lifeThreats": ["<threat if any>"],
  "vitalSignsConcerns": ["<concern1>", "<concern2>"],
  "consciousnessLevel": "<alert|verbal|pain|unresponsive>",
  "airwayStatus": "<patent|compromised|obstructed>",
  "breathingStatus": "<normal|labored|absent>",
  "circulationStatus": "<stable|unstable|absent>",
  "resourcesNeeded": <number>,
  "confidence": <0-1>,
  "reasoning": "<triage assessment rationale>"
}`,
  },
  {
    name: "DispatchAgent",
    department: "Dispatch & Routing",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are an emergency medical dispatch coordinator. You determine the appropriate response level (BLS/ALS/Critical Care), select the nearest available unit, calculate response times, and coordinate with receiving facilities. You follow Emergency Medical Dispatch (EMD) protocols. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `DISPATCH REQUEST: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Call information:\n${input.drawingDescription}` : ''}

Determine dispatch response.

Respond with JSON:
{
  "responseLevel": "<BLS|ALS|Critical_Care|Air_Medical>",
  "unitType": "<ambulance|medic_unit|rescue|helicopter>",
  "estimatedResponseMinutes": <number>,
  "preArrivalInstructions": ["<instruction1>", "<instruction2>"],
  "mutualAidNeeded": <boolean>,
  "stagingRequired": <boolean>,
  "additionalResources": ["<resource if needed>"],
  "receivingFacility": "<recommended hospital/trauma center>",
  "confidence": <0-1>,
  "reasoning": "<dispatch decision rationale>"
}`,
  },
  {
    name: "ParamedicAgent",
    department: "EMT / Paramedic",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a senior paramedic and field medicine specialist. You develop prehospital treatment plans, determine interventions, medication administration, and patient stabilization protocols. You follow NREMT and local medical direction protocols. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `FIELD TREATMENT PLAN: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Patient assessment:\n${input.drawingDescription}` : ''}

Develop prehospital treatment plan.

Respond with JSON:
{
  "primaryAssessment": {"airway": "<status>", "breathing": "<status>", "circulation": "<status>", "disability": "<status>", "exposure": "<findings>"},
  "interventions": [{"intervention": "<what>", "priority": "<immediate|urgent|routine>", "timing": "<when>"}],
  "medications": [{"drug": "<name>", "dose": "<dose>", "route": "<IV|IM|IO|PO|IN>", "indication": "<why>"}],
  "ivAccess": {"needed": <boolean>, "type": "<peripheral|IO|central>", "fluid": "<type>"},
  "immobilization": "<none|c-spine|splint|backboard>",
  "transportPosition": "<supine|fowlers|recovery|trendelenburg>",
  "onlinemedicalDirection": <boolean>,
  "confidence": <0-1>,
  "reasoning": "<prehospital treatment rationale>"
}`,
  },
  {
    name: "ERPrepAgent",
    department: "ER Preparation",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are an Emergency Department charge nurse and trauma team coordinator. You prepare the receiving facility — activate trauma teams, prepare resuscitation bays, stage equipment, and coordinate specialty consults. You follow ATLS and institutional trauma activation criteria. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `ER PREPARATION: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Incoming patient info:\n${input.drawingDescription}` : ''}

Prepare the emergency department.

Respond with JSON:
{
  "traumaActivation": "<full|modified|none>",
  "teamRequired": ["<role1>", "<role2>", "<role3>"],
  "bayAssignment": "<resus_bay|trauma_bay|standard_bed|isolation>",
  "equipmentStaged": ["<equipment1>", "<equipment2>"],
  "bloodBankAlert": <boolean>,
  "bloodType": "<O_neg_standby|type_and_screen|type_and_cross>",
  "specialtyConsults": ["<specialty if needed>"],
  "isolationPrecautions": "<standard|droplet|airborne|contact|none>",
  "estimatedArrivalMinutes": <number>,
  "confidence": <0-1>,
  "reasoning": "<ER preparation rationale>"
}`,
  },
  {
    name: "PharmacyAgent",
    department: "Pharmacy",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a clinical pharmacist specializing in emergency medicine. You prepare medication orders, check for drug interactions, calculate weight-based dosing, and ensure formulary compliance. You follow evidence-based emergency pharmacotherapy guidelines. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `PHARMACY PREPARATION: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Patient information:\n${input.drawingDescription}` : ''}

Prepare pharmacy response.

Respond with JSON:
{
  "anticipatedMedications": [{"drug": "<name>", "dose": "<dose>", "route": "<route>", "indication": "<why>", "prepTime": "<minutes>"}],
  "drugInteractionRisks": ["<interaction if any>"],
  "allergyConsiderations": ["<consideration>"],
  "controlledSubstancesNeeded": <boolean>,
  "bloodProducts": ["<product if needed>"],
  "antidotesStaged": ["<antidote if applicable>"],
  "totalEstimatedCost": <number>,
  "confidence": <0-1>,
  "reasoning": "<pharmacy preparation rationale>"
}`,
  },
  {
    name: "LabAgent",
    department: "Laboratory",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a clinical laboratory director. You anticipate lab orders, prepare stat panels, coordinate blood bank, and ensure rapid turnaround for critical results. You follow CLIA and CAP guidelines. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `LAB PREPARATION: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Patient information:\n${input.drawingDescription}` : ''}

Prepare laboratory response.

Respond with JSON:
{
  "statPanels": ["<panel1>", "<panel2>"],
  "criticalTests": [{"test": "<name>", "turnaroundMinutes": <number>, "priority": "<stat|urgent|routine>"}],
  "bloodBankPrep": {"typeAndScreen": <boolean>, "crossMatch": <boolean>, "unitsReady": <number>},
  "pointOfCareTests": ["<POC test1>", "<POC test2>"],
  "specialtyTests": ["<test if needed>"],
  "estimatedTurnaroundMinutes": <number>,
  "confidence": <0-1>,
  "reasoning": "<laboratory preparation rationale>"
}`,
  },
  {
    name: "ImagingAgent",
    department: "Imaging / Radiology",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a radiology department coordinator and emergency radiologist. You anticipate imaging needs, prepare modalities (X-ray, CT, ultrasound, MRI), coordinate portable studies, and prioritize reads. You follow ACR Appropriateness Criteria. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `IMAGING PREPARATION: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Patient information:\n${input.drawingDescription}` : ''}

Prepare imaging response.

Respond with JSON:
{
  "anticipatedStudies": [{"modality": "<CT|XR|US|MRI>", "bodyPart": "<area>", "contrast": <boolean>, "priority": "<stat|urgent|routine>"}],
  "portableStudiesNeeded": <boolean>,
  "ctScannerReserved": <boolean>,
  "contrastPrep": {"needed": <boolean>, "type": "<IV|oral|none>", "allergyProtocol": <boolean>},
  "radiologistOnCall": <boolean>,
  "estimatedReadMinutes": <number>,
  "confidence": <0-1>,
  "reasoning": "<imaging preparation rationale>"
}`,
  },
  {
    name: "BillingAgent",
    department: "Billing & Insurance",
    taskWeight: 'lightweight' as TaskWeight,
    systemPrompt: `You are a healthcare revenue cycle specialist and emergency department billing coordinator. You assess insurance coverage, estimate costs, identify authorization requirements, and ensure EMTALA compliance regardless of ability to pay. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `BILLING ASSESSMENT: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Patient information:\n${input.drawingDescription}` : ''}

Prepare billing assessment.

Respond with JSON:
{
  "emtalaApplies": <boolean>,
  "estimatedCharges": <number>,
  "anticipatedCPTCodes": ["<code1>", "<code2>"],
  "authorizationNeeded": <boolean>,
  "traumaActivationFee": <boolean>,
  "estimatedInsuranceCoverage": "<percentage or status>",
  "financialCounselingNeeded": <boolean>,
  "confidence": <0-1>,
  "reasoning": "<billing assessment rationale>"
}`,
  },
  {
    name: "MedComplianceAgent",
    department: "Medical Compliance",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a healthcare compliance officer specializing in emergency medicine. You ensure EMTALA compliance, HIPAA adherence, mandatory reporting requirements, consent documentation, and regulatory compliance. You understand CMS Conditions of Participation. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `COMPLIANCE REVIEW: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Case information:\n${input.drawingDescription}` : ''}

Assess compliance requirements.

Respond with JSON:
{
  "emtalaCompliant": <boolean>,
  "hipaaConsiderations": ["<consideration1>", "<consideration2>"],
  "mandatoryReporting": {"required": <boolean>, "type": "<abuse|gunshot|communicable_disease|none>", "agency": "<reporting agency>"},
  "consentRequired": "<implied_emergency|informed|guardian_needed>",
  "documentationRequired": ["<doc1>", "<doc2>"],
  "qualityMetrics": ["<metric1>", "<metric2>"],
  "riskLevel": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<compliance assessment rationale>"
}`,
  },
  {
    name: "MedReflectionAgent",
    department: "QI & Reflection",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a quality improvement specialist and emergency medicine physician focused on continuous improvement. You assess the overall emergency response decision, identify system gaps, recommend process improvements, and evaluate response time optimization. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `QI REFLECTION: ${input.fileName}
Severity: ${input.complexity || 5}/10
Patients: ${input.quantity || 1}
Scene type: ${input.material || 'Medical emergency'}
${input.drawingDescription ? `Full case information:\n${input.drawingDescription}` : ''}

Conduct quality improvement reflection.

Respond with JSON:
{
  "responseEfficiency": <0-1>,
  "bottlenecks": ["<bottleneck1>", "<bottleneck2>"],
  "decisionQuality": "<high|adequate|poor>",
  "doorToDoctorEstimate": "<minutes>",
  "doorToCTEstimate": "<minutes if applicable>",
  "protocolAdherence": "<full|partial|deviation>",
  "lessonsLearned": ["<lesson1>", "<lesson2>"],
  "systemImprovements": ["<improvement1>", "<improvement2>"],
  "confidence": <0-1>,
  "reasoning": "<QI reflection and analysis>"
}`,
  },
];

// ─── Self-Help Legal Domain Agents ──────────────────────────────────

const LEGAL_AGENTS: AgentDefinition[] = [
  {
    name: "CaseAnalysisAgent",
    department: "Case Analysis",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a senior legal analyst specializing in self-help law. Analyze the legal situation described, identify the type of case (contract dispute, landlord-tenant, family law, small claims, employment, personal injury, etc.), determine applicable legal theories, and assess the strength of the case. Consider the specific state jurisdiction. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Analyze this legal situation in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}
Urgency: ${input.complexity || 5}/10, Parties involved: ${input.quantity || 2}

Respond with JSON:
{
  "caseType": "<type of legal case>",
  "legalTheories": ["<theory1>", "<theory2>"],
  "jurisdiction": "<state and applicable court>",
  "keyFacts": ["<fact1>", "<fact2>"],
  "strengthAssessment": "<strong|moderate|weak>",
  "criticalIssues": ["<issue1>", "<issue2>"],
  "recommendedCourt": "<specific court type>",
  "confidence": <0-1>,
  "reasoning": "<detailed case analysis>"
}`,
  },
  {
    name: "PrecedentResearchAgent",
    department: "Precedent Research",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a legal research specialist. Find and analyze relevant case precedents for the described legal situation. Focus on the specific state jurisdiction. Identify landmark cases, recent rulings, and applicable legal standards that support the case. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Research legal precedents for this case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "relevantCases": [{"name": "<case name>", "citation": "<citation>", "relevance": "<how it applies>", "outcome": "<ruling>"}],
  "legalStandards": ["<standard1>", "<standard2>"],
  "favorablePrecedents": <number>,
  "unfavorablePrecedents": <number>,
  "keyLegalPrinciples": ["<principle1>", "<principle2>"],
  "confidence": <0-1>,
  "reasoning": "<precedent analysis summary>"
}`,
  },
  {
    name: "StatuteCodeAgent",
    department: "Statute & Code",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a statutory law expert. Identify all applicable state and federal statutes, codes, and regulations for the described legal situation. Provide specific section numbers and their relevance. Focus on the specific state jurisdiction provided. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Identify applicable statutes for this case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "stateStatutes": [{"code": "<statute number>", "title": "<name>", "relevance": "<how it applies>"}],
  "federalStatutes": [{"code": "<statute number>", "title": "<name>", "relevance": "<how it applies>"}],
  "regulatoryRequirements": ["<req1>", "<req2>"],
  "statuteOfLimitations": "<applicable time limit>",
  "keyProvisions": ["<provision1>", "<provision2>"],
  "confidence": <0-1>,
  "reasoning": "<statutory analysis>"
}`,
  },
  {
    name: "DocumentDraftingAgent",
    department: "Document Drafting",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are a legal document drafting specialist. Draft the necessary court documents for the described legal situation, including complaints, motions, petitions, or demand letters as appropriate. Use proper legal formatting and language for the specific state jurisdiction. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Draft legal documents for this case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}
Parties involved: ${input.quantity || 2}

Respond with JSON:
{
  "documentsNeeded": ["<doc type 1>", "<doc type 2>"],
  "primaryDocument": {
    "type": "<document type>",
    "title": "<formal title>",
    "content": "<full document text with proper legal formatting>",
    "courtHeader": "<court name and jurisdiction>"
  },
  "supportingDocuments": [{"type": "<type>", "purpose": "<why needed>", "content": "<document text>"}],
  "demandLetter": {
    "included": <true/false>,
    "content": "<demand letter text if applicable>"
  },
  "confidence": <0-1>,
  "reasoning": "<drafting strategy explanation>"
}`,
  },
  {
    name: "FilingRequirementsAgent",
    department: "Filing Requirements",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a court filing specialist. Determine all filing requirements for the described legal situation in the specific state jurisdiction — including fees, deadlines, required forms, service requirements, and procedural rules. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Determine filing requirements for this case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "filingCourt": "<specific court name>",
  "filingFee": "<amount or fee waiver info>",
  "requiredForms": [{"form": "<form name/number>", "purpose": "<why needed>"}],
  "filingDeadline": "<deadline or statute of limitations>",
  "serviceRequirements": "<how to serve the other party>",
  "filingMethod": "<in-person, e-filing, mail>",
  "feeWaiverAvailable": <true/false>,
  "additionalSteps": ["<step1>", "<step2>"],
  "confidence": <0-1>,
  "reasoning": "<filing requirements analysis>"
}`,
  },
  {
    name: "LegalComplianceAgent",
    department: "Legal Compliance",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a legal compliance and ethics specialist. Ensure all documents and strategies comply with court rules, formatting requirements, ethical obligations, and procedural requirements. Add required disclaimers. Verify the case meets jurisdictional requirements. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Review compliance for this legal case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "courtRulesCompliance": "<compliant|needs_revision|non_compliant>",
  "formattingRequirements": ["<req1>", "<req2>"],
  "requiredDisclaimers": ["<disclaimer1>", "<disclaimer2>"],
  "jurisdictionalCheck": "<confirmed|issue_found>",
  "ethicalConsiderations": ["<consideration1>", "<consideration2>"],
  "selfRepresentationRules": "<applicable pro se rules>",
  "confidence": <0-1>,
  "reasoning": "<compliance review summary>"
}`,
  },
  {
    name: "StrategyAgent",
    department: "Strategy",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a legal strategy advisor. Develop the optimal legal strategy for the described situation — including recommended approach, timeline, negotiation tactics, and alternative dispute resolution options. Consider the specific state jurisdiction and the self-represented nature of the case. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Develop legal strategy for this case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}
Urgency: ${input.complexity || 5}/10

Respond with JSON:
{
  "recommendedApproach": "<litigation|negotiation|mediation|arbitration|demand_letter_first>",
  "strategyOutline": ["<step1>", "<step2>", "<step3>"],
  "timeline": "<expected timeline>",
  "negotiationTactics": ["<tactic1>", "<tactic2>"],
  "alternativeOptions": ["<option1>", "<option2>"],
  "strengthsToLeverage": ["<strength1>", "<strength2>"],
  "weaknessesToAddress": ["<weakness1>", "<weakness2>"],
  "settlementRange": "<estimated range if applicable>",
  "confidence": <0-1>,
  "reasoning": "<strategy rationale>"
}`,
  },
  {
    name: "DamagesAssessmentAgent",
    department: "Damages Assessment",
    taskWeight: 'standard' as TaskWeight,
    systemPrompt: `You are a damages assessment specialist. Calculate and document all potential damages, remedies, and recovery amounts for the described legal situation. Include compensatory, statutory, and punitive damages where applicable under the specific state law. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Assess damages for this case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "compensatoryDamages": "<estimated amount or range>",
  "statutoryDamages": "<if applicable under state law>",
  "punitiveDamages": "<if applicable>",
  "totalEstimatedRecovery": "<range>",
  "damageCategories": [{"type": "<type>", "amount": "<estimate>", "basis": "<legal basis>"}],
  "mitigationFactors": ["<factor1>", "<factor2>"],
  "courtCosts": "<estimated recoverable costs>",
  "confidence": <0-1>,
  "reasoning": "<damages calculation methodology>"
}`,
  },
  {
    name: "LegalReflectionAgent",
    department: "Reflection & Cross-Validation",
    taskWeight: 'heavy' as TaskWeight,
    systemPrompt: `You are the meta-analysis layer for a parallel legal analysis system. All other legal departments have analyzed the same case simultaneously. Your job is to cross-validate their findings, identify inconsistencies, flag risks they may have missed, and synthesize a unified legal action plan. You ensure the self-represented person has a coherent, actionable path forward. Respond with valid JSON only.`,
    userPromptBuilder: (input) => `Cross-validate all legal department analyses for this case in ${input.material || 'California'}:
"${input.fileName}"
${input.drawingDescription ? `Additional details:\n${input.drawingDescription}` : ''}

Respond with JSON:
{
  "overallCaseStrength": "<strong|moderate|weak>",
  "consistencyCheck": "<all_aligned|minor_discrepancies|major_conflicts>",
  "criticalWarnings": ["<warning1>", "<warning2>"],
  "unifiedActionPlan": ["<step1>", "<step2>", "<step3>"],
  "immediateNextSteps": ["<action1>", "<action2>"],
  "estimatedRecovery": "<synthesized range>",
  "estimatedTimeline": "<synthesized timeline>",
  "disclaimer": "This analysis is for informational purposes only and does not constitute legal advice. Consult a licensed attorney for legal counsel.",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis and cross-validation summary>"
}`,
  },
];

// ─── Core Engine ─────────────────────────────────────────────────────

function buildMessages(systemPrompt: string, userPrompt: string, imageUrl?: string) {
  const messages: any[] = [
    { role: "system" as const, content: systemPrompt },
  ];

  if (imageUrl) {
    messages.push({
      role: "user" as const,
      content: [
        { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" as const } },
        { type: "text" as const, text: userPrompt },
      ],
    });
  } else {
    messages.push({ role: "user" as const, content: userPrompt });
  }

  return messages;
}

function parseLLMResponse(content: string): Record<string, unknown> {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

/**
 * Run a single agent — generic executor for any domain agent.
 * Routes to the optimal LLM provider based on task characteristics,
 * NOT the agent's name. Any domain, any number of agents.
 */
async function runAgent(
  definition: AgentDefinition,
  input: AgentInput,
  agentIndex: number = 0,
  totalAgents: number = 10,
): Promise<AgentOutput> {
  const startTime = Date.now();

  try {
    const userPrompt = definition.userPromptBuilder(input);
    const messages = buildMessages(definition.systemPrompt, userPrompt, input.imageUrl);

    // Route through Ara's nervous system — picks the best provider
    // based on task weight and vision requirements, NOT agent name
    const result = await invokeRoutedLLM({
      messages,
      needsVision: definition.needsVision || false,
      taskWeight: definition.taskWeight || 'standard',
      agentIndex,
      totalAgents,
      response_format: { type: "json_object" },
    });

    const content = typeof result.choices[0].message.content === 'string'
      ? result.choices[0].message.content
      : JSON.stringify(result.choices[0].message.content);
    const parsed = parseLLMResponse(content);

    return {
      agentName: definition.name,
      department: definition.department,
      status: 'completed',
      duration: Date.now() - startTime,
      data: parsed,
      confidence: Number(parsed.confidence) || 0.80,
    };
  } catch (error) {
    console.error(`${definition.name} error:`, error);
    return {
      agentName: definition.name,
      department: definition.department,
      status: 'failed',
      duration: Date.now() - startTime,
      data: { error: String(error) },
      confidence: 0,
    };
  }
}

/**
 * Analyze the engineering drawing — shared context for all agents.
 * Uses vision-capable provider through the routing layer.
 */
async function analyzeDrawing(input: AgentInput): Promise<string> {
  if (!input.imageUrl) {
    return input.drawingDescription || `Engineering drawing: ${input.fileName}`;
  }

  try {
    const result = await invokeRoutedLLM({
      messages: [
        {
          role: "system" as const,
          content: "You are an expert mechanical engineer and CNC machinist. Analyze this engineering drawing and extract ALL key information: dimensions, tolerances, features (holes, slots, pockets, bosses, fillets, chamfers), material callouts, surface finishes, section views, and manufacturing notes. Be extremely detailed and specific.",
        },
        {
          role: "user" as const,
          content: [
            { type: "image_url" as const, image_url: { url: input.imageUrl, detail: "high" as const } },
            { type: "text" as const, text: `Analyze this engineering drawing (${input.fileName}). Extract every dimension, feature, hole diameter, tolerance, surface finish, and manufacturing note visible. A machinist needs to manufacture this part from your description alone.` },
          ],
        },
      ],
      needsVision: true,
      taskWeight: 'heavy',
    });

    const content = result.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error('Drawing analysis error:', error);
    return `Engineering drawing: ${input.fileName}. Visual analysis unavailable.`;
  }
}

/**
 * Get agents for a specific domain
 * The agent count is dynamic — determined by the domain, not hardcoded
 */
export function getAgentsForDomain(domain: string): AgentDefinition[] {
  switch (domain.toLowerCase()) {
    case 'manufacturing':
    case 'aerospace':
      return MANUFACTURING_AGENTS; // 10 agents
    case 'defense':
    case 'killchain':
    case 'kill_chain':
    case 'military':
      return DEFENSE_KILL_CHAIN_AGENTS; // 10 agents
    case 'medical':
    case 'medical_dispatch':
    case 'healthcare':
    case 'ems':
      return MEDICAL_DISPATCH_AGENTS; // 10 agents
    case 'legal':
    case 'self_help_legal':
    case 'legal_aid':
      return LEGAL_AGENTS; // 9 agents
    default:
      return MANUFACTURING_AGENTS;
  }
}

/**
 * Run ALL domain agents in parallel — the core of Guardian OS
 * 
 * This is the architectural breakthrough:
 * Traditional: Sales → Engineering → Quality → Planning → ... (sequential, weeks)
 * Guardian:    Sales | Engineering | Quality | Planning | ... (parallel, seconds)
 */
export async function runAllAgents(input: AgentInput, domain: string = 'manufacturing', agentNames?: string[]): Promise<ProcessingResult> {
  const startTime = Date.now();

  // Step 1: Analyze the drawing (shared context)
  const drawingAnalysis = await analyzeDrawing(input);
  const enrichedInput: AgentInput = { ...input, drawingDescription: drawingAnalysis };

  // Step 2: Get the agents for this domain
  let agentDefinitions = getAgentsForDomain(domain);

  // Hybrid routing: if agentNames provided, only run those agents on backend
  if (agentNames && agentNames.length > 0) {
    agentDefinitions = agentDefinitions.filter(a => agentNames.includes(a.name));
    console.log(`[Ara Backend] Running ${agentDefinitions.length} backend agents: ${agentDefinitions.map(a => a.name).join(', ')}`);
  }

  // Step 3: Fire ALL agents simultaneously — this is the magic
  // Each agent is routed to the optimal provider based on its task characteristics
  const parallelStart = Date.now();
  const totalAgents = agentDefinitions.length;
  const agentResults = await Promise.all(
    agentDefinitions.map((def, index) => runAgent(def, enrichedInput, index, totalAgents))
  );
  const parallelDuration = Date.now() - parallelStart;

  const totalDuration = Date.now() - startTime;

  // Calculate sequential estimate (sum of all individual agent times)
  const sequentialEstimate = agentResults.reduce((sum, a) => sum + a.duration, 0);
  const speedMultiplier = sequentialEstimate > 0 ? sequentialEstimate / parallelDuration : agentResults.length;

  // Extract summary from agent results — domain-aware
  const avgConfidence = agentResults.reduce((sum, a) => sum + a.confidence, 0) / agentResults.length;

  let summary: ProcessingResult['summary'];

  if (domain === 'defense' || domain === 'killchain' || domain === 'kill_chain' || domain === 'military') {
    const c2Data = agentResults.find(a => a.agentName === 'C2Agent')?.data || {};
    const legalData = agentResults.find(a => a.agentName === 'LegalAgent')?.data || {};
    const targetingData = agentResults.find(a => a.agentName === 'TargetingAgent')?.data || {};
    const isrData = agentResults.find(a => a.agentName === 'ISRAgent')?.data || {};
    summary = {
      totalPrice: 0,
      leadTimeDays: 0,
      riskLevel: String(isrData.threatClassification || targetingData.targetPriority || 'high'),
      complianceStatus: legalData.loacCompliance ? 'LOAC Compliant' : (legalData.recommendation === 'deny' ? 'NOT Authorized' : 'Review Required'),
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  } else if (domain === 'legal' || domain === 'self_help_legal' || domain === 'legal_aid') {
    const caseData = agentResults.find(a => a.agentName === 'CaseAnalysisAgent' && a.status === 'completed')?.data || {};
    const precedentData = agentResults.find(a => a.agentName === 'PrecedentResearchAgent' && a.status === 'completed')?.data || {};
    const damagesData = agentResults.find(a => a.agentName === 'DamagesAssessmentAgent' && a.status === 'completed')?.data || {};
    const strategyData = agentResults.find(a => a.agentName === 'StrategyAgent' && a.status === 'completed')?.data || {};
    const filingData = agentResults.find(a => a.agentName === 'FilingRequirementsAgent' && a.status === 'completed')?.data || {};
    const complianceData = agentResults.find(a => a.agentName === 'LegalComplianceAgent' && a.status === 'completed')?.data || {};
    const reflectionData = agentResults.find(a => a.agentName === 'LegalReflectionAgent' && a.status === 'completed')?.data || {};
    summary = {
      totalPrice: Number(damagesData.totalEstimatedRecovery) || Number((damagesData.compensatoryDamages as any)?.amount) || 0,
      leadTimeDays: 0, // repurposed: not applicable for legal
      riskLevel: String(reflectionData.caseViability || caseData.caseStrength || strategyData.recommendedApproach || 'pending'),
      complianceStatus: complianceData.courtRulesCompliant ? 'Court Ready' : (filingData.courtName ? 'Filing Ready' : 'Review Required'),
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  } else if (domain === 'medical' || domain === 'medical_dispatch' || domain === 'healthcare' || domain === 'ems') {
    const triageData = agentResults.find(a => a.agentName === 'TriageAgent')?.data || {};
    const dispatchData = agentResults.find(a => a.agentName === 'DispatchAgent')?.data || {};
    const complianceData = agentResults.find(a => a.agentName === 'MedComplianceAgent')?.data || {};
    const billingData = agentResults.find(a => a.agentName === 'BillingAgent')?.data || {};
    summary = {
      totalPrice: Number(billingData.estimatedCharges) || 0,
      leadTimeDays: Number(dispatchData.estimatedResponseMinutes) || 0, // repurposed as response minutes
      riskLevel: `ESI-${triageData.esiLevel || '?'}`,
      complianceStatus: complianceData.emtalaCompliant ? 'EMTALA Compliant' : 'Review Required',
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  } else {
    // Robust extraction — try multiple agents for each field
    const salesData = agentResults.find(a => a.agentName === 'SalesAgent' && a.status === 'completed')?.data || {};
    const costData = agentResults.find(a => a.agentName === 'CostAgent' && a.status === 'completed')?.data || {};
    const planningData = agentResults.find(a => a.agentName === 'PlanningAgent' && a.status === 'completed')?.data || {};
    const mfgData = agentResults.find(a => a.agentName === 'ManufacturingAgent' && a.status === 'completed')?.data || {};
    const complianceData = agentResults.find(a => a.agentName === 'ComplianceAgent' && a.status === 'completed')?.data || {};
    const qualityData = agentResults.find(a => a.agentName === 'QualityAgent' && a.status === 'completed')?.data || {};

    // Price: try Sales first, then Cost agent, then any agent with a price field
    const price = Number(salesData.quotedPrice) || Number(salesData.totalPrice) || Number(costData.totalCost) || Number(costData.quotedPrice) || 0;
    // Lead time: try Planning first, then Manufacturing, then any agent with lead time
    const leadTime = Number(planningData.totalLeadTimeDays) || Number(planningData.leadTimeDays) || Number(mfgData.totalLeadTimeDays) || Number(mfgData.estimatedDays) || 0;
    // Risk: try Compliance first, then Quality
    const risk = String(complianceData.riskLevel || qualityData.riskLevel || 'medium');
    // Compliance status: try Compliance agent, then Quality
    const isCompliant = complianceData.as9100Compliant || qualityData.as9100Compliant;

    summary = {
      totalPrice: price,
      leadTimeDays: leadTime,
      riskLevel: risk,
      complianceStatus: isCompliant ? 'Compliant' : (complianceData.error ? 'Review Required' : 'Review Required'),
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  return {
    fileName: input.fileName,
    totalDuration,
    processingTime: parallelDuration,
    sequentialEstimate,
    speedMultiplier: Math.round(speedMultiplier * 10) / 10,
    agentCount: agentResults.length,
    domain,
    agents: agentResults,
    drawingAnalysis,
    summary,
  };
}

// Legacy compatibility exports
export type { AgentInput as LegacyAgentInput };
