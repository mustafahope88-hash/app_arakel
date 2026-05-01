'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minTotal: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '',
    minTotal: '',
    maxUses: '',
    startsAt: '',
    expiresAt: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons');
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        code: formData.code,
        type: formData.type,
        value: Number(formData.value),
        minTotal: formData.minTotal ? Number(formData.minTotal) : 0,
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        startsAt: formData.startsAt || null,
        expiresAt: formData.expiresAt || null,
      };

      if (editingCoupon) {
        const { data } = await api.put(`/coupons/${editingCoupon.id}`, payload);
        if (data.success) {
          setShowModal(false);
          fetchCoupons();
        } else {
          setError(data.message);
        }
      } else {
        const { data } = await api.post('/coupons', payload);
        if (data.success) {
          setShowModal(false);
          fetchCoupons();
        } else {
          setError(data.message);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;

    try {
      const { data } = await api.delete(`/coupons/${id}`);
      if (data.success) {
        fetchCoupons();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { data } = await api.put(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      if (data.success) {
        fetchCoupons();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minTotal: String(coupon.minTotal),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      startsAt: coupon.startsAt ? coupon.startsAt.split('T')[0] : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      minTotal: '',
      maxUses: '',
      startsAt: '',
      expiresAt: '',
      isActive: true,
    });
    setError('');
    setShowModal(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  const getTypeLabel = (type: string) => {
    return type === 'percent' ? 'نسبة (%)' : 'ثابت (ل.س)';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-lg font-bold text-muted-foreground">جاري تحميل الكوبونات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">إدارة الكوبونات</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">قم بإدارة كوبونات الخصم والعروض الترويجية</p>
        </div>
        <Button onClick={openAdd} className="h-14 rounded-2xl px-8 text-lg font-bold shadow-lg transition-all hover:scale-105 hover:shadow-primary/25">
          <Plus className="ml-3 h-6 w-6" />
          إضافة كوبون جديد
        </Button>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all">
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                <th className="py-6 pr-10 pl-6 w-1/6">الكود</th>
                <th className="py-6 px-6">النوع</th>
                <th className="py-6 px-6">القيمة</th>
                <th className="py-6 px-6">الحد الأدنى</th>
                <th className="py-6 px-6">الاستخدام</th>
                <th className="py-6 px-6">الحالة</th>
                <th className="py-6 pl-10 pr-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="mb-5 rounded-full bg-muted/50 p-6">
                        <Badge className="h-12 w-12 opacity-40 bg-transparent text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">لا توجد كوبونات</p>
                      <p className="mt-2 text-sm">أضف كوبون خصم جديد لزيادة المبيعات</p>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="group transition-colors hover:bg-muted/20">
                    <td className="py-5 pr-10 pl-6">
                      <span className="font-mono text-lg font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="py-5 px-6 font-medium text-muted-foreground">
                      {getTypeLabel(coupon.type)}
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-lg font-bold text-foreground">
                        {coupon.type === 'percent' 
                          ? `${coupon.value}%` 
                          : `${coupon.value.toLocaleString()} ل.س`
                        }
                      </span>
                    </td>
                    <td className="py-5 px-6 font-medium text-muted-foreground">
                      {coupon.minTotal > 0 ? `${coupon.minTotal.toLocaleString()} ل.س` : '—'}
                    </td>
                    <td className="py-5 px-6">
                      <div className="inline-flex items-center justify-center rounded-xl bg-muted/50 px-4 py-2 font-bold text-foreground shadow-sm">
                        {coupon.maxUses 
                          ? `${coupon.usedCount} / ${coupon.maxUses}` 
                          : coupon.usedCount
                        }
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold shadow-sm ${
                        coupon.isActive
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                        {coupon.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-5 pl-10 pr-6">
                      <div className="flex items-center justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleToggleActive(coupon)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all hover:scale-110 ${
                            coupon.isActive ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white'
                          }`}
                          title={coupon.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {coupon.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button 
                          onClick={() => openEdit(coupon)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground shadow-sm transition-all hover:scale-110 hover:bg-secondary"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shadow-sm transition-all hover:scale-110 hover:bg-destructive hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-card/95 border border-border/50 rounded-[2rem] shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">
                {editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}
              </h2>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Badge className="h-6 w-6 bg-transparent" />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">رمز الكوبون *</label>
                <Input
                  type="text"
                  className="h-14 rounded-2xl bg-muted/30 border-border/50 font-mono text-lg"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: SUMMER24"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">النوع *</label>
                  <select
                    className="flex h-14 w-full rounded-2xl border border-border/50 bg-muted/30 px-3 py-2 text-base font-bold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percent' | 'fixed' })}
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">
                    {formData.type === 'percent' ? 'النسبة (%)' : 'المبلغ'} *
                  </label>
                  <Input
                    type="number"
                    className="h-14 rounded-2xl bg-muted/30 border-border/50 text-lg font-bold"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">الحد الأدنى للطلب</label>
                  <Input
                    type="number"
                    className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold"
                    value={formData.minTotal}
                    onChange={(e) => setFormData({ ...formData, minTotal: e.target.value })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">أقصى عدد استخدام</label>
                  <Input
                    type="number"
                    className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    min="1"
                    placeholder="بدون حد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">تاريخ البداية</label>
                  <Input
                    type="date"
                    className="h-14 rounded-2xl bg-muted/30 border-border/50"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">تاريخ النهاية</label>
                  <Input
                    type="date"
                    className="h-14 rounded-2xl bg-muted/30 border-border/50"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/30">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-14 rounded-2xl text-lg font-bold"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg"
                  >
                    {submitting ? 'جاري الحفظ...' : 'حفظ الكوبون'}
                  </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

}