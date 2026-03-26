import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Save, Rocket, Edit2, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function CampaignBuilder() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [leadQuantity, setLeadQuantity] = useState('100');
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  // Fetch templates
  const { data: fetchedTemplates = [] } = trpc.emailCampaigns.getAll.useQuery({ agentId: 1 });

  useEffect(() => {
    if (fetchedTemplates.length > 0) {
      setTemplates(fetchedTemplates);
    }
  }, [fetchedTemplates]);

  // Load template data
  const loadTemplate = (template: any) => {
    setSelectedTemplate(template);
    setCampaignName(template.name || '');
    setSubject(template.subject || '');
    setEmailBody(template.emailBody || '');
    const storedLeads = sessionStorage.getItem('selectedLeads');
    if (storedLeads) {
      const parsedLeads = JSON.parse(storedLeads);
      setLeads(parsedLeads);
      setLeadQuantity(parsedLeads.length.toString());
    } else {
      setLeadQuantity('100');
    }
  };

  // Load leads from sessionStorage on mount
  useEffect(() => {
    const storedLeads = sessionStorage.getItem('selectedLeads');
    if (storedLeads) {
      const parsedLeads = JSON.parse(storedLeads);
      setLeads(parsedLeads);
      setLeadQuantity(parsedLeads.length.toString());
    }
  }, []);

  // Save template
  const saveTemplateMutation = trpc.emailCampaigns.create.useMutation({
    onSuccess: (data) => {
      toast.success('Template saved successfully');
      setTemplates([...templates, data]);
      setSelectedTemplate(data);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save template');
    },
  });

  const handleSaveTemplate = () => {
    if (!campaignName.trim() || !subject.trim() || !emailBody.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    saveTemplateMutation.mutate({
      agentId: 1,
      name: campaignName,
      subject,
      targetPositions: [],
      emailTemplateId: selectedTemplate?.id,
    });
  };

  const handleSourceLeads = () => {
    window.location.href = '/source-leads';
  };

  // Create campaign mutation
  const createCampaignMutation = trpc.emailCampaigns.create.useMutation({
    onSuccess: (campaign) => {
      toast.success(`Campaign created: ${campaign.id}`);
      // Store campaign ID for results page
      sessionStorage.setItem('lastCampaignId', campaign.id.toString());
      // Redirect to results page
      setTimeout(() => {
        window.location.href = `/campaign-results/${campaign.id}`;
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
      setIsLaunching(false);
    },
  });

  const handleLaunchCampaign = () => {
    if (!campaignName.trim() || !subject.trim() || !emailBody.trim()) {
      toast.error('Please fill in all campaign details');
      return;
    }

    if (leads.length === 0) {
      toast.error('Please source leads first');
      return;
    }

    setIsLaunching(true);
    
    // Create campaign with leads
    createCampaignMutation.mutate({
      agentId: 1,
      name: campaignName,
      subject,
      targetPositions: [],
      emailTemplateId: selectedTemplate?.id,
      leads: leads, // Pass leads to backend
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Campaign Builder</h1>
          <p className="text-muted-foreground">Create, edit, and launch email campaigns to your leads</p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Campaign</TabsTrigger>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Auto Schedule</TabsTrigger>
          </TabsList>

          {/* Create Campaign Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Campaign Settings */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Campaign Name</label>
                      <Input
                        placeholder="e.g., Q1 Sales Outreach"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Lead Quantity</label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={leadQuantity}
                        onChange={(e) => setLeadQuantity(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Number of leads to include in this campaign
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Source Leads</label>
                      <Button onClick={handleSourceLeads} className="w-full gap-2 mt-2">
                        <span>🔍</span>
                        Search & Select Leads
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Selected: {leads.length} leads
                      </p>
                      {leads.length > 0 && (
                        <div className="mt-3 p-2 bg-accent/20 rounded text-xs space-y-1">
                          <p className="font-medium">Leads Ready:</p>
                          {leads.slice(0, 3).map((lead, idx) => (
                            <div key={idx}>{lead.name}</div>
                          ))}
                          {leads.length > 3 && <div>... and {leads.length - 3} more</div>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Subject Line</label>
                      <Input
                        placeholder="e.g., Exclusive offer for your business"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Email Body</label>
                      <Textarea
                        placeholder="Write your email message here..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={8}
                        className="mt-1 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {'{'}company{'}'} and {'{'}email{'}'} for dynamic fields
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={handleSaveTemplate}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      <Save className="w-4 h-4" />
                      Save Template
                    </Button>

                    <Button
                      onClick={handleLaunchCampaign}
                      disabled={!campaignName.trim() || !subject.trim() || isLaunching}
                      className="w-full gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      {isLaunching ? 'Launching...' : 'Launch Now'}
                    </Button>

                    <div className="border-t pt-3">
                      <label className="text-sm font-medium text-foreground block mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Schedule Campaign
                      </label>
                      <Input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="text-sm"
                      />
                      {scheduleTime && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Will send on {new Date(scheduleTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900">Sales Email</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-blue-900">
                    <p>All campaign results and lead responses are sent to:</p>
                    <p className="font-mono font-bold mt-2">guardianoperatingsystem@gmail.com</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.length === 0 ? (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No templates yet. Create one to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-accent bg-accent/5'
                        : 'hover:border-accent'
                    }`}
                    onClick={() => loadTemplate(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.emailBody}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadTemplate(template);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTemplates(templates.filter(t => t.id !== template.id));
                            toast.success('Template deleted');
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Automation Schedule</CardTitle>
                <CardDescription>Campaigns run automatically at these times every day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="font-bold text-lg text-foreground">4:00 AM</p>
                    <p className="text-sm text-muted-foreground mt-1">Source Leads</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Automatically fetch leads from your database based on criteria
                    </p>
                    <Badge className="mt-3">Active</Badge>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="font-bold text-lg text-foreground">5:00 AM</p>
                    <p className="text-sm text-muted-foreground mt-1">Apply to Template</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Apply sourced leads to your default campaign template
                    </p>
                    <Badge className="mt-3">Active</Badge>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <p className="font-bold text-lg text-foreground">6:00 AM</p>
                    <p className="text-sm text-muted-foreground mt-1">Launch Campaign</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Send emails to all sourced leads automatically
                    </p>
                    <Badge className="mt-3">Active</Badge>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Automation runs daily. Results and responses sent to guardianoperatingsystem@gmail.com
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Status:</strong> Automation is active and will run tomorrow at 4:00 AM
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
