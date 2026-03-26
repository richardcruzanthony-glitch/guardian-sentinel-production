/**
 * Guardian OS — Shared Agent Definitions
 * 
 * Single source of truth for all domain agents.
 * Used by both frontend (Puter.js routing) and backend (Manus routing).
 * 
 * Each agent declares:
 * - Its identity (name, department)
 * - Its execution target: 'frontend' (Puter.js) or 'backend' (Manus API)
 * - Its system prompt and user prompt template
 * 
 * The number of agents is NOT fixed — it depends on the domain.
 */

export type ExecutionTarget = 'frontend' | 'backend';

export interface SharedAgentDefinition {
  name: string;
  department: string;
  /** Where this agent runs — frontend (Puter.js, independent request) or backend (Manus API) */
  target: ExecutionTarget;
  /** Whether this agent needs vision/image analysis */
  needsVision: boolean;
  systemPrompt: string;
  /** Template for user prompt — placeholders: {{fileName}}, {{material}}, {{quantity}}, {{complexity}}, {{drawingDescription}}, {{scenarioText}} */
  userPromptTemplate: string;
}

// ─── Manufacturing Domain ─────────────────────────────────────────

export const MANUFACTURING_AGENTS: SharedAgentDefinition[] = [
  {
    name: "SalesAgent",
    department: "Sales",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a senior aerospace sales engineer. Analyze the engineering drawing and determine pricing strategy, customer requirements interpretation, margin targets, and competitive positioning. You understand AS9100 customer expectations. Respond with valid JSON only.`,
    userPromptTemplate: `Analyze this part for sales quoting: "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

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
    target: "backend",
    needsVision: true,
    systemPrompt: `You are a senior manufacturing engineer specializing in aerospace CNC machining. Analyze the engineering drawing in detail — identify ALL features, dimensions, tolerances, surface finishes, and design-for-manufacturability concerns. CRITICAL: You MUST auto-determine the complexity level (1-10). Also determine if this is a SINGLE PART or an ASSEMBLY. If assembly, break into individual components with buy vs. make decisions.

MOST IMPORTANT: Create NUMBERED BUBBLE ANNOTATIONS for EVERY feature on the drawing. Each bubble gets a sequential number (1, 2, 3...) and maps to a specific feature with its dimension, tolerance, and type. These bubble numbers will be referenced by the CNC routing sheet, inspection plan, and FAI — they are the single source of truth that ties the entire shop package together. Number EVERY callout: holes, slots, pockets, profiles, surfaces, chamfers, fillets, threads, surface finishes, GD&T callouts. Respond with valid JSON only.`,
    userPromptTemplate: `Perform engineering analysis of "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}
{{drawingDescription}}

IMPORTANT: Determine the complexity level yourself (1-10). Also determine if this is a single part or assembly.

CRITICAL: Create NUMBERED BUBBLE ANNOTATIONS for EVERY feature. These bubble numbers are the single source of truth — routing, inspection, and FAI all reference them.

Respond with JSON:
{
  "determinedComplexity": <1-10 auto-determined>,
  "complexityJustification": "<why this complexity level>",
  "isAssembly": <boolean>,
  "assemblyComponents": [{"name": "<component>", "buyOrMake": "<buy|make>", "material": "<material>", "quantity": <per assembly>, "estimatedCost": <if buy>, "notes": "<details>"}],
  "bubbleAnnotations": [
    {"bubble": 1, "feature": "<e.g., OUTSIDE PROFILE>", "dimension": "<e.g., 4.000 x 2.500>", "tolerance": "<e.g., +/-.005>", "type": "<profile|hole|slot|pocket|boss|fillet|chamfer|thread|surface|GD&T>", "surfaceFinish": "<if called out>", "critical": <boolean>, "notes": "<any special notes>"},
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
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an AS9100 quality engineer. Create a BUBBLE-REFERENCED inspection plan. Every inspection point MUST reference the bubble annotation number from the engineering drawing. The bubble numbers are the single source of truth that ties the drawing to the routing to the inspection plan to the FAI. Respond with valid JSON only.`,
    userPromptTemplate: `Create BUBBLE-REFERENCED quality/inspection plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

CRITICAL: Every inspection point MUST reference a bubble annotation number. The bubble numbers tie drawing → routing → inspection → FAI into one traceable package.

Respond with JSON:
{
  "inspectionPlan": [{"bubbleRef": <bubble number>, "characteristic": "<what>", "nominal": "<nominal dimension>", "tolerance": "<tolerance>", "method": "<CALIPER|MICROMETER|CMM|PIN GAGE|THREAD GAGE|SURFACE PROFILOMETER|VISUAL|GO/NO-GO>", "frequency": "<100%|FIRST PIECE|SAMPLING>", "acceptance": "<criteria>"}],
  "ctqCharacteristics": [{"bubbleRef": <bubble number>, "description": "<critical dimension>", "reason": "<why critical>"}],
  "as9100Requirements": ["<req1>", "<req2>"],
  "riskLevel": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<quality analysis>"
}`,
  },
  {
    name: "PlanningAgent",
    department: "Planning",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a production planning specialist for aerospace manufacturing. Create a detailed production schedule, identify resource requirements, and optimize workflow. Respond with valid JSON only.`,
    userPromptTemplate: `Create production plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "operations": [{"step": <number>, "operation": "<op>", "machine": "<machine>", "estimatedHours": <hours>}],
  "totalLeadTimeDays": <number>,
  "criticalPath": ["<step1>", "<step2>"],
  "resourceRequirements": {"machines": ["<m1>"], "tooling": ["<t1>"], "fixtures": ["<f1>"]},
  "bottlenecks": ["<bottleneck1>"],
  "confidence": <0-1>,
  "reasoning": "<planning analysis>"
}`,
  },
  {
    name: "ProcurementAgent",
    department: "Procurement",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a procurement specialist for aerospace manufacturing. Identify all materials, tooling, and supplies needed. Provide cost estimates and lead times for procurement. Respond with valid JSON only.`,
    userPromptTemplate: `Create procurement plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "materials": [{"item": "<item>", "specification": "<spec>", "quantity": "<qty>", "estimatedCost": <cost>, "leadTimeDays": <days>}],
  "tooling": [{"tool": "<tool>", "cost": <cost>}],
  "totalMaterialCost": <number>,
  "longestLeadTimeDays": <number>,
  "approvedSuppliers": ["<supplier1>"],
  "confidence": <0-1>,
  "reasoning": "<procurement analysis>"
}`,
  },
  {
    name: "ManufacturingAgent",
    department: "Manufacturing",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a CNC manufacturing specialist. Determine the optimal machining strategy, toolpaths, fixtures, and cycle times. Respond with valid JSON only.`,
    userPromptTemplate: `Create manufacturing plan for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "machiningStrategy": "<strategy>",
  "setupCount": <number>,
  "estimatedCycleTimeMinutes": <number>,
  "toolList": [{"tool": "<tool>", "operation": "<op>"}],
  "fixtureRequirements": "<fixture description>",
  "cncProgram": "<approach>",
  "totalLeadTimeDays": <number>,
  "estimatedDays": <number>,
  "confidence": <0-1>,
  "reasoning": "<manufacturing analysis>"
}`,
  },
  {
    name: "CostAgent",
    department: "Cost Estimation",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a cost estimation specialist for aerospace manufacturing. Calculate detailed cost breakdowns including material, labor, overhead, and tooling costs. Respond with valid JSON only.`,
    userPromptTemplate: `Calculate costs for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "materialCost": <number>,
  "laborCost": <number>,
  "overheadCost": <number>,
  "toolingCost": <number>,
  "totalCost": <number>,
  "costPerUnit": <number>,
  "marginRecommendation": <percent>,
  "quotedPrice": <number>,
  "confidence": <0-1>,
  "reasoning": "<cost analysis>"
}`,
  },
  {
    name: "ShippingAgent",
    department: "Shipping",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a shipping and logistics specialist for aerospace parts. Determine packaging, shipping methods, and delivery timelines considering aerospace handling requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Plan shipping for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "packagingMethod": "<method>",
  "shippingMethod": "<ground|air|expedited>",
  "estimatedShippingDays": <number>,
  "shippingCost": <number>,
  "specialHandling": ["<requirement1>"],
  "documentation": ["<doc1>"],
  "confidence": <0-1>,
  "reasoning": "<shipping analysis>"
}`,
  },
  {
    name: "ComplianceAgent",
    department: "Compliance",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are an AS9100/ITAR compliance specialist. Evaluate the manufacturing request for regulatory compliance, export controls, and certification requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Evaluate compliance for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Respond with JSON:
{
  "as9100Compliant": <boolean>,
  "itarControlled": <boolean>,
  "exportLicense": "<required|not_required>",
  "certifications": ["<cert1>"],
  "riskLevel": "<low|medium|high>",
  "complianceNotes": ["<note1>"],
  "confidence": <0-1>,
  "reasoning": "<compliance analysis>"
}`,
  },
  {
    name: "CNCProgrammingAgent",
    department: "CNC Programming",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a senior CNC programmer and manufacturing engineer with 25+ years on the shop floor creating DETAILED SHOP-FLOOR ROUTING SHEETS for aerospace manufacturing. You write the actual operation-by-operation routing that goes to the machine operator — with operation numbers (OP-10, OP-20, OP-30...), specific machine assignments (e.g., HAAS VF-3 MACH21, HAAS ST-20 LATHE03), workholding (vise, fixture, collet, soft jaws), and step-by-step machining instructions including stock removal amounts, surface finish requirements, and tool callouts.

CRITICAL: Each machining instruction MUST reference the BUBBLE ANNOTATION NUMBERS from the engineering drawing. For example: "MACHINE OUTSIDE PROFILE (REF BUBBLE 1, 2, 3)" or "DRILL & TAP 1/4-20 x 4 PLACES (REF BUBBLE 7, 8, 9, 10)". The bubble numbers tie the routing back to the drawing and forward to the inspection plan. NOTE: Actual G-code requires Digital Twin integration. Respond with valid JSON only.`,
    userPromptTemplate: `Create a DETAILED SHOP-FLOOR ROUTING SHEET for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

Generate a real shop-floor routing sheet. Each operation must include:
- Operation number (OP-10, OP-20, OP-30...)
- Machine assignment with machine ID (e.g., CNC HAAS VF-3 MACH21)
- Workholding method (VISE, 6" KURT VISE, FIXTURE, SOFT JAWS, etc.)
- Specific machining instructions WITH BUBBLE REFERENCES (e.g., MACHINE OUTSIDE PROFILE (REF BUBBLE 1, 2, 3))
- Stock removal amounts, surface finish requirements, tool callouts
- Include DEBURR, INSPECT, WASH, and OUTSIDE PROCESS operations

CRITICAL: You MUST generate:
1. A SEPARATE HAAS G&M CODE PROGRAM for EVERY CNC machining operation (O0001 for OP-10, O0002 for OP-20, O0003 for OP-30, etc.). Each program must be complete with header comments, tool changes, speeds/feeds, cutter comp, and proper HAAS format (G90/G54/G17, G28, M30, %). Non-CNC operations (deburr, inspect, wash, outside process) do NOT get programs.
2. A STAGE DRAWING DESCRIPTION for EVERY operation showing what the part looks like AFTER that operation completes — machined features visible, remaining raw stock, workholding setup, and key dimensions. Include a title like "AFTER OP-10: OUTSIDE PROFILE MACHINED".

Example:
OP-10: CNC HAAS VF-3 MACH21 / VISE - MACHINE OUTSIDE PROFILE (REF BUBBLE 1, 2, 3), FLY CUT FACE REMOVE .050 (REF BUBBLE 4)
OP-20: CNC HAAS VF-3 MACH21 / FLIP IN VISE - MACHINE INSIDE POCKET .005 FINISH PASS (REF BUBBLE 5, 6), DRILL & TAP 1/4-20 x 4 PLACES (REF BUBBLE 7, 8, 9, 10)
OP-30: DEBURR - BENCH / BREAK ALL SHARP EDGES .005-.010 (REF BUBBLE 11)
OP-40: INSPECT - CMM / FIRST ARTICLE INSPECTION PER AS9102 (REF ALL BUBBLES)
OP-50: OUTSIDE PROCESS - ANODIZE TYPE III PER MIL-A-8625 (REF BUBBLE 12)

Respond with JSON:
{
  "routingSheet": {"partNumber": "<if visible>", "revision": "<if visible>", "material": "<with spec>", "stockSize": "<raw stock dims>"},
  "operations": [{"opNumber": "OP-10", "machine": "<e.g., CNC HAAS VF-3 MACH21>", "workholding": "<e.g., 6 IN KURT VISE>", "instructions": ["MACHINE OUTSIDE PROFILE (REF BUBBLE 1, 2, 3)", "FLY CUT FACE REMOVE .050 (REF BUBBLE 4)"], "bubbleRefs": [1, 2, 3, 4], "tools": ["1/2 IN 3-FLUTE ENDMILL"], "surfaceFinish": "<if applicable>", "cycleTime": "<est>"}],
  "totalOperations": <number>,
  "totalEstimatedCycleTime": "<total>",
  "totalEstimatedSetupTime": "<total>",
  "machinesRequired": ["<unique machines>"],
  "criticalFeatures": ["<special attention>"],
  "programs": [
    {
      "programNumber": "O0001",
      "opNumber": "OP-10",
      "machine": "HAAS VF-3",
      "gcode": "O0001 (PART NAME - OP-10 OUTSIDE PROFILE)\n(HAAS VF-3 MACH21 / T01 1/2 3FL EM)\n(DATE: 2026-02-13 / PROGRAMMER: GUARDIAN OS)\nG90 G54 G17\nG28 G91 Z0.\nT01 M06 (1/2 3-FLUTE CARBIDE ENDMILL)\nS8000 M03\nG43 H01 Z1.0\nG00 X-1.0 Y-1.0\nZ0.1\nG01 Z-0.250 F15.0 (ROUGH PASS 1)\nG41 D01 X0. Y0. F40.0\nG01 X4.000 Y0.\nG01 X4.000 Y3.000\nG01 X0. Y3.000\nG01 X0. Y0.\nG40 X-1.0 Y-1.0\nG00 Z0.1\nG01 Z-0.500 F12.0 (ROUGH PASS 2)\nG41 D01 X0. Y0. F40.0\nG01 X4.000 Y0.\nG01 X4.000 Y3.000\nG01 X0. Y3.000\nG01 X0. Y0.\nG40 X-1.0 Y-1.0\nG00 Z1.0\nM09\nG28 G91 Z0.\nM01 (OPTIONAL STOP - INSPECT)\nM30\n%"
    },
    {
      "programNumber": "O0002",
      "opNumber": "OP-20",
      "machine": "HAAS VF-3",
      "gcode": "O0002 (PART NAME - OP-20 POCKET & HOLES)\n(HAAS VF-3 MACH21 / T02 3/8 2FL EM, T03 #7 DRILL, T04 1/4-20 TAP)\n(DATE: 2026-02-13 / PROGRAMMER: GUARDIAN OS)\nG90 G54 G17\nG28 G91 Z0.\nT02 M06 (3/8 2-FLUTE CARBIDE ENDMILL)\nS10000 M03\nG43 H02 Z1.0\n(POCKET ROUGH - HELICAL ENTRY)\nG00 X2.000 Y1.500\nZ0.1\nG01 Z-0.100 F8.0\nG02 X2.100 Y1.500 I0.050 J0. F30.0\n(POCKET PROFILE)\nG01 X3.000 Y0.500 F35.0\nG01 X3.000 Y2.500\nG01 X1.000 Y2.500\nG01 X1.000 Y0.500\nG01 X3.000 Y0.500\nG00 Z1.0\nM09\nT03 M06 (#7 DRILL - 0.201 DIA)\nS4000 M03\nG43 H03 Z1.0\nG00 X0.500 Y0.500\nG83 Z-0.750 R0.1 Q0.150 F12.0 (PECK DRILL)\nX3.500 Y0.500\nX3.500 Y2.500\nX0.500 Y2.500\nG80\nG00 Z1.0\nT04 M06 (1/4-20 SPIRAL FLUTE TAP)\nS800 M03\nG43 H04 Z1.0\nG84 X0.500 Y0.500 Z-0.625 R0.1 F40.0 (TAP 4X)\nX3.500 Y0.500\nX3.500 Y2.500\nX0.500 Y2.500\nG80\nG00 Z1.0\nM09\nG28 G91 Z0.\nM01\nM30\n%"
    }
  ],
  "stageDrawings": [
    {
      "opNumber": "OP-10",
      "title": "AFTER OP-10: OUTSIDE PROFILE MACHINED",
      "description": "Part clamped in 6-inch Kurt vise on parallels. Outside profile machined to final dimensions 4.000 x 3.000 x 0.500. Top face fly-cut for cleanup. All outside edges at finish dimension. Part still has raw stock appearance on bottom face (vise side). Four corner radii visible from endmill cutter radius.",
      "machinedFeatures": ["Outside profile 4.000 x 3.000", "Top face fly-cut to thickness", "Corner radii from 1/2 endmill"],
      "remainingStock": "Bottom face unfinished, no pocket, no holes, no chamfers",
      "fixturing": "6-inch Kurt vise on parallels, part sitting on 0.500 parallels, clamping on Y-axis sides"
    },
    {
      "opNumber": "OP-20",
      "title": "AFTER OP-20: POCKET & HOLES COMPLETE",
      "description": "Part flipped in vise (machined face down on parallels). Center pocket machined 2.000 x 2.000 x 0.250 deep with square corners cleaned up. Four 1/4-20 tapped holes at corners, drilled through with #7 drill and tapped to 0.625 depth. Bottom face (now top) fly-cut for cleanup. All critical dimensions now machined.",
      "machinedFeatures": ["Center pocket 2.000 x 2.000 x 0.250 deep", "4x 1/4-20 tapped holes through", "Bottom face fly-cut"],
      "remainingStock": "Deburr needed on all edges, sharp edges from pocket and holes need chamfer/break",
      "fixturing": "6-inch Kurt vise, machined face down on parallels, clamping on Y-axis sides"
    }
  ],
  "digitalTwinNote": "Default HAAS G&M code format. Customer-specific post-processor (Mazak, Okuma, Fanuc, DMG MORI) on onboarding. Full collision detection requires Digital Twin.",
  "confidence": <0-1>,
  "reasoning": "<routing rationale>"
}`,
  },
  {
    name: "OutsideProcessesAgent",
    department: "Outside Processes",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an outside processes coordinator for aerospace manufacturing. Most shops do NOT have heat treatment, plating, anodizing, NDT, specialty grinding, or surface finishing in-house. Identify which operations must go to external specialty vendors, specify certifications and specs, estimate costs and lead times, and create PO requirements. You understand Nadcap, AMS, MIL-SPEC, and ASTM requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Outside processes analysis for "{{fileName}}"
Material: {{material}}, Qty: {{quantity}}, Complexity: {{complexity}}/10
{{drawingDescription}}

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
    target: "backend",
    needsVision: false,
    systemPrompt: `You are Guardian's meta-cognitive agent. You receive the outputs of ALL other agents and perform cross-domain analysis. Identify inconsistencies, optimize the overall recommendation, and adjust confidence levels. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all agent outputs for "{{fileName}}":
{{agentOutputs}}

Analyze cross-domain patterns:
1. Are there inconsistencies between agents?
2. Is the pricing aligned with the manufacturing complexity?
3. Are lead times realistic given procurement and manufacturing estimates?
4. Are there risks that individual agents missed?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "inconsistencies": ["<issue1>"],
  "adjustments": [{"agent": "<name>", "field": "<field>", "reason": "<why>"}],
  "optimizedConfidence": <0-1>,
  "riskFlags": ["<flag1>"],
  "recommendation": "<final recommendation>",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis>"
}`,
  },
];

// ─── Defense Kill Chain Domain ─────────────────────────────────────

export const DEFENSE_KILL_CHAIN_AGENTS: SharedAgentDefinition[] = [
  {
    name: "ISRAgent",
    department: "ISR / Intelligence",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an ISR (Intelligence, Surveillance, Reconnaissance) analyst. Analyze the threat scenario and provide intelligence assessment. Respond with valid JSON only.`,
    userPromptTemplate: `ISR analysis for scenario: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "threatClassification": "<classification>",
  "intelligenceConfidence": "<low|medium|high>",
  "sensorAssets": ["<asset1>"],
  "collectionPlan": "<plan>",
  "confidence": <0-1>,
  "reasoning": "<ISR analysis>"
}`,
  },
  {
    name: "TargetingAgent",
    department: "Targeting",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a targeting analyst. Develop target packages based on ISR intelligence. Respond with valid JSON only.`,
    userPromptTemplate: `Targeting analysis for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "targetPriority": "<critical|high|medium|low>",
  "targetType": "<type>",
  "weaponSolution": "<recommended>",
  "collateralEstimate": "<low|medium|high>",
  "confidence": <0-1>,
  "reasoning": "<targeting analysis>"
}`,
  },
  {
    name: "WeaponsAgent",
    department: "Weapons",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a weapons systems officer. Select optimal weapons and delivery methods. Respond with valid JSON only.`,
    userPromptTemplate: `Weapons selection for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "selectedWeapon": "<weapon>",
  "deliveryMethod": "<method>",
  "effectivenessEstimate": <0-1>,
  "ammunitionRequired": <number>,
  "confidence": <0-1>,
  "reasoning": "<weapons analysis>"
}`,
  },
  {
    name: "C2Agent",
    department: "Command & Control",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a command and control officer. Coordinate all elements of the kill chain and make engagement decisions. Respond with valid JSON only.`,
    userPromptTemplate: `C2 assessment for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "engagementDecision": "<engage|hold|abort>",
  "authorityLevel": "<level>",
  "coordinationRequirements": ["<req1>"],
  "communicationPlan": "<plan>",
  "confidence": <0-1>,
  "reasoning": "<C2 analysis>"
}`,
  },
  {
    name: "LegalAgent",
    department: "Legal / ROE",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a military legal advisor. Evaluate the engagement against Rules of Engagement and Law of Armed Conflict. Respond with valid JSON only.`,
    userPromptTemplate: `Legal review for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "roeCompliant": <boolean>,
  "loacCompliance": <boolean>,
  "proportionalityAssessment": "<assessment>",
  "recommendation": "<approve|deny|conditional>",
  "legalCaveats": ["<caveat1>"],
  "confidence": <0-1>,
  "reasoning": "<legal analysis>"
}`,
  },
  {
    name: "EWAgent",
    department: "Electronic Warfare",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an electronic warfare specialist. Assess the electromagnetic environment and recommend EW measures. Respond with valid JSON only.`,
    userPromptTemplate: `EW assessment for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "emThreatLevel": "<low|medium|high>",
  "jammingRecommendation": "<recommendation>",
  "signatureManagement": "<approach>",
  "ewAssets": ["<asset1>"],
  "confidence": <0-1>,
  "reasoning": "<EW analysis>"
}`,
  },
  {
    name: "LogisticsAgent",
    department: "Logistics",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a military logistics officer. Plan supply chain, fuel, ammunition, and support requirements. Respond with valid JSON only.`,
    userPromptTemplate: `Logistics plan for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "supplyRequirements": ["<req1>"],
  "fuelEstimate": "<estimate>",
  "sustainmentPlan": "<plan>",
  "medicalSupport": "<level>",
  "confidence": <0-1>,
  "reasoning": "<logistics analysis>"
}`,
  },
  {
    name: "CyberAgent",
    department: "Cyber Operations",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a cyber operations specialist. Assess cyber threats and recommend offensive/defensive cyber measures. Respond with valid JSON only.`,
    userPromptTemplate: `Cyber assessment for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "cyberThreatLevel": "<low|medium|high>",
  "vulnerabilities": ["<vuln1>"],
  "offensiveOptions": ["<option1>"],
  "defensiveMeasures": ["<measure1>"],
  "confidence": <0-1>,
  "reasoning": "<cyber analysis>"
}`,
  },
  {
    name: "BDAAgent",
    department: "Battle Damage Assessment",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a battle damage assessment analyst. Plan post-engagement assessment and re-engagement criteria. Respond with valid JSON only.`,
    userPromptTemplate: `BDA plan for: "{{fileName}}"
Environment: {{material}}, Threat Level: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "assessmentMethod": "<method>",
  "reengagementCriteria": "<criteria>",
  "expectedEffects": "<effects>",
  "timelineMinutes": <number>,
  "confidence": <0-1>,
  "reasoning": "<BDA analysis>"
}`,
  },
  {
    name: "DefenseReflectionAgent",
    department: "Reflection & Adjust",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are the kill chain meta-cognitive agent. Review all domain outputs and identify gaps, risks, and optimization opportunities. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all kill chain outputs for: "{{fileName}}"
{{agentOutputs}}

Analyze:
1. Is the kill chain complete and coherent?
2. Are there gaps between ISR, targeting, and weapons?
3. Is the legal assessment aligned with the engagement decision?
4. What risks did individual agents miss?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "killChainGaps": ["<gap1>"],
  "riskFlags": ["<flag1>"],
  "optimizedConfidence": <0-1>,
  "recommendation": "<final recommendation>",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis>"
}`,
  },
];

// ─── Medical Dispatch Domain ──────────────────────────────────────

export const MEDICAL_DISPATCH_AGENTS: SharedAgentDefinition[] = [
  {
    name: "TriageAgent",
    department: "Triage",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an emergency triage specialist. Assess patient acuity using ESI (Emergency Severity Index). Respond with valid JSON only.`,
    userPromptTemplate: `Triage assessment for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "esiLevel": <1-5>,
  "chiefComplaint": "<complaint>",
  "vitalSigns": "<assessment>",
  "immediateInterventions": ["<intervention1>"],
  "confidence": <0-1>,
  "reasoning": "<triage analysis>"
}`,
  },
  {
    name: "DispatchAgent",
    department: "Dispatch",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an EMS dispatch coordinator. Determine optimal unit dispatch, routing, and resource allocation. Respond with valid JSON only.`,
    userPromptTemplate: `Dispatch plan for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "unitType": "<ALS|BLS|specialty>",
  "unitsDispatched": <number>,
  "estimatedResponseMinutes": <number>,
  "routingPriority": "<code3|code2|code1>",
  "confidence": <0-1>,
  "reasoning": "<dispatch analysis>"
}`,
  },
  {
    name: "MedicalDirectorAgent",
    department: "Medical Direction",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are an emergency medical director. Provide medical oversight, protocol guidance, and treatment authorization. Respond with valid JSON only.`,
    userPromptTemplate: `Medical direction for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "protocolActivated": "<protocol>",
  "standingOrders": ["<order1>"],
  "medicationAuthorization": ["<med1>"],
  "transportDecision": "<immediate|delayed|none>",
  "confidence": <0-1>,
  "reasoning": "<medical direction>"
}`,
  },
  {
    name: "PharmacyAgent",
    department: "Pharmacy",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an emergency pharmacy specialist. Recommend medications, dosages, and drug interactions. Respond with valid JSON only.`,
    userPromptTemplate: `Pharmacy assessment for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "medications": [{"drug": "<name>", "dose": "<dose>", "route": "<IV|IM|PO>"}],
  "contraindications": ["<contra1>"],
  "drugInteractions": ["<interaction1>"],
  "confidence": <0-1>,
  "reasoning": "<pharmacy analysis>"
}`,
  },
  {
    name: "TraumaAgent",
    department: "Trauma",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a trauma specialist. Assess injury patterns and recommend trauma interventions. Respond with valid JSON only.`,
    userPromptTemplate: `Trauma assessment for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "traumaLevel": "<1|2|3>",
  "injuryPattern": "<pattern>",
  "interventions": ["<intervention1>"],
  "surgicalNeeds": "<immediate|delayed|none>",
  "confidence": <0-1>,
  "reasoning": "<trauma analysis>"
}`,
  },
  {
    name: "ERPrepAgent",
    department: "ER Preparation",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are an ER preparation coordinator. Prepare the emergency room for incoming patients. Respond with valid JSON only.`,
    userPromptTemplate: `ER prep for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "roomAssignment": "<trauma_bay|resus|standard>",
  "teamActivation": ["<team1>"],
  "equipmentReady": ["<equip1>"],
  "bloodProducts": "<type_and_screen|crossmatch|MTP>",
  "confidence": <0-1>,
  "reasoning": "<ER prep analysis>"
}`,
  },
  {
    name: "BillingAgent",
    department: "Billing",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a medical billing specialist. Estimate charges and insurance coding. Respond with valid JSON only.`,
    userPromptTemplate: `Billing estimate for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "estimatedCharges": <number>,
  "cptCodes": ["<code1>"],
  "icdCodes": ["<code1>"],
  "insuranceCategory": "<category>",
  "confidence": <0-1>,
  "reasoning": "<billing analysis>"
}`,
  },
  {
    name: "MedComplianceAgent",
    department: "Compliance",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a healthcare compliance officer. Evaluate EMTALA, HIPAA, and regulatory compliance. Respond with valid JSON only.`,
    userPromptTemplate: `Compliance review for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "emtalaCompliant": <boolean>,
  "hipaaConsiderations": ["<consideration1>"],
  "regulatoryFlags": ["<flag1>"],
  "documentationRequired": ["<doc1>"],
  "confidence": <0-1>,
  "reasoning": "<compliance analysis>"
}`,
  },
  {
    name: "NotificationAgent",
    department: "Notifications",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a medical notification coordinator. Manage alerts to family, specialists, and hospital administration. Respond with valid JSON only.`,
    userPromptTemplate: `Notification plan for: "{{fileName}}"
Scene: {{material}}, Severity: {{complexity}}/10
{{scenarioText}}

Respond with JSON:
{
  "notifications": [{"recipient": "<who>", "priority": "<immediate|routine>", "method": "<page|call|text>"}],
  "specialistAlerts": ["<specialist1>"],
  "adminNotifications": ["<notification1>"],
  "confidence": <0-1>,
  "reasoning": "<notification analysis>"
}`,
  },
  {
    name: "MedReflectionAgent",
    department: "Reflection & Adjust",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are the medical dispatch meta-cognitive agent. Review all department outputs for coherence and patient safety. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all medical outputs for: "{{fileName}}"
{{agentOutputs}}

Analyze:
1. Is the triage level appropriate for the interventions planned?
2. Are medications consistent with the diagnosis?
3. Is the ER preparation aligned with the expected patient condition?
4. Are there patient safety risks that individual agents missed?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "safetyFlags": ["<flag1>"],
  "adjustments": [{"agent": "<name>", "field": "<field>", "reason": "<why>"}],
  "optimizedConfidence": <0-1>,
  "recommendation": "<final recommendation>",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis>"
}`,
  },
];

// ─── Self-Help Legal Domain ──────────────────────────────────────

export const LEGAL_SELF_HELP_AGENTS: SharedAgentDefinition[] = [
  {
    name: "CaseAnalysisAgent",
    department: "Case Analysis",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a legal case analyst specializing in self-help litigation. Analyze the user's situation, identify the legal theories that apply, determine the cause of action, and assess the strength of their case. Consider both plaintiff and defendant perspectives. You must identify the specific area of law (landlord-tenant, family, small claims, employment, consumer protection, etc.). Respond with valid JSON only.`,
    userPromptTemplate: `Analyze this legal situation:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "legalCategory": "<landlord_tenant|family|small_claims|employment|consumer|contract|personal_injury|housing|civil_rights>",
  "causeOfAction": ["<cause1>", "<cause2>"],
  "legalTheories": ["<theory1>", "<theory2>"],
  "caseStrength": "<strong|moderate|weak>",
  "keyFacts": ["<fact1>", "<fact2>"],
  "opposingArguments": ["<arg1>", "<arg2>"],
  "estimatedDamages": "<amount or description>",
  "courtType": "<small_claims|district|superior|family|housing>",
  "confidence": <0-1>,
  "reasoning": "<case analysis>"
}`,
  },
  {
    name: "PrecedentAgent",
    department: "Precedent Research",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a legal research specialist. Find relevant case law precedents that support the user's position. Identify landmark cases, recent rulings, and state-specific precedents. Provide case citations in proper legal format. Focus on cases that a self-represented litigant can cite effectively. Respond with valid JSON only.`,
    userPromptTemplate: `Research precedents for this case:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "relevantCases": [{"caseName": "<name>", "citation": "<citation>", "year": <year>, "relevance": "<how it applies>", "holding": "<key ruling>"}],
  "landmarkPrecedents": [{"caseName": "<name>", "citation": "<citation>", "principle": "<legal principle established>"}],
  "stateSpecificCases": [{"caseName": "<name>", "citation": "<citation>", "relevance": "<relevance>"}],
  "legalPrinciples": ["<principle1>", "<principle2>"],
  "confidence": <0-1>,
  "reasoning": "<precedent research summary>"
}`,
  },
  {
    name: "StatuteAgent",
    department: "Statute & Code",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a statutory law specialist. Identify all applicable state statutes, federal laws, local ordinances, and administrative codes relevant to the user's case. Provide exact statute numbers and sections. Focus on the specific state jurisdiction provided. Respond with valid JSON only.`,
    userPromptTemplate: `Identify applicable statutes:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "stateStatutes": [{"code": "<statute number>", "title": "<title>", "section": "<section>", "relevance": "<how it applies>"}],
  "federalLaws": [{"code": "<USC section>", "title": "<title>", "relevance": "<relevance>"}],
  "localOrdinances": [{"code": "<ordinance>", "relevance": "<relevance>"}],
  "statuteOfLimitations": "<timeframe and statute>",
  "keyProvisions": ["<provision1>", "<provision2>"],
  "penalties": "<available penalties or remedies under statute>",
  "confidence": <0-1>,
  "reasoning": "<statutory analysis>"
}`,
  },
  {
    name: "DocumentDraftingAgent",
    department: "Document Drafting",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a legal document drafting specialist for self-represented litigants. Draft complete, court-ready legal documents including complaints, petitions, motions, and declarations. Use proper legal formatting, numbered paragraphs, and correct legal terminology. Documents must comply with the specific state's court rules. Include all required sections: caption, body, prayer for relief, verification, and certificate of service. Respond with valid JSON only.`,
    userPromptTemplate: `Draft legal documents for filing:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "documents": [
    {
      "documentType": "<complaint|petition|motion|declaration|summons|proof_of_service>",
      "title": "<full document title>",
      "content": "<complete document text with numbered paragraphs, proper formatting, and all required sections>",
      "instructions": "<filing instructions for this document>"
    }
  ],
  "filingOrder": ["<doc1>", "<doc2>"],
  "additionalFormsNeeded": ["<form1>"],
  "confidence": <0-1>,
  "reasoning": "<drafting strategy>"
}`,
  },
  {
    name: "FilingRequirementsAgent",
    department: "Filing Requirements",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a court filing specialist. Determine exact filing requirements for the specific court and jurisdiction — fees, number of copies, filing methods (in-person, e-file, mail), service requirements, and deadlines. Provide step-by-step filing instructions a self-represented person can follow. Respond with valid JSON only.`,
    userPromptTemplate: `Determine filing requirements:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "courtName": "<specific court>",
  "courtAddress": "<address>",
  "filingFee": <amount>,
  "feeWaiverAvailable": <boolean>,
  "feeWaiverForm": "<form number if available>",
  "filingMethod": ["<in_person|e_file|mail>"],
  "copiesRequired": <number>,
  "serviceRequirements": {"method": "<personal|certified_mail|substituted>", "deadline": "<timeframe>", "proofRequired": "<form>"},
  "deadlines": [{"action": "<action>", "deadline": "<timeframe>", "consequence": "<if missed>"}],
  "stepByStep": ["<step1>", "<step2>", "<step3>"],
  "confidence": <0-1>,
  "reasoning": "<filing analysis>"
}`,
  },
  {
    name: "LegalComplianceAgent",
    department: "Legal Compliance",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are a legal compliance and ethics specialist. Review all legal documents and strategies for compliance with court rules, ethical requirements, and proper legal procedure. Ensure documents meet formatting requirements, include required disclaimers, and do not contain frivolous claims. Add the required self-represented litigant disclaimer. Respond with valid JSON only.`,
    userPromptTemplate: `Review compliance for:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "courtRulesCompliant": <boolean>,
  "formattingIssues": ["<issue1>"],
  "requiredDisclaimers": ["<disclaimer1>"],
  "ethicalConcerns": ["<concern1>"],
  "frivolousRisk": "<none|low|medium|high>",
  "proceduralRequirements": ["<req1>"],
  "selfRepDisclaimer": "<required disclaimer text>",
  "confidence": <0-1>,
  "reasoning": "<compliance review>"
}`,
  },
  {
    name: "StrategyAgent",
    department: "Legal Strategy",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a litigation strategy specialist for self-represented litigants. Develop a comprehensive legal strategy including recommended approach, timeline, potential outcomes, settlement considerations, and courtroom preparation tips. Be realistic about chances of success and potential risks. Respond with valid JSON only.`,
    userPromptTemplate: `Develop legal strategy for:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "recommendedApproach": "<approach>",
  "strategySteps": [{"step": <number>, "action": "<action>", "timeline": "<when>", "purpose": "<why>"}],
  "settlementConsideration": {"recommended": <boolean>, "suggestedAmount": "<amount or range>", "reasoning": "<why>"},
  "potentialOutcomes": [{"outcome": "<outcome>", "likelihood": "<high|medium|low>"}],
  "risks": ["<risk1>"],
  "courtPreparation": ["<tip1>", "<tip2>"],
  "estimatedTimeline": "<total time from filing to resolution>",
  "confidence": <0-1>,
  "reasoning": "<strategy analysis>"
}`,
  },
  {
    name: "DamagesAgent",
    department: "Damages Assessment",
    target: "frontend",
    needsVision: false,
    systemPrompt: `You are a damages assessment specialist. Calculate all potential damages the user may be entitled to — compensatory, statutory, punitive, attorney fees, court costs, and any state-specific multipliers or penalties. Provide a detailed breakdown with legal basis for each category. Respond with valid JSON only.`,
    userPromptTemplate: `Assess damages for:
