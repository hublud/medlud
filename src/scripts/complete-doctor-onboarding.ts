
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

async function markDoctorOnboardingComplete() {
    const email = 'mediacontact@gmail.com';
    console.log(`Marking onboarding as complete for ${email}...`);

    // 1. Get the user
    const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (fetchError || !profile) {
        console.error('Profile not found:', fetchError);
        return;
    }

    console.log(`Current status: onboarding_completed = ${profile.onboarding_completed}`);

    // 2. Update the profile
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            onboarding_completed: true,
            onboarding_step: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

    if (updateError) {
        console.error('Error updating profile:', updateError);
    } else {
        console.log('✅ Doctor onboarding marked as complete!');
        console.log('The doctor can now access the dashboard directly.');
    }
}

markDoctorOnboardingComplete();
