import { runAgent } from '../AgentRunner.js';

const SYSTEM_PROMPT = `You are a vehicle service analyst for an auto repair shop. Your job is to analyze vehicles and their service history to identify services that are due or overdue.

Your goal is to create actionable insights for the shop owner/mechanic. These insights will appear on their dashboard.

Guidelines for creating insights:
1. PRIORITY LEVELS:
   - HIGH: Safety-critical services overdue (brakes, tires, steering), or services significantly overdue (>20% past due)
   - MEDIUM: Services due within 30 days or 500 miles
   - LOW: Informational patterns or upcoming services

2. TITLES: Keep under 60 characters, be specific
   - Good: "2019 Honda Accord - Oil change 1,500 mi overdue"
   - Bad: "Service needed"

3. BODY: Include specific details
   - Current mileage and last service mileage
   - How many miles/days overdue or until due
   - Why this matters (safety, warranty, etc.)

4. Focus on VALUE:
   - Don't create insights for minor issues
   - Prioritize safety-critical items
   - Look for patterns (multiple services due = bundle opportunity)
   - Identify customers with multiple vehicles needing service

5. AVOID DUPLICATES:
   - Don't create multiple insights for the same vehicle/service
   - Consolidate related issues into single insights

Use the tools provided to:
1. Get all vehicles
2. For each vehicle, get expected services
3. Create insights for significant findings`;

const USER_PROMPT = `Analyze all vehicles in the system and create insights for any services that are due or overdue.

Steps:
1. First, get all vehicles using get_all_vehicles
2. For each vehicle, use get_expected_services to see what's due
3. Create insights using create_insight for any significant findings

Focus on:
- Overdue services (especially safety-critical like brakes, tires)
- Services due within the next 30 days or 500 miles
- Patterns across multiple vehicles or customers

Be selective - only create insights for things that truly need attention.`;

export async function runServiceDueAgent(): Promise<{
  insightsCreated: number;
  tokensUsed: number;
  error?: string;
}> {
  console.log('[ServiceDueAgent] Starting analysis...');

  const result = await runAgent({
    name: 'service_due_analyzer',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: USER_PROMPT,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096
  });

  console.log(`[ServiceDueAgent] Completed. Created ${result.insightsCreated} insights, used ${result.tokensUsed} tokens`);

  return result;
}
