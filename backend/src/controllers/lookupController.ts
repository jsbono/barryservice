import { Request, Response } from 'express';
import * as ServiceRecommendationModel from '../models/ServiceRecommendation.js';

export function getMakes(req: Request, res: Response): void {
  try {
    const makes = ServiceRecommendationModel.getMakes();
    res.json({ makes });
  } catch (error) {
    console.error('Get makes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getModels(req: Request, res: Response): void {
  try {
    const make = req.query.make as string;

    if (!make) {
      res.status(400).json({ error: 'make query parameter is required' });
      return;
    }

    const models = ServiceRecommendationModel.getModels(make);
    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getYears(req: Request, res: Response): void {
  try {
    const make = req.query.make as string;
    const model = req.query.model as string;

    if (!make || !model) {
      res.status(400).json({ error: 'make and model query parameters are required' });
      return;
    }

    const years = ServiceRecommendationModel.getYears(make, model);
    res.json({ years });
  } catch (error) {
    console.error('Get years error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getServices(req: Request, res: Response): void {
  try {
    const make = req.query.make as string;
    const model = req.query.model as string;
    const year = parseInt(req.query.year as string);

    if (!make || !model || isNaN(year)) {
      res.status(400).json({ error: 'make, model, and year query parameters are required' });
      return;
    }

    const services = ServiceRecommendationModel.getServices(make, model, year);
    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
