"use client";

export function PrintButton({ label = "Print / save PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-green btn-sm">
      {label}
    </button>
  );
}
