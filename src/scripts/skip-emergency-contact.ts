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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function skipEmergencyContact() {
    const email = 'patient@medlud.com'; // Change this if testing with different account

    console.log(`⏭️  Skipping Emergency Contact step for: ${email}\n`);

    // Get user
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (!profile) {
        console.error('❌ User not found');
        return;
    }

    console.log(`Current step: ${profile.onboarding_step}`);

    // Update to move past emergency contact
    const { error } = await supabase
        .from('profiles')
        .update({
            emergency_contact_name: 'parent',
            emergency_contact_relationship: 'HUS',
            emergency_contact_phone: '09099876',
            share_location_emergency: false,
            onboarding_step: 'permissions',
            updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

    if (error) {
        console.error('❌ Failed:', error.message);
    } else {
        console.log('✅ Emergency contact saved!');
        console.log('✅ Moved to permissions step\n');
        console.log('Now:');
        console.log('1. Refresh the browser page');
        console.log('2. You should see the Permissions page\n');
    }
}

skipEmergencyContact();
