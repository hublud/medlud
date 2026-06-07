import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'taxnigeria1@gmail.com';
    console.log(`Checking details for ${email}...`);

    // 1. Get profile
    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (profileErr) {
        console.error('Error fetching profile:', profileErr);
    } else {
        console.log('Profile:', profile);
    }

    if (profile) {
        // 2. Check facility staff
        const { data: staff, error: staffErr } = await supabase
            .from('facility_staff')
            .select('*')
            .eq('profile_id', profile.id);

        if (staffErr) {
            console.error('Error fetching facility_staff:', staffErr);
        } else {
            console.log('Facility staff records:', staff);
        }

        // 3. Check facilities
        const { data: facility, error: facilityErr } = await supabase
            .from('facilities')
            .select('*')
            .eq('id', profile.facility_id);

        if (facilityErr) {
            console.error('Error fetching facility:', facilityErr);
        } else {
            console.log('Linked facility:', facility);
        }
    }
}

checkUser();
