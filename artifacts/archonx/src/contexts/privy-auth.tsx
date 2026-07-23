/**
 * PrivyAuthContext — wraps @privy-io/react-auth hooks and provides
 * safe no-op fallbacks when Privy is not configured (no valid App ID).
 *
 * Usage:
 *   - When a valid appId is available: render PrivyProvider → PrivyAuthProvider → ...
 *   - Otherwise:                       render FallbackPrivyAuthProvider → ...
 *   - Consumers always call useAuth() — never usePrivy() directly.
 */
import { createContext, useContext, type ReactNode } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

export interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  address: string;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  authenticated: false,
  address: "",
  login: () => {},
  logout: async () => {},
});

/** Use this inside PrivyProvider tree — calls real Privy hooks. */
export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const address = wallets[0]?.address ?? "";

  return (
    <AuthContext.Provider value={{ ready, authenticated, address, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Use this when Privy is not configured — provides static disconnected state. */
export function FallbackAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        ready: true,
        authenticated: false,
        address: "",
        login: () => {},
        logout: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
