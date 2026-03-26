import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Home } from "./pages/Home";
import ShopFloor from "./pages/ShopFloor";
import SalesDashboard from "./pages/SalesDashboard";
import AISalesAgentDashboard from "./pages/AISalesAgentDashboard";
import { EmailCampaignBuilder } from "./pages/EmailCampaignBuilder";
import CampaignBuilder from "./pages/CampaignBuilder";
import SourceLeads from "./pages/SourceLeads";
import CampaignResults from "./pages/CampaignResults";
import { LeadGenerationDashboard } from "./pages/LeadGenerationDashboard";
import { Pricing } from "./pages/Pricing";
import { ProcurementIntake } from "./pages/ProcurementIntake";
import { ComplianceChecklist } from "./pages/ComplianceChecklist";
import { ROICalculator } from "./pages/ROICalculator";
import { CaseStudies } from "./pages/CaseStudies";
import { ChatWidget } from "./components/ChatWidget";
import { AISalesAgent } from "./components/AISalesAgent";
import { NotificationProvider } from "./components/NotificationCenter";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/shop-floor"} component={ShopFloor} />
      <Route path={"/sales-dashboard"} component={SalesDashboard} />
      <Route path={"/ai-sales-agent-dashboard"} component={AISalesAgentDashboard} />
      <Route path={"/email-campaigns"} component={EmailCampaignBuilder} />
      <Route path={"/campaign-builder"} component={CampaignBuilder} />
      <Route path={"/source-leads"} component={SourceLeads} />
      <Route path={"/campaign-results/:campaignId"} component={CampaignResults} />
      <Route path={"/leads"} component={LeadGenerationDashboard} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/procurement-intake"} component={ProcurementIntake} />
      <Route path={"/compliance-checklist"} component={ComplianceChecklist} />
      <Route path={"/roi-calculator"} component={ROICalculator} />
      <Route path={"/case-studies"} component={CaseStudies} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // NOTE: Puter.js auth is NOT triggered on page load because it hijacks the page.
  // Instead, Puter auth is triggered only when the user clicks Process (via the hybrid orchestrator).
  // If Puter is already authenticated (return visit), it works instantly.
  // If not, the system routes all agents through the backend.

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
          <Router />
          <ChatWidget />
          <AISalesAgent />
          {/* Sales Dashboard accessible at /sales-dashboard */}
          </TooltipProvider>
        </ThemeProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
