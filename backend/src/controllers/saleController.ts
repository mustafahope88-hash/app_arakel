import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

interface SaleItem {
  productId: number;
  quantity: number;
}

export const saleController = {
  async createSale(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { products, discount = 0, paymentMethod = 'cash', notes, couponId } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Products array is required' 
        });
      }

      const productIds = products.map((p: SaleItem) => p.productId);
      
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (dbProducts.length !== productIds.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Some products not found' 
        });
      }

      for (const p of dbProducts) {
        const orderQty = products.find((o: SaleItem) => o.productId === p.id)?.quantity || 0;
        if (p.stockQuantity < orderQty) {
          return res.status(400).json({ 
            success: false, 
            message: `Not enough stock for ${p.name}. Available: ${p.stockQuantity}` 
          });
        }
      }

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      
      const lastInvoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: `INV-${dateStr}` } },
        orderBy: { invoiceNumber: 'desc' },
      });
      
      let seq = 1;
      if (lastInvoice) {
        const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0');
        seq = lastSeq + 1;
      }
      
      const invoiceNumber = `INV-${dateStr}-${String(seq).padStart(4, '0')}`;

      const coupon = couponId ? await prisma.coupon.findUnique({ where: { id: Number(couponId) } }) : null;

      const result = await prisma.$transaction(async (tx: any) => {
        let subtotal = 0;

        for (const item of products) {
          const product = dbProducts.find(p => p.id === item.productId)!;
          const lineTotal = Number(product.salePrice) * item.quantity;
          subtotal += lineTotal;

          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: product.stockQuantity - item.quantity },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              type: 'sale',
              quantity: -item.quantity,
              referenceId: 0,
              userId,
              notes: `Sale ${invoiceNumber}`,
            },
          });
        }

        const total = subtotal - Number(discount);

        if (total < 0) {
          throw new Error('Total cannot be negative');
        }

        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            userId,
            subtotal,
            discount: Number(discount),
            tax: 0,
            total,
            paymentMethod,
            status: 'completed',
            notes: notes || null,
            couponId: couponId ? Number(couponId) : null,
          },
        });

        for (const item of products) {
          const product = dbProducts.find(p => p.id === item.productId)!;
          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              productId: product.id,
              productName: product.name,
              unitPrice: product.salePrice,
              quantity: item.quantity,
              lineTotal: Number(product.salePrice) * item.quantity,
            },
          });
        }

        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });

          await tx.invoiceDiscount.create({
            data: {
              invoiceId: invoice.id,
              type: 'coupon',
              couponId: coupon.id,
              targetId: null,
              amount: Number(discount),
              note: `Coupon: ${coupon.code}`,
            },
          });
        } else if (discount > 0) {
          await tx.invoiceDiscount.create({
            data: {
              invoiceId: invoice.id,
              type: 'manual',
              couponId: null,
              targetId: null,
              amount: Number(discount),
              note: 'Manual discount',
            },
          });
        }

        const allItems = await tx.invoiceItem.findMany({
          where: { invoiceId: invoice.id },
        });

        const discounts = await tx.invoiceDiscount.findMany({
          where: { invoiceId: invoice.id },
        });

        return { invoice, items: allItems, discounts };
      });

      res.json({
        success: true,
        message: 'Sale completed successfully',
        invoice: {
          id: result.invoice.id,
          invoiceNumber: result.invoice.invoiceNumber,
          total: result.invoice.total,
        },
      });
    } catch (error: any) {
      console.error('Sale error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Internal server error' 
      });
    }
  },

  async cancelSale(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id: Number(id) },
        include: { items: true, discounts: true },
      });

      if (!invoice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invoice not found' 
        });
      }

      if (invoice.status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invoice already cancelled' 
        });
      }

      await prisma.$transaction(async (tx: any) => {
        for (const item of invoice.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'return',
              quantity: item.quantity,
              referenceId: invoice.id,
              userId,
              notes: `Cancel ${invoice.invoiceNumber}`,
            },
          });
        }

        if (invoice.couponId) {
          await tx.coupon.update({
            where: { id: invoice.couponId },
            data: { usedCount: { decrement: 1 } },
          });
        }

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: userId,
          },
        });
      });

      res.json({ success: true, message: 'Invoice cancelled' });
    } catch (error) {
      console.error('Cancel sale error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },
};