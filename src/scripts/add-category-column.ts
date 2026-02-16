
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function generateMigration() {
    console.log('Migration Required: Add category column to appointments table');
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:\n');
    console.log(`
-- Add category column to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Update existing records if needed (optional)
-- UPDATE appointments SET category = 'general' WHERE category IS NULL;
`);
}

generateMigration();
