const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    const query = `
        SELECT schemaname, tablename, policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'consultations';
    `;

    console.log('Fetching RLS policies for consultations...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) {
        console.error('SQL query failed:', error);
    } else {
        console.log('RLS Policies for consultations:', data);
    }
}
run();
