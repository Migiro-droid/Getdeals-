import fs from 'fs';
import path from 'path';

// Load .env manually (simple parser) so Prisma picks up DATABASE_URL
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq === -1) return;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    process.env[key] = value;
  });
}

try {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(users, null, 2));

  await prisma.$disconnect();
} catch (err) {
  console.error('Error listing users:', err);
  process.exit(1);
}
