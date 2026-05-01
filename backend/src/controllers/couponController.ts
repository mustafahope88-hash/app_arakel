import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const couponController = {
  async getAll(req: Request, res: Response) {
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, coupons });
    } catch (error) {
      console.error('Get coupons error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const coupon = await prisma.coupon.findUnique({
        where: { id: Number(id) },
      });

      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }

      res.json({ success: true, coupon });
    } catch (error) {
      console.error('Get coupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { code, type, value, minTotal, maxUses, startsAt, expiresAt } = req.body;

      if (!code || !type || value === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Code, type, and value are required' 
        });
      }

      const existing = await prisma.coupon.findUnique({
        where: { code: String(code).toUpperCase() },
      });

      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'Coupon code already exists' 
        });
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: String(code).toUpperCase(),
          type,
          value: Number(value),
          minTotal: Number(minTotal) || 0,
          maxUses: maxUses ? Number(maxUses) : null,
          startsAt: startsAt ? new Date(startsAt) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      res.json({ success: true, coupon });
    } catch (error) {
      console.error('Create coupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { code, type, value, minTotal, maxUses, startsAt, expiresAt, isActive } = req.body;

      const existing = await prisma.coupon.findUnique({
        where: { id: Number(id) },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }

      if (code && code.toUpperCase() !== existing.code) {
        const duplicate = await prisma.coupon.findUnique({
          where: { code: String(code).toUpperCase() },
        });
        if (duplicate) {
          return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
      }

      const coupon = await prisma.coupon.update({
        where: { id: Number(id) },
        data: {
          code: code ? String(code).toUpperCase() : existing.code,
          type: type || existing.type,
          value: value !== undefined ? Number(value) : existing.value,
          minTotal: minTotal !== undefined ? Number(minTotal) : existing.minTotal,
          maxUses: maxUses !== undefined ? (maxUses ? Number(maxUses) : null) : existing.maxUses,
          startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : existing.startsAt,
          expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        },
      });

      res.json({ success: true, coupon });
    } catch (error) {
      console.error('Update coupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.coupon.findUnique({
        where: { id: Number(id) },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }

      await prisma.coupon.delete({
        where: { id: Number(id) },
      });

      res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
      console.error('Delete coupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async validate(req: Request, res: Response) {
    try {
      const { code, subtotal } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, message: 'Code is required' });
      }

      const coupon = await prisma.coupon.findUnique({
        where: { code: String(code).toUpperCase() },
      });

      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Invalid coupon code' });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ success: false, message: 'Coupon is disabled' });
      }

      const now = new Date();
      
      if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        return res.status(400).json({ success: false, message: 'Coupon not yet valid' });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        return res.status(400).json({ success: false, message: 'Coupon expired' });
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }

      const orderTotal = Number(subtotal) || 0;
      const minTotalNum = Number(coupon.minTotal);
      if (minTotalNum > 0 && orderTotal < minTotalNum) {
        return res.status(400).json({ 
          success: false, 
          message: `Minimum order total is ${minTotalNum}` 
        });
      }

      let discount = 0;
      const couponType = String(coupon.type);
      if (couponType === 'percent') {
        discount = orderTotal * (Number(coupon.value) / 100);
      } else {
        discount = Number(coupon.value);
      }

      res.json({
        success: true,
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: String(coupon.type),
          value: Number(coupon.value),
          minTotal: minTotalNum,
        },
        discount,
        message: 'Coupon is valid',
      });
    } catch (error) {
      console.error('Validate coupon error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};