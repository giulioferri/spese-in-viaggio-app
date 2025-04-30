
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      title={theme === "light" ? "Modalità scura" : "Modalità chiara"}
      className="text-white hover:bg-white/20 hover:text-[#333333]"
    >
      {theme === "light" ? (
        <Moon size={20} className="rotate-0 scale-100 transition-all" />
      ) : (
        <Sun size={20} className="rotate-0 scale-100 transition-all" />
      )}
      <span className="sr-only">
        {theme === "light" ? "Modalità scura" : "Modalità chiara"}
      </span>
    </Button>
  );
}
