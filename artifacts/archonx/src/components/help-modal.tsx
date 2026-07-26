import { useEffect } from "react";
import { X } from "lucide-react";

const LIME    = "hsl(79 100% 57%)";
const BORDER  = "hsl(0 0% 12%)";
const CARD    = "hsl(0 0% 6%)";
const MUTED   = "hsl(0 0% 35%)";

/* ── Trigger Button ── */
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="How it works"
      className="w-7 h-7 rounded-full font-black text-[13px] flex items-center justify-center transition-all flex-shrink-0"
      style={{
        background: `${LIME}12`,
        color: LIME,
        border: `1px solid ${LIME}35`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = `${LIME}22`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px ${LIME}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = `${LIME}12`;
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      !
    </button>
  );
}

/* ── Reusable section block ── */
export function HSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div
        className="font-mono text-[9px] tracking-[0.25em] uppercase pb-1.5"
        style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/* ── Formula block ── */
export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="text-[11px] leading-relaxed rounded-lg px-4 py-3 overflow-x-auto font-mono"
      style={{ background: "hsl(0 0% 9%)", border: `1px solid ${BORDER}`, color: "hsl(0 0% 78%)" }}
    >
      {children}
    </pre>
  );
}

/* ── Small badge ── */
export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{ background: `${color}12`, color, border: `1px solid ${color}28` }}
    >
      {children}
    </span>
  );
}

/* ── Reference table ── */
export function RefTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr style={{ background: "hsl(0 0% 9%)" }}>
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-black tracking-wider text-[9px] uppercase"
                style={{ color: MUTED }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${BORDER}`, background: i % 2 === 0 ? "transparent" : "hsl(0 0% 5%)" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2" style={{ color: "hsl(0 0% 72%)" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Modal ── */
export function HelpModal({
  open, onClose, title, accent = LIME, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* lock body scroll */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: CARD, border: `1px solid ${accent}30`, boxShadow: `0 0 60px ${accent}10` }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: `${accent}60` }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[12px]"
              style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}35` }}
            >
              !
            </div>
            <span className="font-black text-[15px] uppercase tracking-wide" style={{ color: accent }}>
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "hsl(0 0% 10%)", color: "hsl(0 0% 45%)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 45%)"; }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {children}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex-shrink-0 font-mono text-[10px] flex items-center justify-between"
          style={{ borderTop: `1px solid ${BORDER}`, color: MUTED }}
        >
          <span>USDAX Finance · Robinhood Chain Testnet · Chain ID 46630</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
