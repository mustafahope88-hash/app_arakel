# نظام إدارة محل بيع الأراكيل والفيب

نظام ويب متكامل لإدارة المحل مع نقطة بيع (POS), فواتير حرارية, تقارير, وكوبونات خصم.

---

## التقنيات

| الطبقة | التقنية |
|--------|----------|
| Frontend | Next.js 14 + Tailwind CSS + RTL |
| Backend | Node.js + Express + TypeScript |
| Database | MySQL + Prisma ORM |
| Auth | JWT + bcrypt |

---

## المتطلبات

- Node.js 18+
- MySQL 8.x
- npm أو yarn

---

## تنصيب المشروع

### 1. Backend

```bash
cd backend
npm install
```

### 2. قاعدة البيانات

أنشئ قاعدة بيانات جديدة:

```sql
CREATE DATABASE arakel_db;
```

### 3..configure environment

```bash
cp .env.example .env
# عدل DATABASE_URL حسب إعدادات قاعدة البيانات
```

### 4. تطبيق المخطط

```bash
npm run db:push
# أو: npx prisma db push
```

### 5. بيانات أولية

```bash
npm run db:seed
# أو: npx prisma db seed
```

### 6. تشغيل Backend

```bash
npm run dev
# يعمل على http://localhost:3001
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
# يعمل على http://localhost:3000
```

---

## بيانات الدخول الافتراضية

| الدور | اسم المستخدم | كلمة المرور |
|-------|--------------|-------------|
| مدير | admin | admin123 |
| بائع | cashier | cashier123 |

---

## الواجهات

- `/login` - تسجيل الدخول
- `/dashboard` - لوحة التحكم
- `/pos` - نقطة البيع
- `/products` -المنتجات
- `/categories` - التصنيفات
- `/coupons` - الكوبونات
- `/invoices` -الفواتير
- `/invoices/[id]` - عرض/طباعة الفاتورة
- `/reports` -التقارير
- `/settings` -الإعدادات
- `/audit-logs` - سجل العمليات (مدير فقط)

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - بيانات المستخدم

### Products
- `GET /api/products` - قائمة المنتجات
- `POST /api/products` - إضافة منتج (مدير)
- `PUT /api/products/:id` - تعديل منتج (مدير)
- `DELETE /api/products/:id` - حذف منتج (مدير)

### Sales
- `POST /api/sales` - إتمام عملية البيع

### Invoices
- `GET /api/invoices` - قائمة الفواتير
- `GET /api/invoices/:id` - تفاصيل الفاتورة

### Reports
- `GET /api/reports/daily` - التقرير اليومي
- `GET /api/reports/monthly` -التقرير الشهري
- `GET /api/reports/low-stock` - المنتجات المنخفضة المخزون

### Coupons
- `GET /api/coupons` - قائمة الكوبونات
- `POST /api/coupons/validate` - التحقق من كود كوبون

---

## طباعة الفاتورة

الفاتورة مبنية للطباعة على طابعات حرارية 80mm:
- `@media print` مع `width: 80mm`
- دعم RTL الكامل
- بدون أزرار أو عناصر تحكم

---

## هيكل المشروع

```
app_arakel/
├── frontend/          # Next.js
│   └── src/
│       ├── app/      # الصفحات
│       └── lib/      # API + Stores
├── backend/           # Express
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       └── prisma/
├── SPEC.md          # مواصفات النظام
└── README.md        # هذا الملف
```

---

## الترخيص

MIT License