import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Updating general pricing for audio and video calls...');

    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .update({
                chat_price: 7000,
                video_price: 8000
            })
            // Since there's only one row in platform_settings, we update all or assume ID 
            // Better to update where id is not null to affect the row
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select();

        if (error) {
            console.error('Error updating DB:', error);
            process.exit(1);
        }

        console.log('Successfully updated prices:');
        console.log(data);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

main();
