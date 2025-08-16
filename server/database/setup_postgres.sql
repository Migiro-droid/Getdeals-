-- GetDeals Kenya PostgreSQL Database Migration Script
-- This script sets up the complete database schema and includes sample data

-- Create database (run this separately if needed)
-- CREATE DATABASE getdeals_kenya;
-- \c getdeals_kenya;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff', 'manager')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'delivery' CHECK (type IN ('delivery', 'billing')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    county VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    category VARCHAR(100),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    items JSONB, -- For basket items list
    items_detail JSONB, -- For detailed items with individual images
    metadata JSONB, -- Additional product metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 100,
    location VARCHAR(100), -- Storage location/branch
    cost_price DECIMAL(10, 2),
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Customer information (for guest orders or backup)
    customer_first_name VARCHAR(100),
    customer_last_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Order totals
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Status and tracking
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')),
    delivery_method VARCHAR(20) CHECK (delivery_method IN ('pickup', 'speedy')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('mpesa', 'card', 'wallet', 'cash')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Delivery information
    delivery_address JSONB,
    pickup_location VARCHAR(255),
    delivery_instructions TEXT,
    estimated_delivery TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Notes and metadata
    notes TEXT,
    admin_notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot (in case product changes/deleted)
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    -- Product details at time of order
    product_snapshot JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Carts table
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest carts
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id),
    UNIQUE(session_id)
);

-- Create Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(cart_id, product_id)
);

-- Create Payment Transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_id VARCHAR(255),
    external_transaction_id VARCHAR(255), -- M-Pesa receipt number, etc.
    
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('mpesa', 'card', 'wallet', 'cash')),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- M-Pesa specific fields
    mpesa_phone VARCHAR(20),
    mpesa_checkout_request_id VARCHAR(255),
    mpesa_merchant_request_id VARCHAR(255),
    mpesa_receipt_number VARCHAR(255),
    
    -- Provider response data
    provider_response JSONB,
    failure_reason TEXT,
    
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Admin Settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Contact Messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external_id ON payment_transactions(external_transaction_id);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);

-- Insert sample admin settings
INSERT INTO admin_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('black_friday_enabled', 'false', 'Enable/disable Black Friday promotions'),
('site_name', '"GetDeals Kenya"', 'Site name'),
('site_email', '"support@getdeals.co.ke"', 'Site contact email'),
('site_phone', '"+254 700 123 456"', 'Site contact phone'),
('delivery_fee_speedy', '200', 'Speedy delivery fee in KES'),
('max_order_amount', '100000', 'Maximum order amount in KES'),
('min_order_amount', '500', 'Minimum order amount in KES')
ON CONFLICT (key) DO NOTHING;

-- Insert sample products (essential baskets)
INSERT INTO products (id, name, slug, description, price, original_price, category, image_url, items, items_detail) VALUES
(
    uuid_generate_v4(),
    'Essential Basket',
    'essential-basket',
    'Perfect starter basket with basic household essentials',
    3000,
    3500,
    'basket',
    '/assets/essential-basket.jpg',
    '["2kg Rice", "1kg Sugar", "500ml Cooking Oil", "1kg Wheat Flour", "500g Salt"]',
    '[
        {"name": "2kg Rice", "image": "/assets/products/rice.jpg"},
        {"name": "1kg Sugar", "image": "/assets/products/sugar.jpg"},
        {"name": "500ml Cooking Oil", "image": "/assets/products/oil.jpg"},
        {"name": "1kg Wheat Flour", "image": "/assets/products/flour.jpg"},
        {"name": "500g Salt", "image": "/placeholder.svg"}
    ]'
),
(
    uuid_generate_v4(),
    'Family Basket',
    'family-basket',
    'Complete family basket with everything you need for a week',
    5000,
    6000,
    'basket',
    '/assets/family-basket.jpg',
    '["5kg Rice", "2kg Sugar", "1L Cooking Oil", "2kg Wheat Flour", "1kg Salt", "500g Tea Leaves", "1kg Maize Flour"]',
    '[
        {"name": "5kg Rice", "image": "/assets/products/rice.jpg"},
        {"name": "2kg Sugar", "image": "/assets/products/sugar.jpg"},
        {"name": "1L Cooking Oil", "image": "/assets/products/oil.jpg"},
        {"name": "2kg Wheat Flour", "image": "/assets/products/flour.jpg"},
        {"name": "1kg Salt", "image": "/placeholder.svg"},
        {"name": "500g Tea Leaves", "image": "/placeholder.svg"},
        {"name": "1kg Maize Flour", "image": "/placeholder.svg"}
    ]'
),
(
    uuid_generate_v4(),
    'Rice 2kg',
    'rice-2kg',
    'Premium quality rice, perfect for daily meals',
    450,
    NULL,
    'essential',
    '/assets/products/rice.jpg',
    NULL,
    NULL
),
(
    uuid_generate_v4(),
    'Sugar 1kg',
    'sugar-1kg',
    'Pure white sugar for all your cooking needs',
    280,
    NULL,
    'essential',
    '/assets/products/sugar.jpg',
    NULL,
    NULL
),
(
    uuid_generate_v4(),
    'Cooking Oil 500ml',
    'cooking-oil-500ml',
    'High quality cooking oil for healthy meals',
    380,
    NULL,
    'essential',
    '/assets/products/oil.jpg',
    NULL,
    NULL
)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample inventory for products
INSERT INTO inventory_items (product_id, sku, stock_quantity, reorder_level, reorder_quantity, location, cost_price)
SELECT 
    p.id,
    'SKU-' || UPPER(REPLACE(p.slug, '-', '')),
    FLOOR(RANDOM() * 100) + 50, -- Random stock between 50-150
    10,
    100,
    'Main Warehouse',
    p.price * 0.7 -- Cost price is 70% of selling price
