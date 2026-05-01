import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import ExcelJS from 'exceljs';

export const reportController = {
  async dashboardSummary(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todaySales, todayInvoices, totalProducts, lowStock] = await Promise.all([
        prisma.invoice.aggregate({
          where: { createdAt: { gte: today, lt: tomorrow }, status: 'completed' },
          _sum: { total: true },
        }),
        prisma.invoice.count({
          where: { createdAt: { gte: today, lt: tomorrow }, status: 'completed' },
        }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.findMany({
          where: { isActive: true },
          select: { stockQuantity: true, minStock: true },
        }),
      ]);

      const lowStockCount = lowStock.filter(p => p.minStock > 0 && p.stockQuantity <= p.minStock).length;

      res.json({
        success: true,
        summary: {
          todaySales: todaySales._sum.total?.toNumber() || 0,
          todayInvoices,
          totalProducts,
          lowStockCount,
        },
      });
    } catch (error) {
      console.error('Dashboard summary error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async daily(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(String(date)) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const [invoices, totals] = await Promise.all([
        prisma.invoice.findMany({
          where: { createdAt: { gte: targetDate, lt: nextDate }, status: 'completed' },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { fullName: true } }, items: true },
        }),
        prisma.invoice.aggregate({
          where: { createdAt: { gte: targetDate, lt: nextDate }, status: 'completed' },
          _sum: { subtotal: true, discount: true, total: true },
        }),
      ]);

      const invoiceCount = await prisma.invoice.count({
        where: { createdAt: { gte: targetDate, lt: nextDate }, status: 'completed' },
      });

      res.json({
        success: true,
        report: {
          date: targetDate.toISOString().split('T')[0],
          invoices,
          summary: {
            totalSales: totals._sum.total?.toNumber() || 0,
            subtotal: totals._sum.subtotal?.toNumber() || 0,
            discount: totals._sum.discount?.toNumber() || 0,
            invoiceCount,
          },
        },
      });
    } catch (error) {
      console.error('Daily report error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async monthly(req: Request, res: Response) {
    try {
      const { month } = req.query;
      let startDate: Date;

      if (month) {
        const [year, mon] = String(month).split('-');
        startDate = new Date(Number(year), Number(mon) - 1, 1);
      } else {
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const [totals, topProducts] = await Promise.all([
        prisma.invoice.aggregate({
          where: { createdAt: { gte: startDate, lt: endDate }, status: 'completed' },
          _sum: { subtotal: true, discount: true, total: true },
        }),
        prisma.invoiceItem.groupBy({
          by: ['productId', 'productName'],
          _sum: { quantity: true, lineTotal: true },
          where: {
            invoice: { createdAt: { gte: startDate, lt: endDate }, status: 'completed' },
          },
          orderBy: { _sum: { lineTotal: 'desc' } },
          take: 10,
        }),
      ]);

      const invoiceCount = await prisma.invoice.count({
        where: { createdAt: { gte: startDate, lt: endDate }, status: 'completed' },
      });

      res.json({
        success: true,
        report: {
          month: month || startDate.toISOString().slice(0, 7),
          summary: {
            totalSales: totals._sum.total?.toNumber() || 0,
            subtotal: totals._sum.subtotal?.toNumber() || 0,
            discount: totals._sum.discount?.toNumber() || 0,
            invoiceCount,
          },
          topProducts: topProducts.map(p => ({
            productId: p.productId,
            name: p.productName,
            quantity: p._sum.quantity || 0,
            total: p._sum.lineTotal?.toNumber() || 0,
          })),
        },
      });
    } catch (error) {
      console.error('Monthly report error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async topProducts(req: Request, res: Response) {
    try {
      const { from, to, limit = '10' } = req.query;

      const where: any = { invoice: { status: 'completed' } };
      if (from || to) {
        where.invoice = { ...where.invoice, createdAt: {} };
        if (from) where.invoice.createdAt.gte = new Date(String(from));
        if (to) where.invoice.createdAt.lte = new Date(String(to));
      }

      const products = await prisma.invoiceItem.groupBy({
        by: ['productId', 'productName'],
        _sum: { quantity: true, lineTotal: true },
        where,
        orderBy: { _sum: { lineTotal: 'desc' } },
        take: Number(limit),
      });

      res.json({
        success: true,
        products: products.map(p => ({
          productId: p.productId,
          name: p.productName,
          quantitySold: p._sum.quantity || 0,
          totalSales: p._sum.lineTotal?.toNumber() || 0,
        })),
      });
    } catch (error) {
      console.error('Top products error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async lowStock(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true, minStock: { gt: 0 } },
        select: { id: true, name: true, stockQuantity: true, minStock: true, salePrice: true },
      });

      const lowStock = products.filter(p => p.stockQuantity <= p.minStock);

      res.json({
        success: true,
        products: lowStock.map(p => ({
          id: p.id,
          name: p.name,
          stockQuantity: p.stockQuantity,
          minStock: p.minStock,
          salePrice: p.salePrice,
        })),
      });
    } catch (error) {
      console.error('Low stock error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async exportDaily(req: Request, res: Response) {
    try {
      const { date, format = 'xlsx' } = req.query;
      const targetDate = date ? new Date(String(date)) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const [invoices, totals] = await Promise.all([
        prisma.invoice.findMany({
          where: { createdAt: { gte: targetDate, lt: nextDate }, status: 'completed' },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { fullName: true } }, items: true },
        }),
        prisma.invoice.aggregate({
          where: { createdAt: { gte: targetDate, lt: nextDate }, status: 'completed' },
          _sum: { total: true, discount: true },
        }),
      ]);

      const dateStr = targetDate.toLocaleDateString('ar-SA');

      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Arakel Shop';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet(`تقرير ${dateStr}`);

        sheet.addRow(['التقرير اليومي', dateStr]);
        sheet.addRow([]);
        sheet.addRow(['رقم الفاتورة', 'البائع', 'المبلغ', 'الخصم', 'طريقة الدفع', 'الوقت']);

        invoices.forEach(inv => {
          sheet.addRow([
            inv.invoiceNumber,
            inv.user.fullName,
            Number(inv.total),
            Number(inv.discount),
            inv.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة',
            new Date(inv.createdAt).toLocaleTimeString('ar-SA'),
          ]);
        });

        sheet.addRow([]);
        sheet.addRow(['الإجمالي', '', totals._sum.total?.toNumber() || 0, totals._sum.discount?.toNumber() || 0]);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report-${date}.xlsx`);

        const buffer = await workbook.xlsx.writeBuffer();
        return res.send(buffer);
      }

      res.json({ success: true, message: 'Format not supported' });
    } catch (error) {
      console.error('Export daily error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async exportMonthly(req: Request, res: Response) {
    try {
      const { month, format = 'xlsx' } = req.query;
      let startDate: Date;

      if (month) {
        const [year, mon] = String(month).split('-');
        startDate = new Date(Number(year), Number(mon) - 1, 1);
      } else {
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const [totals, topProducts] = await Promise.all([
        prisma.invoice.aggregate({
          where: { createdAt: { gte: startDate, lt: endDate }, status: 'completed' },
          _sum: { total: true, discount: true },
        }),
        prisma.invoiceItem.groupBy({
          by: ['productName'],
          _sum: { quantity: true, lineTotal: true },
          where: { invoice: { createdAt: { gte: startDate, lt: endDate }, status: 'completed' } },
          orderBy: { _sum: { lineTotal: 'desc' } },
          take: 20,
        }),
      ]);

      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Arakel Shop';
        workbook.created = new Date();

        const summarySheet = workbook.addWorksheet('الملخص');
        summarySheet.addRow(['التقرير الشهري', startDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })]);
        summarySheet.addRow(['إجمالي المبيعات', totals._sum.total?.toNumber() || 0]);
        summarySheet.addRow(['إجمالي الخصومات', totals._sum.discount?.toNumber() || 0]);

        const productsSheet = workbook.addWorksheet('أكثر مبيعاً');
        productsSheet.addRow(['المنتج', 'الكمية المباعة', 'إجمالي المبيعات']);
        topProducts.forEach(p => {
          productsSheet.addRow([p.productName, p._sum.quantity || 0, p._sum.lineTotal?.toNumber() || 0]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report-${month}.xlsx`);

        const buffer = await workbook.xlsx.writeBuffer();
        return res.send(buffer);
      }

      res.json({ success: true, message: 'Format not supported' });
    } catch (error) {
      console.error('Export monthly error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};