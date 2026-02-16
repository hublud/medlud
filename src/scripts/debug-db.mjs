
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const appointmentId = '9d723bab-2613-41b5-b878-9158c048b6cd';
    const results = {
        appointmentId,
        specificAppointment: null,
        userProfile: null,
        recentAppointments: []
    };

    const { data: appointment, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

    if (appError) {
        results.appError = appError;
    } else {
        results.specificAppointment = appointment;

        const { data: profile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', appointment.user_id)
            .single();

        if (profError) {
            results.profError = profError;
        } else {
            results.userProfile = profile;
        }
    }

    const { data: appointments, error: listError } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (listError) {
        results.listError = listError;
    } else {
        results.recentAppointments = appointments;
    }

    fs.writeFileSync('debug-results.json', JSON.stringify(results, null, 2));
    console.log('Results written to debug-results.json');
}

check();
