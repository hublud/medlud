import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testOtherDoctorSelect() {
    const otherDoctorId = '46915a56-60d4-40ea-87b5-19945da15e1c'; // Dr. Tunde Adams
    const email = 'mediacontact@gmail.com';
    const password = 'MedLudDoctor123!';
    const consultationId = '1b02e236-1df7-42e6-8ace-b3c102433d7a'; // Assigned to Dr Josh

    // 1. Reset password via admin client
    console.log('Resetting other doctor password via admin client...');
    const adminClient = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error: resetError } = await adminClient.auth.admin.updateUserById(otherDoctorId, {
        password: password,
        email_confirm: true
    });

    if (resetError) {
        console.error('❌ Failed to reset password:', resetError.message);
        return;
    }
    console.log('✅ Other doctor password reset successfully.');

    // 2. Sign in via anon client
    console.log(`Initializing client-side Supabase for other doctor ${email}...`);
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Authentication failed:', authError.message);
        return;
    }

    console.log('✅ Authenticated successfully. User ID:', authData.user?.id);

    // 3. Try to select consultation
    console.log(`Querying consultation ${consultationId} (assigned to Dr Josh) as other doctor...`);
    const { data, error } = await anonClient
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .maybeSingle();

    if (error) {
        console.error('❌ Query failed with error:', error);
    } else if (data) {
        console.log('✅ Query succeeded! Other doctor can see it:', data);
    } else {
        console.log('⚠️ Query returned no results (Consultation not found). RLS is blocking this record!');
    }
}

testOtherDoctorSelect();
