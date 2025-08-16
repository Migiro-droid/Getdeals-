import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import prisma from './lib/prisma.js';
import MpesaService from './lib/mpesa.js';
import SMSService from './lib/sms.js';
import EmailService from './lib/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Initialize services
const mpesaService = new MpesaService();
const smsService = new SMSService();
const emailService = new EmailService();

app.use(cors());
app.use(express.json());

// Legacy file-based functions (for migration support)
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const productsFile = path.join(dataDir, 'products.json');
const productsSeedFile = path.join(dataDir, 'products.seed.json');

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));
}

function readUsers() {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  ensureDataFiles();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/auth/signup', async (req, res) => {
  const { name, phone, email, password } = req.body || {};
  if (!name || !phone || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  const users = readUsers();
  const exists = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const hash = await bcrypt.hash(String(password), 10);
  const user = {
    id: nanoid(),
    name: String(name),
    phone: String(phone),
    email: String(email).toLowerCase(),
    passwordHash: hash,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeUsers(users);

  const token = signToken(user);
  const { passwordHash, ...safe } = user;
  return res.status(201).json({ token, user: safe });
});

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
  const token = signToken(user);
  const { passwordHash, ...safe } = user;
  return res.json({ token, user: safe });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { passwordHash, ...safe } = user;
  return res.json({ user: safe });
});

// --- Products store helpers ---
function ensureProducts() {
  ensureDataFiles();
  if (!fs.existsSync(productsFile)) {
    // Start empty by default; admins can add manually or use the reset endpoint to load the seed.
    fs.writeFileSync(productsFile, JSON.stringify([], null, 2));
  }
}

function readProducts() {
  ensureProducts();
  try {
    return JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
  } catch {
    return [];
  }
}

function writeProducts(list) {
  ensureProducts();
  fs.writeFileSync(productsFile, JSON.stringify(list, null, 2));
}

function validateProductInput(body) {
  const errors = [];
  if (!body || typeof body !== 'object') errors.push('Invalid payload');
  const name = String(body?.name || '').trim();
  const image = String(body?.image || '').trim();
  const category = String(body?.category || '').trim();
  const price = Number(body?.price);
  if (!name) errors.push('name is required');
  if (!image) errors.push('image is required');
  if (!category) errors.push('category is required');
  if (!Number.isFinite(price) || price < 0) errors.push('price must be a non-negative number');
  if (errors.length) return { ok: false, errors };
  const originalPrice = body?.originalPrice != null ? Number(body.originalPrice) : undefined;
  const description = body?.description != null ? String(body.description) : undefined;
  const items = Array.isArray(body?.items) ? body.items.map(String) : undefined;
  let itemsDetail = undefined;
  if (Array.isArray(body?.itemsDetail)) {
    itemsDetail = body.itemsDetail
      .filter((it) => it && typeof it === 'object')
      .map((it) => ({ name: String(it.name || ''), image: String(it.image || '') }))
      .filter((it) => it.name);
  }
  return {
    ok: true,
    value: { name, image, category, price, originalPrice, description, items, itemsDetail }
  };
}

// --- Products API ---
app.get('/api/products', (req, res) => {
  const list = readProducts();
  return res.json(list);
});

app.post('/api/products', (req, res) => {
  const check = validateProductInput(req.body);
  if (!check.ok) return res.status(400).json({ message: 'Validation failed', errors: check.errors });
  const list = readProducts();
  const id = (String(check.value.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || nanoid());
  const exists = list.some(p => p.id === id);
  const finalId = exists ? `${id}-${nanoid(6)}` : id;
  const product = { id: finalId, ...check.value };
  const next = [product, ...list];
  writeProducts(next);
  return res.status(201).json(product);
});

app.patch('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const list = readProducts();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Product not found' });

  const patch = req.body || {};
  // Partial validation: allow updating provided fields only
  const allowed = ['name', 'price', 'originalPrice', 'image', 'discount', 'items', 'itemsDetail', 'category', 'description'];
  const updated = { ...list[idx] };
  for (const key of allowed) {
    if (key in patch) {
      if (key === 'price' || key === 'originalPrice') {
        const num = Number(patch[key]);
        if (!Number.isFinite(num) || num < 0) return res.status(400).json({ message: `${key} must be a non-negative number` });
        updated[key] = num;
      } else if (key === 'items') {
        updated.items = Array.isArray(patch.items) ? patch.items.map(String) : undefined;
      } else if (key === 'itemsDetail') {
        if (patch.itemsDetail == null) {
          updated.itemsDetail = undefined;
        } else if (!Array.isArray(patch.itemsDetail)) {
          return res.status(400).json({ message: 'itemsDetail must be an array' });
        } else {
          updated.itemsDetail = patch.itemsDetail
            .filter((it) => it && typeof it === 'object')
            .map((it) => ({ name: String(it.name || ''), image: String(it.image || '') }))
            .filter((it) => it.name);
        }
      } else if (patch[key] == null) {
        updated[key] = undefined;
      } else {
        updated[key] = String(patch[key]);
      }
    }
  }
  list[idx] = updated;
  writeProducts(list);
  return res.json(updated);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const list = readProducts();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Product not found' });
  list.splice(idx, 1);
  writeProducts(list);
  return res.status(204).send();
});

