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

        return rows.map(row => ({
            ...row,
            members: row.members || []
        }));
    } catch (error) {
        console.error('Error in getUserGroups:', {
            message: (error as Error).message,
            stack: (error as Error).stack,
            error: error
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
        console.log('Creating group:', group);

        // Insert the group
        const { rows: [newGroup] } = await sql`
            INSERT INTO bill_groups (id, name, owner_email)
            VALUES (${group.id}, ${group.name}, ${group.owner_email})
            RETURNING *
        `;

        // Then, insert all members
        for (const member of group.members) {
            await sql`
                INSERT INTO bill_group_members (group_id, user_email, user_name)
                VALUES (${group.id}, ${member.email || ''}, ${member.name})
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
            GROUP BY g.id, g.name, g.owner_email, g.created_at
        `;

        return completeGroup;
    } catch (error: any) {
        console.error('Error in createGroup:', error);
        throw error;
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
            message: (error as Error).message,
            stack: (error as Error).stack,
            error: error
        });
        throw error;
    }
}

// Add this new function to check if a member is part of any expenses
export async function isMemberInExpenses(groupId: string, memberName: string) {
    const { rows } = await sql`
        SELECT EXISTS (
            SELECT 1 FROM bill_expenses 
            WHERE group_id = ${groupId} AND paid_by = ${memberName}
            UNION
            SELECT 1 FROM bill_expense_splits 
            WHERE expense_id IN (SELECT id FROM bill_expenses WHERE group_id = ${groupId})
            AND user_name = ${memberName}
        ) as is_in_expenses
    `;
    return rows[0].is_in_expenses;
}

// Add this function to update a group
export async function updateGroup(group: BillGroup) {
    try {
        await sql`BEGIN`;

        // Update group name
        await sql`
            UPDATE bill_groups 
            SET name = ${group.name}
            WHERE id = ${group.id}
        `;

        // Get current members
        const { rows: currentMembers } = await sql`
            SELECT user_email, user_name 
            FROM bill_group_members 
            WHERE group_id = ${group.id}
        `;

        // Delete members that are not in the new list and not in any expenses
        for (const currentMember of currentMembers) {
            const isInNewList = group.members.some(m => m.name === currentMember.user_name);

            if (!isInNewList) {
                const isInExpenses = await isMemberInExpenses(group.id, currentMember.user_name);
                if (!isInExpenses) {
                    await sql`
                        DELETE FROM bill_group_members 
                        WHERE group_id = ${group.id} 
                        AND user_name = ${currentMember.user_name}
                    `;
                }
            }
        }

        // Update or insert members
        for (const member of group.members) {
            await sql`
                INSERT INTO bill_group_members (group_id, user_email, user_name)
                VALUES (${group.id}, ${member.email || ''}, ${member.name})
                ON CONFLICT (group_id, user_name) 
                DO UPDATE SET user_email = ${member.email || ''}
            `;
        }

        await sql`COMMIT`;

        // Return updated group
        const { rows: [updatedGroup] } = await sql`
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
            GROUP BY g.id, g.name, g.owner_email, g.created_at
        `;

        return updatedGroup;
    } catch (error) {
        await sql`ROLLBACK`;
        console.error('Error in updateGroup:', error);
        throw error;
    }
}