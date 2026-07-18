import React from "react";

export function PageHero({ eyebrow, title, description }: { eyebrow?: React.ReactNode; title?: React.ReactNode; description?: React.ReactNode }) {
 return (
 <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-200">
 {eyebrow && <div className="text-sm font-semibold tracking-wide text-primary uppercase mb-4">{eyebrow}</div>}
 <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary mb-6 max-w-4xl">{title}</h1>
 <p className="text-xl text-muted-foreground max-w-2xl">{description}</p>
 </div>
 );
}
