import { Brain, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { DigitalTwin } from '@/components/DigitalTwin';

export default function ShopFloor() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-accent/30 glass sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">Back</span>
            </Link>
            <div className="w-px h-6 bg-border" />
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-heading tracking-tight">Guardian OS</h1>
              <p className="text-xs text-muted-foreground">Digital Twin &middot; Shop Floor Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent border border-accent/30">LIVE VIEW</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <DigitalTwin />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>Richard Cruz</span>
            <span className="text-accent">(951) 233-5475</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            &copy; {new Date().getFullYear()} Guardian Sentinel. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
