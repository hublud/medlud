import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectConsultations() {
    console.log('\n--- Fetching check constraints for consultations table ---');
    // Drop temp table if exists
    await supabase.rpc('exec_sql', { sql_query: 'DROP TABLE IF EXISTS temp_constraint_check;' });

    // Create table with constraint definition and reload schema cache
    const sql = `
        CREATE TABLE temp_constraint_check AS
        SELECT conname, pg_get_constraintdef(oid) as def 
        FROM pg_constraint 
        WHERE conname = 'consultations_status_check';
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
        .from('temp_constraint_check')
        .select('*');

    if (selectErr) {
        console.error('Error reading temp table:', selectErr);
    } else {
        console.log('Constraint definition:', tempRes);
    }

    // Cleanup temp table and reload schema
    await supabase.rpc('exec_sql', { 
        sql_query: 'DROP TABLE IF EXISTS temp_constraint_check; NOTIFY pgrst, \'reload schema\';' 
    });

    console.log('\n--- Attempting a mock insert into consultations ---');
    // Generate dummy UUIDs
    const mockId = '00000000-0000-0000-0000-000000000000';
    const mockDoctorId = '00000000-0000-0000-0000-000000000000';
    const mockPatientId = '00000000-0000-0000-0000-000000000000';

    const { error: insertError } = await supabase
        .from('consultations')
        .insert({
            id: mockId,
            user_id: mockPatientId,
            doctor_id: mockDoctorId,
            consultation_type: 'chat',
            status: 'pending',
            price: 0,
            started_at: new Date().toISOString(),
            specialty_type: 'General Telemedicine',
            doctor_amount: 0,
            commission_amount: 0
        });

    if (insertError) {
        console.error('Insert error details (stringified):', JSON.stringify(insertError, null, 2));
        console.error('Insert error object:', insertError);
    } else {
        console.log('Mock insert succeeded (or was rolled back/not blocked by constraint)!');
        // Clean up mock insert
        await supabase.from('consultations').delete().eq('id', mockId);
    }
}

inspectConsultations();
