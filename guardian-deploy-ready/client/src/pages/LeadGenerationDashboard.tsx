import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'converted', 'lost'];
const POSITIONS = ['owner', 'operations_manager', 'continuous_improvement', 'cco', 'vp'];

export function LeadGenerationDashboard() {
  const auth = useAuth();
  const [filterPosition, setFilterPosition] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leads, isLoading } = trpc.emailCampaigns.getLeads.useQuery({});
  const updateLeadStatus = trpc.emailCampaigns.updateLeadStatus.useMutation();

  const filteredLeads = (leads || []).filter((lead: any) => {
    const matchesPosition = !filterPosition || lead.position === filterPosition;
    const matchesStatus = !filterStatus || lead.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPosition && matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    await updateLeadStatus.mutateAsync({ leadId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      interested: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      demo_scheduled: 'bg-indigo-100 text-indigo-800',
      proposal_sent: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-emerald-100 text-emerald-800',
      closed_lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l: any) => l.status === 'new').length || 0,
    contacted: leads?.filter((l: any) => l.status === 'contacted').length || 0,
    qualified: leads?.filter((l: any) => l.status === 'qualified').length || 0,
    closedWon: leads?.filter((l: any) => l.status === 'closed_won').length || 0,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Lead Generation Dashboard</h1>
          <p className="text-muted-foreground">Manage and track your sales leads across all positions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All leads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              <p className="text-xs text-muted-foreground mt-1">Not contacted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.qualified}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for demo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Closed Won</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.closedWon}</div>
              <p className="text-xs text-muted-foreground mt-1">Converted</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
              <Input
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Position</label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={filterPosition === null ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilterPosition(null)}
                  >
                    All
                  </Badge>
                  {POSITIONS.map((pos) => (
                    <Badge
                      key={pos}
                      variant={filterPosition === pos ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFilterPosition(pos)}
                    >
                      {pos.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={filterStatus === null ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilterStatus(null)}
                  >
                    All
                  </Badge>
                  {LEAD_STATUSES.map((status) => (
                    <Badge
                      key={status}
                      variant={filterStatus === status ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFilterStatus(status)}
                    >
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads ({filteredLeads.length})</CardTitle>
            <CardDescription>
              {filteredLeads.length} of {stats.total} leads match your filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No leads found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Position</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Engagement</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead: any) => (
                      <tr key={lead.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {lead.firstName} {lead.lastName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{lead.company}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{lead.position.replace(/_/g, ' ').toUpperCase()}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{lead.email}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-foreground">{lead.engagementScore || 0}%</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(lead.id, 'contacted')}
                              disabled={updateLeadStatus.isPending}
                            >
                              Contact
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(lead.id, 'qualified')}
                              disabled={updateLeadStatus.isPending}
                            >
                              Qualify
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
