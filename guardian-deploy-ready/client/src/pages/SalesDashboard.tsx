import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, DollarSign, Target, Mail, Calendar, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

interface SalesLead {
  id: number;
  name: string;
  email: string;
  company?: string | null;
  industry?: string | null;
  tiersInterested?: any;
  status: 'new' | 'contacted' | 'quoted' | 'converted' | 'lost';
  createdAt: Date;
  message?: string | null;
}

export default function SalesDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<'all' | 'new' | 'quoted' | 'converted'>('all');
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);

  // Fetch leads and analytics from tRPC
  const { data: leads = [], isLoading: leadsLoading } = trpc.sales.getAllLeads.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });
  
  const { data: analytics } = trpc.sales.getAnalytics.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  // Use analytics data if available
  const metrics = analytics || {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    quoted: leads.filter((l) => l.status === 'quoted').length,
    converted: leads.filter((l) => l.status === 'converted').length,
    conversionRate: '0',
    tierBreakdown: { starter: 0, professional: 0, enterprise: 0 },
    revenue: { starter: 0, professional: 0, enterprise: 0, total: 0 },
    pipelineValue: 0,
  };

  const tierBreakdown = metrics.tierBreakdown || {
    starter: 0,
    professional: 0,
    enterprise: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'quoted':
        return 'bg-purple-100 text-purple-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const getLeadValue = (lead: SalesLead): number => {
    const tiers = getTiers(lead.tiersInterested);
    if (tiers.includes('Enterprise')) return 15000;
    if (tiers.includes('Professional')) return 5000;
    if (tiers.includes('Starter')) return 1499;
    return 0;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Sales Dashboard</h1>
          <p className="text-muted-foreground">Monitor license leads, conversions, and revenue in real-time</p>
        </div>

        {leadsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.totalLeads}</div>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.newLeads} new</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.conversionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.converted} converted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Revenue (Closed)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${(metrics.revenue?.total || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">From {metrics.converted} deals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Pipeline Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${(metrics.pipelineValue || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.quoted} quoted</p>
                </CardContent>
              </Card>
            </div>

            {/* Tier Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Right to Execute (Starter)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{tierBreakdown.starter}</div>
                  <p className="text-xs text-muted-foreground mt-2">$1,499 per license</p>
                  <p className="text-xs text-muted-foreground">Entry-level compliance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Deterministic Shield (Professional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{tierBreakdown.professional}</div>
                  <p className="text-xs text-muted-foreground mt-2">$5,000 per year</p>
                  <p className="text-xs text-muted-foreground">AS9100 / ISO 13485</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Digital Twin (Enterprise)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{tierBreakdown.enterprise}</div>
                  <p className="text-xs text-muted-foreground mt-2">$15,000+ per year</p>
                  <p className="text-xs text-muted-foreground">Multi-domain access</p>
                </CardContent>
              </Card>
            </div>

            {/* Leads Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Sales Leads</CardTitle>
                  <div className="flex gap-2">
                    {(['all', 'new', 'quoted', 'converted'] as const).map((f) => (
                      <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className="capitalize"
                      >
                        {f === 'all' ? 'All' : f}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 font-semibold">Company</th>
                        <th className="text-left py-3 px-4 font-semibold">Industry</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Value</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-muted-foreground">
                            No leads found
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead) => (
                          <tr key={lead.id} className="border-b border-border hover:bg-accent/5">
                            <td className="py-3 px-4">{lead.name}</td>
                            <td className="py-3 px-4">{lead.company || '-'}</td>
                            <td className="py-3 px-4">{lead.industry || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(lead.status)}`}>
                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold">${getLeadValue(lead).toLocaleString()}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLead(lead)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Lead Detail Modal */}
            {selectedLead && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedLead.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{selectedLead.company || 'No company'}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedLead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(selectedLead.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Industry</p>
                        <p className="font-semibold">{selectedLead.industry || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedLead.status)}`}>
                          {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-semibold">${getLeadValue(selectedLead).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tiers</p>
                        <p className="font-semibold text-xs">{getTiers(selectedLead.tiersInterested).join(', ') || '-'}</p>
                      </div>
                    </div>

                    {selectedLead.message && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Message</p>
                        <p className="text-sm">{selectedLead.message}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" variant="default">
                        Send Email
                      </Button>
                      <Button className="flex-1" variant="outline">
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
