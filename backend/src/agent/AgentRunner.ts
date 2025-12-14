import Anthropic from '@anthropic-ai/sdk';
import * as InsightModel from '../models/Insight.js';
import * as AgentRunModel from '../models/AgentRun.js';
import * as VehicleModel from '../models/Vehicle.js';
import * as CustomerModel from '../models/Customer.js';
import * as ServiceLogModel from '../models/ServiceLog.js';
import { getExpectedServicesForVehicle } from '../services/expectedServicesService.js';
import { CreateInsightRequest, InsightType, InsightPriority, InsightActionType } from '../models/types.js';

// Tool definitions for Claude
const tools: Anthropic.Tool[] = [
  {
    name: 'get_all_vehicles',
    description: 'Get all vehicles in the system with their customer information',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_vehicle_service_history',
    description: 'Get service history for a specific vehicle',
    input_schema: {
      type: 'object' as const,
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'The vehicle ID'
        }
      },
      required: ['vehicle_id']
    }
  },
  {
    name: 'get_expected_services',
    description: 'Get expected/due services for a vehicle based on mileage and time intervals',
    input_schema: {
      type: 'object' as const,
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'The vehicle ID'
        }
      },
      required: ['vehicle_id']
    }
  },
  {
    name: 'get_all_customers',
    description: 'Get all customers in the system',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_customer_vehicles',
    description: 'Get all vehicles for a specific customer',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_id: {
          type: 'string',
          description: 'The customer ID'
        }
      },
      required: ['customer_id']
    }
  },
  {
    name: 'create_insight',
    description: 'Create an insight to display on the dashboard. Use this to surface valuable findings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['service_due', 'customer_health', 'revenue', 'anomaly', 'digest'],
          description: 'The type of insight'
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Priority level - high for urgent/safety issues, medium for due soon, low for informational'
        },
        title: {
          type: 'string',
          description: 'Short headline for the insight (under 60 characters)'
        },
        body: {
          type: 'string',
          description: 'Detailed explanation with specific numbers, dates, and context'
        },
        customer_id: {
          type: 'string',
          description: 'Optional customer ID if this insight is about a specific customer'
        },
        vehicle_id: {
          type: 'string',
          description: 'Optional vehicle ID if this insight is about a specific vehicle'
        },
        action_type: {
          type: 'string',
          enum: ['schedule_service', 'contact_customer', 'review', 'create_estimate', 'view'],
          description: 'Suggested action type'
        }
      },
      required: ['type', 'priority', 'title', 'body']
    }
  }
];

// Tool execution handlers
async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case 'get_all_vehicles': {
        const vehicles = VehicleModel.findAll(100, 0);
        const vehiclesWithCustomers = vehicles.map(v => {
          const customer = CustomerModel.findById(v.customer_id);
          return { ...v, customer };
        });
        return JSON.stringify(vehiclesWithCustomers, null, 2);
      }

      case 'get_vehicle_service_history': {
        const logs = ServiceLogModel.findByVehicleId(input.vehicle_id);
        return JSON.stringify(logs, null, 2);
      }

      case 'get_expected_services': {
        const services = getExpectedServicesForVehicle(input.vehicle_id);
        return JSON.stringify(services, null, 2);
      }

      case 'get_all_customers': {
        const customers = CustomerModel.findAll(100, 0);
        return JSON.stringify(customers, null, 2);
      }

      case 'get_customer_vehicles': {
        const vehicles = VehicleModel.findByCustomerId(input.customer_id);
        return JSON.stringify(vehicles, null, 2);
      }

      case 'create_insight': {
        const insightData: CreateInsightRequest = {
          type: input.type as InsightType,
          priority: input.priority as InsightPriority,
          title: input.title,
          body: input.body,
          customer_id: input.customer_id,
          vehicle_id: input.vehicle_id,
          action_type: input.action_type as InsightActionType,
          action_url: input.vehicle_id
            ? `/dashboard/vehicles/${input.vehicle_id}`
            : input.customer_id
              ? `/dashboard/customers/${input.customer_id}`
              : undefined
        };
        const insight = InsightModel.create(insightData);
        return JSON.stringify({ success: true, insight_id: insight.id });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    return JSON.stringify({ error: String(error) });
  }
}

export interface AgentConfig {
  name: string;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
}

export async function runAgent(config: AgentConfig): Promise<{
  insightsCreated: number;
  tokensUsed: number;
  error?: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  // Create agent run record
  const agentRun = AgentRunModel.create({ agent_type: config.name });
  let insightsCreated = 0;
  let totalTokens = 0;

  try {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: config.userPrompt }
    ];

    let continueLoop = true;

    while (continueLoop) {
      const response = await client.messages.create({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: config.maxTokens || 4096,
        system: config.systemPrompt,
        tools,
        messages
      });

      // Track token usage
      totalTokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      // Check if we need to handle tool use
      if (response.stop_reason === 'tool_use') {
        // Add assistant response to messages
        messages.push({ role: 'assistant', content: response.content });

        // Process tool calls
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            console.log(`[${config.name}] Calling tool: ${block.name}`);
            const result = await executeTool(block.name, block.input as Record<string, any>);

            // Track insight creation
            if (block.name === 'create_insight') {
              const parsed = JSON.parse(result);
              if (parsed.success) {
                insightsCreated++;
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result
            });
          }
        }

        // Add tool results to messages
        messages.push({ role: 'user', content: toolResults });
      } else {
        // Agent finished
        continueLoop = false;

        // Log final response
        for (const block of response.content) {
          if (block.type === 'text') {
            console.log(`[${config.name}] Final response:`, block.text.substring(0, 200));
          }
        }
      }
    }

    // Mark run as complete
    AgentRunModel.complete(agentRun.id, {
      insights_created: insightsCreated,
      tokens_used: totalTokens,
      cost_cents: Math.ceil(totalTokens * 0.003) // Rough estimate
    });

    return { insightsCreated, tokensUsed: totalTokens };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    AgentRunModel.fail(agentRun.id, errorMessage);
    console.error(`[${config.name}] Agent failed:`, errorMessage);
    return { insightsCreated, tokensUsed: totalTokens, error: errorMessage };
  }
}
