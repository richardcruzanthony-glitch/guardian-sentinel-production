import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock, Mail, Eye, Reply } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CampaignResults() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [emailSends, setEmailSends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from backend
    const mockCampaign = {
      id: parseInt(campaignId || '1'),
      name: 'Q1 Sales Campaign',
      subject: 'Exclusive Manufacturing Offer',
      status: 'sent',
      totalLeads: 45,
      sentCount: 45,
      openCount: 12,
      clickCount: 5,
      replyCount: 2,
      createdAt: new Date().toISOString(),
    };

    const mockEmailSends = [
      { id: 1, recipientEmail: 'john@company1.com', status: 'sent', openedAt: new Date().toISOString(), clickedAt: null },
      { id: 2, recipientEmail: 'sarah@company2.com', status: 'sent', openedAt: null, clickedAt: null },
      { id: 3, recipientEmail: 'mike@company3.com', status: 'sent', openedAt: new Date().toISOString(), clickedAt: new Date().toISOString() },
      { id: 4, recipientEmail: 'jane@company4.com', status: 'bounced', openedAt: null, clickedAt: null },
      { id: 5, recipientEmail: 'bob@company5.com', status: 'sent', openedAt: new Date().toISOString(), clickedAt: null },
    ];

    setCampaign(mockCampaign);
    setEmailSends(mockEmailSends);
    setLoading(false);
  }, [campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading campaign results...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'bounced':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'bounced':
        return <Badge className="bg-red-500">Bounced</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Campaign Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{campaign?.name}</h1>
          <p className="text-muted-foreground">Campaign ID: {campaign?.id}</p>
        </div>

        {/* Campaign Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{campaign?.totalLeads}</div>
                <p className="text-sm text-muted-foreground mt-1">Total Recipients</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{campaign?.sentCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Delivered</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{campaign?.openCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Opened</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">{campaign?.clickCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Clicked</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{campaign?.replyCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Replied</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="text-foreground font-medium">{campaign?.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-green-500 mt-1">Completed</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-foreground">{new Date(campaign?.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-foreground font-medium">
                  {campaign?.totalLeads > 0 ? Math.round((campaign?.openCount / campaign?.totalLeads) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Delivery List */}
        <Card>
          <CardHeader>
            <CardTitle>Email Delivery Status</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Verification of all sent emails</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emailSends.map((send) => (
                <div
                  key={send.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(send.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{send.recipientEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {send.status === 'sent' ? 'Delivered' : send.status.charAt(0).toUpperCase() + send.status.slice(1)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {send.openedAt && (
                      <div className="flex items-center gap-1 text-xs text-blue-500" title="Opened">
                        <Eye className="w-3 h-3" />
                      </div>
                    )}
                    {send.clickedAt && (
                      <div className="flex items-center gap-1 text-xs text-purple-500" title="Clicked">
                        <Mail className="w-3 h-3" />
                      </div>
                    )}
                    {getStatusBadge(send.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => window.location.href = '/campaign-builder'} variant="outline">
            Create Another Campaign
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="ghost">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
