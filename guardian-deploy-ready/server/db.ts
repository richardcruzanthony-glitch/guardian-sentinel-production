import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, manufacturingQuotes, learningMetrics, agentLogs, compliancePackages, leads, visitorMessages, licenseLeads, licensingTiers, aiSalesAgents, agentActivityLogs, demoBookings, contracts, payments, prospectFeedback, salesMaterials, emailCampaigns, emailSends, leadInteractions, videoViews, campaignTargetingCriteria, subscriptionPlans, subscriptions, invoices } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Guardian Sentinel specific queries

export async function saveManufacturingQuote(quote: typeof manufacturingQuotes.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save quote: database not available");
    return null;
  }

  try {
    const result = await db.insert(manufacturingQuotes).values(quote);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save quote:", error);
    throw error;
  }
}

export async function getManufacturingQuotes(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get quotes: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(manufacturingQuotes)
      .where(eq(manufacturingQuotes.userId, userId))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get quotes:", error);
    return [];
  }
}

export async function saveLearningMetric(metric: typeof learningMetrics.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save metric: database not available");
    return null;
  }

  try {
    const result = await db.insert(learningMetrics).values(metric);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save metric:", error);
    throw error;
  }
}

export async function getLearningMetrics(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get metrics: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(learningMetrics)
      .where(eq(learningMetrics.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get metrics:", error);
    return [];
  }
}

export async function saveAgentLog(log: typeof agentLogs.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save agent log: database not available");
    return null;
  }

  try {
    const result = await db.insert(agentLogs).values(log);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save agent log:", error);
    throw error;
  }
}

export async function getAgentLogs(quoteId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get agent logs: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.quoteId, quoteId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get agent logs:", error);
    return [];
  }
}

export async function saveCompliancePackage(pkg: typeof compliancePackages.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save compliance package: database not available");
    return null;
  }

  try {
    const result = await db.insert(compliancePackages).values(pkg);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save compliance package:", error);
    throw error;
  }
}

export async function getCompliancePackages(quoteId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get compliance packages: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(compliancePackages)
      .where(eq(compliancePackages.quoteId, quoteId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get compliance packages:", error);
    return [];
  }
}

export async function saveLead(lead: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(leads).values(lead);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save lead:", error);
    throw error;
  }
}

export async function getLeads() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leads: database not available");
    return [];
  }

  try {
    const result = await db.select().from(leads);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get leads:", error);
    return [];
  }
}

export async function saveVisitorMessage(msg: typeof visitorMessages.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save visitor message: database not available");
    return null;
  }

  try {
    const result = await db.insert(visitorMessages).values(msg);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save visitor message:", error);
    throw error;
  }
}

export async function getVisitorMessages() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get visitor messages: database not available");
    return [];
  }

  try {
    const result = await db.select().from(visitorMessages);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get visitor messages:", error);
    return [];
  }
}

// Licensing functions

export async function saveLicenseLead(lead: typeof licenseLeads.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save license lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(licenseLeads).values(lead);
    return result[0]?.insertId || 0;
  } catch (error) {
    console.error("[Database] Failed to save license lead:", error);
    throw error;
  }
}

export async function getLicenseLeads() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get license leads: database not available");
    return [];
  }

  try {
    const result = await db.select().from(licenseLeads);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get license leads:", error);
    return [];
  }
}

export async function getLicensingTiers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get licensing tiers: database not available");
    return [];
  }

  try {
    const result = await db.select().from(licensingTiers);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get licensing tiers:", error);
    return [];
  }
}


// ============================================================================
// AI Sales Agent Dashboard Helpers
// ============================================================================

export async function getAISalesAgents() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get AI sales agents: database not available");
    return [];
  }

  try {
    const result = await db.select().from(aiSalesAgents);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get AI sales agents:", error);
    return [];
  }
}

export async function getAgentActivityLogs(agentId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get agent activity logs: database not available");
    return [];
  }

  try {
    if (agentId) {
      const result = await db.select().from(agentActivityLogs).where(eq(agentActivityLogs.agentId, agentId)).limit(limit).orderBy(agentActivityLogs.createdAt);
      return result;
    }
    const result = await db.select().from(agentActivityLogs).limit(limit).orderBy(agentActivityLogs.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get agent activity logs:", error);
    return [];
  }
}

