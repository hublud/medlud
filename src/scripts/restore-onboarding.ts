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

async function restoreOnboardingEnforcement() {
    console.log('🔄 RESTORING ONBOARDING ENFORCEMENT\n');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`Checking ${profiles.length} profile(s)...\n`);

    for (const profile of profiles) {
        const staffRoles = ['admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant'];
        const isStaff = staffRoles.includes(profile.role);

        // Staff don't need health profile data, so if they're marked complete, leave them
        if (isStaff) {
            console.log(`✓ ${profile.email} (${profile.role}) - Staff account, keeping onboarding_completed=true`);
            continue;
        }

        // For patients: Check if they actually have profile data
        const hasProfileData = profile.gender || profile.date_of_birth || profile.blood_group;

        if (profile.onboarding_completed && !hasProfileData) {
            // They were bypassed but haven't actually filled out their profile
            console.log(`⚠️  ${profile.email} - Bypassed without completing. Resetting...`);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: false,
                    onboarding_step: 'health-profile',
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`   ❌ Failed: ${updateError.message}`);
            } else {
                console.log(`   ✅ Reset to health-profile step`);
            }
        } else if (profile.onboarding_completed && hasProfileData) {
            console.log(`✓ ${profile.email} - Properly completed`);
        } else {
            console.log(`→ ${profile.email} - Already in onboarding (step: ${profile.onboarding_step || 'health-profile'})`);
        }
    }

    console.log('\n✅ Onboarding enforcement restored!');
    console.log('\nNew users will now be required to complete:');
    console.log('  1. Health Profile');
    console.log('  2. Emergency Contact');
    console.log('  3. Permissions');
    console.log('\nBefore accessing their dashboard.\n');
}

restoreOnboardingEnforcement();
