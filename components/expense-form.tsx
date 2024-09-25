"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ExpenseForm() {
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [paidBy, setPaidBy] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would typically send this data to your backend
        console.log({ amount, description, paidBy })
        // Reset form
        setAmount("")
        setDescription("")
        setPaidBy("")
    }

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Add Expense</CardTitle>
                <CardDescription>Enter the details of the new expense.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Dinner, movies, etc."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paidBy">Paid By</Label>
                        <Select onValueChange={setPaidBy} value={paidBy}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select who paid" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="you">You</SelectItem>
                                <SelectItem value="alice">Alice</SelectItem>
                                <SelectItem value="bob">Bob</SelectItem>
                                <SelectItem value="charlie">Charlie</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full">Add Expense</Button>
                </form>
            </CardContent>
        </Card>
    )
}