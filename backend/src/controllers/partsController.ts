import { Request, Response, NextFunction } from 'express';
import * as Part from '../models/Part.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit = 100, offset = 0, search } = req.query;

    if (search) {
      const parts = Part.search(search as string, Number(limit));
      return res.json({ parts, total: parts.length });
    }

    const parts = Part.findAll(Number(limit), Number(offset));
    const total = Part.count();
    res.json({ parts, total });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const part = Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    res.json(part);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { sku, name, description, cost, retail_price, quantity_in_stock, reorder_threshold } = req.body;

    if (!sku || !name || cost === undefined || retail_price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: sku, name, cost, retail_price' });
    }

    // Check for duplicate SKU
    const existing = Part.findBySku(sku);
    if (existing) {
      return res.status(409).json({ error: 'Part with this SKU already exists' });
    }

    const part = Part.create({
      sku,
      name,
      description,
      cost: Number(cost),
      retail_price: Number(retail_price),
      quantity_in_stock: quantity_in_stock ? Number(quantity_in_stock) : 0,
      reorder_threshold: reorder_threshold ? Number(reorder_threshold) : 5,
    });

    res.status(201).json(part);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const part = Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // If SKU is being changed, check for duplicates
    if (req.body.sku && req.body.sku !== part.sku) {
      const existing = Part.findBySku(req.body.sku);
      if (existing) {
        return res.status(409).json({ error: 'Part with this SKU already exists' });
      }
    }

    const updated = Part.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const part = Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    Part.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity adjustment is required' });
    }

    const part = Part.adjustStock(req.params.id, Number(quantity));
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.json(part);
  } catch (error) {
    next(error);
  }
}

export async function getLowStock(req: Request, res: Response, next: NextFunction) {
  try {
    const parts = Part.getLowStock();
    res.json({ parts, count: parts.length });
  } catch (error) {
    next(error);
  }
}
