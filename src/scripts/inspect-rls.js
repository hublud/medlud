const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectRLS() {
    console.log('Testing RPC exec_sql...');
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: `
                SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
                FROM pg_policies 
                WHERE tablename IN ('diagnosis_records', 'prescription_history', 'lab_history', 'imaging_history');
            `
        });
        
        if (error) {
            console.error('RPC exec_sql failed:', error.message);
        } else {
            console.log('Existing RLS policies for EMR tables:');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Exception calling RPC exec_sql:', e.message);
    }
}

inspectRLS();
