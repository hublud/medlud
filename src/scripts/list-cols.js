const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    const { data, error } = await supabase.from('appointments').select('*').limit(1);
    if (error) {
        console.error('Error fetching columns:', error);
    } else {
        console.log('Appointments columns:', data.length > 0 ? Object.keys(data[0]) : 'No data in table');
    }
}
run();
