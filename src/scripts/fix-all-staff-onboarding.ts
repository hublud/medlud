
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

async function fixAllStaffOnboarding() {
    console.log('Fixing onboarding for all staff accounts...\n');

    const staffRoles = ['doctor', 'nurse', 'nurse-assistant', 'mental-health', 'admin'];

    // Get all staff profiles
    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('role', staffRoles);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('No staff profiles found.');
        return;
    }

    console.log(`Found ${profiles.length} staff account(s):\n`);

    for (const profile of profiles) {
        console.log(`Email: ${profile.email}`);
        console.log(`  Role: ${profile.role}`);
        console.log(`  Onboarding Completed: ${profile.onboarding_completed}`);
        console.log(`  Onboarding Step: ${profile.onboarding_step}`);

        if (!profile.onboarding_completed) {
            console.log('  ⚠️ FIXING: Setting onboarding_completed = true');

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    onboarding_step: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (updateError) {
                console.error('  ❌ Error updating:', updateError);
            } else {
                console.log('  ✅ Fixed!');
            }
        } else {
            console.log('  ✅ Already completed');
        }
        console.log('---');
    }

    console.log('\n✅ All staff accounts processed!');
    console.log('\n⚠️ IMPORTANT: Staff members must LOG OUT and LOG BACK IN for changes to take effect!');
}

fixAllStaffOnboarding();
