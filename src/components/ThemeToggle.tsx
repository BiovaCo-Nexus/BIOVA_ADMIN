
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Button
      variant="outline"
      size="icon"
      disabled
      className="h-9 w-9 border border-green-400 bg-white opacity-50 cursor-not-allowed"
    >
      <Sun className="h-4 w-4" style={{ color: '#222222' }} />
      <span className="sr-only">Light theme only</span>
    </Button>
  );
}
