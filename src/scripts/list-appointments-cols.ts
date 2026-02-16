
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envConfig[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listColumns() {
    console.log('Listing current columns in appointments table...\n');

    // Try a simple select to see what comes back
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('column') || error.message.includes('does not exist')) {
            console.log('The table structure seems to be the issue.');
        }
    } else if (data && data.length > 0) {
        console.log('✅ Columns found:', Object.keys(data[0]).join(', '));
    } else {
        console.log('⚠️ No rows found, trying to infer columns via insert check...');
        // Try to insert a dummy object and check the error message if any
        const { error: insertError } = await supabase
            .from('appointments')
            .insert({ non_existent_column_test: 'test' });

        if (insertError) {
            console.log('Insert error hints:', insertError.message);
        }
    }
}

listColumns();
