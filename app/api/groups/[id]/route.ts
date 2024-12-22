import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createGroup, getGroup, updateGroup } from '@/lib/db'
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

        const group = await getGroup(params.id)
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        // Check if the user is the group owner
        if (group.owner_email !== session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const updatedGroupData = await request.json()
        const updatedGroup = await updateGroup({
            ...updatedGroupData,
            id: params.id,
            owner_email: session.user.email
        })

        return NextResponse.json(updatedGroup)
    } catch (error: any) {
        console.error('Error in PUT /api/groups/[id]:', error)
        return NextResponse.json(
            { error: 'Failed to update group', details: error.message },
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

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const group = await getGroup(params.id);

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // If user is logged in, verify they are a member
        if (session?.user?.email) {
            const isMember = group.members.some(
                (member: { email: string }) => member.email === session.user?.email
            );

            if (!isMember) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        return NextResponse.json(group);
    } catch (error) {
        console.error('Error fetching group:', error);
        return NextResponse.json(
            { error: 'Failed to fetch group' },
            { status: 500 }
        );
    }
} 