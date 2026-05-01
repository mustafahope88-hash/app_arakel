'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Save, Store, DollarSign, FileText } from 'lucide-react';

interface Settings {
  id: number;
  shopName: string;
  shopAddress: string | null;
  shopPhone: string | null;
  currency: string;
  taxPercent: number;
  logoUrl: string | null;
  invoiceFooter: string | null;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    currency: 'SYP',
    taxPercent: '0',
    logoUrl: '',
    invoiceFooter: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.success) {
        setSettings(data.settings);
        setFormData({
          shopName: data.settings.shopName || '',
          shopAddress: data.settings.shopAddress || '',
          shopPhone: data.settings.shopPhone || '',
          currency: data.settings.currency || 'SYP',
          taxPercent: String(data.settings.taxPercent || 0),
          logoUrl: data.settings.logoUrl || '',
          invoiceFooter: data.settings.invoiceFooter || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { data } = await api.put('/settings', {
        shopName: formData.shopName,
        shopAddress: formData.shopAddress || null,
        shopPhone: formData.shopPhone || null,
        currency: formData.currency,
        taxPercent: Number(formData.taxPercent),
        logoUrl: formData.logoUrl || null,
        invoiceFooter: formData.invoiceFooter || null,
      });

      if (data.success) {
        setMessage('تم حفظ الإعدادات بنجاح');
        setSettings(data.settings);
      } else {
        setMessage(data.message || 'خطأ في الحفظ');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'خطأ في الحفظ');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12 max-w-5xl mx-auto" dir="rtl">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-foreground">الإعدادات العامّة</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">تخصيص بيانات المتجر والفواتير وإعدادات النظام</p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-2xl border text-base font-bold shadow-sm ${
          message.includes('نجاح')
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Shop Info Card */}
        <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/20">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">بيانات المتجر</h2>
              <p className="text-sm font-medium text-muted-foreground">التفاصيل الأساسية التي تظهر في الفواتير</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-base font-bold text-muted-foreground mb-3 block" htmlFor="shopName">اسم المتجر</Label>
              <Input
                id="shopName"
                type="text"
                className="h-16 rounded-2xl bg-muted/30 border-border/50 text-lg font-bold shadow-sm px-6 focus-visible:ring-primary/50"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="مثال: متجر الأراكيل المميز"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-bold text-muted-foreground mb-3 block" htmlFor="shopPhone">رقم الهاتف</Label>
                <Input
                  id="shopPhone"
                  type="text"
                  className="h-16 rounded-2xl bg-muted/30 border-border/50 text-lg font-bold shadow-sm px-6 focus-visible:ring-primary/50"
                  value={formData.shopPhone}
                  onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                  placeholder="+963 9xx xxx xxx"
                />
              </div>
              <div>
                <Label className="text-base font-bold text-muted-foreground mb-3 block" htmlFor="shopAddress">العنوان الكامل</Label>
                <Input
                  id="shopAddress"
                  type="text"
                  className="h-16 rounded-2xl bg-muted/30 border-border/50 text-lg font-bold shadow-sm px-6 focus-visible:ring-primary/50"
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                  placeholder="المدينة - المنطقة - الشارع"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-bold text-muted-foreground mb-3 block" htmlFor="logoUrl">رابط الشعار (Logo URL)</Label>
              <Input
                id="logoUrl"
                type="url"
                className="h-16 rounded-2xl bg-muted/30 border-border/50 text-lg shadow-sm px-6 focus-visible:ring-primary/50 text-left"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                style={{ direction: 'ltr' }}
              />
            </div>
          </div>
        </div>

        {/* Financial Info Card */}
        <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm border border-emerald-500/20">
              <DollarSign className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">الإعدادات المالية</h2>
              <p className="text-sm font-medium text-muted-foreground">تحديد العملة ونسبة الضريبة المضافة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-base font-bold text-muted-foreground mb-3 block" htmlFor="currency">العملة الافتراضية</Label>
              <Select
                id="currency"
                className="flex h-16 w-full rounded-2xl border border-border/50 bg-muted/30 px-6 py-2 text-lg font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="IQD">دينار عراقي (د.ع)</option>
                <option value="SYP">ليرة سورية (ل.س)</option>
                <option value="USD">دولار أمريكي ($)</option>
                <option value="SAR">ريال سعودي (ر.س)</option>
                <option value="AED">درهم إماراتي (د.إ)</option>
              </Select>
            </div>
            <div>
              <Label className="text-base font-bold text-muted-foreground mb-3 block" htmlFor="taxPercent">نسبة الضريبة (%)</Label>
              <Input
                id="taxPercent"
                type="number"
                className="h-16 rounded-2xl bg-muted/30 border-border/50 text-lg font-bold shadow-sm px-6 focus-visible:ring-primary/50"
                value={formData.taxPercent}
                onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Invoice Info Card */}
        <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-sm border border-amber-500/20">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">إعدادات الطباعة</h2>
              <p className="text-sm font-medium text-muted-foreground">تخصيص النصوص التي تظهر في الفواتير المطبوعة</p>
            </div>
          </div>

          <div>
            <Label className="text-base font-bold text-muted-foreground mb-3 block" htmlFor="invoiceFooter">تذييل الفاتورة</Label>
            <textarea
              id="invoiceFooter"
              className="flex w-full rounded-2xl border border-border/50 bg-muted/30 px-6 py-4 text-lg font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[160px] resize-y"
              value={formData.invoiceFooter}
              onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
              placeholder="مثال: شكراً لتسوقكم معنا! نأمل رؤيتكم قريباً..."
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="h-16 rounded-2xl px-12 text-xl font-black shadow-xl transition-all hover:scale-105 hover:shadow-primary/25 w-full md:w-auto"
          >
            {saving ? (
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-foreground border-t-transparent shadow-sm mx-auto" />
            ) : (
              <>
                <Save className="ml-3 h-6 w-6" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
