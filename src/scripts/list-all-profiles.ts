import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllProfiles() {
    console.log('Listing all profiles and their roles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role');

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profiles list:', profiles);
    }
}

listAllProfiles();
