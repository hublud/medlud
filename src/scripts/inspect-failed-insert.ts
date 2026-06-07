import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFailedInsert() {
    const appointmentId = 'a7d90c52-5d50-4acd-b20c-a7b3ea15c55d';
    const patientId = 'ad275fcc-d27e-442a-bc9b-ca82d3549392';
    const doctorId = 'c9460034-b1cf-4f3f-a0e6-b279421d941b';
    const scheduledDateTime = '2026-05-30T06:40:45.427299+00:00';

    console.log('Attempting to insert twin consultation record...');
    const { error: consultError } = await supabase
        .from('consultations')
        .insert({
            id: appointmentId,
            user_id: patientId,
            doctor_id: doctorId,
            consultation_type: 'voice',
            status: 'pending',
            price: 0,
            started_at: scheduledDateTime,
            specialty_type: 'General Telemedicine',
            doctor_amount: 0,
            commission_amount: 0
        });

    if (consultError) {
        console.error('❌ Insert failed! Error Details:');
        console.error('Code:', consultError.code);
        console.error('Message:', consultError.message);
        console.error('Details:', consultError.details);
        console.error('Hint:', consultError.hint);
    } else {
        console.log('✅ Insert succeeded!');
        // Clean it up
        await supabase.from('consultations').delete().eq('id', appointmentId);
    }
}

inspectFailedInsert();
