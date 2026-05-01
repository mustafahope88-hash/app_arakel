'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useSettingsStore, formatCurrency } from '@/lib/settings-store';
import { DollarSign, FileText, Package, AlertTriangle, TrendingUp, Download } from 'lucide-react';

interface DashboardSummary {
  todaySales: number;
  todayInvoices: number;
  totalProducts: number;
  lowStockCount: number;
}

interface DailyReport {
  date: string;
  invoices: any[];
  summary: {
    totalSales: number;
    subtotal: number;
    discount: number;
    invoiceCount: number;
  };
}

interface MonthlyReport {
  month: string;
  summary: {
    totalSales: number;
    subtotal: number;
    discount: number;
    invoiceCount: number;
  };
  topProducts: any[];
}

interface LowStockProduct {
  id: number;
  name: string;
  stockQuantity: number;
  minStock: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'products' | 'stock'>('daily');
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const { currency, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSummary();
    fetchSettings();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/dashboard-summary');
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/daily', { params: { date } });
      if (data.success) {
        setDailyReport(data.report);
      }
    } catch (err) {
      console.error('Failed to fetch daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/monthly', { params: { month } });
      if (data.success) {
        setMonthlyReport(data.report);
      }
    } catch (err) {
      console.error('Failed to fetch monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/low-stock');
      if (data.success) {
        setLowStock(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch low stock:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'daily') fetchDailyReport();
    else if (tab === 'monthly') fetchMonthlyReport();
    else if (tab === 'stock') fetchLowStock();
  };

  const handleExportDaily = async (format: 'pdf' | 'xlsx') => {
    try {
      const response = await api.get('/reports/daily/export', {
        params: { date, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${date}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleExportMonthly = async (format: 'pdf' | 'xlsx') => {
    try {
      const response = await api.get('/reports/monthly/export', {
        params: { month, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${month}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const statCards = [
    { title: 'مبيعات اليوم', value: summary?.todaySales || 0, icon: DollarSign, gradient: 'from-blue-500 to-indigo-500' },
    { title: 'فواتير اليوم', value: summary?.todayInvoices || 0, icon: FileText, gradient: 'from-emerald-400 to-green-500' },
    { title: 'إجمالي المنتجات', value: summary?.totalProducts || 0, icon: Package, gradient: 'from-fuchsia-500 to-rose-400' },
    { title: 'مخزون منخفض', value: summary?.lowStockCount || 0, icon: AlertTriangle, gradient: 'from-orange-400 to-amber-500' },
  ];

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12 w-full space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">التقارير والإحصائيات</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">تحليل شامل للمبيعات والأداء والمخزون</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-l ${card.gradient} p-6 shadow-md transition-all hover:shadow-lg flex items-center h-36`}
          >
            <div className="flex justify-between items-center w-full h-full">
              {/* Right Side: Text (Because RTL) */}
              <div className="flex flex-col justify-center items-start text-right h-full">
                <span className="text-sm font-bold text-white mb-2">{card.title}</span>
                <span className="text-3xl font-bold text-white mb-1 whitespace-nowrap">
                  {card.title.includes('مبيعات') ? formatCurrency(card.value, currency) : card.value}
                </span>
                <span className="text-xs font-medium text-white/80">إحصائية {card.title}</span>
              </div>
              
              {/* Left Side: Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <card.icon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 p-2 bg-muted/30 rounded-[2rem] border border-border/50 w-fit">
        {[
          { key: 'daily', label: 'التقرير اليومي', icon: FileText },
          { key: 'monthly', label: 'التقرير الشهري', icon: DollarSign },
          { key: 'products', label: 'المنتجات الأكثر مبيعاً', icon: TrendingUp },
          { key: 'stock', label: 'تنبيهات المخزون', icon: AlertTriangle },
        ].map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            className={`rounded-2xl px-6 h-12 text-base font-bold transition-all ${
              activeTab === tab.key 
                ? 'shadow-lg shadow-primary/25 bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            onClick={() => handleTabChange(tab.key as typeof activeTab)}
          >
            <tab.icon className="w-5 h-5 ml-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content Wrapper */}
      <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-all">
        {/* Daily Report */}
        {activeTab === 'daily' && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-border/30">
              <div className="flex w-full md:w-auto items-center gap-3">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-14 w-full md:w-56 rounded-2xl border-border/50 bg-background/80 text-base font-bold shadow-sm"
                />
                <Button 
                  onClick={fetchDailyReport}
                  className="h-14 rounded-2xl px-8 text-lg font-bold shadow-lg transition-all hover:scale-105 hover:shadow-primary/25"
                >
                  عرض البيانات
                </Button>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => handleExportDaily('xlsx')}
                className="h-14 rounded-2xl px-6 text-lg font-bold shadow-sm transition-all hover:scale-105 w-full md:w-auto border border-border/50 bg-muted/50 hover:bg-muted"
              >
                <Download className="w-5 h-5 ml-2" />
                تصدير Excel
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
                <p className="text-lg font-bold text-muted-foreground">جاري تحميل التقرير...</p>
              </div>
            ) : dailyReport ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-primary mb-2">إجمالي المبيعات</p>
                    <p className="text-3xl font-black text-foreground">{formatCurrency(dailyReport.summary.totalSales, currency)}</p>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-destructive mb-2">الخصومات</p>
                    <p className="text-3xl font-black text-foreground">{formatCurrency(dailyReport.summary.discount, currency)}</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">الصافي</p>
                    <p className="text-3xl font-black text-foreground">{formatCurrency(dailyReport.summary.subtotal, currency)}</p>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">عدد الفواتير</p>
                    <p className="text-3xl font-black text-foreground">{dailyReport.summary.invoiceCount}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[2rem] border border-border/40 bg-background/50">
                  <table className="w-full text-right whitespace-nowrap">
                    <thead>
                      <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                        <th className="py-6 pr-8 pl-6">رقم الفاتورة</th>
                        <th className="py-6 px-6">البائع</th>
                        <th className="py-6 px-6">المبلغ</th>
                        <th className="py-6 px-6">الخصم</th>
                        <th className="py-6 px-6">الدفع</th>
                        <th className="py-6 pl-8 pr-6">الوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {dailyReport.invoices.map((inv: any) => (
                        <tr key={inv.id} className="group transition-colors hover:bg-muted/20">
                          <td className="py-5 pr-8 pl-6">
                            <span className="font-mono text-lg font-black text-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                              {inv.invoiceNumber}
                            </span>
                          </td>
                          <td className="py-5 px-6 font-bold text-foreground">{inv.user.fullName}</td>
                          <td className="py-5 px-6 font-black text-primary">{Number(inv.total).toLocaleString()}</td>
                          <td className="py-5 px-6 font-bold text-destructive">{Number(inv.discount).toLocaleString()}</td>
                          <td className="py-5 px-6 font-medium text-muted-foreground">{inv.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة'}</td>
                          <td className="py-5 pl-8 pr-6 text-sm font-medium text-muted-foreground">
                            {new Date(inv.createdAt).toLocaleTimeString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <FileText className="h-16 w-16 mb-6 opacity-40" />
                <p className="text-2xl font-bold text-foreground">اختر تاريخاً لعرض التقرير</p>
                <p className="mt-2 text-sm">حدد التاريخ من الأعلى واضغط على عرض البيانات</p>
              </div>
            )}
          </div>
        )}

        {/* Monthly Report */}
        {activeTab === 'monthly' && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-border/30">
              <div className="flex w-full md:w-auto items-center gap-3">
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-14 w-full md:w-56 rounded-2xl border-border/50 bg-background/80 text-base font-bold shadow-sm"
                />
                <Button 
                  onClick={fetchMonthlyReport}
                  className="h-14 rounded-2xl px-8 text-lg font-bold shadow-lg transition-all hover:scale-105 hover:shadow-primary/25"
                >
                  عرض البيانات
                </Button>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => handleExportMonthly('xlsx')}
                className="h-14 rounded-2xl px-6 text-lg font-bold shadow-sm transition-all hover:scale-105 w-full md:w-auto border border-border/50 bg-muted/50 hover:bg-muted"
              >
                <Download className="w-5 h-5 ml-2" />
                تصدير Excel
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
                <p className="text-lg font-bold text-muted-foreground">جاري تحميل التقرير...</p>
              </div>
            ) : monthlyReport ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-primary mb-2">إجمالي المبيعات</p>
                    <p className="text-3xl font-black text-foreground">{formatCurrency(monthlyReport.summary.totalSales, currency)}</p>
                  </div>
                  <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-destructive mb-2">الخصومات</p>
                    <p className="text-3xl font-black text-foreground">{formatCurrency(monthlyReport.summary.discount, currency)}</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">الصافي</p>
                    <p className="text-3xl font-black text-foreground">{formatCurrency(monthlyReport.summary.subtotal, currency)}</p>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl flex flex-col justify-center items-center text-center h-32">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">عدد الفواتير</p>
                    <p className="text-3xl font-black text-foreground">{monthlyReport.summary.invoiceCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6 mt-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-sm border border-amber-500/20">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground">أكثر المنتجات مبيعاً</h3>
                </div>
                
                <div className="overflow-x-auto rounded-[2rem] border border-border/40 bg-background/50">
                  <table className="w-full text-right whitespace-nowrap">
                    <thead>
                      <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                        <th className="py-6 pr-8 pl-6 w-1/2">المنتج</th>
                        <th className="py-6 px-6">الكمية المباعة</th>
                        <th className="py-6 pl-8 pr-6">إجمالي الإيرادات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {monthlyReport.topProducts.map((p: any, i: number) => (
                        <tr key={i} className="group transition-colors hover:bg-muted/20">
                          <td className="py-5 pr-8 pl-6 font-bold text-lg text-foreground">{p.name}</td>
                          <td className="py-5 px-6 font-black text-primary text-xl">{p.quantity}</td>
                          <td className="py-5 pl-8 pr-6 font-bold text-foreground">
                            <span className="bg-muted/30 px-4 py-2 rounded-xl border border-border/50">
                              {formatCurrency(p.total, currency)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <DollarSign className="h-16 w-16 mb-6 opacity-40" />
                <p className="text-2xl font-bold text-foreground">اختر شهراً لعرض التقرير</p>
                <p className="mt-2 text-sm">حدد الشهر من الأعلى واضغط على عرض البيانات</p>
              </div>
            )}
          </div>
        )}

        {/* Top Products View */}
        {activeTab === 'products' && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <TrendingUp className="h-16 w-16 mb-6 opacity-40" />
              <p className="text-2xl font-bold text-foreground">المنتجات الأكثر مبيعاً</p>
              <p className="mt-2 text-sm">يرجى الذهاب للتقرير الشهري لرؤية هذه الإحصائيات</p>
              <Button 
                onClick={() => setActiveTab('monthly')} 
                className="mt-8 rounded-full px-8"
              >
                الذهاب للتقرير الشهري
              </Button>
            </div>
          </div>
        )}

        {/* Low Stock */}
        {activeTab === 'stock' && (
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-sm border border-destructive/20">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">تنبيهات المخزون المنخفض</h3>
                <p className="text-sm font-medium text-muted-foreground">المنتجات التي تحتاج إلى إعادة طلب عاجلة</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
                <p className="text-lg font-bold text-muted-foreground">جاري فحص المخزون...</p>
              </div>
            ) : lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="mb-6 rounded-full bg-green-500/10 p-6 border border-green-500/20">
                  <Package className="h-16 w-16 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">المخزون في حالة ممتازة</p>
                <p className="mt-2 text-sm">لا توجد منتجات تحت الحد الأدنى حالياً</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[2rem] border border-border/40 bg-background/50">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="bg-muted/30 text-sm font-semibold text-muted-foreground">
                      <th className="py-6 pr-8 pl-6 w-1/3">المنتج</th>
                      <th className="py-6 px-6">المخزون الحالي</th>
                      <th className="py-6 px-6">الحد الأدنى المطلوب</th>
                      <th className="py-6 pl-8 pr-6 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {lowStock.map((p) => (
                      <tr key={p.id} className="group transition-colors hover:bg-muted/20">
                        <td className="py-5 pr-8 pl-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10">
                              <Package className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-lg text-foreground">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-2xl font-black text-destructive bg-destructive/10 px-4 py-1.5 rounded-xl border border-destructive/20 inline-block">
                            {p.stockQuantity}
                          </span>
                        </td>
                        <td className="py-5 px-6 font-bold text-muted-foreground text-lg">{p.minStock}</td>
                        <td className="py-5 pl-8 pr-6 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold shadow-sm bg-destructive text-destructive-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            إعادة طلب عاجل
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
