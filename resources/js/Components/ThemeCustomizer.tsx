import { useEffect, useState } from "react"
import { Check, Paintbrush } from "lucide-react"

import { Button } from "@/Components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themes = [
  { name: "Zinc", class: "theme-zinc", color: "bg-zinc-950" },
  { name: "Blue", class: "theme-blue", color: "bg-blue-600" },
  { name: "Violet", class: "theme-violet", color: "bg-violet-600" },
  { name: "Green", class: "theme-green", color: "bg-green-600" },
  { name: "Orange", class: "theme-orange", color: "bg-orange-600" },
  { name: "Rose", class: "theme-rose", color: "bg-rose-600" },
]

export function ThemeCustomizer() {
  const [theme, setTheme] = useState("theme-blue") // Default Blue karena lebih umum

  useEffect(() => {
    // Load from local storage
    const savedTheme = localStorage.getItem("app-theme-color")
    if (savedTheme) {
        setTheme(savedTheme)
        document.body.classList.remove(...themes.map(t => t.class))
        document.body.classList.add(savedTheme)
    } else {
        // Default set
        document.body.classList.add("theme-blue")
    }
  }, [])

  const changeTheme = (themeClass: string) => {
    document.body.classList.remove(...themes.map(t => t.class))
    document.body.classList.add(themeClass)
    setTheme(themeClass)
    localStorage.setItem("app-theme-color", themeClass)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Customize theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Warna Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.name}
            onClick={() => changeTheme(t.class)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
                <div className={cn("h-4 w-4 rounded-full border", t.color)} />
                {t.name}
            </div>
            {theme === t.class && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
