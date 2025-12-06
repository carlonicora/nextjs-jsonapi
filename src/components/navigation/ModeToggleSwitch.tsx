"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "../../shadcnui";

export function ModeToggleSwitch() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="flex items-center">
      <Switch checked={theme === "dark"} onCheckedChange={handleToggle} className="relative">
        {theme === "dark" ? (
          <MoonIcon className="text-primary-foreground h-4 w-4" />
        ) : (
          <SunIcon className="text-primary h-4 w-4" />
        )}
      </Switch>
    </div>
  );
}
