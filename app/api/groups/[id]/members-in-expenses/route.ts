import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/auth'
import { sql } from '@vercel/postgres'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const groupId = params.id

        // Get members who are either payers or part of splits
        const { rows } = await sql`
            SELECT DISTINCT user_name
            FROM (
                SELECT paid_by as user_name
                FROM bill_expenses
                WHERE group_id = ${groupId}
                UNION
                SELECT user_name
                FROM bill_expense_splits
                WHERE expense_id IN (
                    SELECT id FROM bill_expenses WHERE group_id = ${groupId}
                )
            ) members
        `

        const membersInExpenses = rows.map(row => row.user_name)
        return NextResponse.json({ members: membersInExpenses })
    } catch (error) {
        console.error('Error getting members in expenses:', error)
        return NextResponse.json(
            { error: 'Failed to get members in expenses' },
            { status: 500 }
        )
    }
} 