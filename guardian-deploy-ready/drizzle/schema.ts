import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Manufacturing quotes and processing history
 */
export const manufacturingQuotes = mysqlTable("manufacturing_quotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  materialCost: varchar("materialCost", { length: 20 }),
  laborCost: varchar("laborCost", { length: 20 }),
  overheadCost: varchar("overheadCost", { length: 20 }),
  totalCost: varchar("totalCost", { length: 20 }),
  confidence: varchar("confidence", { length: 10 }),
  processingTime: int("processingTime"),
  results: json("results"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManufacturingQuote = typeof manufacturingQuotes.$inferSelect;
export type InsertManufacturingQuote = typeof manufacturingQuotes.$inferInsert;

/**
 * Self-learning system metrics
 */
export const learningMetrics = mysqlTable("learning_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metricType: varchar("metricType", { length: 50 }).notNull(),
  value: varchar("value", { length: 20 }).notNull(),
  previousValue: varchar("previousValue", { length: 20 }),
  improvement: varchar("improvement", { length: 20 }),
  sampleSize: int("sampleSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearningMetric = typeof learningMetrics.$inferSelect;
export type InsertLearningMetric = typeof learningMetrics.$inferInsert;

/**
 * Agent processing logs
 */
export const agentLogs = mysqlTable("agent_logs", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  agentName: varchar("agentName", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).notNull(),
  input: json("input"),
  output: json("output"),
  duration: int("duration"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = typeof agentLogs.$inferInsert;

/**
 * Compliance packages
 */
export const compliancePackages = mysqlTable("compliance_packages", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  standard: varchar("standard", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  requirements: json("requirements"),
  documentation: json("documentation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompliancePackage = typeof compliancePackages.$inferSelect;
export type InsertCompliancePackage = typeof compliancePackages.$inferInsert;

/**
 * Leads — demo requests and early access signups
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["demo", "early_access", "roi_calculator"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  companySize: varchar("companySize", { length: 50 }),
  industry: varchar("industry", { length: 100 }),
  location: varchar("location", { length: 100 }),
  position: varchar("position", { length: 100 }),
  engagementScore: int("engagementScore").default(0),
  lastContactedAt: timestamp("lastContactedAt"),
  domainsInterested: json("domainsInterested"),
  timeline: varchar("timeline", { length: 50 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Visitor chat messages — questions and comments from site visitors
 */
export const visitorMessages = mysqlTable("visitor_messages", {
  id: int("id").autoincrement().primaryKey(),
  visitorName: varchar("visitorName", { length: 255 }).notNull(),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  message: text("message").notNull(),
  page: varchar("page", { length: 100 }),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  reply: text("reply"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisitorMessage = typeof visitorMessages.$inferSelect;
export type InsertVisitorMessage = typeof visitorMessages.$inferInsert;

/**
 * Licensing tiers and pricing
 */
export const licensingTiers = mysqlTable("licensing_tiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // Starter, Professional, Enterprise
  monthlyPrice: int("monthlyPrice").notNull(), // in cents
  annualPrice: int("annualPrice").notNull(), // in cents
  features: json("features").notNull(), // array of feature strings
  maxUsers: int("maxUsers"), // null = unlimited
  maxProjects: int("maxProjects"), // null = unlimited
  supportLevel: varchar("supportLevel", { length: 50 }).notNull(), // email, priority, dedicated
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LicensingTier = typeof licensingTiers.$inferSelect;
export type InsertLicensingTier = typeof licensingTiers.$inferInsert;

/**
 * License keys and activations
 */
export const licenseKeys = mysqlTable("license_keys", {
  id: int("id").autoincrement().primaryKey(),
  licenseKey: varchar("licenseKey", { length: 64 }).notNull().unique(), // XXXX-XXXX-XXXX-XXXX format
  tierId: int("tierId").notNull(),
  userId: int("userId"), // null until activated
  companyName: varchar("companyName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["generated", "activated", "expired", "revoked"]).default("generated").notNull(),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = typeof licenseKeys.$inferInsert;

/**
 * License sales leads and inquiries
 */
export const licenseLeads = mysqlTable("license_leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  tiersInterested: json("tiersInterested"), // array of tier names
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "quoted", "converted", "lost"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LicenseLead = typeof licenseLeads.$inferSelect;
export type InsertLicenseLead = typeof licenseLeads.$inferInsert;


/**
 * AI Sales Agent configuration and settings
 */
export const aiSalesAgents = mysqlTable("ai_sales_agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Manufacturing Agent", "Legal Agent"
  domain: varchar("domain", { length: 100 }).notNull(), // Manufacturing, Legal, Medical, Kill Chain
  email: varchar("email", { length: 320 }).notNull(), // guardianoperatingsystem@gmail.com
  status: mysqlEnum("status", ["active", "inactive", "paused"]).default("active").notNull(),
  messagingTemplate: text("messagingTemplate"), // Agent's pitch and messaging
  capabilities: json("capabilities"), // {demos: true, pricing: true, contracts: true, payments: true}
  targetIndustries: json("targetIndustries"), // array of industries
  performanceMetrics: json("performanceMetrics"), // {leadsGenerated, conversions, avgResponseTime}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AISalesAgent = typeof aiSalesAgents.$inferSelect;
export type InsertAISalesAgent = typeof aiSalesAgents.$inferInsert;

/**
 * AI Agent activity and interaction logs
 */
export const agentActivityLogs = mysqlTable("agent_activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  leadId: int("leadId"),
  activityType: mysqlEnum("activityType", ["email_sent", "demo_scheduled", "quote_provided", "contract_sent", "payment_processed", "feedback_received"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  prospectEmail: varchar("prospectEmail", { length: 320 }),
  prospectName: varchar("prospectName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "sent", "opened", "clicked", "replied", "failed"]).default("pending").notNull(),
  metadata: json("metadata"), // {demoTime, quoteAmount, contractType, paymentMethod}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentActivityLog = typeof agentActivityLogs.$inferSelect;
export type InsertAgentActivityLog = typeof agentActivityLogs.$inferInsert;

/**
 * Demo scheduling and bookings
 */
export const demoBookings = mysqlTable("demo_bookings", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  leadId: int("leadId").notNull(),
  prospectName: varchar("prospectName", { length: 255 }).notNull(),
  prospectEmail: varchar("prospectEmail", { length: 320 }).notNull(),
  scheduledTime: timestamp("scheduledTime").notNull(),
  duration: int("duration"), // in minutes
  meetingLink: varchar("meetingLink", { length: 500 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DemoBooking = typeof demoBookings.$inferSelect;
export type InsertDemoBooking = typeof demoBookings.$inferInsert;

/**
 * Contract and NDA management
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  leadId: int("leadId").notNull(),
  prospectName: varchar("prospectName", { length: 255 }).notNull(),
  prospectEmail: varchar("prospectEmail", { length: 320 }).notNull(),
  contractType: mysqlEnum("contractType", ["license_agreement", "nda", "msa", "sow"]).notNull(),
  tierId: int("tierId"),
  terms: json("terms"), // {duration, price, features, renewalTerms}
  documentUrl: varchar("documentUrl", { length: 500 }),
  status: mysqlEnum("status", ["draft", "sent", "signed", "executed", "expired"]).default("draft").notNull(),
  signedAt: timestamp("signedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Payment transactions and invoices
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  leadId: int("leadId").notNull(),
  tierId: int("tierId").notNull(),
  prospectEmail: varchar("prospectEmail", { length: 320 }).notNull(),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["credit_card", "bank_transfer", "invoice", "stripe"]).notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  invoiceUrl: varchar("invoiceUrl", { length: 500 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Prospect feedback and engagement tracking
 */
export const prospectFeedback = mysqlTable("prospect_feedback", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  leadId: int("leadId").notNull(),
  prospectEmail: varchar("prospectEmail", { length: 320 }).notNull(),
  feedbackType: mysqlEnum("feedbackType", ["email_open", "link_click", "demo_interest", "pricing_inquiry", "objection", "positive_feedback", "negative_feedback"]).notNull(),
  content: text("content"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  engagementScore: int("engagementScore"), // 0-100
  nextAction: varchar("nextAction", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProspectFeedback = typeof prospectFeedback.$inferSelect;
export type InsertProspectFeedback = typeof prospectFeedback.$inferInsert;


/**
 * Sales materials (presentations, videos, emails)
 */
/**
 * Campaign file uploads (videos, PDFs, attachments)
 */
export const campaignFiles = mysqlTable("campaign_files", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // 'video', 'pdf', 'image', 'document'
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"), // in bytes
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type CampaignFile = typeof campaignFiles.$inferSelect;
export type InsertCampaignFile = typeof campaignFiles.$inferInsert;

export const salesMaterials = mysqlTable("sales_materials", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["presentation", "video", "email_template", "case_study", "whitepaper"]).notNull(),
  description: text("description"),
  fileUrl: varchar("fileUrl", { length: 500 }), // S3 URL
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  content: text("content"), // for email templates
  isActive: int("isActive").default(1).notNull(), // 1 = true, 0 = false
  viewCount: int("viewCount").default(0),
  downloadCount: int("downloadCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesMaterial = typeof salesMaterials.$inferSelect;
export type InsertSalesMaterial = typeof salesMaterials.$inferInsert;

/**
 * Email campaigns
 */
/**
 * Campaign targeting criteria for advanced filtering
 */
export const campaignTargetingCriteria = mysqlTable("campaign_targeting_criteria", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  minEngagementScore: int("minEngagementScore").default(0),
  maxEngagementScore: int("maxEngagementScore").default(100),
  industries: json("industries"), // array of industries
  locations: json("locations"), // array of locations
  positions: json("positions"), // array of positions
  companySizes: json("companySizes"), // array of company sizes
  minDaysSinceContact: int("minDaysSinceContact"),
  maxLeadsToTarget: int("maxLeadsToTarget"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignTargetingCriteria = typeof campaignTargetingCriteria.$inferSelect;
export type InsertCampaignTargetingCriteria = typeof campaignTargetingCriteria.$inferInsert;

export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  emailBody: text("emailBody"), // Full email content (HTML or plain text)
  emailTemplateId: int("emailTemplateId"),
  targetPositions: json("targetPositions"), // array of positions
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "paused"]).default("draft").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  recurringSchedule: varchar("recurringSchedule", { length: 50 }), // 'daily', 'weekly', 'monthly', 'once'
  recurringDayOfWeek: int("recurringDayOfWeek"), // 0-6 for weekly schedules
  recurringTime: varchar("recurringTime", { length: 5 }), // HH:mm format
  recurringEndDate: timestamp("recurringEndDate"), // When to stop recurring
  nextScheduledRun: timestamp("nextScheduledRun"),
  totalLeads: int("totalLeads").default(0),
  sentCount: int("sentCount").default(0),
  openCount: int("openCount").default(0),
  clickCount: int("clickCount").default(0),
  replyCount: int("replyCount").default(0),
  conversionCount: int("conversionCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

/**
 * Email sends tracking
 */
export const emailSends = mysqlTable("email_sends", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  leadId: int("leadId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "bounced", "failed"]).default("pending").notNull(),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  repliedAt: timestamp("repliedAt"),
  replyContent: text("replyContent"),
  trackingId: varchar("trackingId", { length: 255 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSend = typeof emailSends.$inferSelect;
export type InsertEmailSend = typeof emailSends.$inferInsert;

/**
 * Lead interactions and engagement history
 */
export const leadInteractions = mysqlTable("lead_interactions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  type: mysqlEnum("type", ["email_sent", "email_opened", "link_clicked", "video_viewed", "document_downloaded", "demo_scheduled", "call_scheduled", "reply_received", "status_changed"]).notNull(),
  description: text("description"),
  metadata: json("metadata"), // {videoId, documentId, linkUrl, etc}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadInteraction = typeof leadInteractions.$inferSelect;
export type InsertLeadInteraction = typeof leadInteractions.$inferInsert;

/**
 * Video tracking for demo videos
 */
export const videoViews = mysqlTable("video_views", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  videoId: int("videoId").notNull(),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  duration: int("duration"), // seconds watched
  completionPercent: int("completionPercent"), // 0-100
});

export type VideoView = typeof videoViews.$inferSelect;
export type InsertVideoView = typeof videoViews.$inferInsert;


/**
 * Subscription plans and pricing
 */
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Starter, Professional, Enterprise
  monthlyPrice: int("monthlyPrice").notNull(), // in cents: 250000 = $2500
  description: text("description"),
  maxLeads: int("maxLeads"), // null = unlimited
  maxCampaigns: int("maxCampaigns"), // null = unlimited
  features: json("features"), // array of feature names
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * Customer subscriptions
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "paused", "cancelled", "expired"]).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Invoices and billing history
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  amount: int("amount").notNull(), // in cents
  status: mysqlEnum("status", ["draft", "open", "paid", "void", "uncollectible"]).notNull(),
  invoiceDate: timestamp("invoiceDate").notNull(),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
