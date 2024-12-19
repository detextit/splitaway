import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createGroup } from '@/lib/db'
import { authOptions } from '../../auth/[...nextauth]/auth'
import { sql } from '@vercel/postgres'

// PUT handler for updating groups
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const group = await request.json()
        group.id = params.id

        const updatedGroup = await createGroup(group)
        return NextResponse.json(updatedGroup)
    } catch (error) {
        console.error('Error updating group:', error)
        return NextResponse.json(
            { error: 'Failed to update group' },
            { status: 500 }
        )
    }
}

// DELETE handler for removing groups
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const groupId = params.id

        // Delete expense splits first
        await sql`DELETE FROM bill_expense_splits 
                 WHERE expense_id IN (
                     SELECT id FROM bill_expenses WHERE group_id = ${groupId}
                 )`

        // Delete expenses
        await sql`DELETE FROM bill_expenses WHERE group_id = ${groupId}`

        // Delete group members
        await sql`DELETE FROM bill_group_members WHERE group_id = ${groupId}`

        // Delete the group
        await sql`DELETE FROM bill_groups WHERE id = ${groupId}`

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting group:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
} 