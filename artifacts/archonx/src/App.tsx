import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Landing from '@/pages/landing';
import Docs from '@/pages/docs';
import Protocol from '@/pages/protocol';
import StakingPage from '@/pages/staking-page';
import GovernancePage from '@/pages/governance-page';
import { Navbar } from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import Positions from '@/pages/positions';
import Staking from '@/pages/staking';
import Liquidations from '@/pages/liquidations';

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-x-hidden">
        <Switch>
          <Route path="/app" component={Dashboard} />
          <Route path="/app/positions" component={Positions} />
          <Route path="/app/staking" component={Staking} />
          <Route path="/app/liquidations" component={Liquidations} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/docs" component={Docs} />
      <Route path="/protocol" component={Protocol} />
      <Route path="/staking" component={StakingPage} />
      <Route path="/governance" component={GovernancePage} />
      <Route component={AppLayout} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
