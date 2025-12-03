import { Request, Response } from 'express';
import { runReminderJob } from '../services/reminderService.js';

export function triggerReminders(req: Request, res: Response): void {
  try {
    const result = runReminderJob();
    res.json({
      message: 'Reminder job completed',
      ...result,
    });
  } catch (error) {
    console.error('Trigger reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
