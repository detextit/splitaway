"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Group } from "./group-form"
import { Expense } from "@/app/page"

interface ExpenseFormProps {
    group: Group
    onExpenseAdd: (expense: Expense) => void
}

export function ExpenseForm({ group, onExpenseAdd }: ExpenseFormProps) {
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [paidBy, setPaidBy] = useState("")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    useEffect(() => {
        setSelectedMembers(group.members.map(m => m.name))
        if (paidBy && !group.members.some(m => m.name === paidBy)) {
            setPaidBy("")
        }
    }, [group, paidBy])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const newExpense: Expense = {
            amount: parseFloat(amount),
            description,
            paidBy,
            date: new Date(),
            splitWith: selectedMembers
        }

        onExpenseAdd(newExpense)

        // Reset form
        setAmount("")
        setDescription("")
        setPaidBy("")
        setSelectedMembers(group.members.map(m => m.name))
    }

    const toggleMember = (memberName: string) => {
        if (memberName === paidBy) {
            return // Don't allow deselecting the payer
        }

        setSelectedMembers(prev =>
            prev.includes(memberName)
                ? prev.filter(name => name !== memberName)
                : [...prev, memberName]
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Expense for {group.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
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
                                <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                            <SelectContent>
                                {group.members.map((member, index) => (
                                    <SelectItem key={index} value={member.name}>
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Split With</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {group.members.map((member, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`member-${index}`}
                                        checked={selectedMembers.includes(member.name)}
                                        onCheckedChange={() => toggleMember(member.name)}
                                        disabled={member.name === paidBy}
                                    />
                                    <Label htmlFor={`member-${index}`}>
                                        {member.name}
                                        {member.name === paidBy && " (Payer)"}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button type="submit" className="w-full">Add Expense</Button>
                </form>
            </CardContent>
        </Card>
    )
}