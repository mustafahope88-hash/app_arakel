import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todaySales, todayInvoices, totalProducts, productsWithLowStock] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            createdAt: { gte: today, lt: tomorrow },
            status: 'completed',
          },
          _sum: { total: true },
        }),
        prisma.invoice.count({
          where: {
            createdAt: { gte: today, lt: tomorrow },
            status: 'completed',
          },
        }),
        prisma.product.count({
          where: { isActive: true },
        }),
        prisma.product.findMany({
          where: { isActive: true },
          select: { stockQuantity: true, minStock: true },
        }),
      ]);

      const lowStockProducts = productsWithLowStock.filter(
        (p) => p.minStock > 0 && p.stockQuantity <= p.minStock
      ).length;

      res.json({
        success: true,
        stats: {
          todaySales: todaySales._sum.total?.toNumber() || 0,
          todayInvoices,
          totalProducts,
          lowStockProducts,
        },
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },
};