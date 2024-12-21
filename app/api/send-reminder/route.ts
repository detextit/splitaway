import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, amount, fromName } = await request.json();

        const email = await resend.emails.send({
            from: 'Split App <noreply@yourdomain.com>',
            to: [to],
            subject: `Payment Reminder from ${fromName}`,
            html: `
                <p>Hello,</p>
                <p>This is a friendly reminder that you owe ${fromName} $${amount.toFixed(2)}.</p>
                <p>Please arrange the payment at your earliest convenience.</p>
                <p>Best regards,<br/>Split App</p>
            `
        });

        return NextResponse.json({ message: 'Reminder sent successfully' });
    } catch (error) {
        console.error('Error sending reminder:', error);
        return NextResponse.json(
            { error: 'Failed to send reminder' },
            { status: 500 }
        );
    }
} 