const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }
    console.log('--- Auth Users ---');
    for (const u of users) {
        console.log(`ID: ${u.id} | Email: ${u.email}`);
    }

    const { data: facilityStaff } = await supabase.from('facility_staff').select('*');
    console.log('--- Facility Staff Mapping ---');
    console.log(facilityStaff);
}
run();
