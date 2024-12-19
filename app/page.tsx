'use client'

import { useSession } from "next-auth/react"
import { Layout } from "@/components/layout"
import { ExpenseForm } from "@/components/expense-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Group, GroupForm } from "@/components/group-form"
import { useState, useEffect } from "react"
import { BalanceSummary } from "@/components/balance-summary"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"

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

  useEffect(() => {
    if (session?.user?.email) {
      // Load user's groups
      fetch('/api/groups')
        .then(res => res.json())
        .then(data => {
          // Ensure data is an array
          const groupsArray = Array.isArray(data) ? data : [];
          setGroups(groupsArray);
          if (groupsArray.length > 0) {
            setCurrentGroup(groupsArray[0]);
          }
        })
        .catch(error => {
          console.error('Error loading groups:', error);
          setGroups([]);
        });
    }
  }, [session]);

  useEffect(() => {
    if (currentGroup) {
      // Load group's expenses
      fetch(`/api/expenses?groupId=${currentGroup.id}`)
        .then(res => res.json())
        .then(data => {
          setExpensesByGroup(prev => ({
            ...prev,
            [currentGroup.id]: data
          }));
        })
        .catch(error => console.error('Error loading expenses:', error));
    }
  }, [currentGroup]);

  const handleGroupCreate = async (group: Group) => {
    // Add current user as first member if they're not already included
    if (session?.user?.name && session?.user?.email) {
      const currentUserExists = group.members.some(
        member => member.email === session.user?.email
      );

      if (!currentUserExists) {
        group.members.unshift({
          name: session.user.name,
          email: session.user.email
        });
      }
    }

    try {
      // Determine if we're updating or creating
      const isUpdate = currentGroup !== null;
      const groupId = isUpdate ? currentGroup.id : crypto.randomUUID();

      // Use the existing ID for updates, or generate new one for creation
      const groupData = {
        ...group,
        id: groupId
      };

      const response = await fetch(
        isUpdate ? `/api/groups/${groupId}` : '/api/groups',
        {
          method: isUpdate ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupData)
        }
      );

      if (!response.ok) throw new Error('Failed to save group');

      const savedGroup = await response.json();
      setGroups(prevGroups => {
        if (isUpdate) {
          // Update existing group
          return prevGroups.map(g =>
            g.id === groupId ? savedGroup : g
          );
        }
        // Add new group
        return [...prevGroups, savedGroup];
      });

      setExpensesByGroup(prev => ({ ...prev, [savedGroup.id]: prev[savedGroup.id] || [] }));
      setCurrentGroup(savedGroup);
      setShowGroupForm(false);
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleExpenseAdd = async (expense: Expense) => {
    if (!currentGroup) return;

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expense, groupId: currentGroup.id })
      });

      if (!response.ok) throw new Error('Failed to create expense');

      const newExpense = await response.json();
      setExpensesByGroup(prev => ({
        ...prev,
        [currentGroup.id]: [...(prev[currentGroup.id] || []), expense]
      }));
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  // Calculate debts based on expenses
  const calculateDebts = () => {
    if (!currentGroup) return []

    const memberBalances = new Map<string, number>()

    // Initialize all members with 0 balance
    currentGroup.members.forEach(member => {
      memberBalances.set(member.name, 0)
    })

    // Add safety check for expenses array
    const groupExpenses = expensesByGroup[currentGroup.id] || []

    // Calculate each expense split
    groupExpenses.forEach(expense => {
      // Ensure amount is a number
      const expenseAmount = Number(expense.amount)

      // Ensure splitWith is always an array
      const splitWith = expense.splitWith || []

      // Calculate split amount based on selected members only
      const splitAmount = expenseAmount / (splitWith.length || 1) // Prevent division by zero

      // Add full amount to payer
      memberBalances.set(
        expense.paidBy,
        (memberBalances.get(expense.paidBy) || 0) + expenseAmount
      )

      // Subtract split amount from selected members only
      splitWith.forEach(memberName => {
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

  const handleGroupDelete = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete group');

      // Remove group from state
      setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
      setExpensesByGroup(prev => {
        const newState = { ...prev };
        delete newState[groupId];
        return newState;
      });
      setCurrentGroup(null);
      setShowGroupForm(false);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

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
              {(groups || []).map((group) => (
                <div key={group.id} className="flex gap-2">
                  <Button
                    variant={currentGroup?.id === group.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setCurrentGroup(group)}
                  >
                    {group.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this group?')) {
                        handleGroupDelete(group.id);
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
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

            <GroupForm
              onGroupCreate={handleGroupCreate}
              onGroupDelete={handleGroupDelete}
              existingGroup={currentGroup}
              defaultMember={session?.user ? {
                name: session.user.name || '',
                email: session.user.email || ''
              } : undefined}
            />
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