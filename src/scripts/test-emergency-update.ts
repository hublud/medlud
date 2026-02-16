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

async function testEmergencyContactUpdate() {
    console.log('🔍 Testing Emergency Contact Update\n');

    // Find a test user
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1)
        .single();

    if (!profiles) {
        console.error('No profiles found');
        return;
    }

    console.log(`Testing with user: ${profiles.email}\n`);

    //Try the exact update that the emergency-contact page does
    const testUpdates = {
        emergency_contact_name: 'Test Parent',
        emergency_contact_relationship: 'Mother',
        emergency_contact_phone: '1234567890',
        share_location_emergency: false,
        onboarding_step: 'permissions',
        updated_at: new Date().toISOString()
    };

    console.log('Attempting update with these fields:');
    console.log(JSON.stringify(testUpdates, null, 2));
    console.log('');

    const { data, error } = await supabase
        .from('profiles')
        .update(testUpdates)
        .eq('id', profiles.id)
        .select();

    if (error) {
        console.error('❌ UPDATE FAILED:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Details: ${error.details}`);

        console.log('\n🔎 Possible causes:');
        console.log('   1. RLS policy blocking the update');
        console.log('   2. Column(s) do not exist in profiles table');
        console.log('   3. Data type mismatch\n');

        console.log('💡 Solution: Check if these columns exist in your profiles table:');
        console.log('   - emergency_contact_name');
        console.log('   - emergency_contact_relationship');
        console.log('   - emergency_contact_phone');
        console.log('   - share_location_emergency\n');
    } else {
        console.log('✅ UPDATE SUCCESSFUL!');
        console.log('   The emergency contact page should work now.\n');
    }
}

testEmergencyContactUpdate();
