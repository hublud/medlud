import { supabase } from '../lib/supabase';

async function initStorage() {
    console.log('🚀 Initializing MedLud Storage...');

    // Note: Creating buckets via the client usually requires the Service Role Key
    // if not configured otherwise. Most users prefer the Dashboard for this.

    const { data, error } = await supabase.storage.createBucket('lab-results', {
        public: false,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ Bucket "lab-results" already exists.');
        } else {
            console.error('❌ Error creating bucket:', error.message);
            console.log('\nTIP: If you get a "403 Forbidden", please create the "lab-results" bucket manually in the Supabase Dashboard (Storage tab).');
        }
    } else {
        console.log('✅ Bucket "lab-results" created successfully!');
    }
}

initStorage();
