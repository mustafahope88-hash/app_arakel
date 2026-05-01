'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useSettingsStore, formatCurrency, getCurrencySymbol } from '@/lib/settings-store';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Badge,
  CircularProgress,
  Alert,
  Divider,
  ButtonGroup,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as PlusIcon,
  Remove as MinusIcon,
  CreditCard as CreditCardIcon,
  Money as BanknoteIcon,
  Close as XIcon,
  ShoppingBag as ShoppingBagIcon,
  Image as ImageIcon,
  Delete as Trash2Icon,
  LocalOffer as TagIcon,
  Percent as PercentIcon
} from '@mui/icons-material';

interface Product {
  id: number;
  name: string;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  imageUrl: string | null;
}

interface AppliedCoupon {
  id: number;
  code: string;
  type: string;
  value: number;
  discount: number;
}

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [lastInvoiceId, setLastInvoiceId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const { fetchSettings, currency } = useSettingsStore();

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products', { params: { limit: 100 } });
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setMessage('');

    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal: getSubtotal(),
      });

      if (data.success && data.valid) {
        setAppliedCoupon({
          id: data.coupon.id,
          code: data.coupon.code,
          type: data.coupon.type,
          value: data.coupon.value,
          discount: data.discount,
        });
        setDiscount(data.discount);
        setMessage(`تم تطبيق الكوبون: -${formatCurrency(data.discount, currency)}`);
      } else {
        setMessage(data.message || 'كوبون غير صالح');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'خطأ في التحقق من الكوبون');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setDiscount(0);
  };

  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      setMessage('غير متوفر بالمخزون');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.salePrice),
      imageUrl: product.imageUrl,
    });

    setMessage(`تم إضافة ${product.name} للسلة`);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setMessage('السلة فارغة');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const payload = {
        products: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        discount,
        paymentMethod,
        couponId: appliedCoupon?.id || null,
      };

      const { data } = await api.post('/sales', payload);

      if (data.success) {
        setLastInvoiceId(data.invoice.id);
        setMessage(`تم إتمام البيع! رقم الفاتورة: ${data.invoice.invoiceNumber}`);

        if (appliedCoupon) {
          setAppliedCoupon(null);
          setCouponCode('');
        }

        clearCart();
      } else {
        setMessage(data.message || 'خطأ في إتمام البيع');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'خطأ في إتمام البيع');
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) && p.stockQuantity > 0
  );

  const subtotal = getSubtotal();
  const total = getTotal();

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', p: { xs: 2, sm: 3 }, direction: 'rtl' }}>
      <Box sx={{ display: 'flex', height: '100%', gap: 3, flexDirection: 'row-reverse' }}>
        
        {/* CART PANEL */}
        <Card sx={{ width: 440, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            px: 4,
            py: 3,
            bgcolor: 'grey.50'
          }}>
            <Avatar sx={{ mb: 2, bgcolor: 'primary.light' }}>
              <ShoppingBagIcon />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>الطلبات</Typography>
            <Typography variant="body2" color="text.secondary">{items.length} منتجات مضافة</Typography>
          </Box>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                <div className="mb-5 rounded-full bg-muted p-6">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold text-foreground">السلة فارغة</p>
                <p className="mt-2 text-sm text-muted-foreground">قم بإضافة منتجات من القائمة لبدء البيع</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/40 bg-background p-5 text-center shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive opacity-80 transition-all hover:bg-destructive hover:text-white hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="w-full px-6">
                      <h3 className="truncate text-base font-bold text-foreground">{item.name}</h3>
                      <p className="mt-1 text-lg font-extrabold text-primary">
                        {formatCurrency(Number(item.price), currency)}
                      </p>
                    </div>

                    <div className="flex w-full flex-col items-center gap-3">
                      <div className="flex items-center rounded-full border border-border/50 bg-muted/30 p-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform hover:scale-105 hover:text-primary active:scale-95"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center text-base font-bold text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <p className="rounded-lg bg-muted/50 px-4 py-1.5 text-sm font-bold text-foreground">
                        الإجمالي: {formatCurrency(item.price * item.quantity, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Summary */}
          <div className="z-10 rounded-t-[2rem] border-t border-border/40 bg-card p-6 text-center shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.3)]">
            <div className="mb-5 space-y-4">
              {/* Subtotal */}
              <div className="flex flex-col items-center justify-center gap-1 text-sm font-medium">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(subtotal, currency)}</span>
              </div>
              
              {/* Coupon Row */}
              {appliedCoupon ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{appliedCoupon.code}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-green-600 dark:text-green-400">
                      -{formatCurrency(appliedCoupon.discount, currency)}
                    </span>
                    <button onClick={handleRemoveCoupon} className="rounded-full bg-destructive/10 p-1.5 text-destructive transition-transform hover:scale-110 hover:bg-destructive hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full">
                    <Tag className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      className="h-12 w-full text-center rounded-xl border-border/50 bg-muted/20 px-10 text-base font-medium focus-visible:ring-primary/50"
                      placeholder="كود الخصم"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={applyingCoupon}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="h-12 w-full rounded-xl font-bold"
                  >
                    {applyingCoupon ? '...' : 'تطبيق الكود'}
                  </Button>
                </div>
              )}

              {/* Manual Discount */}
              {!appliedCoupon && (
                <div className="relative w-full pt-2">
                  <Percent className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground mt-1" />
                  <Input
                    type="number"
                    className="h-12 w-full text-center rounded-xl border-border/50 bg-muted/20 px-10 text-base font-medium focus-visible:ring-primary/50"
                    placeholder="خصم يدوي"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max={subtotal}
                  />
                </div>
              )}

              {/* Total */}
              <div className="flex flex-col items-center justify-center border-t border-border/40 pt-4">
                <span className="mb-1 text-base font-bold text-muted-foreground">الإجمالي المطلوب</span>
                <span className="text-4xl font-black tracking-tight text-primary">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>

            {/* Payment & Checkout */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/30 bg-muted/30 p-1.5">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-background text-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  نقدي
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-background text-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  بطاقة
                </button>
              </div>

              {message && (
                <div
                  className={`animate-in fade-in zoom-in rounded-xl border p-3 text-center text-sm font-bold duration-300 ${
                    message.includes('تم')
                      ? 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'border-destructive/20 bg-destructive/10 text-destructive'
                  }`}
                >
                  {message}
                </div>
              )}

              {lastInvoiceId && (
                <Button
                  variant="outline"
                  className="h-14 w-full rounded-2xl border-primary/30 text-base font-bold text-primary hover:bg-primary/5"
                  onClick={() => router.push(`/invoices/${lastInvoiceId}`)}
                >
                  عرض الفاتورة
                </Button>
              )}

              <Button
                className="relative h-16 w-full overflow-hidden rounded-2xl text-xl font-black shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary/25 disabled:pointer-events-none disabled:opacity-50"
                onClick={handleCheckout}
                disabled={submitting || items.length === 0}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80" />
                <span className="relative z-10 flex items-center justify-center gap-2 text-primary-foreground">
                  {submitting ? 'جاري التنفيذ...' : 'تأكيد الدفع'}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* PRODUCTS AREA */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-card/40 p-6 shadow-sm backdrop-blur-sm">
          {/* Search Header */}
          <div className="mb-6 flex items-center justify-center">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                className="h-14 w-full rounded-full border-border/50 bg-background/80 text-center text-lg font-medium shadow-sm transition-all placeholder:text-muted-foreground focus-visible:ring-primary/50"
                placeholder="ابحث عن منتج بالاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide px-2">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-xl font-medium text-muted-foreground">جاري تحميل المنتجات...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const imageSrc = product.imageUrl
                    ? product.imageUrl.startsWith('/uploads')
                      ? product.imageUrl
                      : product.imageUrl
                    : '';

                  const isLowStock = product.stockQuantity <= product.minStock;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border/40 bg-card text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl"
                    >
                      {/* Image Area */}
                      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        
                        {/* Add Icon on Hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <div className="translate-y-4 rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-transform duration-300 group-hover:translate-y-0">
                            <Plus className="h-8 w-8" />
                          </div>
                        </div>

                        {/* Stock Badge */}
                        <div className="absolute left-3 top-3">
                          <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold backdrop-blur-md ${
                            isLowStock 
                              ? 'bg-destructive/90 text-white shadow-sm' 
                              : 'bg-background/90 text-foreground shadow-sm'
                          }`}>
                            المخزون: {product.stockQuantity}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex flex-1 flex-col items-center justify-center p-5 text-center">
                        <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                          {product.name}
                        </h3>
                        <div className="mt-3">
                          <span className="text-xl font-black text-primary">
                            {formatCurrency(Number(product.salePrice), currency)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}