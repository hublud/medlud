import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function activateSaas() {
    const facilityId = 'fb011042-2d30-4d3e-8cf7-c69fbfff12cf';
    console.log(`Activating SaaS for facility ID: ${facilityId}...`);

    const { data, error } = await supabase
        .from('facilities')
        .update({
            saas_enabled: true,
            saas_subscription_status: 'active',
            saas_subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        })
        .eq('id', facilityId)
        .select();

    if (error) {
        console.error('Error activating SaaS:', error);
    } else {
        console.log('SaaS activated successfully for facility:', data);
    }
}

activateSaas();
