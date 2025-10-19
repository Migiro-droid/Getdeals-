-- Create user_basket_preferences table for personalized shopping experience
CREATE TABLE IF NOT EXISTS user_basket_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shopping_frequency TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  spending_pattern TEXT NOT NULL,
  income_range TEXT NOT NULL,
  county TEXT,
  town TEXT,
  estate TEXT,
  occupation TEXT,
  source_awareness TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one preference record per user
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_basket_preferences_user_id 
ON user_basket_preferences(user_id);

-- Create index on spending_pattern for timed deals filtering
CREATE INDEX IF NOT EXISTS idx_user_basket_preferences_spending_pattern 
ON user_basket_preferences(spending_pattern);

-- Create index on categories for recommendation filtering
CREATE INDEX IF NOT EXISTS idx_user_basket_preferences_categories 
ON user_basket_preferences USING GIN(categories);

-- Enable Row Level Security
ALTER TABLE user_basket_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own basket preferences"
ON user_basket_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own basket preferences"
ON user_basket_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own basket preferences"
ON user_basket_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Admins can view all preferences
CREATE POLICY "Admins can view all basket preferences"
ON user_basket_preferences
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'manager')
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_basket_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_user_basket_preferences_updated_at_trigger
BEFORE UPDATE ON user_basket_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_basket_preferences_updated_at();

-- Add comment to table
COMMENT ON TABLE user_basket_preferences IS 'Stores user shopping preferences for personalized deals and basket recommendations';
