import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Mail, Calendar, FileText, CreditCard, MessageSquare, Settings, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

export default function AISalesAgentDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch AI Sales Agents
  const { data: agents = [], isLoading: agentsLoading } = trpc.aiSalesAgent.getAgents.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });

  // Fetch agent activity logs
  const { data: activityLogs = [] } = trpc.aiSalesAgent.getActivityLogs.useQuery(
    { agentId: selectedAgent || undefined },
    { enabled: !!user && user.role === 'admin' && !!selectedAgent }
  );

  // Fetch demo bookings
  const { data: demoBookings = [] } = trpc.aiSalesAgent.getDemoBookings.useQuery(
    { agentId: selectedAgent || undefined },
    { enabled: !!user && user.role === 'admin' && !!selectedAgent }
  );

  // Fetch contracts
  const { data: contracts = [] } = trpc.aiSalesAgent.getContracts.useQuery(
    { agentId: selectedAgent || undefined },
    { enabled: !!user && user.role === 'admin' && !!selectedAgent }
  );

  // Fetch payments
  const { data: payments = [] } = trpc.aiSalesAgent.getPayments.useQuery(
    { agentId: selectedAgent || undefined },
    { enabled: !!user && user.role === 'admin' && !!selectedAgent }
  );

  // Fetch feedback
  const { data: feedback = [] } = trpc.aiSalesAgent.getFeedback.useQuery(
    { agentId: selectedAgent || undefined },
    { enabled: !!user && user.role === 'admin' && !!selectedAgent }
  );

  // Fetch performance metrics
  const { data: metrics } = trpc.aiSalesAgent.getPerformanceMetrics.useQuery(
    { agentId: selectedAgent || 0 },
    { enabled: !!user && user.role === 'admin' && !!selectedAgent }
  );

  // Redirect non-admin users
  React.useEffect(() => {
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

  const currentAgent = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">AI Sales Agent Dashboard</h1>
          <p className="text-muted-foreground">Monitor agent performance, track interactions, and manage sales operations</p>
        </div>

        {agentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Agent Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {agents.map((a: any) => (
                <Card
                  key={a.id}
                  className={`cursor-pointer transition-all ${
                    selectedAgent === a.id
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'hover:bg-accent/5'
                  }`}
                  onClick={() => setSelectedAgent(a.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{a.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{a.domain}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        a.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : a.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Agent Details */}
            {selectedAgent && currentAgent && (
              <>
                {/* Performance Metrics */}
                {metrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Emails Sent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.emailsSent}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Demos Scheduled</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.demosScheduled}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Quotes Provided</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.quotesProvided}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Contracts Sent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.contractsSent}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Payments Processed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.paymentsProcessed}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Conversion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="demos">Demos</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Agent Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-semibold">{currentAgent.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-semibold capitalize">{currentAgent.status}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Domain</p>
                            <p className="font-semibold">{currentAgent.domain}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Target Industries</p>
                            <p className="font-semibold">
                              {Array.isArray(currentAgent.targetIndustries)
                                ? currentAgent.targetIndustries.join(', ')
                                : '-'}
                            </p>
                          </div>
                        </div>

                        {currentAgent.messagingTemplate && (
                          <div className="pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-2">Messaging Template</p>
                            <p className="text-sm bg-muted p-3 rounded">{currentAgent.messagingTemplate}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button variant="default">Edit Configuration</Button>
                          <Button variant="outline">View Capabilities</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {activityLogs.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No activity yet</p>
                          ) : (
                            activityLogs.map((log: any) => (
                              <div key={log.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{log.activityType.replace(/_/g, ' ')}</p>
                                  <p className="text-sm text-muted-foreground">{log.prospectName || log.prospectEmail}</p>
                                  {log.subject && <p className="text-xs text-muted-foreground mt-1">{log.subject}</p>}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  log.status === 'sent'
                                    ? 'bg-green-100 text-green-800'
                                    : log.status === 'opened'
                                    ? 'bg-blue-100 text-blue-800'
                                    : log.status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {log.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Demos Tab */}
                  <TabsContent value="demos">
                    <Card>
                      <CardHeader>
                        <CardTitle>Demo Bookings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {demoBookings.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No demos scheduled</p>
                          ) : (
                            demoBookings.map((demo: any) => (
                              <div key={demo.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                                <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{demo.prospectName}</p>
                                  <p className="text-sm text-muted-foreground">{demo.prospectEmail}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(demo.scheduledTime).toLocaleString()}
                                  </p>
                                  {demo.meetingLink && (
                                    <a href={demo.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                                      Join Meeting
                                    </a>
                                  )}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  demo.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : demo.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {demo.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Contracts Tab */}
                  <TabsContent value="contracts">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contracts & Agreements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {contracts.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No contracts yet</p>
                          ) : (
                            contracts.map((contract: any) => (
                              <div key={contract.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                                <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{contract.contractType.replace(/_/g, ' ')}</p>
                                  <p className="text-sm text-muted-foreground">{contract.prospectName}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{contract.prospectEmail}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  contract.status === 'executed'
                                    ? 'bg-green-100 text-green-800'
                                    : contract.status === 'signed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : contract.status === 'sent'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {contract.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Feedback Tab */}
                  <TabsContent value="feedback">
                    <Card>
                      <CardHeader>
                        <CardTitle>Prospect Feedback & Engagement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {feedback.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No feedback yet</p>
                          ) : (
                            feedback.map((fb: any) => (
                              <div key={fb.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                                <MessageSquare className="w-5 h-5 text-muted-foreground mt-1" />
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{fb.feedbackType.replace(/_/g, ' ')}</p>
                                  <p className="text-sm text-muted-foreground">{fb.prospectEmail}</p>
                                  {fb.content && <p className="text-xs text-muted-foreground mt-1">{fb.content}</p>}
                                  {fb.engagementScore && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Engagement Score: {fb.engagementScore}/100
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  fb.sentiment === 'positive'
                                    ? 'bg-green-100 text-green-800'
                                    : fb.sentiment === 'negative'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {fb.sentiment || 'neutral'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {!selectedAgent && agents.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">Select an agent to view details</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
