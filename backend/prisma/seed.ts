import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'المدير',
      role: 'admin',
    },
  });
  console.log('Admin user created:', admin.username);

  // Create cashier user
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashier = await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      passwordHash: cashierPassword,
      fullName: 'البائع',
      role: 'cashier',
    },
  });
  console.log('Cashier user created:', cashier.username);

  // Create categories
  const categories = [
    { name: 'معسلات', description: 'معسلات طبيعية وتركية' },
    { name: 'فحم', description: 'فحم طبيعى ومكبس' },
    { name: 'فيب', description: 'أجهزة فيبلكترونية' },
    { name: 'نكهات', description: 'سوائل نكهات الفيبر' },
    { name: 'إكسسوارات', description: 'خراطيم، رؤوس، مقاضٍ' },
    { name: 'تبغ', description: 'تبغ وطbacco' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
      },
    });
  }
  console.log('Categories created');

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      shopName: 'محل الأراكيل',
      shopAddress: 'العراق',
      shopPhone: '+964 770 000 0000',
      currency: 'IQD',
      taxPercent: 0,
      invoiceFooter: 'شكراً لزيارتكم',
    },
  });
  console.log('Settings created');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });