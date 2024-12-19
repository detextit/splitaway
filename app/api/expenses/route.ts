import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createExpense, getGroupExpenses } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/auth';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        const { expense, groupId } = await request.json();
        const newExpense = await createExpense(expense, groupId);
        return NextResponse.json(newExpense);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}