import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
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

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAllRLSIssues() {
    console.log('🔧 COMPREHENSIVE RLS FIX\n');
    console.log('This script will:');
    console.log('1. Test appointments table access');
    console.log('2. Provide workaround instructions\n');

    // Test appointments access with service role
    console.log('[1/2] Testing appointments table...');
    const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('count');

    if (aptError) {
        console.error('❌ Cannot access appointments:', aptError.message);
        console.log('\n⚠️ The appointments table may not exist or has severe access issues.');
    } else {
        console.log('✅ Appointments table accessible via service role');
    }

    // Test profiles access
    console.log('\n[2/2] Testing profiles table...');
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('count');

    if (profError) {
        console.error('❌ Cannot access profiles:', profError.message);
    } else {
        console.log('✅ Profiles table accessible');
    }

    console.log('\n' + '='.repeat(60));
    console.log('CRITICAL ISSUE IDENTIFIED');
    console.log('='.repeat(60));
    console.log('\nThe Supabase JavaScript client cannot execute DDL commands');
    console.log('(like CREATE POLICY) for security reasons.');
    console.log('\n📋 YOU MUST RUN THE SQL MANUALLY:\n');

    const sqlScript = `
-- Copy this entire block and paste into Supabase SQL Editor
-- https://supabase.com/dashboard

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;

-- Allow staff to view all appointments
CREATE POLICY "Staff can view all appointments" ON appointments
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN 
  ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant')
);

-- Allow patients to view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Allow patients to create appointments
CREATE POLICY "Users can create appointments" ON appointments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
`;

    console.log(sqlScript);
    console.log('='.repeat(60));
    console.log('\n💡 ALTERNATIVE: If Supabase web editor fails:');
    console.log('1. Download Supabase CLI: https://supabase.com/docs/guides/cli');
    console.log('2. Run: supabase db push');
    console.log('\nOR temporarily disable RLS for testing (NOT recommended for production)');
}

fixAllRLSIssues();
