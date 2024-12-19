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

export default function Home() {
  const { data: session } = useSession()
  console.log(session?.user?.name);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showGroupForm, setShowGroupForm] = useState(true)

  const handleGroupCreate = (group: Group) => {
    setCurrentGroup(group)
    setShowGroupForm(false)
  }

  const handleExpenseAdd = (expense: Expense) => {
    setExpenses([...expenses, expense])
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
    expenses.forEach(expense => {
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
        <div className="w-full md:w-1/2">
          <BalanceSummary
            group={currentGroup}
            expenses={expenses}
            debts={calculateDebts()}
          />
        </div>
        <div className="w-full md:w-1/2 space-y-8">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowGroupForm(!showGroupForm)}
              className="flex items-center gap-2 w-full"
            >
              {showGroupForm ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Group Settings
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Group Settings
                </>
              )}
            </Button>

            <div className={`transition-all duration-300 ease-in-out ${showGroupForm ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
              <GroupForm
                onGroupCreate={handleGroupCreate}
                existingGroup={currentGroup}
              />
            </div>
          </div>

          {currentGroup && (
            <>
              <ExpenseForm group={currentGroup} onExpenseAdd={handleExpenseAdd} />
              {/* <FileUpload /> */}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}