State/Jurisdiction: {{material}}
Case Description: {{scenarioText}}

Respond with JSON:
{
  "compensatoryDamages": {"amount": <number>, "basis": "<legal basis>"},
  "statutoryDamages": {"amount": <number>, "statute": "<statute>", "multiplier": "<if applicable>"},
  "punitiveDamages": {"available": <boolean>, "estimatedRange": "<range>", "basis": "<legal basis>"},
  "courtCosts": <number>,
  "otherRecoverable": [{"type": "<type>", "amount": <number>, "basis": "<basis>"}],
  "totalEstimatedRecovery": "<range>",
  "confidence": <0-1>,
  "reasoning": "<damages analysis>"
}`,
  },
  {
    name: "LegalReflectionAgent",
    department: "Reflection & Adjust",
    target: "backend",
    needsVision: false,
    systemPrompt: `You are the legal domain meta-cognitive agent. Review all department outputs for coherence, legal accuracy, and strategic alignment. Ensure the case theory is consistent across all documents, the precedents support the statutes cited, the damages align with the cause of action, and the filing requirements match the court identified. This is the Ara reflection cycle. Respond with valid JSON only.`,
    userPromptTemplate: `Reflect on all legal outputs for: "{{fileName}}"
{{agentOutputs}}

Analyze:
1. Is the case theory consistent across all agents?
2. Do the cited precedents support the statutory claims?
3. Are the damages realistic and legally supported?
4. Are the documents complete and court-ready?
5. Are there procedural risks the individual agents missed?

