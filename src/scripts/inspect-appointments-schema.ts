
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAppointments() {
    console.log('Inspecting appointments table...');
    const { data, error } = await supabase
        .rpc('list_columns', { table_name_input: 'appointments' });

    if (error) {
        // Fallback
        const { data: oneRow } = await supabase.from('appointments').select('*').limit(1);
        if (oneRow && oneRow.length > 0) {
            console.log('Columns found:', Object.keys(oneRow[0]));
        } else {
            console.log('Could not list columns via RPC or row inspection. Assuming standard columns.');
        }
    } else {
        console.log('Columns:', data);
    }
}

inspectAppointments();
