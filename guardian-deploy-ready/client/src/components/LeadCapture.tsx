import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ArrowRight, Rocket, Phone, Mail, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface LeadCaptureProps {
  demoOpen: boolean;
  setDemoOpen: (open: boolean) => void;
  earlyAccessOpen: boolean;
  setEarlyAccessOpen: (open: boolean) => void;
}

export function DemoRequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitDemo = trpc.leads.submitDemo.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast.error('Something went wrong. Please try again or contact us directly.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    submitDemo.mutate({ name, email, company, message });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <DialogTitle className="text-xl text-foreground">We'll Be in Touch</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Richard Cruz will reach out within 24 hours to schedule your personalized demo.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> (951) 233-5475</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Direct Contact</span>
            </div>
            <Button onClick={handleClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-accent" />
                Request a Demo
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                See Guardian OS in action with your own data. We'll walk you through every domain.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Email *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Company</label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company name"
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your use case (optional)"
                  rows={3}
                  className="mt-1 bg-background border-border resize-none"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={submitDemo.isPending || !name || !email}
              >
                {submitDemo.isPending ? 'Submitting...' : 'Request Demo'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function EarlyAccessModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitEarlyAccess = trpc.leads.submitEarlyAccess.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast.error('Something went wrong. Please try again or contact us directly.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    submitEarlyAccess.mutate({
      name,
      email,
      company,
      companySize,
      domainsInterested: domains,
      timeline,
      message,
    });
  };

  const toggleDomain = (d: string) => {
    setDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setCompany('');
      setCompanySize('');
      setDomains([]);
      setTimeline('');
      setMessage('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Rocket className="w-8 h-8 text-green-400" />
            </div>
            <DialogTitle className="text-xl text-foreground">Welcome to Early Access</DialogTitle>
            <p className="text-muted-foreground text-sm">
              You're in. Richard Cruz will personally reach out to get you set up and discuss how Guardian OS fits your operations.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> (951) 233-5475</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Direct Contact</span>
            </div>
            <Button onClick={handleClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Rocket className="w-5 h-5 text-green-400" />
                Join Early Access
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Be among the first to deploy Guardian OS. Limited spots — we work directly with each early adopter.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="mt-1 bg-background border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Email *</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="mt-1 bg-background border-border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Company</label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                    className="mt-1 bg-background border-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">Select...</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Domains of Interest</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Manufacturing', 'Defense', 'Medical', 'Legal'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDomain(d)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        domains.includes(d)
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-background text-muted-foreground border-border hover:border-accent/50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Timeline</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Ready now', 'Within 30 days', 'Within 90 days', 'Exploring'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimeline(t)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        timeline === t
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-background text-muted-foreground border-border hover:border-accent/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Tell Us About Your Needs</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What challenges are you looking to solve? (optional)"
                  rows={3}
                  className="mt-1 bg-background border-border resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={submitEarlyAccess.isPending || !name || !email}
              >
                {submitEarlyAccess.isPending ? 'Submitting...' : 'Join Early Access Program'}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                No commitment required. We'll reach out to discuss your specific needs.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ContactSection({ onDemoClick, onEarlyAccessClick }: { onDemoClick: () => void; onEarlyAccessClick: () => void }) {
  return (
    <div className="border border-accent/30 rounded-lg bg-gradient-to-br from-accent/5 to-transparent p-8 text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Ready to Transform Your Operations?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Guardian OS is currently available to select early adopters. See it in action with your own data, 
          or secure your spot in the program.
        </p>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={onDemoClick}
          variant="outline"
          size="lg"
          className="border-accent/50 text-accent hover:bg-accent/10"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Request a Demo
        </Button>
        <Button
          onClick={onEarlyAccessClick}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Join Early Access
        </Button>
      </div>
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1.5">
          <User className="w-3 h-3" /> Richard Cruz
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="w-3 h-3" /> (951) 233-5475
        </span>
      </div>
    </div>
  );
}