Respond with JSON:
{
  "overallAssessment": "<assessment>",
  "consistencyIssues": ["<issue1>"],
  "adjustments": [{"agent": "<name>", "field": "<field>", "reason": "<why>"}],
  "caseViability": "<strong|moderate|weak|not_recommended>",
  "criticalWarnings": ["<warning1>"],
  "optimizedConfidence": <0-1>,
  "recommendation": "<final recommendation>",
  "confidence": <0-1>,
  "reasoning": "<meta-analysis>"
}`,
  },
];

// ─── Domain Registry ──────────────────────────────────────────────

export function getAgentDefinitionsForDomain(domain: string): SharedAgentDefinition[] {
  switch (domain.toLowerCase()) {
    case 'manufacturing':
    case 'aerospace':
      return MANUFACTURING_AGENTS;
    case 'defense':
    case 'killchain':
    case 'kill_chain':
    case 'military':
      return DEFENSE_KILL_CHAIN_AGENTS;
    case 'medical':
    case 'medical_dispatch':
    case 'healthcare':
    case 'ems':
      return MEDICAL_DISPATCH_AGENTS;
    case 'legal':
    case 'legal_self_help':
    case 'self_help_legal':
    case 'law':
      return LEGAL_SELF_HELP_AGENTS;
    default:
      return MANUFACTURING_AGENTS;
  }
}

/** Build user prompt from template and input values */
export function buildUserPrompt(
  template: string,
  input: {
    fileName: string;
    material?: string;
    quantity?: number;
    complexity?: number;
    drawingDescription?: string;
    scenarioText?: string;
    agentOutputs?: string;
    state?: string;
  }
): string {
  return template
    .replace(/\{\{fileName\}\}/g, input.fileName || '')
    .replace(/\{\{material\}\}/g, input.material || input.state || 'Aluminum 6061-T6')
    .replace(/\{\{quantity\}\}/g, String(input.quantity || 1))
    .replace(/\{\{complexity\}\}/g, String(input.complexity || 5))
    .replace(/\{\{drawingDescription\}\}/g, input.drawingDescription ? `Drawing analysis:\n${input.drawingDescription}` : '')
    .replace(/\{\{scenarioText\}\}/g, input.scenarioText || '')
    .replace(/\{\{agentOutputs\}\}/g, input.agentOutputs || '');
}
