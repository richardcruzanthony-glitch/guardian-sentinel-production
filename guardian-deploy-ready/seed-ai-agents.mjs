import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { aiSalesAgents, agentActivityLogs, demoBookings, contracts, payments, prospectFeedback, licensingTiers } from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

async function seedDatabase() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("🌱 Seeding AI Sales Agents...");

    // Get or create tiers
    let tiers = await db.select().from(licensingTiers);
    if (tiers.length === 0) {
      console.log("Creating licensing tiers...");
      await db.insert(licensingTiers).values([
        { 
          name: "Starter", 
          monthlyPrice: 500000, 
          annualPrice: 5000000,
          features: JSON.stringify(["Basic operations", "Email support"]),
          supportLevel: "email",
          description: "Basic plan for small teams"
        },
        { 
          name: "Professional", 
          monthlyPrice: 1500000, 
          annualPrice: 15000000,
          features: JSON.stringify(["Advanced operations", "Priority support", "API access"]),
          supportLevel: "priority",
          description: "Professional plan for growing businesses"
        },
        { 
          name: "Enterprise", 
          monthlyPrice: 5000000, 
          annualPrice: 50000000,
          features: JSON.stringify(["Full operations", "Dedicated support", "Custom integrations"]),
          supportLevel: "dedicated",
          description: "Enterprise plan with full features"
        },
      ]);
      tiers = await db.select().from(licensingTiers);
    }
    const tierId = tiers[0].id;

    // Insert AI Sales Agents
    const agentValues = [
      {
        name: "Manufacturing Sales Agent",
        domain: "manufacturing",
        email: "guardianoperatingsystem@gmail.com",
        status: "active",
        targetIndustries: JSON.stringify(["aerospace", "automotive", "industrial"]),
        messagingTemplate: "Hi {{prospectName}}, I noticed your company specializes in {{industry}}. Guardian OS can reduce your process time by 40-60%. Would you like a demo?",
        capabilities: JSON.stringify(["email", "demo", "pricing", "contracts", "payments"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Legal Sales Agent",
        domain: "legal",
        email: "guardianoperatingsystem@gmail.com",
        status: "active",
        targetIndustries: JSON.stringify(["law_firms", "corporate_legal", "compliance"]),
        messagingTemplate: "Hello {{prospectName}}, Guardian OS helps legal teams automate document workflows and compliance tracking. Interested in learning more?",
        capabilities: JSON.stringify(["email", "demo", "pricing", "contracts", "payments"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Medical Sales Agent",
        domain: "medical",
        email: "guardianoperatingsystem@gmail.com",
        status: "active",
        targetIndustries: JSON.stringify(["hospitals", "clinics", "medical_devices"]),
        messagingTemplate: "Hi {{prospectName}}, Guardian OS streamlines medical operations and compliance. Would you like to see how it works?",
        capabilities: JSON.stringify(["email", "demo", "pricing", "contracts", "payments"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Kill Chain Sales Agent",
        domain: "kill_chain",
        email: "guardianoperatingsystem@gmail.com",
        status: "paused",
        targetIndustries: JSON.stringify(["defense", "security", "logistics"]),
        messagingTemplate: "Greetings {{prospectName}}, Guardian OS provides real-time operational intelligence. Let's discuss your needs.",
        capabilities: JSON.stringify(["email", "demo", "pricing", "contracts", "payments"]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(aiSalesAgents).values(agentValues);
    console.log(`✅ Created ${agentValues.length} AI sales agents`);

    // Get agent IDs
    const agents = await db.select().from(aiSalesAgents);
    const agentIds = agents.map(a => a.id);

    // Insert Activity Logs
    const now = new Date();
    const activityLogs = [];
    const activityTypes = ["email_sent", "demo_scheduled", "quote_provided", "contract_sent", "payment_processed"];
    const statuses = ["sent", "opened", "pending", "clicked", "replied", "failed"];

    for (let i = 0; i < 15; i++) {
      const agentId = agentIds[i % agentIds.length];
      activityLogs.push({
        agentId,
        prospectName: `Prospect ${i + 1}`,
        prospectEmail: `prospect${i + 1}@company.com`,
        activityType: activityTypes[i % activityTypes.length],
        subject: `Guardian OS - Your Operations Solution`,
        status: statuses[i % statuses.length],
        createdAt: new Date(now.getTime() - i * 3600000),
        updatedAt: new Date(now.getTime() - i * 3600000),
      });
    }
    await db.insert(agentActivityLogs).values(activityLogs);
    console.log(`✅ Created ${activityLogs.length} activity logs`);

    // Insert Demo Bookings
    const demoData = [];
    for (let i = 0; i < 8; i++) {
      const agentId = agentIds[i % agentIds.length];
      const statuses = ["scheduled", "completed", "cancelled", "no_show"];
      const scheduledTime = new Date(now.getTime() + (i + 1) * 86400000);

      demoData.push({
        agentId,
        leadId: i + 1,
        prospectName: `Demo Prospect ${i + 1}`,
        prospectEmail: `demo${i + 1}@company.com`,
        scheduledTime,
        duration: 60,
        status: statuses[i % statuses.length],
        meetingLink: i % 2 === 0 ? `https://zoom.us/j/${Math.random().toString().slice(2, 12)}` : null,
        feedback: i % 3 === 0 ? "Great product, interested in pricing" : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await db.insert(demoBookings).values(demoData);
    console.log(`✅ Created ${demoData.length} demo bookings`);

    // Insert Contracts
    const contractData = [];
    for (let i = 0; i < 6; i++) {
      const agentId = agentIds[i % agentIds.length];
      const contractTypes = ["license_agreement", "nda", "msa"];
      const statuses = ["sent", "signed", "executed"];

      contractData.push({
        agentId,
        leadId: i + 10,
        prospectName: `Contract Prospect ${i + 1}`,
        prospectEmail: `contract${i + 1}@company.com`,
        contractType: contractTypes[i % contractTypes.length],
        tierId,
        status: statuses[i % statuses.length],
        documentUrl: `https://storage.example.com/contracts/contract-${i + 1}.pdf`,
        createdAt: new Date(now.getTime() - i * 86400000),
        updatedAt: new Date(now.getTime() - i * 86400000),
      });
    }
    await db.insert(contracts).values(contractData);
    console.log(`✅ Created ${contractData.length} contracts`);

    // Insert Payments
    const paymentData = [];
    for (let i = 0; i < 10; i++) {
      const agentId = agentIds[i % agentIds.length];
      const amounts = [500000, 1500000, 5000000, 10000000];
      const statuses = ["completed", "pending", "failed"];

      paymentData.push({
        agentId,
        leadId: i + 20,
        tierId,
        prospectEmail: `payment${i + 1}@company.com`,
        amount: amounts[i % amounts.length],
        currency: "USD",
        paymentMethod: ["credit_card", "bank_transfer", "invoice"][i % 3],
        status: statuses[i % statuses.length],
        transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`,
        createdAt: new Date(now.getTime() - i * 86400000),
        updatedAt: new Date(now.getTime() - i * 86400000),
      });
    }
    await db.insert(payments).values(paymentData);
    console.log(`✅ Created ${paymentData.length} payments`);

    // Insert Feedback - use correct enum values
    const feedbackData = [];
    const feedbackTypes = ["email_open", "link_click", "demo_interest", "pricing_inquiry"];
    const sentiments = ["positive", "neutral", "negative"];

    for (let i = 0; i < 12; i++) {
      const agentId = agentIds[i % agentIds.length];
      feedbackData.push({
        agentId,
        leadId: i + 30,
        prospectEmail: `feedback${i + 1}@company.com`,
        feedbackType: feedbackTypes[i % feedbackTypes.length],
        content: `Great demo! Interested in learning more about pricing and implementation timeline.`,
        sentiment: sentiments[i % sentiments.length],
        engagementScore: Math.floor(Math.random() * 100) + 1,
        nextAction: ["schedule_demo", "send_proposal", "follow_up_call", "send_pricing"][i % 4],
        createdAt: new Date(now.getTime() - i * 43200000),
      });
    }
    await db.insert(prospectFeedback).values(feedbackData);
    console.log(`✅ Created ${feedbackData.length} feedback entries`);

    console.log("\n✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
