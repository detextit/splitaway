'use client'

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"
import { Expense } from "@/app/page"
import { Group } from "./group-form"

type BalanceSummaryProps = {
    group: Group | null
    expenses: Expense[]
    debts: { name: string; amount: number }[]
}

type Settlement = {
    from: string
    to: string
    amount: number
}

export function BalanceSummary({ group, expenses, debts }: BalanceSummaryProps) {
    // Calculate total expenses
    const calculateTotal = () => {
        return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    };

    // Calculate average per person
    const calculateAverage = () => {
        if (!group || group.members.length === 0) return 0;
        return calculateTotal() / group.members.length;
    };

    const calculateSettlements = (): Settlement[] => {
        if (!debts.length) return []

        // Deep copy of debts to avoid mutating original
        let debtors = debts.filter(d => d.amount < 0).map(d => ({ ...d, amount: Math.abs(d.amount) }))
        let creditors = debts.filter(d => d.amount > 0).map(d => ({ ...d }))
        let settlements: Settlement[] = []

        // Sort by amount to optimize settlements
        debtors.sort((a, b) => b.amount - a.amount)
        creditors.sort((a, b) => b.amount - a.amount)

        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0]
            const creditor = creditors[0]

            const amount = Math.min(debtor.amount, creditor.amount)
            if (amount > 0) {
                settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: Number(amount.toFixed(2))
                })
            }

            debtor.amount -= amount
            creditor.amount -= amount

            if (debtor.amount < 0.01) debtors.shift()
            if (creditor.amount < 0.01) creditors.shift()
        }

        return settlements
    }

    if (!group || expenses.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Balance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-500">
                        <p>No expenses yet. Start by adding expenses!</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Balance Summary for {group.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="balances">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="balances">Balances</TabsTrigger>
                        <TabsTrigger value="settlements">Settlements</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    </TabsList>

                    <TabsContent value="balances" className="space-y-4">
                        <div className="rounded-lg bg-muted p-4">
                            <h3 className="font-semibold mb-2">Current Balances</h3>
                            <ul className="space-y-2">
                                {debts.map((debt, index) => (
                                    <li key={index} className="flex justify-between items-center">
                                        <span>{debt.name}</span>
                                        <span className={`font-mono ${debt.amount < 0 ? "text-red-500" : "text-green-500"}`}>
                                            ${Math.abs(Number(debt.amount)).toFixed(2)}
                                            {debt.amount < 0 ? " (owes)" : " (owed)"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-lg bg-muted p-4">
                            <h3 className="font-semibold mb-2">Group Statistics</h3>
                            <div className="space-y-1 text-sm">
                                <p>Total Expenses: ${calculateTotal().toFixed(2)}</p>
                                <p>Number of Expenses: {expenses.length}</p>
                                <p>Average per Person: ${calculateAverage().toFixed(2)}</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="settlements">
                        <div className="rounded-lg bg-muted p-4">
                            <h3 className="font-semibold mb-4">Settlement Plan</h3>
                            {calculateSettlements().length > 0 ? (
                                <div className="space-y-3">
                                    {calculateSettlements().map((settlement, index) => {
                                        console.log('Settlement data:', settlement);
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-background rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-red-500 font-medium">
                                                        {settlement.from}
                                                    </span>
                                                    <span className="text-muted-foreground">pays</span>
                                                    <span className="text-green-500 font-medium">
                                                        {settlement.to || 'N/A'}
                                                    </span>
                                                </div>
                                                <span className="font-mono font-semibold">
                                                    ${Number(settlement.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground">
                                    No settlements needed - all balances are settled!
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="expenses">
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                                {expenses.map((expense, index) => {
                                    console.log('Expense data:', expense);
                                    return (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold">{expense.description}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Paid by {expense.paidBy || 'Unknown'}
                                                    </p>
                                                    <div className="mt-2 text-sm">
                                                        <p className="text-muted-foreground">Split between:</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {expense.splitWith.map((member, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="bg-muted px-2 py-0.5 rounded-full text-xs"
                                                                >
                                                                    {member}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="font-mono font-semibold">
                                                    ${Number(expense.amount).toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(expense.date).toLocaleDateString()} at{' '}
                                                {new Date(expense.date).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
} 