import { sql } from '@vercel/postgres';

// Add this type definition at the top of the file
type BillGroup = {
    id: string;
    name: string;
    owner_email: string;
    members: Array<{
        name: string;
        email: string;
    }>;
};

// export async function initializeDatabase() {
//     try {
//         // Create groups table
//         await sql`
//       CREATE TABLE IF NOT EXISTS bill_groups (
//         id VARCHAR(255) PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `;

//         // Create group members table
//         await sql`
//       CREATE TABLE IF NOT EXISTS bill_group_members (
//         group_id VARCHAR(255) REFERENCES bill_groups(id),
//         user_email VARCHAR(255) NOT NULL,
//         user_name VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         PRIMARY KEY (group_id, user_email)
//       )
//     `;

//         // Create expenses table
//         await sql`
//       CREATE TABLE IF NOT EXISTS bill_expenses (
//         id VARCHAR(255) PRIMARY KEY,
//         group_id VARCHAR(255) REFERENCES bill_groups(id),
//         amount DECIMAL(10,2) NOT NULL,
//         description TEXT NOT NULL,
//         paid_by VARCHAR(255) NOT NULL,
//         date TIMESTAMP WITH TIME ZONE NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `;

//         // Create expense splits table
//         await sql`
//       CREATE TABLE IF NOT EXISTS bill_expense_splits (
//         expense_id VARCHAR(255) REFERENCES bill_expenses(id),
//         user_name VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         PRIMARY KEY (expense_id, user_name)
//       )
//     `;

//         console.log('Database initialized successfully');
//     } catch (error) {
//         console.error('Error initializing database:', error);
//         throw error;
//     }
// }

export async function getUserGroups(userEmail: string) {
    try {
        console.log('Fetching groups for user:', userEmail);

        const { rows } = await sql`
      SELECT 
        g.*,
        json_agg(
          json_build_object(
            'name', gm.user_name,
            'email', gm.user_email
          )
        ) as members
      FROM bill_groups g
      JOIN bill_group_members gm ON g.id = gm.group_id
      WHERE EXISTS (
        SELECT 1 FROM bill_group_members 
        WHERE group_id = g.id AND user_email = ${userEmail}
      )
      GROUP BY g.id, g.name, g.owner_email, g.created_at
    `;

        console.log('Fetched groups:', rows);

        return rows.map(row => ({
            ...row,
            members: row.members || []
        }));
    } catch (error) {
        console.error('Error in getUserGroups:', {
            message: error.message,
            stack: error.stack,
            error
        });
        throw error;
    }
}

export async function getGroupExpenses(groupId: string) {
    try {
        const { rows } = await sql`
            SELECT 
                e.*,
                COALESCE(array_agg(es.user_name) FILTER (WHERE es.user_name IS NOT NULL), ARRAY[]::text[]) as split_with
            FROM bill_expenses e
            LEFT JOIN bill_expense_splits es ON e.id = es.expense_id
            WHERE e.group_id = ${groupId}
            GROUP BY e.id, e.group_id, e.amount, e.description, e.paid_by, e.date, e.created_at
        `;

        // Transform the data to match frontend expectations
        return rows.map(expense => ({
            id: expense.id,
            groupId: expense.group_id,
            amount: expense.amount,
            description: expense.description,
            paidBy: expense.paid_by,  // Convert from paid_by to paidBy
            date: expense.date,
            createdAt: expense.created_at,
            splitWith: expense.split_with || []
        }));
    } catch (error) {
        console.error('Error fetching group expenses:', error);
        throw error;
    }
}

export async function createGroup(group: BillGroup) {
    try {
        console.log('Creating group:', group); // Debug log

        // Updated INSERT query to include owner_email
        const { rows: [newGroup] } = await sql`
            INSERT INTO bill_groups (id, name, owner_email)
            VALUES (${group.id}, ${group.name}, ${group.owner_email})
            RETURNING *
        `;

        console.log('Group created:', newGroup); // Debug log

        // Then, insert all members
        for (const member of group.members) {
            console.log('Adding member:', member); // Debug log

            await sql`
        INSERT INTO bill_group_members (group_id, user_email, user_name)
        VALUES (${group.id}, ${member.email}, ${member.name})
      `;
        }

        // Fetch the complete group with members
        const { rows: [completeGroup] } = await sql`
      SELECT 
        g.*,
        json_agg(
          json_build_object(
            'name', gm.user_name,
            'email', gm.user_email
          )
        ) as members
      FROM bill_groups g
      JOIN bill_group_members gm ON g.id = gm.group_id
      WHERE g.id = ${group.id}
      GROUP BY g.id, g.name, g.created_at
    `;

        return completeGroup;
    } catch (error: any) {
        console.error('Error in createGroup:', {
            message: error.message,
            stack: error.stack,
            error
        });
        throw error; // Re-throw to be caught by the API route
    }
}

export async function createExpense(expense: any, groupId: string) {
    const expenseId = crypto.randomUUID();
    const { rows } = await sql`
    INSERT INTO bill_expenses (id, group_id, amount, description, paid_by, date)
    VALUES (${expenseId}, ${groupId}, ${expense.amount}, ${expense.description}, ${expense.paidBy}, ${expense.date})
    RETURNING *
  `;

    // Insert expense splits
    for (const userName of expense.splitWith) {
        await sql`
      INSERT INTO bill_expense_splits (expense_id, user_name)
      VALUES (${expenseId}, ${userName})
    `;
    }

    return rows[0];
}

export async function getGroup(groupId: string) {
    try {
        const { rows: [group] } = await sql`
            SELECT 
                g.*,
                json_agg(
                    json_build_object(
                        'name', gm.user_name,
                        'email', gm.user_email
                    )
                ) as members
            FROM bill_groups g
            JOIN bill_group_members gm ON g.id = gm.group_id
            WHERE g.id = ${groupId}
            GROUP BY g.id, g.name, g.owner_email, g.created_at
        `;

        if (!group) {
            return null;
        }

        return {
            ...group,
            members: group.members || []
        };
    } catch (error) {
        console.error('Error in getGroup:', {
            message: error.message,
            stack: error.stack,
            error
        });
        throw error;
    }
} 