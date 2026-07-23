import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { PrivyProvider } from '@privy-io/react-auth';
import { PrivyAuthProvider, FallbackAuthProvider } from '@/contexts/privy-auth';

import Landing from '@/pages/landing';
import Docs from '@/pages/docs';
import Protocol from '@/pages/protocol';
import StakingPage from '@/pages/staking-page';
import GovernancePage from '@/pages/governance-page';
import { Navbar } from '@/components/layout';
import { Footer } from '@/components/footer';
import Dashboard from '@/pages/dashboard';
import Positions from '@/pages/positions';
import Staking from '@/pages/staking';
import Liquidations from '@/pages/liquidations';
import Nexus from '@/pages/nexus';
import Yield from '@/pages/yield';

const queryClient = new QueryClient();

const LIME = '#a3e635';

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-x-hidden">
        <Switch>
          <Route path="/app" component={Dashboard} />
          <Route path="/app/nexus" component={Nexus} />
          <Route path="/app/yield" component={Yield} />
          <Route path="/app/positions" component={Positions} />
          <Route path="/app/staking" component={Staking} />
          <Route path="/app/liquidations" component={Liquidations} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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

/** The inner app tree — same whether or not Privy is configured. */
function AppInner() {
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

type ConfigState =
  | { status: 'loading' }
  | { status: 'ready'; privyAppId: string };

export default function App() {
  const [config, setConfig] = useState<ConfigState>({ status: 'loading' });

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((c: { privyAppId?: string }) => {
        const id = (c.privyAppId ?? '').trim();
        setConfig({ status: 'ready', privyAppId: id });
      })
      .catch(() => setConfig({ status: 'ready', privyAppId: '' }));
  }, []);

  if (config.status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'hsl(0 0% 4%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `2px solid ${LIME}30`,
            borderTopColor: LIME,
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { privyAppId } = config;

  // When a valid Privy app ID is configured, wrap with PrivyProvider
  if (privyAppId.length > 8) {
    return (
      <PrivyProvider
        appId={privyAppId}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: LIME,
            logo: `${import.meta.env.BASE_URL}favicon.png`,
            landingHeader: 'Connect to USDEX Finance',
            loginMessage: 'Robinhood Chain · EVM 46630',
          },
          loginMethods: ['wallet', 'email'],
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        <PrivyAuthProvider>
          <AppInner />
        </PrivyAuthProvider>
      </PrivyProvider>
    );
  }

  // Fallback: no Privy — show app with disconnected wallet state
  return (
    <FallbackAuthProvider>
      <AppInner />
    </FallbackAuthProvider>
  );
}
