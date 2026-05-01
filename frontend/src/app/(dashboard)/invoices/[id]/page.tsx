'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Box, 
  Paper, 
  Typography, 
  Stack, 
  Divider, 
  Button,
  CircularProgress,
  Alert
} from '@mui/material';

interface InvoiceItem {
  id: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface InvoiceDiscount {
  id: number;
  type: string;
  amount: number;
  note: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user: { fullName: string };
  items: InvoiceItem[];
  discounts: InvoiceDiscount[];
  coupon: { code: string } | null;
}

interface Settings {
  shopName: string;
  shopAddress: string | null;
  shopPhone: string | null;
  currency: string;
  invoiceFooter: string | null;
}

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await api.get(`/invoices/${invoiceId}`);
        if (data.success) {
          setInvoice(data.invoice);
          setSettings(data.settings);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64vh' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">جاري التحميل...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
          {error || 'الفاتورة غير موجودة'}
        </Alert>
        <Button variant="contained" onClick={() => router.push('/invoices')}>
          العودة للقائمة
        </Button>
      </Box>
    );
  }

  const shopName = settings?.shopName || 'محل الأراكيل';
  const shopAddress = settings?.shopAddress || 'دمشق - سوريا';
  const shopPhone = settings?.shopPhone || '';
  const invoiceFooter = settings?.invoiceFooter || 'شكراً لزيارتكم';
  const currency = settings?.currency || 'SYP';

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }} className="print:hidden">
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          الفاتورة
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/invoices')}>
          العودة
        </Button>
      </Box>

      {/* Invoice Content */}
      <Box ref={printRef} sx={{ maxWidth: 420, mx: 'auto' }}>
        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
          {/* Shop Header */}
          <Stack spacing={0.5} sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {shopName}
            </Typography>
            {shopAddress && (
              <Typography variant="caption" color="text.secondary">
                {shopAddress}
              </Typography>
            )}
            {shopPhone && (
              <Typography variant="caption" color="text.secondary">
                {shopPhone}
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Invoice Info */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">رقم الفاتورة:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{invoice.invoiceNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">التاريخ:</Typography>
              <Typography variant="body2">{formatDate(invoice.createdAt)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">البائع:</Typography>
              <Typography variant="body2">{invoice.user.fullName}</Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Items Header */}
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="caption" sx={{ flex: 1, fontWeight: 'bold' }}>المنتج</Typography>
            <Typography variant="caption" sx={{ width: 40, textAlign: 'center', fontWeight: 'bold' }}>الكمية</Typography>
            <Typography variant="caption" sx={{ width: 60, textAlign: 'left', fontWeight: 'bold' }}>المجموع</Typography>
          </Box>

          {/* Items List */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            {invoice.items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex' }}>
                <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.productName}
                </Typography>
                <Typography variant="body2" sx={{ width: 40, textAlign: 'center' }}>{item.quantity}</Typography>
                <Typography variant="body2" sx={{ width: 60, textAlign: 'left' }}>
                  {Number(item.lineTotal).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Totals */}
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">المجموع:</Typography>
              <Typography variant="body2">{Number(invoice.subtotal).toLocaleString()}</Typography>
            </Box>
            
            {invoice.discounts && invoice.discounts.length > 0 && (
              <>
                {invoice.discounts.map((d) => (
                  <Box key={d.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="success.main">الخصم ({d.note || 'خصم'}):</Typography>
                    <Typography variant="body2" color="success.main">
                      -{Number(d.amount).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
            
            {invoice.discount > 0 && !invoice.coupon && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="success.main">الخصم:</Typography>
                <Typography variant="body2" color="success.main">
                  -{Number(invoice.discount).toLocaleString()}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>الإجمالي:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {Number(invoice.total).toLocaleString()} {currency}
              </Typography>
            </Box>
          </Stack>

          {/* Payment Method */}
          <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              طريقة الدفع: {invoice.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة'}
            </Typography>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {invoiceFooter}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Print Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }} className="print:hidden">
        <Button variant="contained" onClick={handlePrint} size="large" sx={{ px: 8 }}>
          طباعة الفاتورة
        </Button>
      </Box>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          [class*="MuiPaper"] {
            box-shadow: none !important;
            border: none !important;
          }
          [class*="MuiBox-root"] {
            background: transparent !important;
          }
        }
      `}</style>
    </Box>
  );
}
