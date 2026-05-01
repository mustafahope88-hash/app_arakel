'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CategoryForm {
  name: string;
  description: string;
  isActive: boolean;
}

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id ? Number(params.id) : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) return;
      
      try {
        const { data } = await api.get(`/categories/${categoryId}`);
        if (data.success) {
          const category = data.category;
          setFormData({
            name: category.name || '',
            description: category.description || '',
            isActive: category.isActive ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to fetch category:', err);
        setError('فشل في تحميل بيانات التصنيف');
      }
    };

    fetchCategory();
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
      };

      const { data } = await api.put(`/categories/${categoryId}`, payload);
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
    <div className="w-full min-h-[calc(100vh-90px)] flex items-start justify-center px-6 py-12" dir="rtl">
      <div className="w-full max-w-[720px]">
        <div className="rounded-3xl border border-white/10 bg-[#1e293b] shadow-2xl p-8 space-y-7">
          <div className="flex items-center gap-4">
            <Link href="/categories">
              <Button variant="secondary" size="sm">
                ← رجوع
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-white">تعديل التصنيف</h1>
              <p className="mt-2 text-sm text-white/60">تعديل بيانات التصنيف الحالي</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
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

            <div className="grid grid-cols-2 gap-4 pt-2">
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
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
