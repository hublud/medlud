import { supabase } from '../lib/supabase';

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');

    // Check messages columns
    console.log('Checking "messages" table structure...');
    try {
        const { data, error } = await supabase.from('messages').select('*').limit(1);
        if (error) {
            console.error('❌ Error selecting from messages:', error.message);
        } else if (data && data.length >= 0) {
            // We can't see columns if data is empty, let's try a dummy insert or another way
            // Actually, if we get data, we can check keys. If empty, it's hard.
            console.log('✅ messages table is accessible.');
            if (data.length > 0) {
                console.log('Columns found:', Object.keys(data[0]));
            } else {
                console.log('Table is empty. Attempting to check columns via rpc or error induction...');
                const { error: insertErr } = await supabase.from('messages').insert({ image_url: 'test' });
                if (insertErr && insertErr.message.includes('column "image_url" of relation "messages" does not exist')) {
                    console.log('❌ Column "image_url" is MISSING.');
                } else {
                    console.log('✅ Column "image_url" likely EXISTS (or different error occurred).');
                    if (insertErr) console.log('Insert error was:', insertErr.message);
                    // Clean up if it worked
                    await supabase.from('messages').delete().eq('image_url', 'test');
                }
            }
        }
    } catch (e: any) {
        console.error('Unexpected error in DB check:', e.message);
    }

    // Check Storage
    console.log('\nChecking Storage Buckets...');
    try {
        const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
        if (bucketErr) {
            console.error('❌ Error listing buckets:', bucketErr.message);
        } else {
            console.log('✅ Visible buckets:', buckets.map(b => b.name));
            const labResults = buckets.find(b => b.name.toLowerCase() === 'lab-results');
            if (labResults) {
                console.log(`✅ "lab-results" bucket found (Public: ${labResults.public})`);
            } else {
                console.log('❌ "lab-results" bucket is MISSING.');
            }
        }
    } catch (e: any) {
        console.error('Unexpected error in Storage check:', e.message);
    }

    console.log('--- DIAGNOSTIC END ---');
}

diagnose();
