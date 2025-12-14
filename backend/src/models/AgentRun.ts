import { query, queryOne, execute } from '../config/db.js';
import { AgentRun, CreateAgentRunRequest, UpdateAgentRunRequest } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export function findAll(options: {
  limit?: number;
  offset?: number;
  agentType?: string;
  status?: string;
} = {}): AgentRun[] {
  const { limit = 50, offset = 0, agentType, status } = options;

  let sql = 'SELECT * FROM agent_runs WHERE 1=1';
  const params: any[] = [];

  if (agentType) {
    sql += ' AND agent_type = ?';
    params.push(agentType);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return query<AgentRun>(sql, params);
}

export function findById(id: string): AgentRun | null {
  return queryOne<AgentRun>('SELECT * FROM agent_runs WHERE id = ?', [id]);
}

export function findLatestByType(agentType: string): AgentRun | null {
  return queryOne<AgentRun>(
    'SELECT * FROM agent_runs WHERE agent_type = ? ORDER BY started_at DESC LIMIT 1',
    [agentType]
  );
}

export function findRunning(): AgentRun[] {
  return query<AgentRun>('SELECT * FROM agent_runs WHERE status = ? ORDER BY started_at DESC', ['running']);
}

export function create(data: CreateAgentRunRequest): AgentRun {
  const id = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO agent_runs (id, agent_type, started_at, status, insights_created)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.agent_type, now, 'running', 0]
  );

  return findById(id)!;
}

export function update(id: string, data: UpdateAgentRunRequest): AgentRun | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }

  if (data.completed_at !== undefined) {
    fields.push('completed_at = ?');
    values.push(data.completed_at);
  }

  if (data.insights_created !== undefined) {
    fields.push('insights_created = ?');
    values.push(data.insights_created);
  }

  if (data.tokens_used !== undefined) {
    fields.push('tokens_used = ?');
    values.push(data.tokens_used);
  }

  if (data.cost_cents !== undefined) {
    fields.push('cost_cents = ?');
    values.push(data.cost_cents);
  }

  if (data.error_message !== undefined) {
    fields.push('error_message = ?');
    values.push(data.error_message);
  }

  if (data.metadata !== undefined) {
    fields.push('metadata = ?');
    values.push(JSON.stringify(data.metadata));
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);
  execute(`UPDATE agent_runs SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export function complete(id: string, result: {
  insights_created: number;
  tokens_used?: number;
  cost_cents?: number;
  metadata?: Record<string, any>;
}): AgentRun | null {
  const now = new Date().toISOString();
  return update(id, {
    status: 'completed',
    completed_at: now,
    ...result
  });
}

export function fail(id: string, errorMessage: string): AgentRun | null {
  const now = new Date().toISOString();
  return update(id, {
    status: 'failed',
    completed_at: now,
    error_message: errorMessage
  });
}

export function remove(id: string): boolean {
  const count = execute('DELETE FROM agent_runs WHERE id = ?', [id]);
  return count > 0;
}

export function getStats(days: number = 7): {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalInsights: number;
  totalTokens: number;
  totalCostCents: number;
} {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const stats = queryOne<{
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    total_insights: number;
    total_tokens: number;
    total_cost: number;
  }>(`
    SELECT
      COUNT(*) as total_runs,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
      SUM(COALESCE(insights_created, 0)) as total_insights,
      SUM(COALESCE(tokens_used, 0)) as total_tokens,
      SUM(COALESCE(cost_cents, 0)) as total_cost
    FROM agent_runs
    WHERE started_at >= ?
  `, [cutoffStr]);

  return {
    totalRuns: stats?.total_runs || 0,
    successfulRuns: stats?.successful_runs || 0,
    failedRuns: stats?.failed_runs || 0,
    totalInsights: stats?.total_insights || 0,
    totalTokens: stats?.total_tokens || 0,
    totalCostCents: stats?.total_cost || 0
  };
}

export function deleteOlderThan(days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return execute('DELETE FROM agent_runs WHERE started_at < ?', [cutoff.toISOString()]);
}