export async function getDemoBookings(agentId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get demo bookings: database not available");
    return [];
  }

  try {
    if (agentId) {
      const result = await db.select().from(demoBookings).where(eq(demoBookings.agentId, agentId)).orderBy(demoBookings.scheduledTime);
      return result;
    }
    const result = await db.select().from(demoBookings).orderBy(demoBookings.scheduledTime);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get demo bookings:", error);
    return [];
  }
}

export async function getContracts(agentId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contracts: database not available");
    return [];
  }

  try {
    if (agentId) {
      const result = await db.select().from(contracts).where(eq(contracts.agentId, agentId)).orderBy(contracts.createdAt);
      return result;
    }
    const result = await db.select().from(contracts).orderBy(contracts.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get contracts:", error);
    return [];
  }
}

export async function getPayments(agentId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get payments: database not available");
    return [];
  }

  try {
    if (agentId) {
      const result = await db.select().from(payments).where(eq(payments.agentId, agentId)).orderBy(payments.createdAt);
      return result;
    }
    const result = await db.select().from(payments).orderBy(payments.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get payments:", error);
    return [];
  }
}

export async function getProspectFeedback(agentId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get prospect feedback: database not available");
    return [];
  }

  try {
    if (agentId) {
      const result = await db.select().from(prospectFeedback).where(eq(prospectFeedback.agentId, agentId)).orderBy(prospectFeedback.createdAt);
      return result;
    }
    const result = await db.select().from(prospectFeedback).orderBy(prospectFeedback.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get prospect feedback:", error);
    return [];
  }
}

export async function getAgentPerformanceMetrics(agentId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get agent performance metrics: database not available");
    return null;
  }

  try {
    const agent = await db.select().from(aiSalesAgents).where(eq(aiSalesAgents.id, agentId));
    if (!agent.length) return null;

    const logs = await db.select().from(agentActivityLogs).where(eq(agentActivityLogs.agentId, agentId));
    const feedback = await db.select().from(prospectFeedback).where(eq(prospectFeedback.agentId, agentId));
    const paymentsList = await db.select().from(payments).where(eq(payments.agentId, agentId));

    const emailsSent = logs.filter((l) => l.activityType === "email_sent").length;
    const demosScheduled = logs.filter((l) => l.activityType === "demo_scheduled").length;
    const quotesProvided = logs.filter((l) => l.activityType === "quote_provided").length;
    const contractsSent = logs.filter((l) => l.activityType === "contract_sent").length;
    const paymentsProcessed = paymentsList.filter((p) => p.status === "completed").length;
    const totalRevenue = paymentsList.filter((p) => p.status === "completed").reduce((sum: number, p) => sum + p.amount, 0);
    const avgEngagementScore = feedback.length > 0 ? feedback.reduce((sum: number, f) => sum + (f.engagementScore || 0), 0) / feedback.length : 0;

    return {
      agentId,
      emailsSent,
      demosScheduled,
      quotesProvided,
      contractsSent,
      paymentsProcessed,
      totalRevenue,
      avgEngagementScore: Math.round(avgEngagementScore),
      conversionRate: emailsSent > 0 ? Math.round((paymentsProcessed / emailsSent) * 100) : 0,
    };
  } catch (error) {
    console.error("[Database] Failed to get agent performance metrics:", error);
    return null;
  }
}


// Lead Management Functions
export async function createLeads(leadsData: Array<{
  agentId: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  industry?: string;
  phone?: string;
  linkedinUrl?: string;
}>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create leads: database not available");
    return [];
  }
  try {
    const result = await db.insert(leads).values(leadsData as any);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create leads:", error);
    return [];
  }
}

