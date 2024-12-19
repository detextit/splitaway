"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function Layout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <div className="min-h-screen">
            <header className="flex justify-between items-center p-4 bg-background">
                <h1 className="text-2xl font-bold">Split Away</h1>
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                    {session ? (
                        <Button onClick={() => signOut()}>Sign Out</Button>
                    ) : (
                        <Button onClick={() => signIn()}>Sign In</Button>
                    )}
                </div>
            </header>
            <main>{children}</main>
        </div>
    )
}