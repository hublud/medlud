import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const patientId = 'c9460034-b1cf-4f3f-a0e6-b279421d941b'; // Dr Josh's profile ID as dummy patient
    const doctorId = 'c9460034-b1cf-4f3f-a0e6-b279421d941b'; // Dr Josh
    const appointmentId = '00000000-0000-0000-0000-000000000002';

    // Insert dummy appointment first
    const { error: aptErr } = await supabase
        .from('appointments')
        .insert({
            id: appointmentId,
            user_id: patientId,
            doctor_id: doctorId,
            title: 'Test Appointment',
            status: 'SCHEDULED',
            date: new Date().toISOString(),
            type: 'video',
            duration: '30 mins'
        });

    if (aptErr) {
        console.error('Appointment insert failed:', aptErr);
        return;
    }
    console.log('Dummy appointment inserted successfully.');

    // Now insert consultations
    const { error: consultError } = await supabase
        .from('consultations')
        .insert({
            id: appointmentId,
            user_id: patientId,
            doctor_id: doctorId,
            consultation_type: 'video',
            status: 'pending',
            price: 0,
            started_at: new Date().toISOString(),
            specialty_type: 'General Telemedicine',
            doctor_amount: 0,
            commission_amount: 0
        });

    if (consultError) {
        console.error('Consultation insert failed (Postgres Error):', consultError);
    } else {
        console.log('Consultation insert succeeded!');
        // Cleanup
        await supabase.from('consultations').delete().eq('id', appointmentId);
    }

    // Cleanup appointment
    await supabase.from('appointments').delete().eq('id', appointmentId);
}

testInsert();
