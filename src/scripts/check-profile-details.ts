import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'ad275fcc-d27e-442a-bc9b-ca82d3549392')
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile:', error);
    } else {
        console.log('Profile details:', profile);
    }
}

checkProfile();
