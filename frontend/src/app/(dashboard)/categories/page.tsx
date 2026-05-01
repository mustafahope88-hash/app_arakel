'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, Edit, Trash2, FolderOpen } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  productsCount: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    try {
      const { data } = await api.delete(`/categories/${id}`);
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-lg font-bold text-muted-foreground">جاري تحميل التصنيفات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">إدارة التصنيفات</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">إدارة وتعديل تصنيفات المنتجات في النظام</p>
        </div>
        <Link href="/categories/new">
          <Button className="h-14 rounded-2xl px-8 text-lg font-bold shadow-lg transition-all hover:scale-105 hover:shadow-primary/25">
            <Plus className="ml-3 h-6 w-6" />
            إضافة تصنيف جديد
          </Button>
        </Link>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all">
        {/* Search Bar */}
        <div className="border-b border-border/30 bg-muted/10 p-6 sm:p-8">
          <div className="relative w-full max-w-xl mx-auto sm:mx-0">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              type="text"
              className="h-16 w-full rounded-full border-border/50 bg-background/80 pl-6 pr-16 text-lg font-medium shadow-sm transition-all placeholder:text-muted-foreground focus-visible:ring-primary/50"
              placeholder="ابحث باسم التصنيف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                <th className="py-6 pr-10 pl-6 w-1/4">الاسم</th>
                <th className="py-6 px-6 w-1/3">الوصف</th>
                <th className="py-6 px-6">عدد المنتجات</th>
                <th className="py-6 px-6">الحالة</th>
                <th className="py-6 pl-10 pr-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="mb-5 rounded-full bg-muted/50 p-6">
                        <FolderOpen className="h-12 w-12 opacity-40" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">لا توجد تصنيفات</p>
                      <p className="mt-2 text-sm">لم يتم العثور على أي تصنيف يطابق بحثك الحالى</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="group transition-colors hover:bg-muted/20">
                    <td className="py-5 pr-10 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                          <FolderOpen className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-lg text-foreground">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-muted-foreground font-medium truncate max-w-xs">{category.description || '—'}</p>
                    </td>
                    <td className="py-5 px-6">
                      <div className="inline-flex items-center justify-center rounded-xl bg-muted/50 px-4 py-2 font-bold text-foreground shadow-sm">
                        {category.productsCount}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold shadow-sm ${
                        category.isActive
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                        {category.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="py-5 pl-10 pr-6">
                      <div className="flex items-center justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                        <Link href={`/categories/${category.id}/edit`}>
                          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground shadow-sm transition-all hover:scale-110 hover:bg-secondary">
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id)}
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
    </div>
  );
}
