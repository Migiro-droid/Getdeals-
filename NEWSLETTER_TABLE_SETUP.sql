-- Newsletter Subscribers Table
-- This table stores email addresses of users who subscribe to the newsletter

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

-- Add comments for documentation
COMMENT ON TABLE newsletter_subscribers IS 'Stores email addresses of newsletter subscribers';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Email address of the subscriber (unique constraint)';
COMMENT ON COLUMN newsletter_subscribers.status IS 'Subscription status: active or inactive';
COMMENT ON COLUMN newsletter_subscribers.unsubscribed_at IS 'Timestamp when user unsubscribed (NULL if still subscribed)';

-- Enable Row Level Security (optional but recommended)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to view their own subscription (if needed in future)
CREATE POLICY "Users can view subscriptions"
  ON newsletter_subscribers
  FOR SELECT
  USING (true);
