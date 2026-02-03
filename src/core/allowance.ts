import { db } from '../db';
import { allowances, transactions } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function checkSpend(agentId: string, amount: number, category: string, allowanceId?: string): Promise<{ allowed: boolean; reason?: string; allowanceId?: string }> {
  // Query for allowance - either by specific ID or by agent
  let allowance;
  if (allowanceId) {
    allowance = await db.select().from(allowances).where(eq(allowances.id, allowanceId)).limit(1).get();
  } else {
    allowance = await db.select().from(allowances).where(eq(allowances.agentId, agentId)).limit(1).get();
  }

  if (!allowance) {
    return { allowed: false, reason: 'Allowance not found' };
  }

  if (allowance.status !== 'active') {
    return { allowed: false, reason: 'Allowance is paused or inactive' };
  }

  // Check limits
  if (amount <= 0) return { allowed: false, reason: 'Amount must be positive' };

  const dailyLimit = allowance.dailyLimit ?? 0;
  const weeklyLimit = allowance.weeklyLimit ?? 0;
  const monthlyLimit = allowance.monthlyLimit ?? 0;
  const spentToday = allowance.spentToday ?? 0;
  const spentThisWeek = allowance.spentThisWeek ?? 0;
  const spentThisMonth = allowance.spentThisMonth ?? 0;

  if (dailyLimit > 0 && spentToday + amount > dailyLimit) {
    return { allowed: false, reason: 'Daily limit exceeded' };
  }
  if (weeklyLimit > 0 && spentThisWeek + amount > weeklyLimit) {
    return { allowed: false, reason: 'Weekly limit exceeded' };
  }
  if (monthlyLimit > 0 && spentThisMonth + amount > monthlyLimit) {
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
