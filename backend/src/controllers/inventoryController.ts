import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/inventory - Get all inventory movements
export const getAll = async (req: Request, res: Response) => {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Manually fetch related data
    const movementsWithDetails = await Promise.all(
      movements.map(async (m) => {
        const product = await prisma.product.findUnique({
          where: { id: m.productId }
        });
        const user = m.userId ? await prisma.user.findUnique({
          where: { id: m.userId }
        }) : null;

        return {
          id: m.id,
          productId: m.productId,
          productName: product?.name || 'غير معروف',
          type: m.type,
          quantity: m.quantity,
          notes: m.notes,
          createdAt: m.createdAt,
          user: user?.fullName || user?.username || 'غير معروف'
        };
      })
    );

    res.json({
      success: true,
      movements: movementsWithDetails || [],
    });
  } catch (error: any) {
    console.error('Inventory GET error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory movements',
      error: error.message,
    });
  }
};

// POST /api/inventory - Create inventory movement
export const create = async (req: Request, res: Response) => {
  try {
    const { productId, type, quantity, notes } = req.body as any;
    const userId = (req as any).user?.userId;

    if (!productId || !type || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty === 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be non-zero number' });
    }

    const validTypes = ['purchase', 'sale', 'adjustment', 'return'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid movement type' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      let stockChange = 0;

      if (type === 'purchase' || type === 'return') {
        stockChange = Math.abs(qty);
      } else if (type === 'sale' || type === 'adjustment') {
        stockChange = -Math.abs(qty);
      }

      const currentProduct = await tx.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const newStock = currentProduct.stockQuantity + stockChange;
      if (newStock < 0) {
        throw new Error('Stock cannot be negative');
      }

      await tx.product.update({
        where: { id: parseInt(productId) },
        data: { stockQuantity: newStock }
      });

      // Create movement using direct fields (not relation objects)
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: parseInt(productId),
          type: type as any,
          quantity: stockChange,
          notes: notes || null,
          userId: userId || null,
        }
      });

      // Create audit log
      try {
        await tx.auditLog.create({
          data: {
            userId: userId || null,
            action: 'CREATE_INVENTORY_MOVEMENT',
            entity: 'InventoryMovement',
            entityId: movement.id,
            details: JSON.stringify({ productId, type, quantity: stockChange, notes })
          }
        });
      } catch (e) {
        console.error('Audit log error:', e);
      }

      return movement;
    });

    res.json({
      success: true,
      movement: result
    });
  } catch (error: any) {
    console.error('Create inventory movement error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create inventory movement' 
    });
  }
};

// PUT /api/inventory/:id - Update inventory movement
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { productId, type, quantity, notes } = req.body as any;
    const userId = (req as any).user?.userId;

    const existingMovement = await prisma.inventoryMovement.findUnique({
      where: { id }
    });

    if (!existingMovement) {
      return res.status(404).json({ success: false, message: 'Movement not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Reverse old movement effect
      const oldProduct = await tx.product.findUnique({
        where: { id: existingMovement.productId }
      });

      if (oldProduct) {
        await tx.product.update({
          where: { id: oldProduct.id },
          data: { stockQuantity: oldProduct.stockQuantity - existingMovement.quantity }
        });
      }

      // Apply new movement
      let stockChange = 0;
      if (type === 'purchase' || type === 'return') {
        stockChange = Math.abs(parseInt(quantity));
      } else if (type === 'sale' || type === 'adjustment') {
        stockChange = -Math.abs(parseInt(quantity));
      }

      const newProduct = await tx.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!newProduct) {
        throw new Error('Product not found');
      }

      const newStock = newProduct.stockQuantity + stockChange;
      if (newStock < 0) {
        throw new Error('Stock cannot be negative');
      }

      await tx.product.update({
        where: { id: parseInt(productId) },
        data: { stockQuantity: newStock }
      });

      const movement = await tx.inventoryMovement.update({
        where: { id },
        data: {
          productId: parseInt(productId),
          type: type as any,
          quantity: stockChange,
          notes: notes || null
        }
      });

      // Create audit log
      try {
        await tx.auditLog.create({
          data: {
            userId: userId || null,
            action: 'UPDATE_INVENTORY_MOVEMENT',
            entity: 'InventoryMovement',
            entityId: movement.id,
            details: JSON.stringify({ old: existingMovement, new: { productId, type, quantity: stockChange, notes } })
          }
        });
      } catch (e) {
        console.error('Audit log error:', e);
      }

      return movement;
    });

    res.json({
      success: true,
      movement: result
    });
  } catch (error: any) {
    console.error('Update inventory movement error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update inventory movement' 
    });
  }
};

// DELETE /api/inventory/:id - Delete inventory movement
export const deleteMovement = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    const movement = await prisma.inventoryMovement.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movement not found' });
    }

    // Only admin can delete sale movements
    if (movement.type === 'sale' && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin can delete sale movements' 
      });
    }

    await prisma.$transaction(async (tx) => {
      // Reverse movement effect
      if (movement.product) {
        const newStock = movement.product.stockQuantity - movement.quantity;
        if (newStock < 0) {
          throw new Error('Cannot delete: would make stock negative');
        }

        await tx.product.update({
          where: { id: movement.productId },
          data: { stockQuantity: newStock }
        });
      }

      await tx.inventoryMovement.delete({
        where: { id }
      });

      // Create audit log
      try {
        await tx.auditLog.create({
          data: {
            userId: userId || null,
            action: 'DELETE_INVENTORY_MOVEMENT',
            entity: 'InventoryMovement',
            entityId: movement.id,
            details: JSON.stringify({ movement })
          }
        });
      } catch (e) {
        console.error('Audit log error:', e);
      }
    });

    res.json({ success: true, message: 'Movement deleted successfully' });
  } catch (error: any) {
    console.error('Delete inventory movement error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete inventory movement' 
    });
  }
};
