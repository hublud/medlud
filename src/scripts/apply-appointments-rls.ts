
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envConfig[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyAppointmentsRLS() {
    console.log('Applying RLS policies for appointments table...\n');

    const sql = `
-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can update appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;

-- Policy: Users can view their own appointments
CREATE POLICY "Users can view their own appointments" ON appointments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policy: Staff can view all appointments
CREATE POLICY "Staff can view all appointments" ON appointments
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant')
);

-- Policy: Staff can update appointments
CREATE POLICY "Staff can update appointments" ON appointments
FOR UPDATE TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant')
);

-- Policy: Users can create their own appointments
CREATE POLICY "Users can create their own appointments" ON appointments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
`;

    try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Error applying policies via RPC:', error);
            console.log('\n⚠️ RPC method not available. Trying alternative approach...\n');

            // If RPC doesn't work, we need to tell the user to run it manually
            console.log('Please copy this SQL and run it in Supabase SQL Editor:');
            console.log('---');
            console.log(sql);
            console.log('---');
            return;
        }

        console.log('✅ RLS policies applied successfully!');
        console.log('\nYou can now:');
        console.log('1. Log in as the doctor (mediacontact@gmail.com)');
        console.log('2. The appointments should load without errors');
    } catch (err: any) {
        console.error('❌ Error:', err.message);
        console.log('\nAlternative: Try copying the SQL from the artifact file:');
        console.log('007_fix_appointments_rls.sql');
    }
}

applyAppointmentsRLS();
