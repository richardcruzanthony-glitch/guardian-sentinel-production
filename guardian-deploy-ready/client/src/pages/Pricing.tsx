import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useRouter } from 'wouter';

interface PricingPlan {
  id: number;
  name: string;
  monthlyPrice: number;
  description: string | null;
  maxLeads: number | null;
  maxCampaigns: number | null;
  features: string[] | null;
}

export function Pricing() {
  const { user } = useAuth();
  const { navigate } = useRouter() as any;
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const { mutateAsync: createSubscription, isPending } = trpc.subscriptions.createSubscription.useMutation();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await trpc.subscriptions.getPlans.useQuery();
        setPlans((response?.data || []) as PricingPlan[]);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId: number) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setSelectedPlan(planId);
    try {
      const result = await createSubscription({ planId }) as any;
      // If Stripe session URL is returned, redirect to Stripe checkout
      if (result?.sessionUrl) {
        window.location.href = result.sessionUrl;
      } else if (result?.success || result) {
        // Otherwise redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to process subscription. Please try again.');
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading pricing plans...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Guardian OS Pricing</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Choose the plan that fits your business
          </p>
          <p className="text-lg text-muted-foreground">
            From autonomous business management to enterprise operations intelligence
          </p>
        </div>

        {/* Problem Statement */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">The Problem</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Nerve Endings (ERP/MRP)</h3>
              <p className="text-muted-foreground">
                Your systems collect data but lack coordinated decision-making across departments
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">The Execution Gap</h3>
              <p className="text-muted-foreground">
                Over 70% of ERP initiatives fail due to the gap between insights and coordinated actions
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">The Missing Brain</h3>
              <p className="text-muted-foreground">
                No real-time intelligence layer connecting Engineering, Procurement, Planning, Quality
              </p>
            </div>
          </div>
        </div>

        {/* Solution Statement */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">The Solution: Guardian OS</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Guardian is the missing brain and digital spinal cord that sits on top of your existing ERP/MRP systems. 
            It transforms your data into coordinated, autonomous business execution across all departments.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span>Real-time Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              <span>Cross-Department Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Proactive Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              <span>Autonomous Decisions</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const monthlyPrice = plan.monthlyPrice / 100; // Convert cents to dollars
            const isPopular = plan.name === 'Professional';

            return (
              <Card
                key={plan.id}
                className={`relative p-8 flex flex-col ${
                  isPopular ? 'border-accent border-2 shadow-lg' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 rounded-bl-lg text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${monthlyPrice.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>

                {plan.description && (
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                )}

                {/* Features */}
                <div className="mb-8 flex-grow">
                  <h4 className="font-semibold mb-4">Includes:</h4>
                  <ul className="space-y-3">
                    {plan.maxLeads && (
                      <li className="flex items-center gap-2">
                        <span className="text-accent">✓</span>
                        <span>Up to {plan.maxLeads.toLocaleString()} leads/month</span>
                      </li>
                    )}
                    {plan.maxCampaigns && (
                      <li className="flex items-center gap-2">
                        <span className="text-accent">✓</span>
                        <span>Up to {plan.maxCampaigns} email campaigns</span>
                      </li>
                    )}
                    {plan.features && plan.features.length > 0 && (
                      plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-accent">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={selectedPlan === plan.id || isPending}
                  variant={isPopular ? 'default' : 'outline'}
                  className="w-full"
                >
                  {selectedPlan === plan.id ? 'Processing...' : 'Get Started'}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* ROI Calculator */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">ROI Calculator</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Conservative (10 jobs/month)</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>Direct savings: <span className="text-foreground font-semibold">$16,000/mo</span></p>
                <p>Prevented rework: <span className="text-foreground font-semibold">+$5,000-$10,000/mo</span></p>
                <p>Faster cash flow: <span className="text-foreground font-semibold">+$20,000-$30,000/mo</span></p>
                <p className="border-t border-border pt-2 mt-2">
                  Total value: <span className="text-accent font-bold text-lg">$41,000-$56,000/mo</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Growth (20 jobs/month)</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>Direct savings: <span className="text-foreground font-semibold">$32,000/mo</span></p>
                <p>Prevented rework: <span className="text-foreground font-semibold">+$10,000-$20,000/mo</span></p>
                <p>Faster cash flow: <span className="text-foreground font-semibold">+$40,000-$60,000/mo</span></p>
                <p className="border-t border-border pt-2 mt-2">
                  Total value: <span className="text-accent font-bold text-lg">$82,000-$112,000/mo</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Your ROI</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>Professional Plan: <span className="text-foreground font-semibold">$5,000/mo</span></p>
                <p>Conservative ROI: <span className="text-accent font-bold">8-11:1</span></p>
                <p className="text-sm">Payback period: <span className="text-accent font-bold">1-2 weeks</span></p>
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-sm">Guardian pays for itself before your first invoice is due.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
