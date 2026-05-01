'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSettingsStore, formatCurrency } from '@/lib/settings-store';
import { Search, FileText, Eye } from 'lucide-react';

interface Invoice {
  id: number;
  invoiceNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user: { fullName: string };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { currency, fetchSettings } = useSettingsStore();

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices', {
        params: { search, page, limit: 20 },
      });
      if (data.success) {
        setInvoices(data.invoices);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, [search, page]);

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return { variant: 'success' as const, label: 'مكتملة' };
    return { variant: 'destructive' as const, label: 'ملغاة' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ar-SA');
  };

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">سجل الفواتير</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">عرض وإدارة فواتير المبيعات وطباعتها</p>
        </div>
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
              placeholder="ابحث برقم الفاتورة..."
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
                <th className="py-6 pr-10 pl-6 w-1/5">رقم الفاتورة</th>
                <th className="py-6 px-6">التاريخ</th>
                <th className="py-6 px-6">البائع</th>
                <th className="py-6 px-6">المبلغ</th>
                <th className="py-6 px-6">الدفع</th>
                <th className="py-6 px-6">الحالة</th>
                <th className="py-6 pl-10 pr-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
                      <p className="text-lg font-bold text-muted-foreground">جاري تحميل الفواتير...</p>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="mb-5 rounded-full bg-muted/50 p-6">
                        <FileText className="h-12 w-12 opacity-40" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">لا توجد فواتير</p>
                      <p className="mt-2 text-sm">لم يتم العثور على أي فاتورة مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const status = getStatusBadge(invoice.status);
                  return (
                    <tr key={invoice.id} className="group transition-colors hover:bg-muted/20">
                      <td className="py-5 pr-10 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                            <FileText className="h-6 w-6" />
                          </div>
                          <span className="font-mono text-lg font-black text-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 font-medium text-muted-foreground">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="py-5 px-6 font-bold text-foreground">
                        {invoice.user.fullName}
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xl font-black text-primary">
                          {formatCurrency(Number(invoice.total), currency)}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-medium text-muted-foreground">
                        {invoice.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة'}
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-bold shadow-sm ${
                          status.variant === 'success'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-5 pl-10 pr-6">
                        <div className="flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                          <Link href={`/invoices/${invoice.id}`}>
                            <button className="flex h-10 px-4 items-center justify-center gap-2 rounded-xl bg-secondary/80 text-secondary-foreground font-bold shadow-sm transition-all hover:scale-105 hover:bg-secondary">
                              <Eye className="h-4 w-4" />
                              عرض
                            </button>
                          </Link>
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
