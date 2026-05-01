'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Search, Filter, LogIn, Plus, Edit, Trash2, X } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  entity: string | null;
  entityId: number | null;
  details: string | null;
  createdAt: string;
  user: { fullName: string } | null;
}

export default function AuditLogsPage() {
  const user = useAuthStore((state) => state.user);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchLogs = async () => {
    try {
      const params: any = { page, limit: 50 };
      if (filterAction) params.action = filterAction;
      if (filterDate) params.from = filterDate;

      const { data } = await api.get('/audit-logs', { params });
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [page, filterAction, filterDate, user]);

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: 'تسجيل دخول',
      CREATE_PRODUCT: 'إضافة منتج',
      UPDATE_PRODUCT: 'تعديل منتج',
      DELETE_PRODUCT: 'حذف منتج',
      CREATE_SALE: 'عملية بيع',
      CANCEL_SALE: 'إلغاء فاتورة',
      CREATE_COUPON: 'إضافة كوبون',
      UPDATE_COUPON: 'تعديل كوبون',
      DELETE_COUPON: 'حذف كوبون',
    };
    return labels[action] || action;
  };

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) return { variant: 'success' as const, icon: LogIn };
    if (action.includes('CREATE')) return { variant: 'success' as const, icon: Plus };
    if (action.includes('UPDATE')) return { variant: 'warning' as const, icon: Edit };
    if (action.includes('DELETE') || action.includes('CANCEL')) return { variant: 'destructive' as const, icon: Trash2 };
    return { variant: 'secondary' as const, icon: X };
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">عذراً، هذه الصفحة للمدير فقط</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">سجل العمليات</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">مراقبة وتتبع جميع نشاطات النظام والمستخدمين</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all">
        {/* Filters Bar */}
        <div className="border-b border-border/30 bg-muted/10 p-6 sm:p-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-xl mx-auto md:mx-0">
            <Filter className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              className="flex h-14 w-full rounded-full border border-border/50 bg-background/80 pl-6 pr-16 text-lg font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">كل العمليات</option>
              <option value="LOGIN">تسجيل دخول</option>
              <option value="CREATE_PRODUCT">إضافة منتج</option>
              <option value="UPDATE_PRODUCT">تعديل منتج</option>
              <option value="DELETE_PRODUCT">حذف منتج</option>
              <option value="CREATE_SALE">عملية بيع</option>
              <option value="CANCEL_SALE">إلغاء فاتورة</option>
              <option value="CREATE_COUPON">إضافة كوبون</option>
              <option value="UPDATE_COUPON">تعديل كوبون</option>
              <option value="DELETE_COUPON">حذف كوبون</option>
            </Select>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="h-14 w-full md:w-56 rounded-2xl border-border/50 bg-background/80 text-base font-bold shadow-sm"
            />

            <Button
              onClick={fetchLogs}
              className="h-14 rounded-2xl px-8 text-lg font-bold shadow-lg transition-all hover:scale-105 hover:shadow-primary/25"
            >
              <Search className="w-5 h-5 ml-2" />
              بحث
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                <th className="py-6 pr-10 pl-6 w-1/5">التاريخ</th>
                <th className="py-6 px-6">المستخدم</th>
                <th className="py-6 px-6">العملية</th>
                <th className="py-6 px-6">الكيان</th>
                <th className="py-6 pl-10 pr-6">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
                      <p className="text-lg font-bold text-muted-foreground">جاري تحميل سجل العمليات...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="mb-5 rounded-full bg-muted/50 p-6">
                        <Search className="h-12 w-12 opacity-40" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">لا توجد عمليات مسجلة</p>
                      <p className="mt-2 text-sm">لم يتم العثور على أي نشاط مطابق للبحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="group transition-colors hover:bg-muted/20">
                      <td className="py-5 pr-10 pl-6 text-muted-foreground font-medium">
                        {new Date(log.createdAt).toLocaleString('ar-SA')}
                      </td>
                      <td className="py-5 px-6 font-bold text-foreground">
                        {log.user?.fullName || '—'}
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold shadow-sm ${
                          badge.variant === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                          badge.variant === 'destructive' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                          badge.variant === 'warning' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          'bg-muted/50 text-muted-foreground border border-border/50'
                        }`}>
                          <badge.icon className="h-4 w-4" />
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-medium text-muted-foreground">
                        {log.entity || '—'}
                      </td>
                      <td className="py-5 pl-10 pr-6">
                        <span className="font-mono text-sm font-bold bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
                          {log.entityId ? `#${log.entityId}` : '—'}
                        </span>
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
