import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRls() {
    const consultationId = '1b02e236-1df7-42e6-8ace-b3c102433d7a';
    const patientId = 'ad275fcc-d27e-442a-bc9b-ca82d3549392';
    const doctorId = 'c9460034-b1cf-4f3f-a0e6-b279421d941b';

    // We will query using exec_sql to run transaction with different claims
    const runAsUser = async (userId: string, roleName: string = 'authenticated') => {
        const sql = `
            BEGIN;
            -- Set claim sub
            SELECT set_config('request.jwt.claim.sub', '${userId}', true);
            SELECT set_config('role', '${roleName}', true);
            
            -- Query consultations
            SELECT id, user_id, doctor_id, status FROM public.consultations WHERE id = '${consultationId}';
            
            COMMIT;
        `;
        // Wait, exec_sql runs a single query. Let's do it in a database function or transaction.
        // Let's create a temp function to execute and return the query under a specific auth context.
        const helperSql = `
            CREATE OR REPLACE FUNCTION public.temp_test_rls_query(p_user_id text, p_role text)
            RETURNS TABLE(id uuid, user_id uuid, doctor_id uuid, status text) AS $$
            DECLARE
                v_sub text;
                v_role text;
                v_result record;
            BEGIN
                -- Store current
                v_sub := current_setting('request.jwt.claim.sub', true);
                v_role := current_setting('role', true);
                
                -- Set test claims
                PERFORM set_config('request.jwt.claim.sub', p_user_id, true);
                PERFORM set_config('role', p_role, true);
                
                RETURN QUERY 
                SELECT c.id, c.user_id, c.doctor_id, c.status 
                FROM public.consultations c 
                WHERE c.id = '${consultationId}'::uuid;
                
                -- Restore claims
                PERFORM set_config('request.jwt.claim.sub', coalesce(v_sub, ''), true);
                PERFORM set_config('role', coalesce(v_role, 'postgres'), true);
            END;
            $$ LANGUAGE plpgsql SECURITY INVOKER;
        `;
        
        await supabase.rpc('exec_sql', { sql_query: helperSql });
        
        // Execute the function
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: `SELECT * FROM public.temp_test_rls_query('${userId}', '${roleName}');` 
        });
        
        if (error) {
            console.error(`Error querying as ${userId}:`, error);
        } else {
            console.log(`Query results as user ${userId} (${roleName}):`, data);
        }
    };

    console.log('--- Testing RLS for Patient ---');
    await runAsUser(patientId);

    console.log('\n--- Testing RLS for Doctor ---');
    await runAsUser(doctorId);

    // Clean up function
    await supabase.rpc('exec_sql', { sql_query: 'DROP FUNCTION IF EXISTS public.temp_test_rls_query(text, text);' });
}

testRls();
