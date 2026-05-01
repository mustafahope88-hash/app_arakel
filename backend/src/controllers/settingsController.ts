import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const settingsController = {
  async get(req: Request, res: Response) {
    try {
      let settings = await prisma.settings.findFirst();

      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            shopName: 'محل الأراكيل',
            currency: 'IQD',
            taxPercent: 0,
          },
        });
      }

      res.json({ success: true, settings });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { shopName, shopAddress, shopPhone, currency, taxPercent, logoUrl, invoiceFooter } = req.body;

      let settings = await prisma.settings.findFirst();
      
      if (settings) {
        settings = await prisma.settings.update({
          where: { id: settings.id },
          data: {
            shopName: shopName || settings.shopName,
            shopAddress: shopAddress !== undefined ? shopAddress : settings.shopAddress,
            shopPhone: shopPhone !== undefined ? shopPhone : settings.shopPhone,
            currency: currency || settings.currency,
            taxPercent: taxPercent !== undefined ? Number(taxPercent) : settings.taxPercent,
            logoUrl: logoUrl !== undefined ? logoUrl : settings.logoUrl,
            invoiceFooter: invoiceFooter !== undefined ? invoiceFooter : settings.invoiceFooter,
          },
        });
      } else {
        settings = await prisma.settings.create({
          data: {
            shopName: shopName || 'محل الأراكيل',
            shopAddress: shopAddress || null,
            shopPhone: shopPhone || null,
            currency: currency || 'SYP',
            taxPercent: taxPercent ? Number(taxPercent) : 0,
            logoUrl: logoUrl || null,
            invoiceFooter: invoiceFooter || null,
          },
        });
      }

      res.json({ success: true, settings });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};