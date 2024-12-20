"use client"

import React from 'react';
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from 'date-fns'
import { Item, Receipt, Expense } from '@/app/page'
import { Group } from './group-form'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from './ui/label'
import { Input } from './ui/input'

type ReceiptProcessorProps = {
    receipt: {
        receipt: Receipt | null;
        items: Item[];
    };
    group: Group;
    onReceiptUpdate: (updatedItems: Item[]) => void;
    onExpenseAdd?: (expense: Expense) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function ReceiptProcessor({
    receipt,
    group,
    onReceiptUpdate,
    onExpenseAdd,
    open,
    onOpenChange
}: ReceiptProcessorProps) {
    const [amountsOwed, setAmountsOwed] = useState<Record<string, number>>({})
    const [paidBy, setPaidBy] = useState("")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [storeName, setStoreName] = useState("")

    const people = group.members.map(member => member.name);

    // Initialize selected members when component mounts
    useEffect(() => {
        setSelectedMembers(group.members.map(m => m.name))
    }, [group])

    // Initialize store name when receipt changes
    useEffect(() => {
        if (receipt.receipt?.nameOfStore) {
            setStoreName(receipt.receipt.nameOfStore)
        }
    }, [receipt.receipt])

    const handleCheckboxChange = (itemIndex: number, person: string) => {
        const newItems = [...receipt.items];
        const item = newItems[itemIndex];

        if (item.sharedWith.includes(person)) {
            item.sharedWith = item.sharedWith.filter(p => p !== person);
        } else {
            item.sharedWith.push(person);
        }

        onReceiptUpdate(newItems);
    }

    const handleAddExpense = () => {
        if (!receipt.receipt || !onExpenseAdd || !paidBy || !group?.id) return;

        const total = receipt.items.reduce((sum, item) => sum + item.amount, 0);

        const newExpense: Expense = {
            amount: total,
            description: `Receipt from ${storeName}`,
            paidBy: paidBy,
            date: new Date(),
            splitWith: selectedMembers.filter(member => member !== paidBy)
        }

        onExpenseAdd(newExpense);
        onOpenChange(false); // Close the modal after adding expense
    }

    // Check if all items have at least one person selected
    const isReadyToSave = receipt.items.every(item => item.sharedWith.length > 0) && paidBy;

    // Calculate amounts owed
    useEffect(() => {
        const newAmountsOwed: Record<string, number> = {};

        if (receipt.receipt) {
            receipt.items.forEach(item => {
                const numShared = item.sharedWith.length;
                if (numShared > 0) {
                    const amountPerPerson = item.amount / numShared;
                    item.sharedWith.forEach(person => {
                        if (person !== paidBy) {
                            newAmountsOwed[person] = (newAmountsOwed[person] || 0) + amountPerPerson;
                        }
                    });
                }
            });
        }

        setAmountsOwed(newAmountsOwed);
    }, [receipt, paidBy]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Receipt Splitter</DialogTitle>
                </DialogHeader>

                {receipt.receipt ? (
                    <>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2">Receipt Details</h2>
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Store</Label>
                                <Input
                                    id="storeName"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="Enter store name"
                                />
                            </div>
                            <p>
                                Date: {receipt.receipt.date && !isNaN(new Date(receipt.receipt.date).getTime())
                                    ? format(new Date(receipt.receipt.date), 'MMMM d, yyyy')
                                    : 'Invalid date'}
                            </p>
                            <p>Total: ${receipt.receipt.total.toFixed(2)}</p>

                            <div className="space-y-2 mt-4">
                                <Label htmlFor="paidBy">Paid By</Label>
                                <Select onValueChange={setPaidBy} value={paidBy}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select who paid" />
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
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Amount</TableHead>
                                    {people.map(person => (
                                        <TableHead key={person}>{person}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receipt.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>${item.amount.toFixed(2)}</TableCell>
                                        {people.map(person => (
                                            <TableCell key={person}>
                                                <Checkbox
                                                    checked={item.sharedWith.includes(person)}
                                                    onCheckedChange={() => handleCheckboxChange(index, person)}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Amounts Owed</h3>
                            {Object.entries(amountsOwed).map(([person, amount]) => (
                                <p key={person}>{person} owes {paidBy}: ${amount.toFixed(2)}</p>
                            ))}
                        </div>
                    </>
                ) : (
                    <p>No receipt data available.</p>
                )}

                <DialogFooter>
                    <Button
                        onClick={handleAddExpense}
                        disabled={!isReadyToSave}
                        className="w-full"
                    >
                        Add as Expense
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