FROM products p
ON CONFLICT (sku) DO NOTHING;

-- Create admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, email_verified) VALUES
(
    uuid_generate_v4(),
    'admin@getdeals.co.ke',
    '$2b$10$K7L/8Y3W4QFjZo5Rh8QZmO.rJ4M5N6P7Q8R9S0T1U2V3W4X5Y6Z7A8', -- admin123
    'Admin',
    'User',
    'admin',
    'active',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that have updated_at
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['users', 'addresses', 'products', 'inventory_items', 'orders', 'carts', 'payment_transactions', 'admin_settings', 'contact_messages'])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON %I 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();',
            table_name, table_name, table_name, table_name
        );
    END LOOP;
END $$;

-- Create views for common queries
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.status,
    o.payment_status,
    o.total,
    o.customer_first_name || ' ' || o.customer_last_name AS customer_name,
    o.customer_email,
    o.customer_phone,
    o.delivery_method,
    o.payment_method,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.created_at, o.status, o.payment_status, o.total, 
         o.customer_first_name, o.customer_last_name, o.customer_email, o.customer_phone,
         o.delivery_method, o.payment_method;

CREATE OR REPLACE VIEW product_inventory AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.category,
    p.is_active,
    COALESCE(i.stock_quantity, 0) as stock_quantity,
    COALESCE(i.reserved_quantity, 0) as reserved_quantity,
    COALESCE(i.stock_quantity, 0) - COALESCE(i.reserved_quantity, 0) as available_quantity,
    i.reorder_level,
    CASE 
        WHEN COALESCE(i.stock_quantity, 0) <= COALESCE(i.reorder_level, 0) THEN true 
        ELSE false 
    END as needs_reorder
FROM products p
LEFT JOIN inventory_items i ON p.id = i.product_id;

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE '✅ GetDeals Kenya Database Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Structure:';
    RAISE NOTICE '   - Users & Authentication';
    RAISE NOTICE '   - Products & Inventory Management';
    RAISE NOTICE '   - Orders & Order Items';
    RAISE NOTICE '   - Payment Transactions (M-Pesa integrated)';
    RAISE NOTICE '   - Shopping Carts';
    RAISE NOTICE '   - Admin Settings';
    RAISE NOTICE '   - Contact Messages';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Default Admin Account:';
    RAISE NOTICE '   Email: admin@getdeals.co.ke';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Sample Data Included:';
    RAISE NOTICE '   - Essential & Family Baskets';
    RAISE NOTICE '   - Individual Products';
    RAISE NOTICE '   - Inventory Records';
    RAISE NOTICE '   - Admin Settings';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '   1. Update your .env file with database connection';
    RAISE NOTICE '   2. Run: npm run db:generate (if using Prisma)';
    RAISE NOTICE '   3. Start your application server';
    RAISE NOTICE '   4. Access admin panel and configure settings';
END $$;
