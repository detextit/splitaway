import type { NextAuthOptions } from "next-auth"
import GoogleProvider from 'next-auth/providers/google';
import { sql } from '@vercel/postgres';

const MONTHLY_CREDIT_LIMIT = 100;

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID || "",
            clientSecret: process.env.GOOGLE_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account && account.provider === 'google') {
                try {
                    const { rows } = await sql`
            SELECT * FROM users WHERE google_id = ${user.id}
          `;

                    if (rows.length === 0) {
                        // User doesn't exist, create a new user
                        await sql`
                        INSERT INTO users (google_id, email, name, credits)
                        VALUES (${user.id}, ${user.email}, ${user.name}, ${MONTHLY_CREDIT_LIMIT})
                        `;
                    } else {
                        // User exists, check and update credits if necessary
                        const existingUser = rows[0];
                        const now = new Date();
                        const lastReset = new Date(existingUser.last_reset);
                        const daysSinceLastReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

                        if (existingUser.credits === 0 && daysSinceLastReset >= 30) {
                            // Reset credits if they are zero and 30 days have passed since the last reset
                            await sql`
                            UPDATE users
                            SET credits = ${MONTHLY_CREDIT_LIMIT}, last_reset = CURRENT_TIMESTAMP
                            WHERE google_id = ${user.id}`;
                        }
                    }
                    return true;
                } catch (error) {
                    console.error('Error handling user sign-in:', error);
                    return false;
                }
            }
            return true;
        },
    },
}