import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const categoryController = {
  async getAll(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      res.json({ success: true, categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await prisma.category.findUnique({
        where: { id: Number(id) },
        include: {
          products: true,
        },
      });

      if (!category) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      res.json({ success: true, category });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name || String(name).trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Name is required' 
        });
      }

      const category = await prisma.category.create({
        data: {
          name: String(name).trim(),
          description: description ? String(description).trim() : null,
        },
      });

      res.json({ success: true, category });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          success: false, 
          message: 'Category already exists' 
        });
      }
      console.error('Create category error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const existing = await prisma.category.findUnique({
        where: { id: Number(id) },
      });

      if (!existing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      const category = await prisma.category.update({
        where: { id: Number(id) },
        data: {
          name: name ? String(name).trim() : existing.name,
          description: description !== undefined 
            ? (description ? String(description).trim() : null) 
            : existing.description,
        },
      });

      res.json({ success: true, category });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          success: false, 
          message: 'Category name already exists' 
        });
      }
      console.error('Update category error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.category.findUnique({
        where: { id: Number(id) },
        include: {
          _count: { select: { products: true } },
        },
      });

      if (!existing) {
        return res.status(404).json({ 
          success: false, 
          message: 'Category not found' 
        });
      }

      if (existing._count.products > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete category with products' 
        });
      }

      await prisma.category.delete({
        where: { id: Number(id) },
      });

      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },
};