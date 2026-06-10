import React from "react";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold tracking-widest text-primary uppercase">{children}</h2>;
}
