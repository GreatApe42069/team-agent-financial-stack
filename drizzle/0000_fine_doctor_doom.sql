CREATE TABLE `allowances` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`daily_limit` real DEFAULT 0,
	`weekly_limit` real DEFAULT 0,
	`monthly_limit` real DEFAULT 0,
	`spent_today` real DEFAULT 0,
	`spent_this_week` real DEFAULT 0,
	`spent_this_month` real DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` integer DEFAULT 1770070043249
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USDC',
	`status` text DEFAULT 'draft',
	`due_at` integer,
	`created_at` integer DEFAULT 1770070043250
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`subscriber_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`amount` real NOT NULL,
	`interval` text DEFAULT 'monthly',
	`next_billing_date` integer NOT NULL,
	`status` text DEFAULT 'active',
	`allowance_id` text NOT NULL,
	`created_at` integer DEFAULT 1770070043251
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`allowance_id` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text DEFAULT 'success',
	`timestamp` integer DEFAULT 1770070043251
);
