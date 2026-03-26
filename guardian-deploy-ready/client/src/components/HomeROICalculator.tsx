import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';

export function HomeROICalculator() {
  const [inputs, setInputs] = useState({
    annualRevenue: 2000000,
    jobsPerMonth: 20,
    hoursPerJob: 45,
  });
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculations = useMemo(() => {
    const hourlyRate = 40;
    const valueAddedMultiplier = 2.8;
    
    const jobsPerYear = inputs.jobsPerMonth * 12;
    const hoursPerYear = jobsPerYear * inputs.hoursPerJob;
    const directSavings = hoursPerYear * hourlyRate;
    const valueCreated = directSavings * valueAddedMultiplier;
    const totalEconomicImpact = directSavings + valueCreated;
    
    const grossMargin = inputs.annualRevenue * 0.40;
    const profitabilityIncrease = (totalEconomicImpact / grossMargin) * 100;

    return {
      directSavings,
      valueCreated,
      totalEconomicImpact,
      profitabilityIncrease,
    };
  }, [inputs]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/trpc/leads.captureROILead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          annualRevenue: inputs.annualRevenue,
          jobsPerMonth: inputs.jobsPerMonth,
          hoursPerJob: inputs.hoursPerJob,
          estimatedAnnualValue: calculations.totalEconomicImpact,
        }),
      });
      
      if (response.ok) {
        setSubmitted(true);
        setEmail('');
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Failed to submit lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">See Your ROI</h2>
        <p className="text-muted-foreground mb-8">
          Enter your business details to see how Guardian OS transforms your profitability
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Input Fields */}
          <div>
            <label className="block text-sm font-medium mb-2">Annual Revenue</label>
            <div className="flex items-center gap-2 bg-background rounded px-3 py-2 border border-border">
              <span className="text-muted-foreground">$</span>
              <input
                type="number"
                name="annualRevenue"
                value={inputs.annualRevenue}
                onChange={handleChange}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Jobs per Month</label>
            <input
              type="number"
              name="jobsPerMonth"
              value={inputs.jobsPerMonth}
              onChange={handleChange}
              className="w-full bg-background rounded px-3 py-2 border border-border text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hours Saved per Job</label>
            <input
              type="number"
              name="hoursPerJob"
              value={inputs.hoursPerJob}
              onChange={handleChange}
              className="w-full bg-background rounded px-3 py-2 border border-border text-sm outline-none"
            />
          </div>
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Direct Labor Savings</p>
            <p className="text-xl font-bold text-accent">
              {formatCurrency(calculations.directSavings)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">/year</p>
          </div>

          <div className="bg-background rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Value from Reallocation</p>
            <p className="text-xl font-bold text-accent">
              {formatCurrency(calculations.valueCreated)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">/year</p>
          </div>

          <div className="bg-background rounded-lg p-4 border border-accent/50">
            <p className="text-xs text-muted-foreground mb-1">Total Economic Impact</p>
            <p className="text-xl font-bold text-accent">
              {formatCurrency(calculations.totalEconomicImpact)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">/year</p>
          </div>

          <div className="bg-accent/10 rounded-lg p-4 border border-accent">
            <p className="text-xs text-muted-foreground mb-1">Profitability Increase</p>
            <p className="text-xl font-bold text-accent">
              {calculations.profitabilityIncrease.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">improvement</p>
          </div>
        </div>

        {/* Email Capture */}
        <div className="bg-background rounded-lg p-6 border border-accent/30 mb-6">
          <h3 className="font-semibold mb-3">Get Your Personalized ROI Report</h3>
          <form onSubmit={handleSubmitEmail} className="flex gap-3">
            <input
              type="email"
              placeholder="your@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-card rounded px-3 py-2 border border-border text-sm outline-none"
              required
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || !email}
              className="whitespace-nowrap"
            >
              {isSubmitting ? 'Sending...' : 'Send Report'}
            </Button>
          </form>
          {submitted && (
            <p className="text-sm text-green-400 mt-3">✓ Report sent! Check your email.</p>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/roi-calculator">
            <Button variant="outline" className="w-full sm:w-auto">
              Full Calculator & Details
            </Button>
          </Link>
          <Button className="w-full sm:w-auto">
            Schedule Demo
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          *This calculation shows direct labor savings and value creation from reallocation. 
          Guardian OS also provides decision-making connectivity, proactive execution, and digital twin capabilities not included in this baseline.
        </p>
      </div>
    </div>
  );
}
