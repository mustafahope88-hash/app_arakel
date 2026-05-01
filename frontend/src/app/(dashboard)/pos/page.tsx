'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useSettingsStore, formatCurrency } from '@/lib/settings-store';
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
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Grid,
  Stack,
  InputAdornment,
  ButtonGroup,
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
        <Card sx={{ 
          width: 400, 
          flexShrink: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderRadius: 4
        }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            px: 3,
            py: 2.5,
            bgcolor: 'grey.50'
          }}>
            <Avatar sx={{ mb: 1.5, bgcolor: 'primary.light', width: 48, height: 48 }}>
              <ShoppingBagIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>الطلبات</Typography>
            <Typography variant="caption" color="text.secondary">{items.length} منتجات مضافة</Typography>
          </Box>

          {/* Cart Items - Scrollable Area */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2 }}>
            {items.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                opacity: 0.6
              }}>
                <Avatar sx={{ mb: 2, bgcolor: 'grey.100', width: 64, height: 64 }}>
                  <ShoppingBagIcon sx={{ fontSize: 32, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>السلة فارغة</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  قم بإضافة منتجات من القائمة لبدء البيع
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {items.map((item) => (
                  <Card 
                    key={item.productId} 
                    variant="outlined"
                    sx={{ 
                      position: 'relative',
                      borderRadius: 3,
                      p: 2.5,
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 2
                      }
                    }}
                  >
                    <IconButton
                      onClick={() => removeItem(item.productId)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: 8,
                        bgcolor: 'error.light',
                        color: 'error.main',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'white'
                        }
                      }}
                    >
                      <Trash2Icon fontSize="small" />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'semibold' }} noWrap>
                          {item.name}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 0.5 }}>
                          {formatCurrency(Number(item.price), currency)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ButtonGroup size="small" sx={{ borderRadius: 2 }}>
                          <Button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            sx={{ minWidth: 40, height: 40, fontSize: '1rem' }}
                          >
                            <MinusIcon />
                          </Button>
                          <Button disabled sx={{ minWidth: 48, fontWeight: 'bold', fontSize: '1rem' }}>
                            {item.quantity}
                          </Button>
                          <Button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            sx={{ minWidth: 40, height: 40, fontSize: '1rem' }}
                          >
                            <PlusIcon />
                          </Button>
                        </ButtonGroup>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                      <Chip 
                        label={`الإجمالي: ${formatCurrency(item.price * item.quantity, currency)}`}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          {/* Footer / Summary - Reduced Size */}
          <Paper sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            px: { xs: 2.5, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxShadow: '0 -10px 30px -10px rgba(0,0,0,0.1)'
          }}>
            <Stack spacing={1.5}>
              {/* Subtotal */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">المجموع الفرعي</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(subtotal, currency)}
                </Typography>
              </Box>
              
              {/* Coupon Row */}
              {appliedCoupon ? (
                <Paper sx={{ 
                  p: 1.5, 
                  bgcolor: 'success.light', 
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'success.main'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TagIcon sx={{ color: 'success.main', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {appliedCoupon.code}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        -{formatCurrency(appliedCoupon.discount, currency)}
                      </Typography>
                      <IconButton size="small" onClick={handleRemoveCoupon} sx={{ color: 'error.main', width: 24, height: 24 }}>
                        <XIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={applyingCoupon}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TagIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& input': { textAlign: 'center', py: 1, borderRadius: 2, fontSize: '0.875rem' } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    sx={{ borderRadius: 2, px: 2, minWidth: 90 }}
                  >
                    {applyingCoupon ? '...' : 'تطبيق'}
                  </Button>
                </Box>
              )}

              {/* Manual Discount */}
              {!appliedCoupon && (
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="خصم يدوي"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PercentIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, max: subtotal }}
                  sx={{ '& input': { textAlign: 'center', py: 1, borderRadius: 2, fontSize: '0.875rem' } }}
                />
              )}

              <Divider sx={{ my: 0.5 }} />

              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">الإجمالي المطلوب</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'extrabold', color: 'primary.main' }}>
                  {formatCurrency(total, currency)}
                </Typography>
              </Box>

              {/* Payment & Checkout */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                  onClick={() => setPaymentMethod('cash')}
                  startIcon={<BanknoteIcon />}
                  size="small"
                  sx={{ borderRadius: 2, py: 1 }}
                >
                  نقدي
                </Button>
                <Button
                  fullWidth
                  variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                  onClick={() => setPaymentMethod('card')}
                  startIcon={<CreditCardIcon />}
                  size="small"
                  sx={{ borderRadius: 2, py: 1 }}
                >
                  بطاقة
                </Button>
              </Box>

              {message && (
                <Alert 
                  severity={message.includes('تم') ? 'success' : 'error'}
                  sx={{ borderRadius: 2, py: 0 }}
                >
                  {message}
                </Alert>
              )}

              {lastInvoiceId && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  sx={{ borderRadius: 2, py: 1 }}
                  onClick={() => router.push(`/invoices/${lastInvoiceId}`)}
                >
                  عرض الفاتورة
                </Button>
              )}

              <Button
                variant="contained"
                fullWidth
                size="medium"
                onClick={handleCheckout}
                disabled={submitting || items.length === 0}
                sx={{ 
                  borderRadius: 2, 
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {submitting ? 'جاري التنفيذ...' : 'تأكيد الدفع'}
              </Button>
            </Stack>
          </Paper>
        </Card>

        {/* PRODUCTS AREA */}
        <Box sx={{ 
          flex: 1, 
          minWidth: 0, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 4,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: 1,
          p: 3
        }}>
          {/* Search Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="ابحث عن منتج بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                maxWidth: 600,
                '& input': { textAlign: 'center', fontSize: '1.1rem', borderRadius: 8, bgcolor: 'background.default' }
              }}
            />
          </Box>

          {/* Products Grid - Bigger Cards */}
          <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                gap: 2
              }}>
                <CircularProgress size={48} />
                <Typography variant="body1" color="text.secondary">جاري تحميل المنتجات...</Typography>
              </Box>
            ) : (
              <Grid container spacing={3.5}>
                {filteredProducts.map((product) => {
                  const imageSrc = product.imageUrl
                    ? product.imageUrl.startsWith('/uploads')
                      ? product.imageUrl
                      : product.imageUrl
                    : '';

                  const isLowStock = product.stockQuantity <= product.minStock;

                  return (
                    <Grid item xs={12} sm={6} md={6} lg={4} xl={4} key={product.id}>
                      <Card
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          borderRadius: 3,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.03)',
                            boxShadow: 8,
                            borderColor: 'primary.main'
                          }
                        }}
                        onClick={() => handleAddToCart(product)}
                      >
                        {/* Image Area - Bigger */}
                        <Box sx={{ 
                          position: 'relative',
                          height: 176,
                          overflow: 'hidden',
                          bgcolor: 'grey.100'
                        }}>
                          {imageSrc ? (
                            <Box
                              component="img"
                              src={imageSrc}
                              alt={product.name}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.7s',
                                '&:hover': { transform: 'scale(1.1)' }
                              }}
                              onError={(e: any) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              height: '100%',
                              bgcolor: 'grey.50'
                            }}>
                              <ImageIcon sx={{ fontSize: 80, color: 'grey.300' }} />
                            </Box>
                          )}
                          
                          {/* Stock Badge */}
                          <Chip
                            label={`المخزون: ${product.stockQuantity}`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: isLowStock ? 'error.main' : 'background.paper',
                              color: isLowStock ? 'white' : 'text.primary',
                              fontWeight: 'bold',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                        </Box>

                        {/* Content Area */}
                        <CardContent sx={{ textAlign: 'center', p: 3, pt: 2.5 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ fontWeight: 'bold', mb: 1.5, fontSize: '1.1rem' }}
                            noWrap
                          >
                            {product.name}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'extrabold', color: 'primary.main', fontSize: '1.25rem' }}>
                            {formatCurrency(Number(product.salePrice), currency)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
