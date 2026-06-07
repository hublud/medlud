import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a client with the user's token to simulate they are calling it
async function testQuery() {
    const email = 'taxnigeria1@gmail.com';
    const password = 'MedLud@Tax2026'; // the user's password

    console.log(`Signing in as ${email}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInErr) {
        console.error('Sign in error:', signInErr);
        return;
    }

    const user = authData.user;
    const session = authData.session;
    console.log(`Signed in successfully! User ID: ${user.id}`);

    // Now try to select from facility_staff
    const facilityId = 'fb011042-2d30-4d3e-8cf7-c69fbfff12cf';
    console.log(`Querying facility_staff for profile_id = ${user.id} and facility_id = ${facilityId}...`);

    const { data: staffData, error: staffErr } = await supabase
        .from('facility_staff')
        .select('*')
        .eq('profile_id', user.id)
        .eq('facility_id', facilityId)
        .eq('status', 'active')
        .maybeSingle();

    if (staffErr) {
        console.error('Error fetching facility_staff:', staffErr);
    } else {
        console.log('Result:', staffData);
    }
}

testQuery();
