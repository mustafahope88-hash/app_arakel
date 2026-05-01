import { Request, Response, NextFunction } from 'express';

export const validate = (schema: Record<string, string>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, type] of Object.entries(schema)) {
      const value = req.body[field];

      if (type === 'required' && (!value || value === '')) {
        errors.push(`${field} is required`);
      } else if (type === 'number' && value && isNaN(Number(value))) {
        errors.push(`${field} must be a number`);
      } else if (type === 'min' && value && value.length < 2) {
        errors.push(`${field} must be at least 2 characters`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: errors.join(', ') 
      });
    }

    next();
  };
};