"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
            aria-label="Toggle theme"
        >
            <Sun
                style={{
                    width: "1.2rem",
                    height: "1.2rem",
                    position: "absolute",
                    transform: theme === "dark" ? "scale(0) rotate(-90deg)" : "scale(1) rotate(0deg)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
            />
            <Moon
                style={{
                    width: "1.2rem",
                    height: "1.2rem",
                    position: "absolute",
                    transform: theme === "dark" ? "scale(1) rotate(0deg)" : "scale(0) rotate(90deg)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
            />
        </button>
    )
}
