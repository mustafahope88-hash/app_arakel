'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Search, Package, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';

interface InventoryMovement {
  id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  createdAt: string;
  product?: {
    id?: number;
    name?: string;
  } | null;
  productName?: string;
  productId?: number;
  user: {
    username: string;
  };
}

export default function InventoryPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovements = async () => {
    try {
      const { data } = await api.get('/inventory', {
        params: {
          search,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page,
          limit: 20,
        },
      });
      if (data.success) {
        setMovements(data.movements || []);

        const pages =
          data.pagination?.pages ??
          data.pagination?.totalPages ??
          1;

        setTotalPages(pages);
      }
    } catch (err) {
      console.error('Failed to fetch inventory movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [search, typeFilter, page]);

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'in':
        return { variant: 'success' as const, label: 'وارد', icon: ArrowUpCircle };
      case 'out':
        return { variant: 'destructive' as const, label: 'صادر', icon: ArrowDownCircle };
      case 'adjustment':
        return { variant: 'warning' as const, label: 'تسوية', icon: Package };
      default:
        return { variant: 'secondary' as const, label: type, icon: Package };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-lg font-bold text-muted-foreground">جاري تحميل حركات المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">حركات المخزون</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">تتبع جميع التعديلات والإضافات على مخزون المنتجات</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all">
        {/* Filters Bar */}
        <div className="border-b border-border/30 bg-muted/10 p-6 sm:p-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-xl mx-auto md:mx-0">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              type="text"
              className="h-14 w-full rounded-full border-border/50 bg-background/80 pl-6 pr-16 text-lg font-medium shadow-sm transition-all placeholder:text-muted-foreground focus-visible:ring-primary/50"
              placeholder="ابحث باسم المنتج..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Filter className="h-6 w-6" />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-14 w-full md:w-48 rounded-2xl border border-border/50 bg-background/80 px-3 py-2 text-base font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">جميع الحركات</option>
              <option value="in">وارد</option>
              <option value="out">صادر</option>
              <option value="adjustment">تسوية</option>
            </Select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                <th className="py-6 pr-10 pl-6 w-1/4">المنتج</th>
                <th className="py-6 px-6">النوع</th>
                <th className="py-6 px-6">الكمية</th>
                <th className="py-6 px-6">السبب</th>
                <th className="py-6 px-6">المستخدم</th>
                <th className="py-6 pl-10 pr-6">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="mb-5 rounded-full bg-muted/50 p-6">
                        <Package className="h-12 w-12 opacity-40" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">لا توجد حركات مخزون</p>
                      <p className="mt-2 text-sm">لم يتم العثور على أي بيانات مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                movements.map((movement) => {
                  const badge = getMovementBadge(movement.type);
                  const productName = movement.product?.name || movement.productName || `منتج رقم ${movement.productId || '-'}`;

                  return (
                    <tr key={movement.id} className="group transition-colors hover:bg-muted/20">
                      <td className="py-5 pr-10 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                            <Package className="h-6 w-6" />
                          </div>
                          <span className="font-bold text-lg text-foreground truncate max-w-xs">{productName}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold shadow-sm ${
                          badge.variant === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                          badge.variant === 'destructive' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          <badge.icon className="h-4 w-4" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-lg font-black shadow-sm ${
                          movement.type === 'in' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          movement.type === 'out' ? 'bg-destructive/10 text-destructive' :
                          'bg-muted/50 text-foreground'
                        }`}>
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-muted-foreground font-medium truncate max-w-xs">{movement.reason || '—'}</p>
                      </td>
                      <td className="py-5 px-6">
                        <span className="font-bold text-foreground bg-muted/40 px-3 py-1.5 rounded-lg">
                          {movement.user.username}
                        </span>
                      </td>
                      <td className="py-5 pl-10 pr-6 text-muted-foreground font-medium text-sm">
                        {new Date(movement.createdAt).toLocaleString('ar-SA')}
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
