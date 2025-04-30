
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      title={theme === "light" ? "Modalità scura" : "Modalità chiara"}
      className={cn(
        profile.palette === "ochre" ? "text-[#222222] hover:bg-black/10 hover:text-[#000000]" : "text-white hover:bg-white/20 hover:text-[#333333]"
      )}
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
