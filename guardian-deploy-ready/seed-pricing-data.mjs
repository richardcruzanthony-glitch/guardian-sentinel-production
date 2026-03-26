import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

async function seedPricingData() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log('Seeding pricing tiers...');

    // Insert subscription plans
    await db.insert(schema.subscriptionPlans).values([
      {
        name: 'Starter',
        monthlyPrice: 250000, // $2,500 in cents
        description: 'Perfect for small teams processing 1-5 jobs per month',
        maxLeads: 500,
        maxCampaigns: 5,
        features: JSON.stringify([
          'Basic lead management',
          'Email campaign builder',
          'Up to 5 email campaigns/month',
          'Basic analytics',
          'Email support'
        ]),
      },
      {
        name: 'Professional',
        monthlyPrice: 500000, // $5,000 in cents
        description: 'For growing teams processing 10+ jobs per month',
        maxLeads: 2000,
        maxCampaigns: 25,
        features: JSON.stringify([
          'Advanced lead management',
          'Unlimited email campaigns',
          'Auto-scheduling (daily/weekly/monthly)',
          'Advanced analytics & ROI tracking',
          'File uploads (videos, PDFs)',
          'Priority email support',
          'API access'
        ]),
      },
      {
        name: 'Enterprise',
        monthlyPrice: 1000000, // $10,000 in cents
        description: 'For large enterprises with complex operations',
        maxLeads: null, // unlimited
        maxCampaigns: null, // unlimited
        features: JSON.stringify([
          'Everything in Professional',
          'Unlimited leads and campaigns',
          'Custom integrations',
          'Dedicated account manager',
          'Phone support',
          'Custom reporting',
          'SLA guarantee'
        ]),
      }
    ]);

    console.log('✓ Pricing tiers seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedPricingData();
