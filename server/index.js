import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { supabase } from "./lib/db.js";
import MpesaService from './lib/mpesa.js';
import SMSService from './lib/sms.js';
import EmailService from './lib/email.js';
import ReceiptService from './lib/receipt.js';
import NotificationService from './lib/notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables. Please add it to the .env file.');
  process.exit(1);
}

// Supabase client is imported from lib/db

// Initialize services
const mpesaService = new MpesaService();
const smsService = new SMSService();
const emailService = new EmailService();
const receiptService = new ReceiptService();
const notificationService = new NotificationService();

app.use(cors());
app.use(express.json());

// API routes
// app.use('/api/mpesa', mpesaRoutes); // Removed - routes are defined individually below

// Legacy file-based functions (for migration support)
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

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
    // Use Supabase auth for password reset instead of Prisma
    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) {
      console.error('Supabase password update error:', error);
      return res.status(500).json({ message: 'Failed to reset password' });
    }
    return res.json({ ok: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

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
app.get('/api/products', async (req, res) => {
  try {
    // Use direct Supabase admin client for products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase products fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }

    return res.json(products || []);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ message: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const check = validateProductInput(req.body);
    if (!check.ok) return res.status(400).json({ message: 'Validation failed', errors: check.errors });

    // Parse additional fields
    const discount = req.body?.discount != null ? parseInt(req.body.discount) : null;
    const inStock = req.body?.inStock !== undefined ? Boolean(req.body.inStock) : true;
    const featured = req.body?.featured !== undefined ? Boolean(req.body.featured) : false;
    
    // Prepare product data for Supabase
    const now = new Date().toISOString();
    const productData = {
      name: check.value.name,
      price: parseInt(check.value.price),
      originalPrice: check.value.originalPrice ? parseInt(check.value.originalPrice) : null,
      image: check.value.image,
      discount: discount,
      items: check.value.items || [],
      itemsDetail: check.value.itemsDetail || null,
      category: check.value.category,
      description: check.value.description || null,
      inStock: inStock,
      featured: featured,
      createdAt: now,
      updatedAt: now
    };

    // Create product in Supabase
    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Supabase product creation error:', error);
      return res.status(500).json({ message: 'Failed to create product', error: error.message });
    }

    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    
    // Partial validation: allow updating provided fields only
    const allowed = ['name', 'price', 'originalPrice', 'image', 'discount', 'items', 'itemsDetail', 'category', 'description', 'inStock', 'featured'];
    const updates = {};
    
    for (const key of allowed) {
      if (key in patch) {
        if (key === 'price' || key === 'originalPrice' || key === 'discount') {
          const num = parseInt(patch[key]);
          if (!Number.isFinite(num) || num < 0) return res.status(400).json({ message: `${key} must be a non-negative number` });
          updates[key] = num;
        } else if (key === 'items') {
          updates.items = Array.isArray(patch.items) ? patch.items.map(String) : [];
        } else if (key === 'itemsDetail') {
          if (patch.itemsDetail == null) {
            updates.itemsDetail = null;
          } else if (!Array.isArray(patch.itemsDetail)) {
            return res.status(400).json({ message: 'itemsDetail must be an array' });
          } else {
            updates.itemsDetail = patch.itemsDetail
              .filter((it) => it && typeof it === 'object')
              .map((it) => ({ name: String(it.name || ''), image: String(it.image || '') }))
              .filter((it) => it.name);
          }
        } else if (key === 'inStock' || key === 'featured') {
          updates[key] = Boolean(patch[key]);
        } else if (patch[key] == null) {
          updates[key] = null;
        } else {
          updates[key] = String(patch[key]);
        }
      }
    }
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    // Update product in Supabase
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase product update error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(500).json({ message: 'Failed to update product', error: error.message });
    }

    return res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Delete product from Supabase
    const { data: deletedProduct, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase product deletion error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(500).json({ message: 'Failed to delete product', error: error.message });
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
app.post('/api/payments/mpesa/initiate', async (req, res) => {
  try {
    let { phoneNumber, amount, orderReference } = req.body || {};
    console.log('MPesa initiate called with body:', JSON.stringify(req.body));

    if (!phoneNumber || !amount || !orderReference) {
      console.error('MPesa initiate missing fields', { phoneNumber, amount, orderReference });
      return res.status(400).json({ message: 'Phone number, amount, and order ID are required' });
    }

    const accessToken = await mpesaService.getAccessToken({
      username: process.env.MPESA_CONSUMER_KEY,
      password: process.env.MPESA_CONSUMER_SECRET
    })
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
        const passkey = process.env.MPESA_PASSKEY
        const shortcode = process.env.MPESA_SHORTCODE
        const str = `${shortcode}${passkey}${timestamp}`
    let password = Buffer.from(str).toString('base64')

    let payload = {
      BusinessShortCode: Number(shortcode),
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Number(amount),
      PartyA: Number(phoneNumber),
      PartyB: Number(shortcode),
      PhoneNumber: Number(phoneNumber),
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: String(orderReference),
      TransactionDesc: 'GetDealsPayment'
    }
    let response = await mpesaService.pay(accessToken, payload)
    return res.status(200).json(response)
  } catch (error) {
    console.error('M-Pesa initiate error:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Payment initiation failed' });
  }
});

// Add the stk-push endpoint that the frontend is calling
app.post('/api/payments/mpesa/stk-push', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, amount, orderReference, description } = req.body;

    if (!phoneNumber || !amount || !orderReference) {
      return res.status(400).json({ success: false, error: 'Phone number, amount, and order reference are required' });
    }

    const result = await mpesaService.initiateSTKPush(phoneNumber, amount, orderReference, description);

    if (result.success) {
      // Save transaction record to Supabase
      const { error } = await supabase
        .from('payments')
        .insert({
          order_id: orderReference,
          amount: Math.round(amount),
          method: 'mpesa',
          status: 'pending',
          phone_number: phoneNumber,
          reference: orderReference,
          transaction_id: result.checkoutRequestId,
        });

      if (error) {
        console.error('Error saving payment record:', error);
      }

      return res.json({
        success: true,
        CheckoutRequestID: result.checkoutRequestId,
        MerchantRequestID: result.merchantRequestId,
        ResponseCode: result.responseCode,
        ResponseDescription: result.responseDescription,
        CustomerMessage: result.customerMessage
      });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('M-Pesa stk-push error:', error);
    return res.status(500).json({ success: false, error: 'Payment initiation failed' });
  }
});

app.post('/api/payments/mpesa/callback', async (req, res) => {
  try {
    const callbackResult = mpesaService.processCallback(req.body);
    console.log(`--- M-Pesa Callback Received ---`, callbackResult)

    if (callbackResult.success) {
      // Update payment transaction in Supabase
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          transaction_id: callbackResult.mpesaReceiptNumber,
          processed_at: new Date().toISOString(),
        })
        .eq('transaction_id', callbackResult.checkoutRequestId);

      if (updateError) {
        console.error('Error updating payment:', updateError);
      }

      // Get the payment record to find the order
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('transaction_id', callbackResult.checkoutRequestId)
        .single();

      if (payment?.order_id) {
        // Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'CONFIRMED',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.order_id);

        if (orderError) {
          console.error('Error updating order:', orderError);
        }

        // Get order details for notifications
        const { data: order } = await supabase
          .from('orders')
          .select(`
            *,
            user:users(*),
            items:order_items(*, product:products(*))
          `)
          .eq('id', payment.order_id)
          .single();

        if (order) {
          // Send comprehensive payment confirmation (SMS + E-receipt)
          try {
            const paymentDetails = {
              paymentMethod: 'M-Pesa',
              transactionId: callbackResult.mpesaReceiptNumber,
              paymentDate: new Date().toISOString()
            };

            const notificationResult = await notificationService.sendPaymentConfirmation(order, paymentDetails);
            
            if (notificationResult.success) {
              console.log(`✅ Payment confirmation notifications sent for order ${order.id}`);
            } else {
              console.error(`❌ Some payment confirmation notifications failed for order ${order.id}:`, notificationResult.error);
            }

            // Log detailed notification results
            console.log('📊 Notification Results:', JSON.stringify(notificationResult.notifications, null, 2));

          } catch (notificationError) {
            console.error('❌ Failed to send payment confirmation notifications:', notificationError);
            
            // Fallback to basic SMS if notification service fails
            if (order.mpesa_phone) {
              try {
                const basicMessage = `Payment confirmed! Order #${order.id} for KES ${(order.total / 100).toLocaleString()}. Thank you for shopping with GetDeals!`;
                await smsService.sendSMS(order.mpesa_phone, basicMessage);
                console.log(`✅ Fallback SMS sent to ${order.mpesa_phone}`);
              } catch (fallbackError) {
                console.error('❌ Even fallback SMS failed:', fallbackError);
              }
            }
          }
        }
      }
    } else {
      // Update payment as failed
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          failure_reason: callbackResult.error,
          processed_at: new Date().toISOString(),
        })
        .eq('transaction_id', callbackResult.checkoutRequestId);

      if (error) {
        console.error('Error updating failed payment:', error);
      }

      // Update order status to failed
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('transaction_id', callbackResult.checkoutRequestId)
        .single();

      if (payment?.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'PAYMENT_FAILED',
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.order_id);
      }
    }

    res.json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('M-Pesa callback error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

app.get('/api/payments/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);

    if (result.success) {
      return res.json({
        success: true,
        status: result.resultCode === 0 ? 'completed' : 'failed',
        ResultCode: result.resultCode,
        ResultDesc: result.resultDesc,
        CheckoutRequestID: checkoutRequestId
      });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('M-Pesa status query error:', error);
    res.status(500).json({ message: 'Status query failed' });
  }
});

