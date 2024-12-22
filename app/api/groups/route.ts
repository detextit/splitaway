import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createGroup, getUserGroups } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            console.log('No session or email found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const groups = await getUserGroups(session.user.email);

        return NextResponse.json(Array.isArray(groups) ? groups : []);
    } catch (error: any) {
        console.error('Error in GET /api/groups:', {
            message: error.message,
            stack: error.stack,
            error
        });
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const group = await request.json();

        if (!group.id) {
            group.id = uuidv4();
        }

        if (!group.name || !Array.isArray(group.members)) {
            return NextResponse.json(
                { error: 'Invalid group data' },
                { status: 400 }
            );
        }

        const newGroup = await createGroup(group);

        return NextResponse.json(newGroup);
    } catch (error: any) {
        console.error('Error in POST /api/groups:', {
            message: error.message,
            stack: error.stack,
            error
        });
        return NextResponse.json(
            { error: 'Failed to create group', details: error.message },
            { status: 500 }
        );
    }
}