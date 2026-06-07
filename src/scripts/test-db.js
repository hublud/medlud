const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkUsers() {
    console.log('Checking doctor/nurse emails...');
    const { data, error: usersErr } = await supabase.auth.admin.listUsers();
    if (usersErr) {
        console.error('List users error:', usersErr);
    } else {
        const users = data.users || [];
        const doc = users.find(u => u.email === 'test_doctor@medlud.test');
        const nurse = users.find(u => u.email === 'test_nurse@medlud.test');
        console.log('Auth Doctor user found:', doc ? doc.id : 'NO');
        console.log('Auth Nurse user found:', nurse ? nurse.id : 'NO');
    }

    const { data: profiles, error: profsErr } = await supabase
        .from('profiles')
        .select('*')
        .in('email', ['test_doctor@medlud.test', 'test_nurse@medlud.test']);

    if (profsErr) {
        console.error('Fetch profiles error:', profsErr);
    } else {
        console.log('Profiles found:', profiles);
    }
}

checkUsers();
