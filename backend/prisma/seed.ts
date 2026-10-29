import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@thewoman.ro' },
    update: {},
    create: {
      email: 'admin@thewoman.ro',
      name: 'Admin',
      password,
      role: 'ADMIN',
    },
  });

  const project = await prisma.project.upsert({
    where: { key: 'TW' },
    update: {},
    create: {
      name: 'theWoman Platform',
      key: 'TW',
      description: 'Primul proiect — platforma thewoman.ro',
      status: 'IN_PROGRESS',
      responsibleId: admin.id,
    },
  });

  await prisma.task.upsert({
    where: { id: 'seed-task-1' },
    update: {},
    create: {
      id: 'seed-task-1',
      title: 'Configurare proiect',
      description: 'Primul task generat de seed.',
      projectId: project.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      reporterId: admin.id,
      assignees: { connect: [{ id: admin.id }] },
    },
  });

  console.log('Seed complete!');
  console.log('  admin@thewoman.ro / password123 (ADMIN)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
