import React from 'react';
import { Settings, Wrench, ArrowRight, Construction } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  title: string;
  category: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, category }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Construction className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">Module: {category}</p>
        </div>
      </div>

      <Card className="border-dashed border-2 bg-gray-50/50 shadow-none">
        <CardContent className="flex flex-col items-center justify-center p-16 text-center space-y-4">
          <div className="bg-primary/5 p-4 rounded-full">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Under Construction</h2>
          <p className="text-muted-foreground max-w-md">
            The <strong>{title}</strong> module is currently being built out for the enterprise architecture. It will be available in the next deployment phase.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
