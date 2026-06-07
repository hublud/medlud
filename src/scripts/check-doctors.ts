import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDoctors() {
    console.log('Fetching profiles with role doctor...');
    const { data: docProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('role', 'doctor');
    
    if (profErr) {
        console.error('Error fetching doctor profiles:', profErr);
    } else {
        console.log('Doctor profiles found:', docProfiles);
    }

    console.log('\nFetching entries in the doctors table...');
    const { data: doctorsData, error: docErr } = await supabase
        .from('doctors')
        .select('*');

    if (docErr) {
        console.error('Error fetching doctors:', docErr);
    } else {
        console.log('Doctors table entries:', doctorsData);
    }

    // Check if there are any mismatching doctor profiles missing in the doctors table
    if (docProfiles && doctorsData) {
        const docIdsInDoctorsTable = new Set(doctorsData.map(d => d.id));
        const missing = docProfiles.filter(p => !docIdsInDoctorsTable.has(p.id));
        console.log('\nDoctor profiles missing from the doctors table:', missing);
    }
}

checkDoctors();
