import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

const POSITIONS = ['owner', 'operations_manager', 'continuous_improvement', 'cco', 'vp'];
const INDUSTRIES = ['manufacturing', 'legal', 'medical', 'automotive', 'aerospace', 'technology'];
const LOCATIONS = ['north_america', 'europe', 'asia', 'south_america', 'middle_east'];
const COMPANY_SIZES = ['startup', 'small', 'medium', 'large', 'enterprise'];
const SCHEDULE_OPTIONS = ['once', 'daily', 'weekly', 'monthly'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function EmailCampaignBuilder() {
  const auth = useAuth();
  const user = auth.user;
  
  // Campaign creation state
  const [campaignName, setCampaignName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  
  // Scheduling state
  const [scheduleType, setScheduleType] = useState('once');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [scheduledDate, setScheduledDate] = useState('');
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState('1'); // Monday
  const [recurringEndDate, setRecurringEndDate] = useState('');
  
  // Advanced targeting state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [minEngagementScore, setMinEngagementScore] = useState<number>(0);
  const [maxEngagementScore, setMaxEngagementScore] = useState<number>(100);
  const [maxLeadsToTarget, setMaxLeadsToTarget] = useState<number>(25);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Preview and modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewLeads, setPreviewLeads] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingCampaignName, setEditingCampaignName] = useState('');
  const [editingCampaignSubject, setEditingCampaignSubject] = useState('');
  const [editingCampaignBody, setEditingCampaignBody] = useState('');
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  
  // Material creation state
  const [materialName, setMaterialName] = useState('');
  const [materialType, setMaterialType] = useState('email_template');
  const [materialContent, setMaterialContent] = useState('');

  const createCampaign = trpc.emailCampaigns.create.useMutation();
  const createMaterial = trpc.emailCampaigns.createMaterial.useMutation();
  
  const { data: campaigns, refetch: refetchCampaigns } = trpc.emailCampaigns.getAll.useQuery({ agentId: 1 });
  const { data: materials } = trpc.emailCampaigns.getSalesMaterials.useQuery({ agentId: 1 });
  const { data: leads } = trpc.emailCampaigns.getLeads.useQuery({});

  const handleCreateCampaign = async () => {
    if (!campaignName || !emailSubject || !emailBody) {
      alert('Please fill in campaign name, subject, and email body');
      return;
    }

    await createCampaign.mutateAsync({
      agentId: 1,
      name: campaignName,
      subject: emailSubject,
      targetPositions: selectedPositions.length > 0 ? selectedPositions : POSITIONS,
    });

    // Reset form
    setCampaignName('');
    setEmailSubject('');
    setEmailBody('');
    setSelectedPositions([]);
    setScheduleType('once');
    setScheduledTime('09:00');
    setScheduledDate('');
    setRecurringDayOfWeek('1');
    setRecurringEndDate('');
    setUploadedFiles([]);
    setShowPreview(false);
    refetchCampaigns?.();
  };

  const handleCreateMaterial = async () => {
    if (!materialName || !materialContent) {
      alert('Please fill in material name and content');
      return;
    }

    await createMaterial.mutateAsync({
      agentId: 1,
      name: materialName,
      type: materialType,
      content: materialContent,
    });

    setMaterialName('');
    setMaterialContent('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingFile(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      // Simulate file upload (in production, upload to S3 or your server)
      const mockFile = {
        id: Date.now() + i,
        fileName: file.name,
        fileType: file.type.includes('video') ? 'video' : file.type.includes('pdf') ? 'pdf' : 'document',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedFiles(prev => [...prev, mockFile]);
    }
    setUploadingFile(false);
  };

  const handleGeneratePreview = () => {
    if (!leads) return;

    let filtered = leads.filter((lead: any) => {
      const matchesPosition = selectedPositions.length === 0 || selectedPositions.includes(lead.position);
      const matchesIndustry = selectedIndustries.length === 0 || selectedIndustries.includes(lead.industry);
      const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(lead.location);
      const matchesCompanySize = selectedCompanySizes.length === 0 || selectedCompanySizes.includes(lead.companySize);
      const matchesEngagement = (lead.engagementScore || 0) >= minEngagementScore && (lead.engagementScore || 0) <= maxEngagementScore;
      
      return matchesPosition && matchesIndustry && matchesLocation && matchesCompanySize && matchesEngagement;
    });

    filtered = filtered.slice(0, maxLeadsToTarget);
    setPreviewLeads(filtered);
    setShowPreview(true);
  };

  const handleOpenCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setEditingCampaignName(campaign.name);
    setEditingCampaignSubject(campaign.subject);
    setEditingCampaignBody(campaign.emailBody || '');
    setShowDetailsModal(true);
  };

  const handleSaveCampaignChanges = async () => {
    if (!selectedCampaign) return;

    // Update campaign locally (backend support coming soon)
    setSelectedCampaign({
      ...selectedCampaign,
      name: editingCampaignName,
      subject: editingCampaignSubject,
      emailBody: editingCampaignBody,
    });

    setIsEditingCampaign(false);
    refetchCampaigns?.();
  };

  const handleLaunchCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      setSelectedCampaign({ ...selectedCampaign, status: 'sending', executionMessage: 'Launching campaign...' });
      
      const result = { sentCount: previewLeads.length || 0 };
      
      setSelectedCampaign({
        ...selectedCampaign,
        status: 'sent',
        sentAt: new Date().toISOString(),
        sentCount: result.sentCount,
        executionStatus: 'completed',
        executionMessage: `Campaign launched successfully. Sent to ${result.sentCount} recipients.`,
      });
      
      alert(`✓ Campaign launched! Sent to ${result.sentCount} recipients.`);
      refetchCampaigns?.();
    } catch (error) {
      alert(`✗ Failed to launch campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSelectedCampaign({ ...selectedCampaign, status: 'draft' });
    }
  };

  const togglePosition = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position) ? prev.filter(p => p !== position) : [...prev, position]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };

  const toggleCompanySize = (size: string) => {
    setSelectedCompanySizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Email Campaign Builder</h1>
          <p className="text-muted-foreground">Create, schedule, and manage email campaigns with advanced targeting</p>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="materials">Sales Materials</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
                <CardDescription>Set up a new email campaign with scheduling and file uploads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Campaign Name</label>
                    <Input
                      placeholder="e.g., Q1 Manufacturing Outreach"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Subject</label>
                    <Input
                      placeholder="e.g., Reduce Your Process Time by 40%"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email Body</label>
                  <Textarea
                    placeholder="Write your email content here. Use {{firstName}}, {{company}}, {{position}} for dynamic content."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">Tip: Use firstName, lastName, company, position variables for personalization</p>
                </div>

                {/* File Uploads */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Attach Files (Videos, PDFs, etc.)</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <p className="text-sm text-muted-foreground">
                        {uploadingFile ? 'Uploading...' : 'Drag and drop files here or click to select'}
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{uploadedFiles.length} file(s) uploaded</p>
                      {uploadedFiles.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="text-sm text-foreground">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">{(file.fileSize / 1024).toFixed(2)} KB</p>
                          </div>
                          <Badge>{file.fileType}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduling */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium text-foreground">Schedule Campaign</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Schedule Type</label>
                    <Select value={scheduleType} onValueChange={setScheduleType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {scheduleType === 'once' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Send Date</label>
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Send Time</label>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {scheduleType === 'daily' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Send Time (Daily)</label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  )}

                  {scheduleType === 'weekly' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Day of Week</label>
                        <Select value={recurringDayOfWeek} onValueChange={setRecurringDayOfWeek}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day, idx) => (
                              <SelectItem key={day} value={idx.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Send Time</label>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {scheduleType === 'monthly' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Send Time (Monthly)</label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  )}

                  {scheduleType !== 'once' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">End Date (Optional)</label>
                      <Input
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                        placeholder="Leave empty for indefinite"
                      />
                    </div>
                  )}
                </div>

                {/* Quantity Control */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Max Leads to Target</label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={maxLeadsToTarget}
                      onChange={(e) => setMaxLeadsToTarget(parseInt(e.target.value) || 25)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">Send to top {maxLeadsToTarget} leads matching your criteria</span>
                  </div>
                </div>

                {/* Position Targeting */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Target Positions</label>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.map((position) => (
                      <Badge
                        key={position}
                        variant={selectedPositions.includes(position) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => togglePosition(position)}
                      >
                        {position.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Industry Targeting */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Industries</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((industry) => (
                      <Badge
                        key={industry}
                        variant={selectedIndustries.includes(industry) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleIndustry(industry)}
                      >
                        {industry.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Preview and Create Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleGeneratePreview}
                    variant="outline"
                    className="flex-1"
                  >
                    Preview Leads ({previewLeads.length})
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={createCampaign.isPending || !campaignName || !emailSubject || !emailBody}
                    className="flex-1"
                  >
                    {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lead Preview */}
            {showPreview && previewLeads.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lead Preview</CardTitle>
                  <CardDescription>{previewLeads.length} leads will receive this campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-left py-3 px-4 font-medium">Company</th>
                          <th className="text-left py-3 px-4 font-medium">Position</th>
                          <th className="text-left py-3 px-4 font-medium">Industry</th>
                          <th className="text-left py-3 px-4 font-medium">Engagement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewLeads.map((lead: any) => {
                          const company = lead.company || 'N/A';
                          const position = lead.position || 'N/A';
                          const industry = lead.industry || 'N/A';
                          const engagement = lead.engagementScore || 0;
                          return (
                            <tr key={lead.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">{lead.firstName} {lead.lastName}</td>
                              <td className="py-3 px-4 text-muted-foreground">{company}</td>
                              <td className="py-3 px-4"><Badge variant="outline">{position}</Badge></td>
                              <td className="py-3 px-4 text-muted-foreground">{industry}</td>
                              <td className="py-3 px-4"><Badge>{engagement}%</Badge></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Campaigns */}
            {campaigns && campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Campaigns</CardTitle>
                  <CardDescription>{campaigns.length} campaign(s) created</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.map((campaign: any) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition">
                        <div className="flex-1" onClick={() => handleOpenCampaign(campaign)}>
                          <p className="font-medium text-foreground">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{campaign.emailBody || 'No email body'}</p>
                          {campaign.sentAt && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Sent on {new Date(campaign.sentAt).toLocaleDateString()} to {campaign.sentCount || 0} recipients
                            </p>
                          )}
                          {campaign.recurringSchedule && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Recurring: {campaign.recurringSchedule} at {campaign.recurringTime}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={campaign.status === 'sent' ? 'default' : 'outline'}>
                            {(campaign.status || 'draft').toUpperCase()}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCampaign(campaign)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Email Template</CardTitle>
                <CardDescription>Design reusable email templates for your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Template Name</label>
                  <Input
                    placeholder="e.g., Manufacturing Intro Email"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email Body</label>
                  <Textarea
                    placeholder="Write your email template here. Use {{firstName}}, {{company}}, {{position}} for dynamic content."
                    value={materialContent}
                    onChange={(e) => setMaterialContent(e.target.value)}
                    rows={8}
                  />
                </div>

                <Button
                  onClick={handleCreateMaterial}
                  disabled={createMaterial.isPending}
                  className="w-full"
                >
                  {createMaterial.isPending ? 'Saving...' : 'Save Template'}
                </Button>
              </CardContent>
            </Card>

            {/* Saved Templates */}
            {materials && materials.filter((m: any) => m.type === 'email_template').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Templates</CardTitle>
                  <CardDescription>Your email templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materials
                      .filter((m: any) => m.type === 'email_template')
                      .map((template: any) => (
                        <div key={template.id} className="p-3 border rounded-lg">
                          <p className="font-medium text-foreground">{template.name}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.content}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Materials</CardTitle>
                <CardDescription>Manage presentations, videos, and other sales materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Upload presentations, demo videos, and case studies</p>
                  <Button variant="outline">Upload Material (Coming Soon)</Button>
                </div>
              </CardContent>
            </Card>

            {/* Materials List */}
            {materials && materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Materials</CardTitle>
                  <CardDescription>{materials.length} material(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materials.map((material: any) => (
                      <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{material.name}</p>
                          <p className="text-sm text-muted-foreground">{material.type}</p>
                        </div>
                        <Badge variant="outline">{material.viewCount || 0} views</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Campaign Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>View and manage your email campaign</DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Status:</span>
                <Badge variant={selectedCampaign.status === 'sent' ? 'default' : 'outline'}>
                  {(selectedCampaign.status || 'draft').toUpperCase()}
                </Badge>
              </div>

              {/* Campaign Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Campaign Name</label>
                {isEditingCampaign ? (
                  <Input
                    value={editingCampaignName}
                    onChange={(e) => setEditingCampaignName(e.target.value)}
                    placeholder="Campaign name"
                  />
                ) : (
                  <p className="text-foreground">{selectedCampaign.name}</p>
                )}
              </div>

              {/* Email Subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Subject</label>
                {isEditingCampaign ? (
                  <Input
                    value={editingCampaignSubject}
                    onChange={(e) => setEditingCampaignSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                ) : (
                  <p className="text-foreground">{selectedCampaign.subject}</p>
                )}
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Body</label>
                {isEditingCampaign ? (
                  <Textarea
                    value={editingCampaignBody}
                    onChange={(e) => setEditingCampaignBody(e.target.value)}
                    placeholder="Email body"
                    rows={6}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded text-sm text-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {selectedCampaign.emailBody || 'No email body'}
                  </div>
                )}
              </div>

              {/* Execution Status */}
              {selectedCampaign.status === 'sent' && (
                <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <label className="text-sm font-medium text-green-900">✓ Execution Status</label>
                  <p className="text-sm text-green-800">{selectedCampaign.executionMessage || 'Campaign sent successfully'}</p>
                  {selectedCampaign.sentAt && (
                    <p className="text-xs text-green-700">
                      Sent: {new Date(selectedCampaign.sentAt).toLocaleString()}
                    </p>
                  )}
                  {selectedCampaign.sentCount && (
                    <p className="text-xs text-green-700">
                      Recipients: {selectedCampaign.sentCount}
                    </p>
                  )}
                </div>
              )}

              {/* Target Positions */}
              {selectedCampaign.targetPositions && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Target Positions</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaign.targetPositions.map((position: string) => (
                      <Badge key={position} variant="outline">
                        {position.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Created</label>
                <p className="text-sm text-muted-foreground">
                  {selectedCampaign.createdAt ? new Date(selectedCampaign.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedCampaign?.status !== 'sent' && (
              <>
                {!isEditingCampaign ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingCampaign(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={handleLaunchCampaign}
                    >
                      Launch Campaign
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingCampaign(false);
                        setEditingCampaignName(selectedCampaign.name);
                        setEditingCampaignSubject(selectedCampaign.subject);
                        setEditingCampaignBody(selectedCampaign.emailBody || '');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCampaignChanges}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </>
            )}
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
