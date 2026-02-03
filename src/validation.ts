import { z } from 'zod';

// Allowance schemas
export const createAllowanceSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  dailyLimit: z.number().min(0).optional().default(0),
  weeklyLimit: z.number().min(0).optional().default(0),
  monthlyLimit: z.number().min(0).optional().default(0),
});

export const updateAllowanceSchema = z.object({
  dailyLimit: z.number().min(0).optional(),
  weeklyLimit: z.number().min(0).optional(),
  monthlyLimit: z.number().min(0).optional(),
  status: z.enum(['active', 'paused']).optional(),
});

// Invoice schemas
export const createInvoiceSchema = z.object({
  issuerId: z.string().min(1, 'Issuer ID is required'),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional().default('USDC'),
  dueAt: z.number().optional(),
  memo: z.string().optional(),
});

export const payInvoiceSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  allowanceId: z.string().optional(),
});

// Subscription schemas
export const createSubscriptionSchema = z.object({
  subscriberId: z.string().min(1, 'Subscriber ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  amount: z.number().positive('Amount must be positive'),
  interval: z.enum(['daily', 'weekly', 'monthly']).optional().default('monthly'),
  allowanceId: z.string().min(1, 'Allowance ID is required'),
});

// Query schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

export const agentFilterSchema = paginationSchema.extend({
  agentId: z.string().optional(),
  status: z.string().optional(),
});

// Types
export type CreateAllowance = z.infer<typeof createAllowanceSchema>;
export type UpdateAllowance = z.infer<typeof updateAllowanceSchema>;
export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export type PayInvoice = z.infer<typeof payInvoiceSchema>;
export type CreateSubscription = z.infer<typeof createSubscriptionSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type AgentFilter = z.infer<typeof agentFilterSchema>;