export async function updateLeadStatus(leadId: number, status: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update lead: database not available");
    return null;
  }
  try {
    const result = await db.update(leads).set({ status: status as any }).where(eq(leads.id, leadId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update lead:", error);
    return null;
  }
}

// Sales Materials Functions
export async function createSalesMaterial(data: {
  agentId: number;
  name: string;
  type: string;
  description?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  content?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create sales material: database not available");
    return null;
  }
  try {
    const result = await db.insert(salesMaterials).values(data as any);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create sales material:", error);
    return null;
  }
}

export async function getSalesMaterials(agentId?: number, type?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sales materials: database not available");
    return [];
  }
  try {
    let query: any = db.select().from(salesMaterials);
    if (agentId) {
      query = query.where(eq(salesMaterials.agentId, agentId));
    }
    const result = await query.orderBy(salesMaterials.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get sales materials:", error);
    return [];
  }
}

// Email Campaign Functions
export async function createEmailCampaign(data: {
  agentId: number;
  name: string;
  subject: string;
  emailTemplateId?: number;
  targetPositions: any;
  status?: string;
  scheduledFor?: Date;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create email campaign: database not available");
    return null;
  }
  try {
    const result = await db.insert(emailCampaigns).values(data as any);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create email campaign:", error);
    return null;
  }
}

export async function getEmailCampaigns(agentId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email campaigns: database not available");
    return [];
  }
  try {
    let query: any = db.select().from(emailCampaigns);
    if (agentId) {
      query = query.where(eq(emailCampaigns.agentId, agentId));
    }
    const result = await query.orderBy(emailCampaigns.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get email campaigns:", error);
    return [];
  }
}

// Email Sends Functions
export async function createEmailSend(data: {
  campaignId: number;
  leadId: number;
  recipientEmail: string;
  subject: string;
  status?: string;
  trackingId?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create email send: database not available");
    return null;
  }
  try {
    const result = await db.insert(emailSends).values(data as any);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create email send:", error);
    return null;
  }
}

export async function getEmailSends(campaignId?: number, leadId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email sends: database not available");
    return [];
  }
  try {
    let query: any = db.select().from(emailSends);
    if (campaignId) {
      query = query.where(eq(emailSends.campaignId, campaignId));
    }
    const result = await query.orderBy(emailSends.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get email sends:", error);
    return [];
  }
}

// Lead Interactions Functions
export async function createLeadInteraction(data: {
  leadId: number;
  type: string;
  description?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create lead interaction: database not available");
    return null;
  }
  try {
    const result = await db.insert(leadInteractions).values(data as any);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create lead interaction:", error);
    return null;
  }
}

export async function getLeadInteractions(leadId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get lead interactions: database not available");
    return [];
  }
  try {
    const result = await db.select().from(leadInteractions).where(eq(leadInteractions.leadId, leadId)).orderBy(leadInteractions.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get lead interactions:", error);
    return [];
  }
}

// Video Views Functions
export async function createVideoView(data: {
  leadId: number;
  videoId: number;
  videoUrl: string;
  duration?: number;
  completionPercent?: number;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create video view: database not available");
    return null;
  }
  try {
    const result = await db.insert(videoViews).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create video view:", error);
    return null;
  }
}

export async function getVideoViews(leadId?: number, videoId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get video views: database not available");
    return [];
  }
  try {
    let query: any = db.select().from(videoViews);
    if (leadId) {
      query = query.where(eq(videoViews.leadId, leadId));
    }
    const result = await query.orderBy(videoViews.viewedAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get video views:", error);
    return [];
  }
}


// Advanced Lead Filtering Functions
export async function filterLeadsByAdvancedCriteria(criteria: {
  minEngagementScore?: number;
  maxEngagementScore?: number;
  industries?: string[];
  locations?: string[];
  positions?: string[];
  companySizes?: string[];
  minDaysSinceContact?: number;
  maxLeadsToTarget?: number;
  status?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot filter leads: database not available");
    return [];
  }

  try {
    let query: any = db.select().from(leads);

    // Engagement score filter
    if (criteria.minEngagementScore !== undefined) {
      const minScore = criteria.minEngagementScore;
      query = query.where((lead: any) => lead.engagementScore >= minScore);
    }
    if (criteria.maxEngagementScore !== undefined) {
      const maxScore = criteria.maxEngagementScore;
      query = query.where((lead: any) => lead.engagementScore <= maxScore);
    }

    // Industry filter
    if (criteria.industries && criteria.industries.length > 0) {
      query = query.where((lead: any) => criteria.industries!.includes(lead.industry));
    }

    // Location filter
    if (criteria.locations && criteria.locations.length > 0) {
      query = query.where((lead: any) => criteria.locations!.includes(lead.location));
    }

    // Position filter
    if (criteria.positions && criteria.positions.length > 0) {
      query = query.where((lead: any) => criteria.positions!.includes(lead.position));
    }

    // Company size filter
    if (criteria.companySizes && criteria.companySizes.length > 0) {
      query = query.where((lead: any) => criteria.companySizes!.includes(lead.companySize));
    }

    // Status filter
    if (criteria.status) {
      query = query.where(eq(leads.status, criteria.status as any));
    }

    // Days since contact filter
    if (criteria.minDaysSinceContact !== undefined) {
      const daysAgo = new Date(Date.now() - criteria.minDaysSinceContact * 24 * 60 * 60 * 1000);
      query = query.where((lead: any) => !lead.lastContactedAt || lead.lastContactedAt < daysAgo);
    }

    let result = await query.orderBy(leads.createdAt);

    // Limit results
    if (criteria.maxLeadsToTarget) {
      result = result.slice(0, criteria.maxLeadsToTarget);
    }

    return result;
  } catch (error) {
    console.error("[Database] Failed to filter leads:", error);
    return [];
  }
}

// Create campaign targeting criteria
export async function createCampaignTargetingCriteria(data: {
  campaignId: number;
  minEngagementScore?: number;
  maxEngagementScore?: number;
  industries?: string[];
  locations?: string[];
  positions?: string[];
  companySizes?: string[];
  minDaysSinceContact?: number;
  maxLeadsToTarget?: number;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create targeting criteria: database not available");
    return null;
  }

  try {
    const result = await db.insert(campaignTargetingCriteria).values(data as any);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create targeting criteria:", error);
    return null;
  }
}

// Get campaign targeting criteria
export async function getCampaignTargetingCriteria(campaignId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get targeting criteria: database not available");
    return null;
  }

  try {
    const result = await db.select().from(campaignTargetingCriteria).where(eq(campaignTargetingCriteria.campaignId, campaignId));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get targeting criteria:", error);
    return null;
  }
}

