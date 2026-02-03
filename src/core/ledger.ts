import { db } from '../db';
import { invoices, transactions } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { checkSpend, deductSpend } from './allowance';

export async function createInvoice(issuerId: string, recipientId: string, amount: number, dueAt?: number): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const invoiceId = uuidv4();
    await db.insert(invoices).values({
      id: invoiceId,
      issuerId: issuerId,
      recipientId: recipientId,
      amount: amount,
      dueAt: dueAt,
      status: 'draft',
      createdAt: Date.now(),
    }).run();

    return { success: true, invoiceId: invoiceId };
  } catch (error) {
    console.error("Create Invoice error:", error);
    return { success: false, error: 'Database error' };
  }
}

export async function sendInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1).get();
    
    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (invoice.status !== 'draft') return { success: false, error: 'Invoice must be in draft status to send' };

    await db.update(invoices)
      .set({ status: 'sent' })
      .where(eq(invoices.id, invoiceId))
      .run();

    return { success: true };
  } catch (error) {
    console.error("Send Invoice error:", error);
    return { success: false, error: 'Database error' };
  }
}

export async function payInvoice(invoiceId: string, agentId: string, allowanceId?: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1).get();
    
    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (invoice.status === 'paid') return { success: false, error: 'Invoice already paid' };
    // Allow paying if 'sent' or 'draft' (auto-generated invoices might skip 'sent' state if internal)
    // But strictly speaking, better to enforce flow. For now, let's allow both to be safe for subscriptions.
    if (invoice.recipientId !== agentId) return { success: false, error: 'Recipient mismatch' };

    // Check allowance and deduct
    const spendResult = await deductSpend(agentId, invoice.amount, 'invoice_payment', invoice.issuerId, allowanceId);

    if (!spendResult.success) {
      return { success: false, error: spendResult.reason || 'Spend failed' };
    }

    await db.update(invoices)
      .set({ status: 'paid' })
      .where(eq(invoices.id, invoiceId))
      .run();

    return { success: true, transactionId: spendResult.transactionId };

  } catch (error) {
    console.error("Pay Invoice error:", error);
    return { success: false, error: 'Database error' };
  }
}
