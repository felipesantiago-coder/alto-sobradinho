"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggleSimple() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled className="h-9 w-9">
        <Monitor className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Carregando tema...</span>
      </Button>
    )
  }

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        className="h-8 w-8 px-2"
        title="Tema Claro"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="h-8 w-8 px-2"
        title="Tema Escuro"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "system" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("system")}
        className="h-8 w-8 px-2"
        title="Tema do Sistema"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  )
}