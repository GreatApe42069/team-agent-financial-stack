import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const allowances = sqliteTable('allowances', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  ownerId: text('owner_id').notNull(),
  dailyLimit: real('daily_limit').default(0),
  weeklyLimit: real('weekly_limit').default(0),
  monthlyLimit: real('monthly_limit').default(0),
  spentToday: real('spent_today').default(0),
  spentThisWeek: real('spent_this_week').default(0),
  spentThisMonth: real('spent_this_month').default(0),
  status: text('status').default('active'), // active, paused, exhausted
  createdAt: integer('created_at').default(Date.now()),
});

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  issuerId: text('issuer_id').notNull(),
  recipientId: text('recipient_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('USDC'),
  status: text('status').default('draft'), // draft, sent, paid, cancelled
  dueAt: integer('due_at'),
  createdAt: integer('created_at').default(Date.now()),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  subscriberId: text('subscriber_id').notNull(),
  providerId: text('provider_id').notNull(),
  planId: text('plan_id').notNull(),
  amount: real('amount').notNull(),
  interval: text('interval').default('monthly'), // daily, weekly, monthly
  nextBillingDate: integer('next_billing_date').notNull(),
  status: text('status').default('active'), // active, paused, cancelled
  allowanceId: text('allowance_id').notNull(),
  createdAt: integer('created_at').default(Date.now()),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  allowanceId: text('allowance_id').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  recipient: text('recipient').notNull(),
  status: text('status').default('success'), // success, failed
  timestamp: integer('timestamp').default(Date.now()),
});
