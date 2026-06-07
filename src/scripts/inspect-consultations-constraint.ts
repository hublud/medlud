import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAllConstraints() {
    console.log('Fetching all check constraints for consultations table...');
    
    // Drop temp table if exists
    await supabase.rpc('exec_sql', { sql_query: 'DROP TABLE IF EXISTS temp_all_constraints;' });

    const sql = `
        CREATE TABLE temp_all_constraints AS
        SELECT conname, pg_get_constraintdef(oid) as def 
        FROM pg_constraint 
        WHERE conrelid = 'public.consultations'::regclass;
        NOTIFY pgrst, 'reload schema';
    `;
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (rpcError) {
        console.error('Error executing SQL:', rpcError);
        return;
    }

    // Wait for PostgREST to reload schema cache
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Query the temp table
    const { data: tempRes, error: selectErr } = await supabase
        .from('temp_all_constraints')
        .select('*');

    if (selectErr) {
        console.error('Error reading temp table:', selectErr);
    } else {
        console.log('Constraints:', tempRes);
    }

    // Cleanup temp table and reload schema
    await supabase.rpc('exec_sql', { 
        sql_query: 'DROP TABLE IF EXISTS temp_all_constraints; NOTIFY pgrst, \'reload schema\';' 
    });
}

inspectAllConstraints();
