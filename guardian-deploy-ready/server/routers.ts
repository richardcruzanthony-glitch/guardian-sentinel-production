import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { runAllAgents, getAgentsForDomain } from "./agents";
import { generateImage } from "./_core/imageGeneration";
import { saveManufacturingQuote, getManufacturingQuotes, saveLearningMetric, getLearningMetrics, saveAgentLog, getAgentLogs, saveCompliancePackage, getCompliancePackages, saveLead, getLeads, saveVisitorMessage, getVisitorMessages } from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Guardian OS — Dynamic Domain-Driven Processing
  guardian: router({
    /**
     * Get available agents for a domain
     */
    getAgents: publicProcedure
      .input(z.object({ domain: z.string().default('manufacturing') }))
      .query(({ input }) => {
        const agents = getAgentsForDomain(input.domain);
        return agents.map(a => ({ name: a.name, department: a.department }));
      }),

    /**
     * Upload an engineering drawing and get S3 URL
     */
    uploadDrawing: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string().default('image/jpeg'),
      }))
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.fileData, 'base64');
          const suffix = Math.random().toString(36).substring(2, 10);
          const fileKey = `drawings/${Date.now()}-${suffix}-${input.fileName}`;
          const { url } = await storagePut(fileKey, buffer, input.contentType);
          return { success: true, url, fileKey };
        } catch (error) {
          console.error('Upload error:', error);
          throw new Error(`Failed to upload drawing: ${String(error)}`);
        }
      }),

    /**
     * Process a manufacturing request through ALL domain agents in parallel
     * This is the core Guardian OS demo endpoint
     */
    processRequest: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number().optional(),
        complexity: z.number().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
        imageUrl: z.string().optional(),
        domain: z.string().default('manufacturing'),
        agentNames: z.array(z.string()).optional(), // Hybrid routing: only run these agents on backend
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await runAllAgents({
            fileName: input.fileName,
            fileSize: input.fileSize,
            complexity: input.complexity,
            material: input.material,
            quantity: input.quantity,
            imageUrl: input.imageUrl,
          }, input.domain, input.agentNames);

          // Send notification to owner
          try {
            await notifyOwner({
              title: `Guardian OS — ${input.domain.charAt(0).toUpperCase() + input.domain.slice(1)} Processing Complete`,
              content: `Domain: ${input.domain}\nFile: ${input.fileName}\nAgents: ${result.agents.length}\nParallel Time: ${result.processingTime.toFixed(1)}s\nSpeed Multiplier: ${result.speedMultiplier.toFixed(1)}x\nConfidence: ${(result.summary.confidence * 100).toFixed(0)}%`,
            });
          } catch (e) {
            console.warn('Notification failed:', e);
          }

          return {
            success: true,
            result,
          };
        } catch (error) {
          console.error('Guardian processing error:', error);
          throw new Error(`Failed to process request: ${String(error)}`);
        }
      }),

    /**
     * Generate a stage drawing image for a CNC operation
     */
    generateStageDrawing: publicProcedure
      .input(z.object({
        opNumber: z.string(),
        title: z.string(),
        description: z.string(),
        machinedFeatures: z.array(z.string()),
        remainingStock: z.string(),
        fixturing: z.string().optional(),
        material: z.string().optional(),
        partName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const prompt = `Technical CNC machining stage drawing, engineering blueprint style with dark background and cyan/green line art. Isometric 3D view of a machined metal part.

Part: ${input.partName || 'CNC Machined Part'}
Material: ${input.material || 'Aluminum 6061-T6'}
Stage: ${input.title}

${input.description}

Machined features (shown as finished surfaces with fine crosshatch): ${input.machinedFeatures.join(', ')}
Remaining stock (shown as rough/unmachined): ${input.remainingStock}
${input.fixturing ? `Workholding: ${input.fixturing}` : ''}

Style: Technical engineering illustration, dark navy/black background, parts shown in metallic silver/aluminum color, machined surfaces highlighted in cyan glow, dimensions and callouts shown, vise/fixture shown in gray. Clean, professional, suitable for a manufacturing routing sheet.`;

          const { url } = await generateImage({ prompt });
          return { success: true, url: url || '' };
        } catch (error) {
          console.error('Stage drawing generation error:', error);
          return { success: false, url: '', error: String(error) };
        }
      }),

    /**
     * Process with authentication and save to database
     */
    processAndSave: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number().optional(),
        complexity: z.number().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
        imageUrl: z.string().optional(),
        domain: z.string().default('manufacturing'),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await runAllAgents({
            fileName: input.fileName,
            fileSize: input.fileSize,
            complexity: input.complexity,
            material: input.material,
            quantity: input.quantity,
            imageUrl: input.imageUrl,
          }, input.domain);

          // Save to database
          let quoteId = 0;
          try {
            const quoteResult = await saveManufacturingQuote({
              userId: ctx.user.id,
              fileName: input.fileName,
              fileSize: input.fileSize || 0,
              materialCost: String(result.summary.totalPrice * 0.3),
              laborCost: String(result.summary.totalPrice * 0.4),
              overheadCost: String(result.summary.totalPrice * 0.15),
              totalCost: String(result.summary.totalPrice),
              confidence: String(result.summary.confidence),
              processingTime: result.processingTime,
              results: result as unknown as Record<string, unknown>,
            });
            quoteId = quoteResult?.[0]?.insertId || 0;
          } catch (e) {
            console.warn('Failed to save quote:', e);
          }

          // Save agent logs
          for (const agent of result.agents) {
            try {
              await saveAgentLog({
                quoteId,
                agentName: agent.agentName,
                status: agent.status,
                input: input as unknown as Record<string, unknown>,
                output: agent.data,
                duration: agent.duration,
              });
            } catch (e) {
              console.warn(`Failed to save ${agent.agentName} log:`, e);
            }
          }

          return { success: true, quoteId, result };
        } catch (error) {
          console.error('Guardian processing error:', error);
          throw new Error(`Failed to process request: ${String(error)}`);
        }
      }),
  }),

  // Lead Capture — Demo Requests & Early Access
  leads: router({
    submitDemo: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await saveLead({
            type: 'demo',
            name: input.name,
            email: input.email,
            company: input.company || null,
            message: input.message || null,
          });

          // Notify owner immediately
          try {
            await notifyOwner({
              title: '\u{1F3AF} New Demo Request — Guardian OS',
              content: `Name: ${input.name}\nEmail: ${input.email}\nCompany: ${input.company || 'Not provided'}\nMessage: ${input.message || 'None'}`,
            });
          } catch (e) {
            console.warn('Lead notification failed:', e);
          }

          return { success: true };
        } catch (error) {
          console.error('Demo request error:', error);
          throw new Error('Failed to submit demo request');
        }
      }),

    submitEarlyAccess: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        companySize: z.string().optional(),
        domainsInterested: z.array(z.string()).optional(),
        timeline: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await saveLead({
            type: 'early_access',
            name: input.name,
            email: input.email,
            company: input.company || null,
            companySize: input.companySize || null,
            domainsInterested: input.domainsInterested || null,
            timeline: input.timeline || null,
            message: input.message || null,
          });

          // Notify owner immediately
          try {
            await notifyOwner({
              title: '\u{1F680} New Early Access Signup — Guardian OS',
              content: `Name: ${input.name}\nEmail: ${input.email}\nCompany: ${input.company || 'Not provided'}\nSize: ${input.companySize || 'Not provided'}\nDomains: ${(input.domainsInterested || []).join(', ') || 'Not specified'}\nTimeline: ${input.timeline || 'Not specified'}\nMessage: ${input.message || 'None'}`,
            });
          } catch (e) {
            console.warn('Lead notification failed:', e);
          }

          return { success: true };
        } catch (error) {
          console.error('Early access error:', error);
          throw new Error('Failed to submit early access request');
        }
      }),

    captureROILead: publicProcedure
      .input(z.object({
        email: z.string().email(),
        annualRevenue: z.number().positive(),
        jobsPerMonth: z.number().positive(),
        hoursPerJob: z.number().positive(),
        estimatedAnnualValue: z.number().positive(),
      }))
      .mutation(async ({ input }) => {
        try {
          await saveLead({
            type: 'roi_calculator',
            email: input.email,
            name: 'ROI Calculator Lead',
            company: null,
            message: `ROI: Revenue=$${input.annualRevenue}, Jobs=${input.jobsPerMonth}/mo, Hours=${input.hoursPerJob}/job, Value=$${input.estimatedAnnualValue}/yr`,
          });

          try {
            await notifyOwner({
              title: 'ROI Calculator Lead',
              content: `Email: ${input.email}\nRevenue: $${input.annualRevenue}\nJobs/Month: ${input.jobsPerMonth}\nHours Saved: ${input.hoursPerJob}\nAnnual Value: $${input.estimatedAnnualValue}`,
            });
          } catch (e) {
            console.warn('ROI notification failed:', e);
          }

          return { success: true };
        } catch (error) {
          console.error('ROI lead error:', error);
          throw new Error('Failed to capture ROI lead');
        }
      }),
  }),

  // Visitor Chat — Questions & Comments
  chat: router({
    sendMessage: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        message: z.string().min(1),
        page: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await saveVisitorMessage({
            visitorName: input.name,
            visitorEmail: input.email || null,
            message: input.message,
            page: input.page || null,
          });

          // Notify owner immediately
          try {
            await notifyOwner({
              title: '\u{1F4AC} New Visitor Message — Guardian OS',
              content: `From: ${input.name}${input.email ? ` (${input.email})` : ''}\nPage: ${input.page || 'Unknown'}\n\nMessage:\n${input.message}`,
            });
          } catch (e) {
            console.warn('Chat notification failed:', e);
          }

          return { success: true };
        } catch (error) {
          console.error('Chat message error:', error);
          throw new Error('Failed to send message');
        }
      }),
  }),

  // Legacy endpoints for backward compatibility
  manufacturing: router({
    getQuotes: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input, ctx }) => {
        try {
          return await getManufacturingQuotes(ctx.user.id, input.limit);
        } catch (error) {
          console.error('Get quotes error:', error);
          return [];
        }
      }),

    getLearningMetrics: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getLearningMetrics(ctx.user.id);
      } catch (error) {
        console.error('Get learning metrics error:', error);
        return [];
      }
    }),

    getAgentLogs: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getAgentLogs(input.quoteId);
        } catch (error) {
          console.error('Get agent logs error:', error);
          return [];
        }
      }),

    getCompliancePackages: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getCompliancePackages(input.quoteId);
        } catch (error) {
          console.error('Get compliance packages error:', error);
          return [];
        }
      }),
   }),

  // Sales & Licensing
  sales: router({
    /**
     * Get AI sales response for licensing inquiry
     */
    getSalesResponse: publicProcedure
      .input(z.object({
        userMessage: z.string(),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'agent']),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { invokeLLM } = await import('./_core/llm');
          
          const systemPrompt = `You are the Guardian OS Sales Agent. Your role is to:
1. Pitch three distinct value propositions: Speed (Right to Execute), Safety (Deterministic Shield), Simulation (Digital Twin)
2. Help prospects understand Guardian OS licensing tiers and their business impact
3. Identify sales opportunities and capture lead information
4. Be friendly, professional, and solution-focused

Guardian OS Value Propositions:

1. RIGHT TO EXECUTE (Speed License) - $1,499 Initial
   Pitch: "Turn a complex engineering drawing into an AS9102 FAI package in 3.2 seconds"
   Value: Recover 2-3 weeks of lost lead time (14 days back to your schedule)
   Target: Small businesses needing fast compliance documentation

2. DETERMINISTIC SHIELD (Safety License) - $5,000/Year
   Pitch: "Insurance policy for compliance. Hardened over 12,000 cycles with 0% logic drift"
   Value: Eliminate human error in ISO/AS9100 documentation, protect certification
   Target: Manufacturing companies with AS9100 or ISO 13485 requirements

3. DIGITAL TWIN (Simulation License) - $15,000+/Year
   Pitch: "Digital twin of your entire value chain. Simulate cost, lead time, and compliance before spending a dollar"
   Value: Eliminate estimation risk, optimize operations across manufacturing and legal
   Target: Enterprise customers needing multi-domain visibility

Guardian OS Domains:
- MANUFACTURING: RFQ, routing, compliance (AS9100, FAI, inspection), G-code, procurement
- LEGAL: Contract review, compliance tracking, risk assessment, document management

When you identify a prospect, extract their name, email, company, industry, and which tier/value proposition resonates most.`;

          const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...(input.conversationHistory || []),
            { role: 'user' as const, content: input.userMessage },
          ];

          const response = await invokeLLM({
            messages: messages as any,
          });

          const message = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : 'Thank you for your interest in Guardian OS. How can I help you today?';

          // Lead detection: look for intent to purchase or demo
          const isLead = /email|contact|pricing|demo|trial|purchase|buy|license|interested|manufacturing|legal|contract|compliance|speed|fai|simulation|risk/i.test(input.userMessage);
          
          // Detect which tier resonates
          const speedInterest = /speed|fast|quick|3.2|seconds|lead time|fai|execute/i.test(input.userMessage);
          const safetyInterest = /safety|compliance|audit|certification|error|deterministic|shield|insurance|as9100|iso/i.test(input.userMessage);
          const simulationInterest = /simulation|digital twin|cost|estimate|risk|planning|forecast|what.if/i.test(input.userMessage);
          
          // Extract domain interest
          const manufacturingInterest = /manufacturing|rfc|routing|compliance|as9100|fai|inspection|gcode|procurement/i.test(input.userMessage);
          const legalInterest = /legal|contract|review|compliance|risk|document|management/i.test(input.userMessage);
          
          return {
            message,
            isLead,
            leadInfo: isLead ? {
              name: 'Prospect',
              email: '',
              company: '',
              industry: '',
              tiersInterested: [],
            } : undefined,
          };
        } catch (error) {
          console.error('Sales response error:', error);
          return {
            message: 'I apologize for the technical difficulty. Please contact our sales team at sales@guardiansentinel.io',
            isLead: false,
          };
        }
      }),

    /**
     * Create a license lead from sales inquiry
     */
    createLicenseLead: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        company: z.string().optional(),
        industry: z.string().optional(),
        tiersInterested: z.array(z.string()).optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { saveLicenseLead } = await import('./db');
          
          const leadId = await saveLicenseLead({
            name: input.name,
            email: input.email,
            company: input.company,
            industry: input.industry,
            tiersInterested: input.tiersInterested,
            message: input.message,
          });

          // Notify owner of new lead
          await notifyOwner({
            title: '🎯 New License Lead',
            content: `${input.name} from ${input.company || 'Unknown'} is interested in ${input.tiersInterested?.join(', ') || 'Guardian OS licensing'}. Email: ${input.email}`,
          });

          return { success: true, leadId };
        } catch (error) {
          console.error('Create license lead error:', error);
          throw new Error('Failed to create license lead');
        }
      }),

    /**
     * Get all license leads for dashboard (admin only)
     */
    getAllLeads: protectedProcedure.query(async ({ ctx }) => {
      try {
        // Only admin can view all leads
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: admin access required');
        }
        
        const { getLicenseLeads } = await import('./db');
        const leads = await getLicenseLeads();
        return leads || [];
      } catch (error) {
        console.error('Get all leads error:', error);
        return [];
      }
    }),

    /**
     * Get sales analytics and metrics
     */
    getAnalytics: protectedProcedure.query(async ({ ctx }) => {
      try {
        // Only admin can view analytics
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: admin access required');
        }
        
        const { getLicenseLeads } = await import('./db');
        const leads = await getLicenseLeads();
        
        // Helper function to parse tiersInterested
        const getTiers = (tiers: any): string[] => {
          if (Array.isArray(tiers)) return tiers;
          if (typeof tiers === 'string') {
            try {
              return JSON.parse(tiers);
            } catch {
              return [];
            }
          }
          return [];
        };
        
        // Calculate metrics
        const totalLeads = leads.length;
        const newLeads = leads.filter(l => l.status === 'new').length;
        const contacted = leads.filter(l => l.status === 'contacted').length;
        const quoted = leads.filter(l => l.status === 'quoted').length;
        const converted = leads.filter(l => l.status === 'converted').length;
        const lost = leads.filter(l => l.status === 'lost').length;
        
        const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;
        
        // Revenue calculations
        const starterLeads = leads.filter(l => getTiers(l.tiersInterested).includes('Starter')).length;
        const professionalLeads = leads.filter(l => getTiers(l.tiersInterested).includes('Professional')).length;
        const enterpriseLeads = leads.filter(l => getTiers(l.tiersInterested).includes('Enterprise')).length;
        
        const starterRevenue = leads.filter(l => l.status === 'converted' && getTiers(l.tiersInterested).includes('Starter')).length * 1499;
        const professionalRevenue = leads.filter(l => l.status === 'converted' && getTiers(l.tiersInterested).includes('Professional')).length * 5000;
        const enterpriseRevenue = leads.filter(l => l.status === 'converted' && getTiers(l.tiersInterested).includes('Enterprise')).length * 15000;
        
        const totalRevenue = starterRevenue + professionalRevenue + enterpriseRevenue;
        const pipelineValue = (leads.filter(l => l.status === 'quoted').length * 5000) + 
                             (leads.filter(l => l.status === 'contacted').length * 3000);
        
        // Domain breakdown
        const manufacturingLeads = leads.filter(l => l.industry?.toLowerCase().includes('manufacturing')).length;
        const legalLeads = leads.filter(l => l.industry?.toLowerCase().includes('legal')).length;
        
        // Recent leads (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentLeads = leads.filter(l => new Date(l.createdAt) > sevenDaysAgo).length;
        
        return {
          totalLeads,
          newLeads,
          contacted,
          quoted,
          converted,
          lost,
          conversionRate: conversionRate.toFixed(1),
          tierBreakdown: {
            starter: starterLeads,
            professional: professionalLeads,
            enterprise: enterpriseLeads,
          },
          revenue: {
            starter: starterRevenue,
            professional: professionalRevenue,
            enterprise: enterpriseRevenue,
            total: totalRevenue,
          },
          pipelineValue,
          domainBreakdown: {
            manufacturing: manufacturingLeads,
            legal: legalLeads,
          },
          recentLeads,
        };
      } catch (error) {
        console.error('Get analytics error:', error);
        return null;
      }
    }),

    /**
     * Update lead status
     */
    updateLeadStatus: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        status: z.enum(['new', 'contacted', 'quoted', 'converted', 'lost']),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          if (ctx.user.role !== 'admin') {
            throw new Error('Unauthorized: admin access required');
          }
          
          const { getDb } = await import('./db');
          const { licenseLeads: licenseLeadsTable } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          const db = await getDb();
          if (!db) throw new Error('Database not available');
          
          // Update the lead status
          await db.update(licenseLeadsTable)
            .set({ status: input.status })
            .where(eq(licenseLeadsTable.id, input.leadId));
          
          return { success: true };
        } catch (error) {
          console.error('Update lead status error:', error);
          throw new Error('Failed to update lead status');
        }
      }),

    getCampaignById: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getEmailCampaigns } = await import('./db');
        const campaigns = await getEmailCampaigns();
        return campaigns.find((c: any) => c.id === input.campaignId) || null;
      }),

    updateCampaign: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await import('./db');
        const campaigns = await db.getEmailCampaigns();
        const campaign = campaigns.find((c: any) => c.id === input.campaignId);
        if (!campaign) return null;
        if (input.name) campaign.name = input.name;
        if (input.subject) campaign.subject = input.subject;
        if (input.status) campaign.status = input.status;
        return campaign;
      }),

    launchCampaign: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        maxLeadsToTarget: z.number().default(25),
      }))
      .mutation(async ({ input }) => {
        const { getEmailCampaigns, getLeads } = await import('./db');
        const campaigns = await getEmailCampaigns();
        const campaign = campaigns.find((c: any) => c.id === input.campaignId);
        if (!campaign) return { success: false, message: 'Campaign not found' };
        
        const leads = await getLeads();
        const targetedLeads = leads.slice(0, input.maxLeadsToTarget);
        
        return {
          success: true,
          campaignId: input.campaignId,
          emailsSent: targetedLeads.length,
          leads: targetedLeads,
          status: 'sent'
        };
      }),

    getCampaignStats: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getEmailCampaigns, getEmailSends } = await import('./db');
        const campaigns = await getEmailCampaigns();
        const campaign = campaigns.find((c: any) => c.id === input.campaignId);
        if (!campaign) return null;
        
        const sends = await getEmailSends(input.campaignId);
        return {
          campaignId: input.campaignId,
          campaignName: campaign.name,
          totalSent: sends.length,
          opened: sends.filter((s: any) => s.opened).length,
          clicked: sends.filter((s: any) => s.clicked).length,
          replied: sends.filter((s: any) => s.replied).length,
        };
      }),

    /**
     * Get available licensing tiers
     */
    getLicensingTiers: publicProcedure.query(async () => {
      try {
        const { getLicensingTiers: getTiers } = await import('./db');
        
        const tiers = await getTiers();
        return tiers;
      } catch (error) {
        console.error('Get licensing tiers error:', error);
        return [
          {
            id: 1,
            name: 'Right to Execute',
            monthlyPrice: 0,
            annualPrice: 149900,
            features: [
              'Turn engineering drawings into AS9102 FAI in 3.2 seconds',
              'Manufacturing domain access',
              'Email support',
              'Up to 5 users',
              'Standard compliance templates'
            ],
            maxUsers: 5,
            maxProjects: null,
            supportLevel: 'email',
            description: 'Speed License - Recover 2-3 weeks of lost lead time. $1,499 initial investment.',
            createdAt: new Date(),
          },
          {
            id: 2,
            name: 'Deterministic Shield',
            monthlyPrice: 416700,
            annualPrice: 500000,
            features: [
              'Insurance policy for compliance - 0% logic drift',
              'Manufacturing + Legal domain access',
              'Priority support',
              'Up to 20 users',
              'Advanced compliance automation',
              'Hardened over 12,000 cycles',
              'ISO/AS9100 protection'
            ],
            maxUsers: 20,
            maxProjects: null,
            supportLevel: 'priority',
            description: 'Safety License - Eliminate human error in compliance. $5,000/year subscription.',
            createdAt: new Date(),
          },
          {
            id: 3,
            name: 'Digital Twin',
            monthlyPrice: 125000,
            annualPrice: 1500000,
            features: [
              'Digital twin of your entire value chain',
              'Simulate cost, lead time, and compliance before spending',
              'Manufacturing + Legal + Multi-domain access',
              'Dedicated support',
              'Unlimited users',
              'Custom integration',
              'Advanced simulation and forecasting',
              'Estimation risk elimination'
            ],
            maxUsers: null,
            maxProjects: null,
            supportLevel: 'dedicated',
            description: 'Simulation License - Eliminate estimation risk. $15,000+/year enterprise pricing.',
            createdAt: new Date(),
          },
        ];

      }
    }),
  }),

  // AI Sales Agent Dashboard
  aiSalesAgent: router({
    getAgents: protectedProcedure.query(async ({ ctx }) => {
      const { getAISalesAgents } = await import('./db');
      return getAISalesAgents();
    }),

    getActivityLogs: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getAgentActivityLogs } = await import('./db');
        return getAgentActivityLogs(input.agentId);
      }),

    getDemoBookings: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getDemoBookings } = await import('./db');
        return getDemoBookings(input.agentId);
      }),

    getContracts: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getContracts } = await import('./db');
        return getContracts(input.agentId);
      }),

    getPayments: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getPayments } = await import('./db');
        return getPayments(input.agentId);
      }),

    getFeedback: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getProspectFeedback } = await import('./db');
        return getProspectFeedback(input.agentId);
      }),

    getPerformanceMetrics: protectedProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input }) => {
        const { getAgentPerformanceMetrics } = await import('./db');
        return getAgentPerformanceMetrics(input.agentId);
      }),
  }),

  emailCampaigns: router({
    create: protectedProcedure
      .input(z.object({
        agentId: z.number(),
        name: z.string(),
        subject: z.string(),
        emailTemplateId: z.number().optional(),
        targetPositions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { createEmailCampaign } = await import('./db');
        return createEmailCampaign(input as any);
      }),

    getAll: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getEmailCampaigns } = await import('./db');
        return getEmailCampaigns(input.agentId);
      }),

    getSalesMaterials: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getSalesMaterials } = await import('./db');
        return getSalesMaterials(input.agentId);
      }),

    createMaterial: protectedProcedure
      .input(z.object({
        agentId: z.number(),
        name: z.string(),
        type: z.string(),
        description: z.string().optional(),
        fileUrl: z.string().optional(),
        content: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createSalesMaterial } = await import('./db');
        return createSalesMaterial(input as any);
      }),

    getLeads: protectedProcedure
      .input(z.object({ agentId: z.number().optional() }))
      .query(async ({ input }) => {
        const { getLeads: getLeadsFromDb } = await import('./db');
        return getLeadsFromDb();
      }),

    updateLeadStatus: protectedProcedure
      .input(z.object({ leadId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        const { updateLeadStatus } = await import('./db');
        return updateLeadStatus(input.leadId, input.status);
      }),
  }),
  
  // Subscription & Pricing
  subscriptions: router({
    getPlans: publicProcedure.query(async () => {
      const { getSubscriptionPlans } = await import('./db');
      return getSubscriptionPlans();
    }),
    getUserSubscription: protectedProcedure.query(async ({ ctx }) => {
      const { getUserSubscription } = await import('./db');
      return getUserSubscription(ctx.user.id);
    }),
    getUserInvoices: protectedProcedure.query(async ({ ctx }) => {
      const { getUserInvoices } = await import('./db');
      return getUserInvoices(ctx.user.id);
    }),
    createSubscription: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { createSubscription } = await import('./db');
        return createSubscription(ctx.user.id, input.planId);
      }),
    updateSubscriptionStatus: protectedProcedure
      .input(z.object({ subscriptionId: z.number(), status: z.enum(['active', 'paused', 'cancelled', 'expired']) }))
      .mutation(async ({ input }) => {
        const { updateSubscriptionStatus } = await import('./db');
        return updateSubscriptionStatus(input.subscriptionId, input.status);
      }),
  }),
});
export type AppRouter = typeof appRouter;
