import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Navbar } from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import Positions from '@/pages/positions';
import Staking from '@/pages/staking';
import Liquidations from '@/pages/liquidations';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-x-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/positions" component={Positions} />
          <Route path="/staking" component={Staking} />
          <Route path="/liquidations" component={Liquidations} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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
