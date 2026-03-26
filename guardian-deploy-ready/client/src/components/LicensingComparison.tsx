import React, { useState } from 'react';
import { Check, Zap, Shield, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export function LicensingComparison() {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const { data: tiers = [] } = trpc.sales.getLicensingTiers.useQuery();

  return (
    <div className="w-full bg-background py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-foreground mb-4 text-center">Guardian OS Licensing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier: any) => (
            <div key={tier.id} className="rounded-lg border-2 p-8 bg-gradient-to-br from-slate-500/20 to-slate-500/20">
              <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
              <div className="text-3xl font-bold text-foreground mb-8">${(tier.annualPrice / 100).toLocaleString()}</div>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Learn More</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
