
import { ReactNode, useEffect } from "react";
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
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();

  useEffect(() => {
    const selected = paletteMap[profile.palette || "default"];
    const root = document.documentElement;
    for (const k in selected) {
      root.style.setProperty(k, selected[k as keyof typeof selected]);
    }
  }, [profile.palette]);

  return <>{children}</>;
}
