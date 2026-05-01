'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSettingsStore, formatCurrency } from '@/lib/settings-store';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: number; name: string } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { currency, fetchSettings } = useSettingsStore();

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products', {
        params: { search, page, limit: 20 },
      });
      if (data.success) {
        setProducts(data.products);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, [search, page]);

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      const { data } = await api.delete(`/products/${id}`);
      if (data.success) {
        fetchProducts();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const getStockBadge = (qty: number, min: number) => {
    if (qty <= 0) return 'destructive';
    if (qty <= min) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-lg font-bold text-muted-foreground">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">إدارة المنتجات</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">عرض، تعديل، وحذف المنتجات في متجرك</p>
        </div>
        <Link href="/products/new">
          <Button className="h-14 rounded-2xl px-8 text-lg font-bold shadow-lg transition-all hover:scale-105 hover:shadow-primary/25">
            <Plus className="ml-3 h-6 w-6" />
            إضافة منتج جديد
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
              placeholder="ابحث عن منتج بالاسم أو الباركود..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                <th className="py-6 pr-10 pl-6 text-center w-32">الصورة</th>
                <th className="py-6 px-6">الاسم</th>
                <th className="py-6 px-6">الباركود</th>
                <th className="py-6 px-6">التصنيف</th>
                <th className="py-6 px-6 font-bold text-foreground">سعر البيع</th>
                <th className="py-6 px-6">المخزون</th>
                <th className="py-6 pl-10 pr-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="mb-5 rounded-full bg-muted/50 p-6">
                        <Package className="h-12 w-12 opacity-40" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">لا توجد منتجات</p>
                      <p className="mt-2 text-sm">لم يتم العثور على أي منتج يطابق بحثك الحالى</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const imageSrc = product.imageUrl
                    ? product.imageUrl.startsWith('/uploads')
                      ? product.imageUrl
                      : product.imageUrl
                    : '';
                  
                  const isLowStock = product.stockQuantity <= product.minStock;

                  return (
                    <tr key={product.id} className="group transition-colors hover:bg-muted/20">
                      {/* Image */}
                      <td className="py-5 pr-10 pl-6 text-center">
                        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl bg-muted/30 shadow-sm border border-border/50">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <Package className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Name */}
                      <td className="py-5 px-6">
                        <p className="font-bold text-base text-foreground">{product.name}</p>
                      </td>
                      
                      {/* Barcode */}
                      <td className="py-5 px-6">
                        <p className="font-mono text-sm font-medium text-muted-foreground bg-muted/40 inline-block px-3 py-1.5 rounded-lg border border-border/40">
                          {product.barcode || '—'}
                        </p>
                      </td>
                      
                      {/* Category */}
                      <td className="py-5 px-6">
                        {product.category?.name ? (
                          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm font-medium">—</span>
                        )}
                      </td>
                      
                      {/* Price */}
                      <td className="py-5 px-6">
                        <p className="text-lg font-black text-primary">
                          {formatCurrency(Number(product.salePrice), currency)}
                        </p>
                      </td>
                      
                      {/* Stock */}
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold shadow-sm ${
                          isLowStock
                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                            : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                        }`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-5 pl-10 pr-6">
                        <div className="flex items-center justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                          <Link href={`/products/${product.id}/edit`}>
                            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground shadow-sm transition-all hover:scale-110 hover:bg-secondary">
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shadow-sm transition-all hover:scale-110 hover:bg-destructive hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border/30 bg-muted/5 p-5 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background p-1.5 shadow-sm">
              <Button
                variant="ghost"
                className="rounded-full px-5 font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                السابق
              </Button>
              <div className="px-5 py-2 rounded-full bg-primary/10 text-sm font-bold text-primary">
                {page} / {totalPages}
              </div>
              <Button
                variant="ghost"
                className="rounded-full px-5 font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
