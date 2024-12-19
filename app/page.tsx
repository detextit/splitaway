'use client'

import { useSession } from "next-auth/react"
import { Layout } from "@/components/layout"
import { ExpenseForm } from "@/components/expense-form"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Group, GroupForm } from "@/components/group-form"
import { useState } from "react"
import { BalanceSummary } from "@/components/balance-summary"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

// Remove mock data and add type definitions
export type Debt = {
  name: string
  amount: number
}

export type Expense = {
  amount: number
  description: string
  paidBy: string
  date: Date
  splitWith: string[]
}

// Add new type for storing expenses per group
type GroupExpenses = {
  [groupId: string]: Expense[]
}

export default function Home() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [expensesByGroup, setExpensesByGroup] = useState<GroupExpenses>({})
  const [showGroupForm, setShowGroupForm] = useState(true)

  const handleGroupCreate = (group: Group) => {
    // Add current user as first member if they're not already included
    if (session?.user?.name && session?.user?.email) {
      const currentUserExists = group.members.some(
        member => member.email === session.user?.email
      )

      if (!currentUserExists) {
        group.members.unshift({
          name: session.user.name,
          email: session.user.email
        })
      }
    }

    setGroups(prevGroups => {
      // If we have a currentGroup, this is an update
      if (currentGroup) {
        return prevGroups.map(g => g.id === currentGroup.id ? group : g)
      }
      // Otherwise, this is a new group
      return [...prevGroups, group]
    })

    setExpensesByGroup(prev => ({ ...prev, [group.id]: prev[group.id] || [] }))
    setCurrentGroup(group)
    setShowGroupForm(false)
  }

  const handleExpenseAdd = (expense: Expense) => {
    if (!currentGroup) return
    setExpensesByGroup(prev => ({
      ...prev,
      [currentGroup.id]: [...(prev[currentGroup.id] || []), expense]
    }))
  }

  // Calculate debts based on expenses
  const calculateDebts = () => {
    if (!currentGroup) return []

    const memberBalances = new Map<string, number>()

    // Initialize all members with 0 balance
    currentGroup.members.forEach(member => {
      memberBalances.set(member.name, 0)
    })

    // Calculate each expense split
    expensesByGroup[currentGroup.id].forEach(expense => {
      // Calculate split amount based on selected members only
      const splitAmount = expense.amount / expense.splitWith.length

      // Add full amount to payer
      memberBalances.set(
        expense.paidBy,
        (memberBalances.get(expense.paidBy) || 0) + expense.amount
      )

      // Subtract split amount from selected members only
      expense.splitWith.forEach(memberName => {
        memberBalances.set(
          memberName,
          (memberBalances.get(memberName) || 0) - splitAmount
        )
      })
    })

    // Convert to Debt array
    return Array.from(memberBalances.entries())
      .map(([name, amount]) => ({
        name,
        amount: Number(amount.toFixed(2)) // Round to 2 decimal places
      }))
  }

  const debts = calculateDebts()

  return (
    <Layout>
      <div className="flex flex-col md:flex-row p-4 gap-8">
        {/* Left: Groups Sidebar */}
        <div className="w-full md:w-[25rem] space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {groups.map((group) => (
                <Button
                  key={group.id}
                  variant={currentGroup?.id === group.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setCurrentGroup(group)}
                >
                  {group.name}
                </Button>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowGroupForm(true)
                  setCurrentGroup(null)
                }}
              >
                + New Group
              </Button>
            </CardContent>
          </Card>

          {/* Moved Group Settings here */}
          {(showGroupForm || currentGroup) && (
            <Card>
              <CardHeader className="pb-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowGroupForm(!showGroupForm)}
                  className="flex items-center gap-2 w-full justify-between"
                >
                  <span>Group Settings</span>
                  {showGroupForm ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className={`transition-all duration-300 ease-in-out ${showGroupForm ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <GroupForm
                    onGroupCreate={handleGroupCreate}
                    existingGroup={currentGroup}
                    defaultMember={session?.user ? {
                      name: session.user.name || '',
                      email: session.user.email || ''
                    } : undefined}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle: Forms and Add Expense */}
        <div className="flex-1 max-w-md space-y-8">
          {/* Only show ExpenseForm when there's a currentGroup */}
          {currentGroup && (
            <div className="w-full max-w-md">
              <ExpenseForm group={currentGroup} onExpenseAdd={handleExpenseAdd} />
            </div>
          )}
        </div>

        {/* Right: Balance Summary */}
        <div className="flex-1 min-w-[350px]">
          <BalanceSummary
            group={currentGroup}
            expenses={currentGroup ? expensesByGroup[currentGroup.id] || [] : []}
            debts={calculateDebts()}
          />
        </div>
      </div>
    </Layout>
  )
}