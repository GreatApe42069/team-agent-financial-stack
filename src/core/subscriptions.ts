import { db } from '../db';
import { subscriptions, invoices, transactions } from '../db/schema';
import { eq, lte, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { createInvoice, sendInvoice, payInvoice } from './ledger';
import { checkSpend, deductSpend } from './allowance';

export async function createSubscription(subscriberId: string, providerId: string, planId: string, amount: number, interval: string, allowanceId: string): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const subId = uuidv4();
    await db.insert(subscriptions).values({
      id: subId,
      subscriberId: subscriberId,
      providerId: providerId,
      planId: planId,
      amount: amount,
      interval: interval,
      nextBillingDate: Date.now(), // First billing immediately
      status: 'active',
      allowanceId: allowanceId,
      createdAt: Date.now(),
    }).run();

    return { success: true, subscriptionId: subId };
  } catch (error) {
    console.error("Create Subscription error:", error);
    return { success: false, error: 'Database error' };
  }
}

export async function processBilling(subscriptionId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const sub = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1).get();

    if (!sub) return { success: false, error: 'Subscription not found' };
    if (sub.status !== 'active') return { success: false, error: 'Subscription is not active' };

    // Create Invoice (Draft)
    const invoiceResult = await createInvoice(sub.providerId, sub.subscriberId, sub.amount, Date.now());
    if (!invoiceResult.success) return { success: false, error: 'Failed to create invoice' };

    const invoiceId = invoiceResult.invoiceId!;

    // Send Invoice
    const sendResult = await sendInvoice(invoiceId);
    if (!sendResult.success) return { success: false, error: 'Failed to send invoice' };

    // Pay Invoice
    const paymentResult = await payInvoice(invoiceId, sub.subscriberId, sub.allowanceId);
    
    // If payment fails, we might want to pause subscription or retry later.
    // For now, we return failure but keep the invoice as Sent (unpaid).
    if (!paymentResult.success) {
      // Logic to handle failure (e.g., mark sub as past_due) could go here
      return { success: false, error: paymentResult.error || 'Payment failed' };
    }

    // Update Next Billing Date
    const nextDate = new Date(sub.nextBillingDate);
    if (sub.interval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (sub.interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (sub.interval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

    await db.update(subscriptions)
      .set({ nextBillingDate: nextDate.getTime() })
      .where(eq(subscriptions.id, subscriptionId))
      .run();

    return { success: true, transactionId: paymentResult.transactionId };

  } catch (error) {
    console.error("Process Billing error:", error);
    return { success: false, error: 'Database error' };
  }
}

export async function processDueSubscriptions(): Promise<{ processed: number; failures: number; details: any[] }> {
  const now = Date.now();
  // Find active subscriptions where nextBillingDate <= now
  const dueSubs = await db.select()
    .from(subscriptions)
    .where(
      sql`${subscriptions.status} = 'active' AND ${subscriptions.nextBillingDate} <= ${now}`
    )
    .all();

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const sub of dueSubs) {
    const res = await processBilling(sub.id);
    results.push({ subscriptionId: sub.id, ...res });
    if (res.success) successCount++;
    else failCount++;
  }

  return { processed: successCount, failures: failCount, details: results };
}
