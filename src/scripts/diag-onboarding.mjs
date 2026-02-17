
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOnboarding() {
    console.log('Fetching profiles...');
    const { data: profiles, error, count } = await supabase
        .from('profiles')
        .select('email, role, onboarding_completed, onboarding_step', { count: 'exact' });

    if (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
        return;
    }

    console.log(`Found ${profiles?.length} profiles (Total count: ${count})`);
    if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
            console.log(`- ${p.email}: role=${p.role}, completed=${p.onboarding_completed}, step=${p.onboarding_step}`);
        });
    } else {
        console.log('No profiles found in the table.');
    }
}

checkOnboarding();
