import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const productController = {
  async getAll(req: Request, res: Response) {
    try {
      const { search, category, page = '1', limit = '20' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: String(search) } },
          { barcode: { contains: String(search) } },
        ];
      }

      if (category) {
        where.categoryId = Number(category);
      }

      where.isActive = true;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({ 
        success: true, 
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id: Number(id) },
        include: {
          category: true,
        },
      });

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }

      res.json({ success: true, product });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async getByBarcode(req: Request, res: Response) {
    try {
      const { barcode } = req.params;
      const barcodeStr = String(barcode);
      const product = await prisma.product.findUnique({
        where: { barcode: barcodeStr },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      });

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }

      res.json({ success: true, product });
    } catch (error) {
      console.error('Get product by barcode error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { 
        name, 
        barcode, 
        costPrice, 
        salePrice, 
        stockQuantity, 
        minStock, 
        categoryId, 
        imageUrl 
      } = req.body;

      const productName = String(name || '').trim();
      if (!productName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name is required' 
        });
      }

      const barcodeVal = barcode ? String(barcode).trim() : null;
      if (barcodeVal) {
        const existing = await prisma.product.findUnique({
          where: { barcode: barcodeVal },
        });

        if (existing) {
          return res.status(400).json({ 
            success: false, 
            message: 'Barcode already exists' 
          });
        }
      }

      const product = await prisma.product.create({
        data: {
          name: productName,
          barcode: barcodeVal,
          costPrice: Number(costPrice) || 0,
          salePrice: Number(salePrice) || 0,
          stockQuantity: Number(stockQuantity) || 0,
          minStock: Number(minStock) || 0,
          categoryId: categoryId ? Number(categoryId) : null,
          imageUrl: imageUrl?.trim() || null,
        },
      });

      res.json({ success: true, product });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        name, 
        barcode, 
        costPrice, 
        salePrice, 
        stockQuantity, 
        minStock, 
        categoryId, 
        imageUrl,
        isActive 
      } = req.body;

      const existing = await prisma.product.findUnique({
        where: { id: Number(id) },
      });

      if (!existing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }

      if (barcode && barcode !== existing.barcode) {
        const duplicate = await prisma.product.findUnique({
          where: { barcode },
        });

        if (duplicate) {
          return res.status(400).json({ 
            success: false, 
            message: 'Barcode already exists' 
          });
        }
      }

      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: {
          name: name?.trim() || existing.name,
          barcode: barcode !== undefined ? barcode?.trim() || null : existing.barcode,
          costPrice: costPrice !== undefined ? Number(costPrice) : existing.costPrice,
          salePrice: salePrice !== undefined ? Number(salePrice) : existing.salePrice,
          stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : existing.stockQuantity,
          minStock: minStock !== undefined ? Number(minStock) : existing.minStock,
          categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : existing.categoryId,
          imageUrl: imageUrl !== undefined ? (imageUrl?.trim() || null) : existing.imageUrl,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        },
      });

      res.json({ success: true, product });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.product.findUnique({
        where: { id: Number(id) },
      });

      if (!existing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }

      await prisma.product.update({
        where: { id: Number(id) },
        data: { isActive: false },
      });

      res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },
};