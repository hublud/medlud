import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testClientSelect() {
    const consultationId = '1b02e236-1df7-42e6-8ace-b3c102433d7a';
    const email = 'patient_joshuanwamife_542111@medlud.local';
    const password = 'MedLudPatient123!'; // Default fallback password

    console.log(`Initializing client-side Supabase for ${email}...`);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Authentication failed:', authError.message);
        return;
    }

    console.log('✅ Authenticated successfully. User ID:', authData.user?.id);

    console.log(`Querying consultation ${consultationId} as logged-in patient...`);
    const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .maybeSingle();

    if (error) {
        console.error('❌ Query failed with error:', error);
    } else if (data) {
        console.log('✅ Query succeeded! Consultation record:', data);
    } else {
        console.log('⚠️ Query returned no results (Consultation not found). RLS is blocking this record!');
    }
}

testClientSelect();
