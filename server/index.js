import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { JSONDatabase } from './lib/database.js';
import { supabase, getProducts, getUsers, getOrders, createProduct, updateProduct, deleteProduct, seedDatabase } from '../lib/db.js';
// Removed Prisma import - using JSON database now
// import MpesaService from './lib/mpesa.js';
// import SMSService from './lib/sms.js';
// import EmailService from './lib/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Supabase client is imported from lib/db

// Initialize services (disabled for now - using JSON database)
// const mpesaService = new MpesaService();
// const smsService = new SMSService();
// const emailService = new EmailService();

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
  try {
    const { name, phone, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    // Create Supabase user using admin API (server-side with service role)
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: String(email).toLowerCase(),
      password: String(password),
      user_metadata: { name: String(name), phone: phone || null, role: 'customer' },
      email_confirm: true,
    });

    if (error) {
      console.error('Supabase createUser error:', error);
      return res.status(500).json({ message: 'Signup failed' });
    }

    // Generate a JWT for the app (optionally rely on Supabase session instead)
    const token = signToken({ id: created.user.id, email: created.user.email });
    return res.status(201).json({ token, user: created.user });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Signup failed' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).toLowerCase(),
      password: String(password),
    });

    if (error) {
      console.error('Supabase signIn error:', error);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const session = data.session;
    const user = data.user;
    return res.json({ token: session?.access_token, user });
  } catch (err) {
    console.error('Signin error:', err);
    return res.status(500).json({ message: 'Sign in failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const id = req.user && req.user.sub;
    if (!id) return res.status(401).json({ message: 'Unauthorized' });
  const { data, error } = await supabase.auth.getUserById(id);
  if (error) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: data.user });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update profile (name, phone) or change password
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { firstName, lastName, phone, currentPassword, newPassword } = req.body || {};

  const { data: user, error: getUserErr } = await supabase.auth.getUserById(userId);
  if (getUserErr || !user) return res.status(404).json({ message: 'User not found' });

    // If changing password, verify current password
    if (newPassword) {
  if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
  // Supabase doesn't expose password hashes; attempt to signIn to verify current password
  const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verifyErr) return res.status(401).json({ message: 'Current password is incorrect' });
  // Update password
  const { data: updated, error: updErr } = await supabase.auth.updateUser({ password: newPassword });
  if (updErr) return res.status(500).json({ message: 'Failed to update password' });
    }

    // Update name/phone
    const updates = {};
    if (firstName || lastName) {
      updates.name = [firstName || '', lastName || ''].filter(Boolean).join(' ').trim();
    }
    if (phone) updates.phone = phone;

    if (Object.keys(updates).length) {
      const { data: updated, error: updErr } = await supabase.auth.updateUser({ data: { name: updates.name, phone: updates.phone } });
      if (updErr) return res.status(500).json({ message: 'Failed to update profile' });
      return res.json({ success: true, user: updated.user });
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Password reset: request reset (sends token to email if SMTP configured)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const { data: userLookup } = await supabase.auth.getUserByEmail(String(email).toLowerCase());
    const user = userLookup.user;
    if (!user) {
      // respond success to avoid leaking existence
      return res.json({ ok: true, message: 'If a matching account exists, a reset email has been sent.' });
    }

    // Use Supabase to generate password reset link via admin API
    const { data: linkData, error: linkErr } = await supabase.auth.resetPasswordForEmail(String(email).toLowerCase(), {
      redirectTo: `${process.env.APP_URL || 'http://localhost:8080'}/auth/reset`
    });

    if (linkErr) console.error('Supabase reset password error:', linkErr);

    // Attempt to send email if SMTP configured (fallback)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        const resetUrl = `${process.env.APP_URL || 'http://localhost:8080'}/auth/reset?token=${resetToken}`;
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'no-reply@getdeals.co.ke',
          to: user.email,
          subject: 'Reset your password',
          text: `Reset your password using this link: ${resetUrl}`,
          html: `<p>Reset your password using this link: <a href="${resetUrl}">${resetUrl}</a></p>`
        });
      } catch (emailErr) {
        console.error('Failed to send reset email:', emailErr);
      }
    } else {
      console.log('Reset token for', user.email, resetToken);
    }

  return res.json({ ok: true, message: 'If a matching account exists, a reset email has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Failed to process request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const userId = payload.sub;
    const hash = await bcrypt.hash(String(password), 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return res.json({ ok: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
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
  try {
    const products = JSONDatabase.getAllProducts();
    return res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Failed to fetch products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const check = validateProductInput(req.body);
    if (!check.ok) return res.status(400).json({ message: 'Validation failed', errors: check.errors });
    
    const product = JSONDatabase.addProduct(check.value);
    if (!product) {
      return res.status(500).json({ message: 'Failed to create product' });
    }
    
    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    
    // Partial validation: allow updating provided fields only
    const allowed = ['name', 'price', 'originalPrice', 'image', 'discount', 'items', 'itemsDetail', 'category', 'description'];
    const updates = {};
    
    for (const key of allowed) {
      if (key in patch) {
        if (key === 'price' || key === 'originalPrice') {
          const num = Number(patch[key]);
          if (!Number.isFinite(num) || num < 0) return res.status(400).json({ message: `${key} must be a non-negative number` });
          updates[key] = num;
        } else if (key === 'items') {
          updates.items = Array.isArray(patch.items) ? patch.items.map(String) : undefined;
        } else if (key === 'itemsDetail') {
          if (patch.itemsDetail == null) {
            updates.itemsDetail = undefined;
          } else if (!Array.isArray(patch.itemsDetail)) {
            return res.status(400).json({ message: 'itemsDetail must be an array' });
          } else {
            updates.itemsDetail = patch.itemsDetail
              .filter((it) => it && typeof it === 'object')
              .map((it) => ({ name: String(it.name || ''), image: String(it.image || '') }))
              .filter((it) => it.name);
          }
        } else if (patch[key] == null) {
          updates[key] = undefined;
        } else {
          updates[key] = String(patch[key]);
        }
      }
    }
    
    const updatedProduct = JSONDatabase.updateProduct(id, updates);
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = JSONDatabase.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
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
