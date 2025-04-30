
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { useProfile } from "@/hooks/useProfile";

// CSS variable names to switch the tailwind palette
const paletteMap = {
  default: {
    "--primary": "198 100% 47%",
    "--primary-foreground": "0 0% 100%",
  },
  green: {
    "--primary": "157 70% 58%", // #23c69e
    "--primary-foreground": "0 0% 100%",
  },
  red: {
    "--primary": "346 100% 60%", // #ff325b
    "--primary-foreground": "0 0% 100%",
  },
  ochre: {
    "--primary": "43 96% 58%", // #F5A623 (giallo ocra)
    "--primary-foreground": "240 10% 3.9%", // #222222 per il testo scuro
  },
};

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) return savedTheme;
    
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Update body class for dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Update palette colors
  useEffect(() => {
    const selected = paletteMap[profile.palette || "default"];
    const root = document.documentElement;
    for (const k in selected) {
      root.style.setProperty(k, selected[k as keyof typeof selected]);
    }
  }, [profile.palette]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
