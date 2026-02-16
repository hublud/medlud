import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfilesSchema() {
    console.log('Listing current columns in profiles table...');

    const { data: cols, error } = await supabase
        .rpc('list_columns', { table_name_input: 'profiles' });

    if (error) {
        // If RPC fails, try a direct query to information_schema (might fail due to permissions even with service role)
        const { data: infoCols, error: infoError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'profiles')
            .eq('table_schema', 'public');

        if (infoError) {
            // Last resort: try to fetch one row
            const { data: oneRow, error: rowError } = await supabase.from('profiles').select('*').limit(1);
            if (rowError) {
                console.error('Error fetching profiles:', rowError);
            } else if (oneRow && oneRow.length > 0) {
                console.log('Columns found in profiles:', Object.keys(oneRow[0]));
            } else {
                console.log('No rows in profiles to inspect.');
            }
        } else {
            console.log('Columns in profiles:', infoCols.map(c => c.column_name));
        }
    } else {
        console.log('Columns in profiles:', cols);
    }
}

inspectProfilesSchema();
