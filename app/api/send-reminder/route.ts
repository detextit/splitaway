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
        const formattedAmount = amount.toFixed(2);

        await resend.emails.send({
            from: 'Split Away <noreply@splitaway.app>',
            to: [to],
            subject: `Quick reminder about shared expenses from ${fromName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <p style="font-size: 16px; color: #444;">Hi there!</p>
                    
                    <p style="font-size: 16px; color: #444;">
                        Hope you're doing well! Just a friendly nudge about the shared expenses - ${fromName} covered $${formattedAmount} and it would be great to get that squared away when you have a chance.
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="font-size: 24px; color: #2563eb; margin: 0; text-align: center;">
                            $${formattedAmount}
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; color: #444;">
                        No rush - whenever it's convenient for you! Thanks for helping keep our shared expenses organized.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        Sent via Split Away - Making shared expenses simple
                    </p>
                </div>
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