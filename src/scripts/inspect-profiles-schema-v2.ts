import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfiles() {
    console.log('Fetching one profile to inspect columns...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in profiles table:');
        console.log(Object.keys(data[0]).join(', '));
        console.log('\nSample data:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No profiles found to inspect.');
    }
}

inspectProfiles();
