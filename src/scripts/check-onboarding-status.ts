import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOnboardingStatus() {
    console.log('🔍 Checking onboarding status for all users...\n');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, onboarding_completed, onboarding_step')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching profiles:', error);
        return;
    }

    console.log('📊 Profile Status:\n');
    profiles?.forEach(profile => {
        console.log(`Email: ${profile.email}`);
        console.log(`Role: ${profile.role}`);
        console.log(`Onboarding Completed: ${profile.onboarding_completed}`);
        console.log(`Onboarding Step: ${profile.onboarding_step || 'N/A'}`);
        console.log('---');
    });

    console.log('\n💡 To fix onboarding redirect issues, run:');
    console.log('   npm run fix-onboarding');
}

checkOnboardingStatus();
