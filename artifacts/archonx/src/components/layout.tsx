import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const WALLET_ADDRESS = "0x71C7...656F";
const NETWORK_NAME = "Robinhood Chain";

export function Navbar() {
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/positions", label: "Vaults" },
    { href: "/staking", label: "Staking" },
    { href: "/liquidations", label: "Liquidations" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold tracking-tighter text-primary">
              ARCHON_X
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs font-mono">
            <div className="h-2 w-2 rounded-full bg-safe animate-pulse" />
            <span className="text-muted-foreground">{NETWORK_NAME}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono text-primary">
            {WALLET_ADDRESS}
          </div>
        </div>
      </div>
    </header>
  );
}
