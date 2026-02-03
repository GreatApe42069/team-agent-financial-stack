/**
 * Webhook notification system for agent financial events
 * Notifies agents when invoices are due, payments processed, limits hit, etc.
 */

export type WebhookEvent = 
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'subscription.created'
  | 'subscription.billed'
  | 'subscription.failed'
  | 'allowance.limit_warning'
  | 'allowance.exhausted';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: number;
  data: Record<string, unknown>;
}

// In-memory webhook registry (in production, use DB)
const webhookRegistry: Map<string, string[]> = new Map();

/**
 * Register a webhook URL for an agent
 */
export function registerWebhook(agentId: string, webhookUrl: string): void {
  const existing = webhookRegistry.get(agentId) || [];
  if (!existing.includes(webhookUrl)) {
    existing.push(webhookUrl);
    webhookRegistry.set(agentId, existing);
  }
}

/**
 * Unregister a webhook URL for an agent
 */
export function unregisterWebhook(agentId: string, webhookUrl: string): void {
  const existing = webhookRegistry.get(agentId) || [];
  const filtered = existing.filter(url => url !== webhookUrl);
  if (filtered.length > 0) {
    webhookRegistry.set(agentId, filtered);
  } else {
    webhookRegistry.delete(agentId);
  }
}

/**
 * Get all webhook URLs for an agent
 */
export function getWebhooks(agentId: string): string[] {
  return webhookRegistry.get(agentId) || [];
}

/**
 * Send webhook notification to all registered URLs for an agent
 */
export async function notifyAgent(
  agentId: string, 
  event: WebhookEvent, 
  data: Record<string, unknown>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const urls = getWebhooks(agentId);
  
  if (urls.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: Date.now(),
    data: {
      agentId,
      ...data,
    },
  };

  const results = await Promise.allSettled(
    urls.map(url => sendWebhook(url, payload))
  );

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++;
    } else {
      failed++;
      const errorMsg = result.status === 'rejected' 
        ? String(result.reason) 
        : result.value.error || 'Unknown error';
      errors.push(`${urls[index]}: ${errorMsg}`);
    }
  });

  return { sent, failed, errors };
}

/**
 * Send a single webhook request
 */
async function sendWebhook(
  url: string, 
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AgentFinancialStack/1.4.0',
        'X-Webhook-Event': payload.event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Timeout' };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Convenience functions for common events
 */
export const notify = {
  invoiceCreated: (agentId: string, invoiceId: string, amount: number, issuerId: string) =>
    notifyAgent(agentId, 'invoice.created', { invoiceId, amount, issuerId }),

  invoiceSent: (agentId: string, invoiceId: string, amount: number, dueAt?: number) =>
    notifyAgent(agentId, 'invoice.sent', { invoiceId, amount, dueAt }),

  invoicePaid: (agentId: string, invoiceId: string, amount: number, transactionId: string) =>
    notifyAgent(agentId, 'invoice.paid', { invoiceId, amount, transactionId }),

  subscriptionBilled: (agentId: string, subscriptionId: string, amount: number, nextBillingDate: number) =>
    notifyAgent(agentId, 'subscription.billed', { subscriptionId, amount, nextBillingDate }),

  subscriptionFailed: (agentId: string, subscriptionId: string, reason: string) =>
    notifyAgent(agentId, 'subscription.failed', { subscriptionId, reason }),

  limitWarning: (agentId: string, allowanceId: string, limitType: string, percentUsed: number) =>
    notifyAgent(agentId, 'allowance.limit_warning', { allowanceId, limitType, percentUsed }),

  allowanceExhausted: (agentId: string, allowanceId: string, limitType: string) =>
    notifyAgent(agentId, 'allowance.exhausted', { allowanceId, limitType }),
};
