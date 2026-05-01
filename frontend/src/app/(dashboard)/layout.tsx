'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Ticket,
  BarChart3,
  FileText,
  Receipt,
  Settings,
  ClipboardList,
  LogOut,
  Sun,
  Moon,
  Bell,
  User,
  ChevronDown,
  Menu,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

const navSections: NavSection[] = [
  {
    title: 'الرئيسية',
    items: [
      { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      { href: '/pos', label: 'نقطة البيع', icon: ShoppingCart },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { href: '/products', label: 'المنتجات', icon: Package },
      { href: '/categories', label: 'التصنيفات', icon: FolderOpen },
      { href: '/coupons', label: 'الكوبونات', icon: Ticket },
      { href: '/inventory', label: 'المخزون', icon: BarChart3 },
    ],
    collapsible: true,
  },
  {
    title: 'المالية',
    items: [
      { href: '/invoices', label: 'الفواتير', icon: Receipt },
      { href: '/reports', label: 'التقارير', icon: FileText },
    ],
    collapsible: true,
  },
  {
    title: 'النظام',
    items: [
      { href: '/settings', label: 'الإعدادات', icon: Settings },
      { href: '/audit-logs', label: 'سجل العمليات', icon: ClipboardList, adminOnly: true },
    ],
    collapsible: true,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, logout, initAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [checked, setChecked] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    initAuth().finally(() => setChecked(true));
  }, [initAuth]);

  useEffect(() => {
    if (checked && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [checked, isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getPageTitle = () => {
    for (let i = 0; i < navSections.length; i++) {
      const section = navSections[i];
      for (let j = 0; j < section.items.length; j++) {
        const item = section.items[j];
        if (pathname === item.href || pathname.startsWith(item.href + '/')) {
          return item.label;
        }
      }
    }
    return 'لوحة التحكم';
  };

  if (!checked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white" dir="rtl">
      {/* Sidebar - Fixed on RIGHT */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed right-0 top-0 z-50 h-screen bg-[#1e293b] border-l border-slate-700 overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold text-white">محل الأراكيل</h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3 hover:bg-slate-700 rounded-lg p-2 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fullName || user?.username || 'مستخدم'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.role === 'admin' ? 'مدير' : 'بائع'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-4 py-4 space-y-1 overflow-y-auto">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(item => !item.adminOnly || user?.role === 'admin');
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title}>
                {!isCollapsed && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-3">
                    {section.title}
                  </p>
                )}
                <div className="space-y-2">
                  {visibleItems.map((item) => {
                    const isActive = isItemActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-item flex items-center gap-3 rounded-xl text-sm transition-all duration-200 ${
                          isActive ? 'bg-blue-500 text-white shadow-md' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        } ${isCollapsed ? 'justify-center px-2 py-2' : 'justify-start px-3 py-2'}`}
                        title={isCollapsed ? item.label : undefined}
                        onClick={() => setMobileSidebarOpen(false)}
                      >
                        <item.icon className={`flex-shrink-0 w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-80'}`} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={handleLogout}
            className={`sidebar-item w-full text-red-400 hover:bg-red-900/20 group relative ${
              isCollapsed ? 'justify-center px-2 py-2' : 'justify-start px-3 py-2'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>تسجيل الخروج</span>}
            {isCollapsed && (
              <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                تسجيل الخروج
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 sticky top-0 z-40 bg-[#1e293b]/95 backdrop-blur-sm border-b border-slate-700">
          <section className="w-full flex justify-center">
            <div className="w-full max-w-[1200px] px-6 h-full flex items-center justify-between">
              {/* Left side - Mobile menu & Page title */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-white">
                  {getPageTitle()}
                </h1>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  {theme === 'light' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </Button>

                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700 relative"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>

                  {showNotifications && (
                    <div className="absolute left-0 mt-2 w-80 bg-[#1e293b] rounded-lg shadow-lg border border-slate-700 z-50">
                      <div className="p-4 border-b border-slate-700">
                        <h3 className="text-lg font-medium text-white">الإشعارات</h3>
                      </div>
                      <div className="p-4 text-center text-slate-400">
                        لا توجد إشعارات جديدة
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative mr-2">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 hover:bg-slate-700 rounded-lg p-2 transition-colors"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-white">
                        {user?.fullName || user?.username}
                      </p>
                      <p className="text-xs text-slate-400">
                        {user?.role === 'admin' ? 'مدير' : 'بائع'}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <ChevronDown className="hidden sm:block h-4 w-4 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute left-0 mt-2 w-52 bg-[#1e293b] rounded-lg shadow-lg border border-slate-700 z-50 overflow-hidden">
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-right text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        إظهار البروفايل
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-right text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center justify-between"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                      >
                        <span>تسجيل الخروج</span>
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </header>

        <main className="flex-1 py-6">
          <section className="w-full flex justify-center">
            <div className="w-full max-w-[1200px] px-6 space-y-6">
              {children}
            </div>
          </section>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
