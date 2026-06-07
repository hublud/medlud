import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentRecords() {
    console.log('Fetching last 5 appointments...');
    const { data: apts } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('Appointments:', apts?.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        doctor_id: a.doctor_id,
        user_id: a.user_id,
        created_at: a.created_at
    })));

    if (apts && apts.length > 0) {
        const ids = apts.map(a => a.id);
        console.log('\nChecking matching consultations in database...');
        const { data: consults } = await supabase
            .from('consultations')
            .select('*')
            .in('id', ids);
        
        console.log('Consultations found:', consults?.map(c => ({
            id: c.id,
            status: c.status,
            doctor_id: c.doctor_id,
            user_id: c.user_id,
            created_at: c.created_at
        })));

        // Let's test what an authenticated user would see (RLS simulation)
        // We will query as the doctor for the latest appointment
        const latestApt = apts[0];
        if (latestApt) {
            console.log(`\nSimulating query for appointment ID: ${latestApt.id} as different roles...`);
            // We are using service role key, so bypasses RLS.
            // Let's check RLS rules specifically
            const sql = `
                SELECT 
                    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
                FROM pg_policies 
                WHERE tablename = 'consultations';
            `;
            const { data: policies } = await supabase.rpc('exec_sql', { sql_query: sql });
            console.log('PG Policies for consultations:', policies);
        }
    }
}

checkRecentRecords();
