import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function applyConstraintChange() {
    console.log('Updating consultations_consultation_type_check check constraint...');

    const sql = `
        -- Drop the existing constraint
        ALTER TABLE public.consultations 
        DROP CONSTRAINT IF EXISTS consultations_consultation_type_check;

        -- Recreate the constraint to include 'voice'
        ALTER TABLE public.consultations 
        ADD CONSTRAINT consultations_consultation_type_check 
        CHECK (consultation_type = ANY (ARRAY['chat'::text, 'video'::text, 'voice'::text]));

        -- Notify schema reload
        NOTIFY pgrst, 'reload schema';
    `;

    try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Error executing SQL:', error.message);
        } else {
            console.log('✅ consultations_consultation_type_check updated successfully to allow [\'chat\', \'video\', \'voice\']!');
        }
    } catch (err: any) {
        console.error('❌ Exception occurred:', err.message);
    }
}

applyConstraintChange();