// Add the query endpoint that the frontend is calling
app.get('/api/payments/mpesa/query/:checkoutRequestId', authMiddleware, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);

    if (result.success) {
      return res.json({
        success: true,
        status: result.resultCode === 0 ? 'completed' : 'failed',
        ResultCode: result.resultCode,
        ResultDesc: result.resultDesc,
        CheckoutRequestID: checkoutRequestId
      });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('M-Pesa query error:', error);
    res.status(500).json({ success: false, error: 'Status query failed' });
  }
});

// --- Orders API ---
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, deliveryMethod, deliveryAddress, paymentMethod, mpesaPhone, orderReference } = req.body;
    const userId = req.user.sub;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'speedy' ? 200 : 0; // KES 200 for speedy delivery
    const total = subtotal + deliveryFee;

    // Generate order number
    const orderNumber = `GD${Date.now().toString().slice(-8)}`;

    // Create order in Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total: Math.round(total),
        subtotal: Math.round(subtotal),
        delivery_fee: Math.round(deliveryFee),
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        delivery_date: null,
        notes: null,
        address_id: null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ message: 'Failed to create order' });
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: Math.round(item.price),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      return res.status(500).json({ message: 'Failed to create order items' });
    }

    // If this is an M-Pesa payment, update the payment record with the actual order ID
    if (paymentMethod === 'mpesa' && orderReference) {
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({ order_id: order.id })
        .eq('reference', orderReference)
        .eq('status', 'pending'); // Only update pending payments to avoid race conditions

      if (paymentUpdateError) {
        console.error('Error updating payment record:', paymentUpdateError);
        // Don't fail the order creation for this, just log it
      }
    }

    // Get complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*, product:products(*))
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      console.error('Order fetch error:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch complete order' });
    }

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*, product:products(*))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get orders error:', error);
      return res.status(500).json({ message: 'Failed to fetch orders' });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// --- Admin Endpoints ---
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        phone,
        role,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }

    // Transform the data to match expected format
    const transformedUsers = users.map(user => ({
      id: user.user_id,
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown',
      email: 'N/A', // Email not in profiles table
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
      _count: { orders: 0 } // Would need to join with orders table
    }));

    res.json(transformedUsers);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching recipients:', error);
        return res.status(500).json({ message: 'Failed to fetch recipients' });
      }

      recipients = data.map(profile => ({
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer',
        email: 'user@example.com' // Would need to get from auth.users
      }));
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name');

      if (error) {
        console.error('Error fetching all recipients:', error);
        return res.status(500).json({ message: 'Failed to fetch recipients' });
      }

      recipients = data.map(profile => ({
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer',
        email: 'user@example.com' // Would need to get from auth.users
      }));
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
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching recipients:', error);
        return res.status(500).json({ message: 'Failed to fetch recipients' });
      }

      recipients = data.map(profile => ({
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer',
        phone: profile.phone
      })).filter(recipient => recipient.phone);
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone');

      if (error) {
        console.error('Error fetching all recipients:', error);
        return res.status(500).json({ message: 'Failed to fetch recipients' });
      }

      recipients = data.map(profile => ({
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer',
        phone: profile.phone
      })).filter(recipient => recipient.phone);
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
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(*),
        items:order_items(*, product:products(*))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get admin orders error:', error);
      return res.status(500).json({ message: 'Failed to fetch orders' });
    }

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
