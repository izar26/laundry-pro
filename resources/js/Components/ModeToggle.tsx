import { Moon, Sun, Monitor } from "lucide-react"

import { Button } from "@/Components/ui/button"
import { useTheme } from "@/Components/ThemeProvider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={cycleTheme} title={`Current theme: ${theme}`}>
      {theme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />}
      {theme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />}
      {theme === 'system' && <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

