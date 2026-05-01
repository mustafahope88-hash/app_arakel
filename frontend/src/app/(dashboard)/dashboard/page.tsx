'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useSettingsStore, formatCurrency } from '@/lib/settings-store';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar,
  Paper,
  Grid
} from '@mui/material';
import { 
  AttachMoney as DollarSignIcon,
  Description as FileTextIcon,
  Inventory as PackageIcon,
  Warning as AlertTriangleIcon
} from '@mui/icons-material';
import { FileText, Package } from 'lucide-react';

interface Stats {
  todaySales: number;
  todayInvoices: number;
  totalProducts: number;
  lowStockProducts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    todayInvoices: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });
  const { currency, fetchSettings } = useSettingsStore();
  const router = useRouter();

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const statCards = [
    {
      title: 'مبيعات اليوم',
      subtitle: 'إجمالي مبيعات اليوم',
      value: formatCurrency(stats.todaySales, currency),
      icon: DollarSignIcon,
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      route: '/reports',
    },
    {
      title: 'فواتير اليوم',
      subtitle: 'عدد الفواتير المسجلة',
      value: stats.todayInvoices,
      icon: FileTextIcon,
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      route: '/invoices',
    },
    {
      title: 'إجمالي المنتجات',
      subtitle: 'المنتجات الفعالة',
      value: stats.totalProducts,
      icon: PackageIcon,
      color: '#ec4899',
      bgGradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      route: '/products',
    },
    {
      title: 'مخزون منخفض',
      subtitle: 'يحتاج متابعة',
      value: stats.lowStockProducts,
      icon: AlertTriangleIcon,
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      route: '/inventory',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            مرحباً بك في لوحة التحكم
          </Typography>
          <Typography variant="body1" color="text.secondary">
            نظرة عامة على نشاط المحل والإحصائيات الحديثة
          </Typography>
        </Box>
      </motion.div>

      {/* Modern Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              sx={{
                background: stat.bgGradient,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => router.push(stat.route)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <stat.icon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* Recent Activity Section */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            xl: 'repeat(2, 1fr)'
          },
          gap: 3
        }}
      >
        <Card sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            p: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
              <FileTextIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                آخر الفواتير
              </Typography>
              <Typography variant="body2" color="text.secondary">
                أحدث المعاملات المالية المسجلة
              </Typography>
            </Box>
          </Box>
          <CardContent sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 300
          }}>
            <Avatar sx={{ bgcolor: 'grey.100', width: 80, height: 80, mb: 2 }}>
              <FileTextIcon sx={{ fontSize: 40, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              لا توجد فواتير حديثة
            </Typography>
            <Typography variant="body2" color="text.secondary">
              قم بتسجيل عملية بيع جديدة لتظهر هنا
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            p: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
              <PackageIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                المنتجات الأكثر مبيعاً
              </Typography>
              <Typography variant="body2" color="text.secondary">
                إحصائيات المنتجات الأعلى طلباً هذا الشهر
              </Typography>
            </Box>
          </Box>
          <CardContent sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 300
          }}>
            <Avatar sx={{ bgcolor: 'grey.100', width: 80, height: 80, mb: 2 }}>
              <PackageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              لا توجد بيانات متاحة
            </Typography>
            <Typography variant="body2" color="text.secondary">
              سيتم تحديث القائمة مع توفر المبيعات
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
