import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillConsultations() {
    console.log('Fetching all scheduled telemedicine appointments...');
    const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'SCHEDULED');

    if (aptError) {
        console.error('Error fetching appointments:', aptError);
        return;
    }

    console.log(`Found ${appointments?.length || 0} scheduled appointments.`);

    if (appointments && appointments.length > 0) {
        let backfilledCount = 0;

        for (const apt of appointments) {
            // Check if consultation exists
            const { data: consult, error: consultError } = await supabase
                .from('consultations')
                .select('id')
                .eq('id', apt.id)
                .maybeSingle();

            if (consultError) {
                console.error(`Error checking consultation for ${apt.id}:`, consultError);
                continue;
            }

            if (!consult) {
                console.log(`Backfilling twin consultation for appointment ${apt.id} (${apt.type} call)...`);
                
                // Determine price and amounts
                const isVideo = apt.type === 'video';
                const price = isVideo ? 8000 : 7000;
                const doctorAmount = isVideo ? 5600 : 4900;
                const commissionAmount = isVideo ? 2400 : 2100;

                const { error: insertError } = await supabase
                    .from('consultations')
                    .insert({
                        id: apt.id,
                        user_id: apt.user_id,
                        doctor_id: apt.doctor_id,
                        consultation_type: apt.type || 'video',
                        status: 'pending',
                        price: price,
                        started_at: apt.date || new Date().toISOString(),
                        specialty_type: 'General Telemedicine',
                        doctor_amount: doctorAmount,
                        commission_amount: commissionAmount
                    });

                if (insertError) {
                    console.error(`❌ Failed to backfill consultation for appointment ${apt.id}:`, insertError);
                } else {
                    console.log(`✅ Successfully backfilled consultation for appointment ${apt.id}`);
                    backfilledCount++;
                }
            } else {
                console.log(`Twin consultation for appointment ${apt.id} already exists.`);
            }
        }

        console.log(`\nBackfill complete! ${backfilledCount} consultations backfilled.`);
    }
}

backfillConsultations();
