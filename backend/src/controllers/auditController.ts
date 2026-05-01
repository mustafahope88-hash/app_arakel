import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const auditController = {
  async createLog(userId: number | null, action: string, entity: string | null, entityId: number | null, details: any) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details: details ? JSON.stringify(details) : null,
        },
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  async getLogs(req: Request, res: Response) {
    try {
      const { page = '1', limit = '50', action, user, from, to } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (action) {
        where.action = String(action);
      }

      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(String(from));
        if (to) where.createdAt.lte = new Date(String(to));
      }

      if (user) {
        where.user = { fullName: { contains: String(user) } };
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true } },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};