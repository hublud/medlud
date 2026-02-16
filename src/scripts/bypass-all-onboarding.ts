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

async function bypassOnboardingForAll() {
    console.log('⚠️  BYPASSING ONBOARDING FOR ALL USERS');
    console.log('This is a temporary workaround to allow testing\n');

    // Get all profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, onboarding_completed');

    if (error) {
        console.error('❌ Error fetching profiles:', error.message);
        return;
    }

    console.log(`Found ${profiles.length} user(s)\n`);

    for (const profile of profiles) {
        if (!profile.onboarding_completed) {
            console.log(`Completing onboarding for: ${profile.email} (${profile.role})`);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    onboarding_step: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`  ❌ Failed: ${updateError.message}`);
            } else {
                console.log(`  ✅ Completed`);
            }
        } else {
            console.log(`${profile.email}: Already completed`);
        }
    }

    console.log('\n✅ All done!');
    console.log('\nNext steps:');
    console.log('1. Close the browser tab showing the health profile page');
    console.log('2. Go back to http://localhost:3000/login');
    console.log('3. Log in again');
    console.log('4. You should now go directly to your dashboard\n');
}

bypassOnboardingForAll();
