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
      <Box sx={{ display: 'flex', height: '100%', gap: 3, flexDirection: { xs: 'column', md: 'row-reverse' } }}>
        
        {/* CART PANEL */}
        <Card sx={{ 
          width: { xs: '100%', md: 400 },
          flexShrink: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderRadius: 2,
          height: '100%',
          boxShadow: 2
        }}>
          {/* Compact Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            bgcolor: 'grey.50'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingBagIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>الطلبات</Typography>
            </Box>
            <Chip 
              label={`${items.length} منتج`} 
              size="small" 
              sx={{ height: 24, fontSize: '0.75rem', fontWeight: 'bold' }} 
            />
          </Box>

          {/* Cart Items - Scrollable Area */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
            {items.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                opacity: 0.5
              }}>
                <ShoppingBagIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">السلة فارغة</Typography>
              </Box>
            ) : (
              <Stack spacing={0.5}>
                {items.map((item) => (
                  <Paper 
                    key={item.productId} 
                    variant="outlined"
                    sx={{ 
                      p: 1,
                      borderRadius: 1.5,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Right Side - Product Info */}
                      <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }} noWrap>
                          {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            {formatCurrency(Number(item.price), currency)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            × {item.quantity}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Left Side - Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ButtonGroup size="small" sx={{ borderRadius: 1, '& .MuiButton-root': { minWidth: 28, width: 28, height: 28, p: 0 } }}>
                          <Button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <MinusIcon sx={{ fontSize: 16 }} />
                          </Button>
                          <Button disabled sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                            {item.quantity}
                          </Button>
                          <Button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <PlusIcon sx={{ fontSize: 16 }} />
                          </Button>
                        </ButtonGroup>
                        <IconButton 
                          onClick={() => removeItem(item.productId)}
                          size="small"
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light' }
                          }}
                        >
                          <Trash2Icon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>

          {/* Footer / Summary - Compact */}
          <Paper sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            px: 1.5,
            py: 1.5,
            flexShrink: 0,
            bgcolor: 'background.paper'
          }}>
            <Stack spacing={1}>
              {/* Subtotal & Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">المجموع الفرعي</Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(subtotal, currency)}
                </Typography>
              </Box>

              {/* Coupon Row */}
              {appliedCoupon ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  bgcolor: 'success.light',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TagIcon sx={{ color: 'success.main', fontSize: 14 }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {appliedCoupon.code} (-{formatCurrency(appliedCoupon.discount, currency)})
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={handleRemoveCoupon} sx={{ width: 20, height: 20, color: 'error.main' }}>
                    <XIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={applyingCoupon}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <TagIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ '& input': { textAlign: 'center', py: 0.5, borderRadius: 1, fontSize: '0.75rem' } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    size="small"
                    sx={{ borderRadius: 1, px: 1, minWidth: 60, fontSize: '0.75rem' }}
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
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PercentIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { min: 0, max: subtotal }
                  }}
                  sx={{ '& input': { textAlign: 'center', py: 0.5, borderRadius: 1, fontSize: '0.75rem' } }}
                />
              )}

              <Divider sx={{ my: 0 }} />

              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>الإجمالي</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {formatCurrency(total, currency)}
                </Typography>
              </Box>

              {/* Payment Methods */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  fullWidth
                  variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                  onClick={() => setPaymentMethod('cash')}
                  startIcon={<BanknoteIcon sx={{ fontSize: 16 }} />}
                  size="small"
                  sx={{ borderRadius: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  نقدي
                </Button>
                <Button
                  fullWidth
                  variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                  onClick={() => setPaymentMethod('card')}
                  startIcon={<CreditCardIcon sx={{ fontSize: 16 }} />}
                  size="small"
                  sx={{ borderRadius: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  بطاقة
                </Button>
              </Box>

              {message && (
                <Alert 
                  severity={message.includes('تم') ? 'success' : 'error'}
                  sx={{ borderRadius: 1, py: 0, fontSize: '0.75rem' }}
                >
                  {message}
                </Alert>
              )}

              {lastInvoiceId && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  sx={{ borderRadius: 1, py: 0.5, fontSize: '0.75rem' }}
                  onClick={() => router.push(`/invoices/${lastInvoiceId}`)}
                >
                  عرض الفاتورة
                </Button>
              )}

              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={handleCheckout}
                disabled={submitting || items.length === 0}
                sx={{ 
                  borderRadius: 1, 
                  py: 1,
                  fontSize: '0.875rem',
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
          p: 3,
          minHeight: 0
        }}>
          {/* Search Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="ابحث عن منتج بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
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
                    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${product.imageUrl}`
                    : null;
                  const isLowStock = product.stockQuantity <= (product.minStock || 5);

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 4 }} key={product.id}>
                      <Card
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          borderRadius: 3,
                          transition: 'all 0.2s',
                          border: 1,
                          borderColor: 'divider',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6,
                            borderColor: 'primary.main'
                          }
                        }}
                        onClick={() => handleAddToCart(product)}
                      >
                        {/* Image Area */}
                        <Box sx={{ 
                          position: 'relative',
                          height: 160,
                          overflow: 'hidden',
                          bgcolor: 'grey.50'
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
                                transition: 'transform 0.5s',
                                '&:hover': { transform: 'scale(1.08)' }
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
                            }}>
                              <ImageIcon sx={{ fontSize: 64, color: 'grey.300' }} />
                            </Box>
                          )}
                          
                          {/* Stock Badge */}
                          <Chip
                            label={product.stockQuantity}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: isLowStock ? 'error.main' : 'success.main',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </Box>

                        {/* Content Area */}
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.9rem' }}
                            noWrap
                          >
                            {product.name}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
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
