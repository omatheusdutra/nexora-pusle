import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle({
  dark,
  onToggle
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={dark ? "Tema claro" : "Tema escuro"}
      aria-label={dark ? "Tema claro" : "Tema escuro"}
      onClick={onToggle}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
