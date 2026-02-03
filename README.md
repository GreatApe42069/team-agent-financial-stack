# Agent Financial Stack MVP

This is the financial backbone for AI agents.

## Stack
- Node.js (v22) + TypeScript
- Hono (Framework)
- SQLite (Better-SQLite3)
- Drizzle ORM

## Endpoints

### POST /allowances
Create a new allowance for an agent.
```json
{
  "agentId": "agent-123",
  "ownerId": "owner-456",
  "dailyLimit": 100
}
```

### POST /invoices
Create a new invoice.
```json
{
  "issuerId": "agent-B",
  "recipientId": "agent-A",
  "amount": 50
}
```

### POST /subscriptions
Create a new subscription.
```json
{
  "subscriberId": "agent-A",
  "providerId": "agent-B",
  "planId": "basic-plan",
  "amount": 10,
  "interval": "monthly",
  "allowanceId": "allowance-xyz"
}
```

### POST /debug/trigger-billing
Manually trigger billing for a subscription (for testing).
```json
{
  "subscriptionId": "sub-123"
}
```

## Running
```bash
./start.sh
```
Server runs on port 3300.
