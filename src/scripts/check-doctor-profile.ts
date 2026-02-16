
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

async function checkDoctorProfile() {
    const email = 'mediacontact@gmail.com';
    console.log(`Checking profile for ${email}...`);

    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    if (!profile) {
        console.error('Profile not found!');
        return;
    }

    console.log('--- DOCTOR PROFILE ---');
    console.log(`ID: ${profile.id}`);
    console.log(`Role: ${profile.role}`);
    console.log(`Onboarding Completed: ${profile.onboarding_completed}`);
    console.log(`Onboarding Step: ${profile.onboarding_step}`);
    console.log('----------------------');
}

checkDoctorProfile();
