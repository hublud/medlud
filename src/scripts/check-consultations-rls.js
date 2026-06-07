const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    console.log('Cleaning old temp table...');
    await supabase.rpc('exec_sql', { sql_query: 'DROP TABLE IF EXISTS temp_policy_check;' });
    
    console.log('Creating temp table with RLS policies...');
    const query = `
        CREATE TABLE temp_policy_check AS
        SELECT policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'consultations';
        NOTIFY pgrst, 'reload schema';
    `;

    const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: query });
    if (rpcError) {
        console.error('RPC failed:', rpcError);
        return;
    }

    console.log('Waiting for PostgREST schema reload...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data, error: selectError } = await supabase
        .from('temp_policy_check')
        .select('*');

    if (selectError) {
        console.error('Select failed:', selectError);
    } else {
        console.log('Consultations RLS Policies:', data);
    }

    console.log('Cleaning up temp table...');
    await supabase.rpc('exec_sql', { sql_query: 'DROP TABLE IF EXISTS temp_policy_check; NOTIFY pgrst, \'reload schema\';' });
}
run();
