"use client"

import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const { data: session } = useSession()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await signIn("credentials", { email, password, callbackUrl: "/" })
    }

    if (session) {
        return (
            <div className="flex flex-col items-center gap-4">
                <p>Signed in as {session.user?.email}</p>
                <Button onClick={() => signOut()}>Sign out</Button>
            </div>
        )
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your email and password to sign in.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">Sign In</Button>
                </form>
            </CardContent>
            <CardFooter>
                <p className="text-sm text-center w-full">
                    Don't have an account? <a href="/signup" className="text-primary hover:underline">Sign up</a>
                </p>
            </CardFooter>
        </Card>
    )
}