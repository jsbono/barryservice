import { Request, Response } from 'express';
import * as InsightModel from '../models/Insight.js';
import * as AgentRunModel from '../models/AgentRun.js';
import { triggerAgent } from '../agent/scheduler.js';

// GET /api/insights - List all insights
export const list = (req: Request, res: Response) => {
  try {
    const {
      type,
      priority,
      unread,
      limit = '50',
      offset = '0'
    } = req.query;

    const insights = InsightModel.findAllWithRelations({
      type: type as string,
      priority: priority as string,
      unreadOnly: unread === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    const unreadCount = InsightModel.countUnread();
    const priorityCounts = InsightModel.countByPriority();

    res.json({
      insights,
      meta: {
        unreadCount,
        priorityCounts,
        total: insights.length
      }
    });
  } catch (error) {
    console.error('Error listing insights:', error);
    res.status(500).json({ error: 'Failed to list insights' });
  }
};

// GET /api/insights/:id - Get single insight
export const getById = (req: Request, res: Response) => {
  try {
    const insight = InsightModel.findByIdWithRelations(req.params.id);

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json(insight);
  } catch (error) {
    console.error('Error getting insight:', error);
    res.status(500).json({ error: 'Failed to get insight' });
  }
};

// PUT /api/insights/:id/read - Mark insight as read
export const markRead = (req: Request, res: Response) => {
  try {
    const insight = InsightModel.markRead(req.params.id);

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json(insight);
  } catch (error) {
    console.error('Error marking insight as read:', error);
    res.status(500).json({ error: 'Failed to mark insight as read' });
  }
};

// PUT /api/insights/:id/action - Mark insight as actioned
export const markActioned = (req: Request, res: Response) => {
  try {
    const insight = InsightModel.markActioned(req.params.id);

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json(insight);
  } catch (error) {
    console.error('Error marking insight as actioned:', error);
    res.status(500).json({ error: 'Failed to mark insight as actioned' });
  }
};

// PUT /api/insights/:id/dismiss - Dismiss insight
export const dismiss = (req: Request, res: Response) => {
  try {
    const insight = InsightModel.dismiss(req.params.id);

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json(insight);
  } catch (error) {
    console.error('Error dismissing insight:', error);
    res.status(500).json({ error: 'Failed to dismiss insight' });
  }
};

// GET /api/insights/stats - Get insight statistics
export const getStats = (req: Request, res: Response) => {
  try {
    const unreadCount = InsightModel.countUnread();
    const priorityCounts = InsightModel.countByPriority();
    const agentStats = AgentRunModel.getStats(7);

    res.json({
      unreadCount,
      priorityCounts,
      agentStats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

// POST /api/agents/run/:type - Manually trigger an agent
export const runAgent = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    console.log(`[API] Triggering agent: ${type}`);
    const result = await triggerAgent(type);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      insightsCreated: result.insightsCreated,
      tokensUsed: result.tokensUsed
    });
  } catch (error) {
    console.error('Error running agent:', error);
    res.status(500).json({ error: 'Failed to run agent' });
  }
};

// GET /api/agents/runs - Get agent run history
export const getAgentRuns = (req: Request, res: Response) => {
  try {
    const { type, status, limit = '20' } = req.query;

    const runs = AgentRunModel.findAll({
      agentType: type as string,
      status: status as string,
      limit: parseInt(limit as string)
    });

    res.json(runs);
  } catch (error) {
    console.error('Error getting agent runs:', error);
    res.status(500).json({ error: 'Failed to get agent runs' });
  }
};
