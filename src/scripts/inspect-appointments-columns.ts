import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectForeignKeys() {
    console.log('Inspecting foreign keys for table: appointments');

    // Inspect appointments table columns and foreign keys using RPC or raw query if possible
    // Since we don't have a direct raw query RPC, we'll try to infer from the error if the user provides it,
    // but first let's try to check the schema via an RPC if it exists, or just check what columns we have.

    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'appointments' });

    if (error) {
        console.log('RPC get_table_info not found, trying fallback...');
        // Fallback: Use standard PostgREST to check columns
        const { data: cols, error: colError } = await supabase
            .from('appointments')
            .select('*')
            .limit(1);

        if (colError) {
            console.error('Error fetching columns:', colError);
        } else {
            console.log('Columns found:', Object.keys(cols[0] || {}));
        }
    } else {
        console.log('Table Info:', data);
    }
}

inspectForeignKeys();
