import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  revenue: string;
  jobsPerMonth: number;
  challenge: string;
  solution: string;
  results: {
    hoursFreed: string;
    directSavings: string;
    valueCreated: string;
    profitabilityIncrease: string;
  };
  quote: string;
  role: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'aerospace-1',
    company: 'Precision Aerospace Manufacturing',
    industry: 'Aerospace & Defense',
    revenue: '$2.5M',
    jobsPerMonth: 25,
    challenge: 'Complex compliance requirements (AS9100) consuming 50+ hours per job. Procurement and Engineering working in silos, causing material delays and rework.',
    solution: 'Guardian OS automated compliance tracking and created real-time Engineering→Procurement integration. Reduced quote-to-production time by 3 days.',
    results: {
      hoursFreed: '1,000 hours/year',
      directSavings: '$40,000/year',
      valueCreated: '$1.12M/year',
      profitabilityIncrease: '156%',
    },
    quote: 'Guardian OS transformed how our departments communicate. What used to take a week now takes hours.',
    role: 'Operations Manager',
  },
  {
    id: 'medical-1',
    company: 'Medical Device Supplier',
    industry: 'Medical Devices',
    revenue: '$1.8M',
    jobsPerMonth: 18,
    challenge: 'ISO 13485 compliance documentation taking 40+ hours per job. Traceability and material certifications scattered across email and spreadsheets.',
    solution: 'Guardian OS centralized compliance documentation and automated traceability. Integrated with existing ERP for real-time material tracking.',
    results: {
      hoursFreed: '864 hours/year',
      directSavings: '$34,560/year',
      valueCreated: '$967,680/year',
      profitabilityIncrease: '142%',
    },
    quote: 'Our audit time dropped from 2 weeks to 2 days. Guardian OS gave us the visibility we needed.',
    role: 'Quality Director',
  },
  {
    id: 'general-1',
    company: 'Custom Metal Fabrication',
    industry: 'General Manufacturing',
    revenue: '$3.2M',
    jobsPerMonth: 30,
    challenge: 'Procurement delays causing 15% of jobs to miss deadlines. Manual quote process taking 3-5 days. No visibility into material availability.',
    solution: 'Guardian OS automated quoting and integrated procurement workflow. Real-time material availability checking reduced quote time to 2 hours.',
    results: {
      hoursFreed: '1,440 hours/year',
      directSavings: '$57,600/year',
      valueCreated: '$1.61M/year',
      profitabilityIncrease: '168%',
    },
    quote: 'On-time delivery improved from 85% to 98%. Guardian OS eliminated our biggest operational bottleneck.',
    role: 'Plant Manager',
  },
];

export function CaseStudies() {
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(CASE_STUDIES[0]);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Guardian OS Case Studies</h1>
          <p className="text-lg text-muted-foreground">
            See how manufacturers transformed their operations with Guardian OS
          </p>
        </div>

        {/* Case Study Selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {CASE_STUDIES.map(study => (
            <Button
              key={study.id}
              onClick={() => setSelectedStudy(study)}
              variant={selectedStudy?.id === study.id ? 'default' : 'outline'}
              className="justify-start h-auto py-4 px-4"
            >
              <div className="text-left">
                <div className="font-semibold">{study.company}</div>
                <div className="text-sm text-muted-foreground">{study.industry}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Selected Case Study */}
        {selectedStudy && (
          <div className="space-y-6">
            {/* Header */}
            <Card className="p-8 bg-card border border-border">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">{selectedStudy.company}</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-semibold">{selectedStudy.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p className="font-semibold">{selectedStudy.revenue}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jobs per Month</p>
                      <p className="font-semibold">{selectedStudy.jobsPerMonth}</p>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div className="flex flex-col justify-center">
                  <div className="text-lg italic mb-4">
                    "{selectedStudy.quote}"
                  </div>
                  <div className="text-sm text-muted-foreground">
                    — {selectedStudy.role}
                  </div>
                </div>
              </div>
            </Card>

            {/* Challenge & Solution */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-bold mb-3">Challenge</h3>
                <p className="text-muted-foreground">{selectedStudy.challenge}</p>
              </Card>
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-bold mb-3">Solution</h3>
                <p className="text-muted-foreground">{selectedStudy.solution}</p>
              </Card>
            </div>

            {/* Results */}
            <Card className="p-8 bg-accent/10 border border-accent">
              <h3 className="text-2xl font-bold mb-6">Results</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Hours Freed</p>
                  <p className="text-2xl font-bold text-accent">{selectedStudy.results.hoursFreed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Direct Savings</p>
                  <p className="text-2xl font-bold text-accent">{selectedStudy.results.directSavings}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Value Created</p>
                  <p className="text-2xl font-bold text-accent">{selectedStudy.results.valueCreated}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Profitability Increase</p>
                  <p className="text-2xl font-bold text-accent">{selectedStudy.results.profitabilityIncrease}</p>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <div className="text-center">
              <Button size="lg" className="px-8">
                Schedule Your Demo
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                See how Guardian OS can deliver similar results for your business
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
