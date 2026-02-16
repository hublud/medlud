import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointment(id: string) {
    console.log(`Checking appointment ID: ${id}`);

    // Check with service role (bypasses RLS)
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error (Service Role):', error);
    } else {
        console.log('Appointment found (Service Role):', data);
        console.log(`Owner (user_id): ${data.user_id}`);
    }

    // Check available columns
    const { data: sample, error: sampleError } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (sample && sample[0]) {
        console.log('Available columns in appointments:', Object.keys(sample[0]));
    }
}

// Use the ID from the user's screenshot
checkAppointment('9d723bab-2613-41b5-b878-9158c048b6cd');