// Get leads preview for campaign
export async function getLeadsPreviewForCampaign(campaignId: number) {
  const criteria = await getCampaignTargetingCriteria(campaignId);
  if (!criteria) return [];

  return filterLeadsByAdvancedCriteria({
    minEngagementScore: criteria.minEngagementScore || undefined,
    maxEngagementScore: criteria.maxEngagementScore || undefined,
    industries: criteria.industries as string[] | undefined,
    locations: criteria.locations as string[] | undefined,
    positions: criteria.positions as string[] | undefined,
    companySizes: criteria.companySizes as string[] | undefined,
    minDaysSinceContact: criteria.minDaysSinceContact || undefined,
    maxLeadsToTarget: criteria.maxLeadsToTarget || undefined,
  });
}


// ============================================================================
// SUBSCRIPTION & PRICING HELPERS
// ============================================================================

export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.monthlyPrice);
    return plans as any[];
  } catch (error) {
    console.error("[Database] Error fetching subscription plans:", error);
    return [];
  }
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    return subscription[0] as any || null;
  } catch (error) {
    console.error("[Database] Error fetching user subscription:", error);
    return null;
  }
}

export async function createSubscription(userId: number, planId: number, stripeSubscriptionId?: string, stripeCustomerId?: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(subscriptions).values({
      userId,
      planId,
      status: "active",
      stripeSubscriptionId,
      stripeCustomerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    return result;
  } catch (error) {
    console.error("[Database] Error creating subscription:", error);
    return null;
  }
}

export async function updateSubscriptionStatus(subscriptionId: number, status: "active" | "paused" | "cancelled" | "expired") {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.update(subscriptions).set({ status }).where(eq(subscriptions.id, subscriptionId));
    return true;
  } catch (error) {
    console.error("[Database] Error updating subscription status:", error);
    return false;
  }
}

export async function getUserInvoices(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const userSubscriptions = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    
    if (userSubscriptions.length === 0) return [];
    
    const subscriptionIds = userSubscriptions.map(s => s.id);
    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.subscriptionId, subscriptionIds[0])); // Get invoices for first subscription
    
    return userInvoices as any[];
  } catch (error) {
    console.error("[Database] Error fetching user invoices:", error);
    return [];
  }
}

export async function createInvoice(subscriptionId: number, amount: number, stripeInvoiceId?: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(invoices).values({
      subscriptionId,
      amount,
      status: "draft",
      stripeInvoiceId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    return result;
  } catch (error) {
    console.error("[Database] Error creating invoice:", error);
    return null;
  }
}
