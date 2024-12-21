import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createExpense, getGroupExpenses } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    try {
        const expenses = await getGroupExpenses(groupId);
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.expense || !body.groupId) {
            return NextResponse.json(
                { error: 'Missing required fields: expense or groupId' },
                { status: 400 }
            );
        }

        const { expense, groupId } = body;

        // Validate expense object
        if (!expense.amount || !expense.description || !expense.paidBy || !expense.splitWith) {
            return NextResponse.json(
                { error: 'Invalid expense object: missing required fields' },
                { status: 400 }
            );
        }

        // Ensure amount is a number
        expense.amount = Number(expense.amount);

        // Ensure date is a valid Date object
        expense.date = new Date(expense.date);

        // Create the expense
        const newExpense = await createExpense(expense, groupId);

        return NextResponse.json(newExpense);
    } catch (error) {
        console.error('Failed to create expense:', error);
        return NextResponse.json(
            { error: 'Failed to create expense', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}