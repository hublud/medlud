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

async function fixOnboarding() {
    console.log('🔧 Fixing onboarding status for all users...\n');

    // Update all profiles to mark onboarding as completed
    const { data, error } = await supabase
        .from('profiles')
        .update({
            onboarding_completed: true,
            onboarding_step: 'completed'
        })
        .is('onboarding_completed', null)
        .select();

    if (error) {
        console.error('❌ Error updating profiles:', error);
        return;
    }

    console.log(`✅ Updated ${data?.length || 0} profiles`);

    if (data && data.length > 0) {
        console.log('\n📋 Updated profiles:');
        data.forEach(profile => {
            console.log(`  - ${profile.email} (${profile.role})`);
        });
    }

    console.log('\n✨ Done! Try reloading your dashboard now.');
}

fixOnboarding();
