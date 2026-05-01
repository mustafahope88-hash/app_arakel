'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CategoryForm {
  name: string;
  description: string;
  isActive: boolean;
}

export default function CategoryNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
      };

      const { data } = await api.post('/categories', payload);
      if (data.success) {
        router.push('/categories');
      } else {
        setError(data.message || 'حدث خطأ');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-6 py-10" dir="rtl">
      <div className="rounded-2xl border border-white/10 bg-[#1e293b] shadow-xl p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/categories">
            <Button variant="secondary" size="sm">
              ← رجوع
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white">إضافة تصنيف</h1>
            <p className="text-sm text-white/60">إنشاء تصنيف جديد للمنتجات</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              اسم التصنيف *
            </label>
            <Input
              type="text"
              className="w-full h-12 rounded-xl bg-[#020617] border border-white/10 px-4 text-white placeholder:text-white/50"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="اسم التصنيف"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              الوصف
            </label>
            <textarea
              className="w-full h-24 rounded-xl bg-[#020617] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف التصنيف (اختياري)"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-white/10 bg-[#020617] text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-white/70">
              نشط
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Link href="/categories" className="w-full">
              <Button
                type="button"
                variant="secondary"
                className="w-full h-12 rounded-xl font-semibold"
              >
                إلغاء
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="w-full h-12 rounded-xl font-semibold"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التصنيف'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
