import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  selected: boolean;
}

export default function SourceLeads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  // Mock lead generation function
  const generateMockLeads = (query: string, count: number): Lead[] => {
    const companies = [
      'Aerospace Dynamics Inc',
      'Precision Manufacturing Co',
      'Advanced Machining Solutions',
      'Industrial Tech Systems',
      'Manufacturing Innovations LLC',
      'Quality Engineering Corp',
      'Production Excellence Inc',
      'Advanced Materials Ltd',
      'Precision Components Group',
      'Industrial Solutions Inc'
    ];

    const titles = [
      'Operations Manager',
      'Manufacturing Director',
      'Plant Manager',
      'Procurement Manager',
      'Quality Manager',
      'Engineering Manager',
      'Production Supervisor',
      'Supply Chain Manager',
      'Maintenance Manager',
      'Logistics Manager'
    ];

    const firstNames = [
      'John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert', 'Maria',
      'James', 'Patricia', 'William', 'Linda', 'Richard', 'Barbara', 'Joseph', 'Susan'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
    ];

    const generatedLeads: Lead[] = [];
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`;

      generatedLeads.push({
        id: `lead_${i}`,
        name: `${firstName} ${lastName}`,
        email: email,
        company: company,
        title: title,
        selected: false
      });
    }
    return generatedLeads;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const generatedLeads = generateMockLeads(searchQuery, quantity);
      setLeads(generatedLeads);
      toast.success(`Found ${generatedLeads.length} leads matching "${searchQuery}"`);
    } catch (error) {
      toast.error('Failed to search leads');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLead = (id: string) => {
    setLeads(leads.map(lead => 
      lead.id === id ? { ...lead, selected: !lead.selected } : lead
    ));
    const newSelectedCount = leads.filter(l => l.id === id ? !l.selected : l.selected).length;
    setSelectedCount(newSelectedCount);
  };

  const toggleAllLeads = () => {
    const allSelected = leads.every(l => l.selected);
    setLeads(leads.map(lead => ({ ...lead, selected: !allSelected })));
    setSelectedCount(allSelected ? 0 : leads.length);
  };

  const addToTemplate = () => {
    const selected = leads.filter(l => l.selected);
    if (selected.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }

    sessionStorage.setItem('selectedLeads', JSON.stringify(selected));
    toast.success(`Added ${selected.length} leads to campaign template`);
    
    setTimeout(() => {
      window.location.href = '/campaign-builder';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Source Leads</h1>
          <p className="text-muted-foreground">Search and select leads to add to your campaign template</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Search For</label>
                <Input
                  placeholder="e.g., Manufacturing Director, Aerospace, California"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 50)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {leads.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Results ({leads.length} leads found)</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedCount} / {leads.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b">
                <input
                  type="checkbox"
                  checked={leads.every(l => l.selected)}
                  onChange={toggleAllLeads}
                  className="w-4 h-4 cursor-pointer"
                />
                <label className="text-sm font-medium cursor-pointer">
                  Select All
                </label>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start gap-3 p-3 rounded border border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => toggleLead(lead.id)}
                  >
                    <input
                      type="checkbox"
                      checked={lead.selected}
                      onChange={() => toggleLead(lead.id)}
                      className="w-4 h-4 mt-1 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">{lead.title}</div>
                      <div className="text-sm text-muted-foreground">{lead.email}</div>
                      <div className="text-sm text-muted-foreground">{lead.company}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={addToTemplate}
                  disabled={selectedCount === 0}
                  className="flex-1"
                >
                  Add {selectedCount > 0 ? `${selectedCount} Leads` : 'Leads'} to Template
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setLeads([]);
                    setSelectedCount(0);
                  }}
                  className="flex-1"
                >
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {leads.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No leads yet. Start by searching above.</p>
              <p className="text-sm text-muted-foreground">
                Enter search criteria and quantity to find leads matching your campaign
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
