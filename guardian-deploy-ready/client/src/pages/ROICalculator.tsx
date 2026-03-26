import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ROICalculator() {
  const [inputs, setInputs] = useState({
    annualRevenue: 2000000,
    jobsPerMonth: 20,
    hoursPerJob: 45,
    hourlyRate: 40,
    valueAddedMultiplier: 2.8,
  });

  const calculations = useMemo(() => {
    const jobsPerYear = inputs.jobsPerMonth * 12;
    const hoursPerYear = jobsPerYear * inputs.hoursPerJob;
    const directSavings = hoursPerYear * inputs.hourlyRate;
    const valueCreated = directSavings * inputs.valueAddedMultiplier;
    const totalEconomicImpact = directSavings + valueCreated;
    
    // Assume typical job shop gross margin of 40%
    const grossMargin = inputs.annualRevenue * 0.40;
    const profitabilityIncrease = (totalEconomicImpact / grossMargin) * 100;

    return {
      jobsPerYear,
      hoursPerYear,
      directSavings,
      valueCreated,
      totalEconomicImpact,
      grossMargin,
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Guardian OS ROI Calculator</h1>
          <p className="text-lg text-muted-foreground">
            Calculate your profitability improvement with Guardian OS
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <Card className="p-8 bg-card border border-border h-fit">
            <h2 className="text-2xl font-bold mb-6">Your Business</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Annual Revenue</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    name="annualRevenue"
                    value={inputs.annualRevenue}
                    onChange={handleChange}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jobs per Month</label>
                <Input
                  type="number"
                  name="jobsPerMonth"
                  value={inputs.jobsPerMonth}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hours Saved per Job</label>
                <Input
                  type="number"
                  name="hoursPerJob"
                  value={inputs.hoursPerJob}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate ($)</label>
                <Input
                  type="number"
                  name="hourlyRate"
                  value={inputs.hourlyRate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Value-Added Multiplier</label>
                <div className="text-sm text-muted-foreground mb-2">
                  (How much value each employee generates: 2-3x salary)
                </div>
                <Input
                  type="number"
                  name="valueAddedMultiplier"
                  value={inputs.valueAddedMultiplier}
                  onChange={handleChange}
                  step={0.1}
                />
              </div>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {/* Direct Savings */}
            <Card className="p-6 bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Direct Labor Savings</h3>
              <div className="text-3xl font-bold text-accent">
                {formatCurrency(calculations.directSavings)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {calculations.hoursPerYear.toLocaleString()} hours × ${inputs.hourlyRate}/hour
              </p>
            </Card>

            {/* Value Created */}
            <Card className="p-6 bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Value from Reallocation</h3>
              <div className="text-3xl font-bold text-accent">
                {formatCurrency(calculations.valueCreated)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {formatCurrency(calculations.directSavings)} × {inputs.valueAddedMultiplier}x multiplier
              </p>
            </Card>

            {/* Total Impact */}
            <Card className="p-6 bg-accent/10 border border-accent">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Economic Impact</h3>
              <div className="text-3xl font-bold text-accent">
                {formatCurrency(calculations.totalEconomicImpact)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Annual value creation from Guardian OS
              </p>
            </Card>

            {/* Profitability Increase */}
            <Card className="p-6 bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Profitability Increase</h3>
              <div className="text-3xl font-bold text-accent">
                {calculations.profitabilityIncrease.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                vs. current gross margin of {formatCurrency(calculations.grossMargin)}
              </p>
            </Card>

            {/* Payback Period */}
            <Card className="p-6 bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Payback Period</h3>
              <div className="text-3xl font-bold text-accent">
                {((inputs.annualRevenue * 0.05) / (calculations.totalEconomicImpact / 12)).toFixed(1)} months
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Assuming $5K/month Guardian OS subscription
              </p>
            </Card>
          </div>
        </div>

        {/* Summary */}
        <Card className="mt-8 p-8 bg-card border border-border">
          <h2 className="text-2xl font-bold mb-4">Your Guardian OS Impact</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Annual Jobs</p>
              <p className="text-2xl font-bold">{calculations.jobsPerYear}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Hours Freed</p>
              <p className="text-2xl font-bold">{(calculations.hoursPerYear / 1000).toFixed(1)}K</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Direct Savings</p>
              <p className="text-2xl font-bold">{formatCurrency(calculations.directSavings)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(calculations.totalEconomicImpact)}</p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button size="lg" className="px-8">
            Schedule Demo
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            See how Guardian OS can transform your operations
          </p>
        </div>
      </div>
    </div>
  );
}
