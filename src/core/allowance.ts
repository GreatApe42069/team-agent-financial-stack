import { db } from '../db';
import { allowances, transactions } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function checkSpend(agentId: string, amount: number, category: string, allowanceId?: string): Promise<{ allowed: boolean; reason?: string; allowanceId?: string }> {
  let query = db.select().from(allowances).where(eq(allowances.agentId, agentId));
  
  if (allowanceId) {
    query = query.where(eq(allowances.id, allowanceId));
  }

  const allowance = await query.limit(1).get();

  if (!allowance) {
    return { allowed: false, reason: 'Allowance not found' };
  }

  if (allowance.status !== 'active') {
    return { allowed: false, reason: 'Allowance is paused or inactive' };
  }

  // Check limits
  // (Assuming amount is positive)
  if (amount <= 0) return { allowed: false, reason: 'Amount must be positive' };

  if (allowance.dailyLimit > 0 && (allowance.spentToday || 0) + amount > allowance.dailyLimit) {
    return { allowed: false, reason: 'Daily limit exceeded' };
  }
  if (allowance.weeklyLimit > 0 && (allowance.spentThisWeek || 0) + amount > allowance.weeklyLimit) {
    return { allowed: false, reason: 'Weekly limit exceeded' };
  }
  if (allowance.monthlyLimit > 0 && (allowance.spentThisMonth || 0) + amount > allowance.monthlyLimit) {
    return { allowed: false, reason: 'Monthly limit exceeded' };
  }

  return { allowed: true, allowanceId: allowance.id };
}

export async function deductSpend(agentId: string, amount: number, category: string, recipient: string, allowanceId?: string): Promise<{ success: boolean; transactionId?: string; reason?: string }> {
  const check = await checkSpend(agentId, amount, category, allowanceId);
  
  if (!check.allowed || !check.allowanceId) {
    return { success: false, reason: check.reason };
  }

  const finalAllowanceId = check.allowanceId;

  try {
    // Start transaction (manual or drizzle transaction)
    // For better-sqlite3, synchronous calls are transactions if wrapped correctly, 
    // but Drizzle has transaction support too. 
    // For simplicity, we'll just update sequentially as this is MVP.
    // In production, wrap in db.transaction().

    await db.update(allowances)
      .set({
        spentToday: sql`${allowances.spentToday} + ${amount}`,
        spentThisWeek: sql`${allowances.spentThisWeek} + ${amount}`,
        spentThisMonth: sql`${allowances.spentThisMonth} + ${amount}`,
      })
      .where(eq(allowances.id, finalAllowanceId))
      .run();

    const txId = uuidv4();
    await db.insert(transactions).values({
      id: txId,
      allowanceId: finalAllowanceId,
      amount: amount,
      category: category,
      recipient: recipient,
      status: 'success',
      timestamp: Date.now(),
    }).run();

    return { success: true, transactionId: txId };
  } catch (error) {
    console.error("Spend error:", error);
    return { success: false, reason: 'Database error' };
  }
}
