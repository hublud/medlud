import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLastAppointment() {
    console.log('Fetching the most recent appointments...');
    const { data: apts, error: aptsError } = await supabase
        .from('appointments')
        .select('id, user_id, doctor_id, title, status, type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (aptsError) {
        console.error('Error fetching appointments:', aptsError);
        return;
    }

    console.log('Most recent appointments:', apts);

    if (apts && apts.length > 0) {
        for (const apt of apts) {
            const doctorId = apt.doctor_id;
            if (!doctorId) {
                console.log(`Appointment ${apt.id} has no doctor_id.`);
                continue;
            }

            // Check if this doctor_id exists in public.doctors
            const { data: doc, error: docError } = await supabase
                .from('doctors')
                .select('id')
                .eq('id', doctorId)
                .maybeSingle();

            if (docError) {
                console.error(`Error querying doctor ${doctorId}:`, docError);
            } else if (doc) {
                console.log(`Doctor ID ${doctorId} for appointment ${apt.id} EXISTS in doctors table.`);
            } else {
                console.warn(`⚠️ Doctor ID ${doctorId} for appointment ${apt.id} is MISSING from doctors table!`);
                // Let's also check their profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, role')
                    .eq('id', doctorId)
                    .maybeSingle();
                console.log(`Profile info for missing doctor ${doctorId}:`, profile);
            }
        }
    }
}

inspectLastAppointment();
