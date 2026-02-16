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
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickTest() {
    console.log('Testing Supabase connection and profile access...\n');

    // Test: Can we access profiles?
    const { data, error } = await supabase
        .from('profiles')
        .select('email, role, onboarding_completed')
        .limit(3);

    if (error) {
        console.error('❌ Failed to access profiles:', error.message);
        return;
    }

    console.log(`✅ Successfully accessed profiles. Found ${data.length} record(s)\n`);

    if (data.length > 0) {
        console.log('Sample profiles:');
        data.forEach(p => {
            console.log(`- ${p.email}: role=${p.role}, onboarded=${p.onboarding_completed}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS TO FIX ONBOARDING:');
    console.log('='.repeat(60));
    console.log('\n1. I just fixed the AuthContext timeout issue');
    console.log('2. You need to add 1 more RLS policy to Supabase:');
    console.log('\nRun this SQL in Supabase SQL Editor:');
    console.log('---');
    console.log(`
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
`);
    console.log('---');
    console.log('\n3. After running the SQL, try logging in again');
    console.log('4. Onboarding should complete without errors\n');
}

quickTest();
