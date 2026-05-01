import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { auditController } from './auditController.js';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          isActive: true,
          passwordHash: true,
        },
      });

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'Account is disabled' 
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );

      await auditController.createLog(user.id, 'LOGIN', 'user', user.id, { username: user.username });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },
};