app.post('/api/products/reset', (req, res) => {
  try {
    const seed = fs.existsSync(productsSeedFile)
      ? JSON.parse(fs.readFileSync(productsSeedFile, 'utf-8'))
      : [];
    writeProducts(seed);
    return res.json({ ok: true, count: seed.length });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to reset products' });
  }
});

// --- M-Pesa Payment Endpoints ---
app.post('/api/payments/mpesa/initiate', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, amount, orderId } = req.body;
    
    if (!phoneNumber || !amount || !orderId) {
      return res.status(400).json({ message: 'Phone number, amount, and order ID are required' });
    }

    const result = await mpesaService.initiateSTKPush(phoneNumber, amount, orderId);
    
    if (result.success) {
      // Save transaction record
      await prisma.paymentTransaction.create({
        data: {
          orderId,
          transactionType: 'mpesa_stk',
          amount: Math.round(amount * 100), // Convert to cents
          status: 'pending',
          mpesaCheckoutRequestID: result.checkoutRequestId,
          mpesaPhone: phoneNumber,
          reference: orderId,
          description: 'GetDeals Order Payment',
        },
      });

      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('M-Pesa initiate error:', error);
    return res.status(500).json({ message: 'Payment initiation failed' });
  }
});

app.post('/api/payments/mpesa/callback', async (req, res) => {
  try {
    const callbackResult = mpesaService.processCallback(req.body);
    
    if (callbackResult.success) {
      // Update payment transaction
      await prisma.paymentTransaction.updateMany({
        where: { mpesaCheckoutRequestID: callbackResult.checkoutRequestId },
        data: {
          status: 'success',
          mpesaReceiptNumber: callbackResult.mpesaReceiptNumber,
          mpesaTransactionDate: callbackResult.transactionDate,
        },
      });

      // Update order status
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { mpesaCheckoutRequestID: callbackResult.checkoutRequestId },
      });

      if (transaction?.orderId) {
        const order = await prisma.order.update({
          where: { id: transaction.orderId },
          data: { 
            status: 'CONFIRMED',
            mpesaReceipt: callbackResult.mpesaReceiptNumber,
          },
          include: { items: true, user: true },
        });

        // Send SMS confirmation
        if (order.mpesaPhone) {
          await smsService.sendOrderConfirmationSMS(order.mpesaPhone, order);
        }

        // Send email confirmation
        if (order.user?.email) {
          await emailService.sendOrderConfirmation(order, order.user.email);
        }
      }
    } else {
      // Update payment as failed
      await prisma.paymentTransaction.updateMany({
        where: { mpesaCheckoutRequestID: callbackResult.checkoutRequestId },
        data: { status: 'failed' },
      });

      // Update order status
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { mpesaCheckoutRequestID: callbackResult.checkoutRequestId },
      });

      if (transaction?.orderId) {
        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: 'PAYMENT_FAILED' },
        });
      }
    }

    res.json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

app.get('/api/payments/mpesa/status/:checkoutRequestId', authMiddleware, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);
    res.json(result);
  } catch (error) {
    console.error('M-Pesa status query error:', error);
    res.status(500).json({ message: 'Status query failed' });
  }
});

// --- Orders API ---
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, deliveryMethod, deliveryAddress, paymentMethod, mpesaPhone } = req.body;
    const userId = req.user.sub;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'speedy' ? 200 : 0; // KES 200 for speedy delivery
    const total = subtotal + deliveryFee;

    // Generate order number
    const orderNumber = `GD${Date.now().toString().slice(-8)}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        subtotal: Math.round(subtotal * 100), // Convert to cents
        deliveryFee: Math.round(deliveryFee * 100),
        total: Math.round(total * 100),
        paymentMethod,
        mpesaPhone,
        deliveryMethod,
        deliveryAddress,
        items: {
          create: items.map(item => ({
            productId: item.id,
            name: item.name,
            price: Math.round(item.price * 100),
            quantity: item.quantity,
            image: item.image,
          })),
        },
      },
      include: { items: true, user: true },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// --- Admin Endpoints ---
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        city: true,
        country: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/admin/notifications/email', authMiddleware, async (req, res) => {
  try {
    const { userIds, subject, message } = req.body;
    
    let recipients;
    if (userIds && userIds.length > 0) {
      recipients = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { name: true, email: true },
      });
    } else {
      recipients = await prisma.user.findMany({
        select: { name: true, email: true },
      });
    }

    const results = await emailService.sendBulkEmail(recipients, subject, message);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ message: 'Failed to send emails' });
  }
});

app.post('/api/admin/notifications/sms', authMiddleware, async (req, res) => {
  try {
    const { userIds, message } = req.body;
    
    let recipients;
    if (userIds && userIds.length > 0) {
      recipients = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { name: true, phone: true },
      });
    } else {
      recipients = await prisma.user.findMany({
        select: { name: true, phone: true },
      });
    }

    const result = await smsService.sendBulkSMS(recipients, message);
    res.json(result);
  } catch (error) {
    console.error('Bulk SMS error:', error);
    res.status(500).json({ message: 'Failed to send SMS' });
  }
});

app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// --- Contact Form Endpoint ---
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required' });
    }

    const result = await emailService.sendContactFormEmail({ name, email, phone, subject, message });
    
    if (result.success) {
      res.json({ success: true, message: 'Your message has been sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to process contact form' });
  }
});

app.listen(PORT, () => {
  console.log(`GetDeals server listening on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'File-based (development)'}`);
});
