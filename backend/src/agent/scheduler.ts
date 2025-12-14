import cron from 'node-cron';
import { runServiceDueAgent } from './agents/ServiceDueAgent.js';

let isRunning = false;

export function startAgentScheduler() {
  // Run Service Due Analyzer daily at 6 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('[AgentScheduler] Running daily Service Due analysis...');
    await runServiceDueAgentSafe();
  });

  console.log('[AgentScheduler] Scheduled agents:');
  console.log('  - ServiceDueAgent: Daily at 6:00 AM');
}

async function runServiceDueAgentSafe() {
  if (isRunning) {
    console.log('[AgentScheduler] Agent already running, skipping...');
    return;
  }

  isRunning = true;
  try {
    await runServiceDueAgent();
  } catch (error) {
    console.error('[AgentScheduler] Error running ServiceDueAgent:', error);
  } finally {
    isRunning = false;
  }
}

// Manual trigger function for API use
export async function triggerAgent(agentType: string): Promise<{
  success: boolean;
  insightsCreated?: number;
  tokensUsed?: number;
  error?: string;
}> {
  if (isRunning) {
    return { success: false, error: 'An agent is already running' };
  }

  switch (agentType) {
    case 'service_due':
      const result = await runServiceDueAgentSafe();
      return { success: true, ...result };

    default:
      return { success: false, error: `Unknown agent type: ${agentType}` };
  }
}

// Re-export for convenience
export { runServiceDueAgent };
