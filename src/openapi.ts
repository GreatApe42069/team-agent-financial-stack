/**
 * OpenAPI 3.0 specification for Agent Financial Stack
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Agent Financial Stack API',
    description: 'Financial backbone for autonomous AI agents. Budget controls, invoicing, subscriptions, and on-chain settlement.',
    version: '1.4.0',
    contact: {
      name: 'Agent Financial Stack Team',
      url: 'https://github.com/openwork-hackathon/team-agent-financial-stack',
    },
  },
  servers: [
    {
      url: 'https://team-agent-financial-stack.vercel.app',
      description: 'Production',
    },
    {
      url: 'http://localhost:3300',
      description: 'Local development',
    },
  ],
  tags: [
    { name: 'Allowances', description: 'Agent spending limits and budgets' },
    { name: 'Invoices', description: 'Invoice creation and payment' },
    { name: 'Subscriptions', description: 'Recurring payment management' },
    { name: 'Transactions', description: 'Transaction history' },
    { name: 'On-Chain', description: 'Blockchain balance queries' },
    { name: 'Webhooks', description: 'Event notifications' },
    { name: 'System', description: 'Health and status' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'agent-financial-stack' },
                    version: { type: 'string', example: '1.4.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/allowances': {
      get: {
        tags: ['Allowances'],
        summary: 'List allowances',
        parameters: [
          { name: 'agentId', in: 'query', schema: { type: 'string' }, description: 'Filter by agent ID' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'paused', 'exhausted'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': {
            description: 'List of allowances',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Allowance' } },
                    count: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Allowances'],
        summary: 'Create allowance',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['agentId', 'ownerId'],
                properties: {
                  agentId: { type: 'string', description: 'Agent receiving the allowance' },
                  ownerId: { type: 'string', description: 'Owner granting the allowance' },
                  dailyLimit: { type: 'number', default: 0 },
                  weeklyLimit: { type: 'number', default: 0 },
                  monthlyLimit: { type: 'number', default: 0 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Allowance created' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'List invoices',
        parameters: [
          { name: 'issuerId', in: 'query', schema: { type: 'string' } },
          { name: 'recipientId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'sent', 'paid', 'cancelled'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': { description: 'List of invoices' },
        },
      },
      post: {
        tags: ['Invoices'],
        summary: 'Create invoice',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['issuerId', 'recipientId', 'amount'],
                properties: {
                  issuerId: { type: 'string' },
                  recipientId: { type: 'string' },
                  amount: { type: 'number', minimum: 0 },
                  currency: { type: 'string', default: 'USDC' },
                  dueAt: { type: 'integer', description: 'Unix timestamp' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Invoice created' },
        },
      },
    },
    '/api/subscriptions': {
      get: {
        tags: ['Subscriptions'],
        summary: 'List subscriptions',
        parameters: [
          { name: 'subscriberId', in: 'query', schema: { type: 'string' } },
          { name: 'providerId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'paused', 'cancelled'] } },
        ],
        responses: {
          '200': { description: 'List of subscriptions' },
        },
      },
      post: {
        tags: ['Subscriptions'],
        summary: 'Create subscription',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subscriberId', 'providerId', 'planId', 'amount', 'allowanceId'],
                properties: {
                  subscriberId: { type: 'string' },
                  providerId: { type: 'string' },
                  planId: { type: 'string' },
                  amount: { type: 'number' },
                  interval: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
                  allowanceId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Subscription created' },
        },
      },
    },
    '/api/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions',
        parameters: [
          { name: 'allowanceId', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': { description: 'Transaction history' },
        },
      },
    },
    '/api/agents/{agentId}/summary': {
      get: {
        tags: ['Allowances'],
        summary: 'Get agent spending summary',
        parameters: [
          { name: 'agentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Agent financial summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    agentId: { type: 'string' },
                    spending: {
                      type: 'object',
                      properties: {
                        today: { type: 'number' },
                        thisWeek: { type: 'number' },
                        thisMonth: { type: 'number' },
                      },
                    },
                    limits: {
                      type: 'object',
                      properties: {
                        daily: { type: 'number' },
                        weekly: { type: 'number' },
                        monthly: { type: 'number' },
                      },
                    },
                    subscriptions: {
                      type: 'object',
                      properties: {
                        active: { type: 'integer' },
                        monthlyRecurring: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/wallet/{address}/balance': {
      get: {
        tags: ['On-Chain'],
        summary: 'Get wallet balances',
        description: 'Query $OPENWORK and ETH balances on Base mainnet',
        parameters: [
          { name: 'address', in: 'path', required: true, schema: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' } },
        ],
        responses: {
          '200': {
            description: 'Wallet balances',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    openwork: {
                      type: 'object',
                      properties: {
                        balance: { type: 'string' },
                        balanceRaw: { type: 'string' },
                        token: { type: 'string' },
                      },
                    },
                    eth: {
                      type: 'object',
                      properties: {
                        balance: { type: 'string' },
                        balanceRaw: { type: 'string' },
                      },
                    },
                    chain: { type: 'string', example: 'base' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/wallet/{address}/verify': {
      get: {
        tags: ['On-Chain'],
        summary: 'Verify minimum balance',
        parameters: [
          { name: 'address', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'required', in: 'query', schema: { type: 'number', default: 100000 }, description: 'Required $OPENWORK amount' },
        ],
        responses: {
          '200': {
            description: 'Balance verification result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    sufficient: { type: 'boolean' },
                    balance: { type: 'string' },
                    required: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/webhooks': {
      post: {
        tags: ['Webhooks'],
        summary: 'Register webhook',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['agentId', 'webhookUrl'],
                properties: {
                  agentId: { type: 'string' },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook registered' },
        },
      },
      delete: {
        tags: ['Webhooks'],
        summary: 'Unregister webhook',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['agentId', 'webhookUrl'],
                properties: {
                  agentId: { type: 'string' },
                  webhookUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook unregistered' },
        },
      },
    },
    '/api/webhooks/{agentId}': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks for agent',
        parameters: [
          { name: 'agentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of registered webhooks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    agentId: { type: 'string' },
                    webhooks: { type: 'array', items: { type: 'string', format: 'uri' } },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    schemas: {
      Allowance: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          agentId: { type: 'string' },
          ownerId: { type: 'string' },
          dailyLimit: { type: 'number' },
          weeklyLimit: { type: 'number' },
          monthlyLimit: { type: 'number' },
          spentToday: { type: 'number' },
          spentThisWeek: { type: 'number' },
          spentThisMonth: { type: 'number' },
          status: { type: 'string', enum: ['active', 'paused', 'exhausted'] },
          createdAt: { type: 'integer' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          issuerId: { type: 'string' },
          recipientId: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'cancelled'] },
          dueAt: { type: 'integer' },
          createdAt: { type: 'integer' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          subscriberId: { type: 'string' },
          providerId: { type: 'string' },
          planId: { type: 'string' },
          amount: { type: 'number' },
          interval: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          nextBillingDate: { type: 'integer' },
          status: { type: 'string', enum: ['active', 'paused', 'cancelled'] },
          allowanceId: { type: 'string' },
          createdAt: { type: 'integer' },
        },
      },
    },
  },
};
