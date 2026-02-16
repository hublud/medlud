
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
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

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkAppointmentsTable() {
    console.log('Checking appointments table...\n');

    try {
        // Try to query appointments with admin (bypasses RLS)
        const { data, error, count } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: false })
            .limit(5);

        if (error) {
            console.error('❌ Error querying appointments table:', error);
            console.log('\nPossible causes:');
            console.log('1. Table does not exist');
            console.log('2. Network connectivity issue with Supabase');
            return;
        }

        console.log(`✅ Appointments table exists!`);
        console.log(`   Total records: ${count}`);
        console.log(`   Sample records: ${data?.length || 0}`);

        if (data && data.length > 0) {
            console.log('\nSample appointment:');
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log('\n⚠️ Table is empty - no appointments created yet.');
        }

        console.log('\n--- Next Steps ---');
        console.log('Since the table exists but the doctor cannot access it:');
        console.log('1. The issue is RLS (Row Level Security) policies');
        console.log('2. You need to run the SQL script to add policies');
        console.log('3. Try accessing Supabase SQL Editor again');
        console.log('   OR use the Supabase Dashboard -> SQL Editor');
        console.log('4. If network issues persist, check your internet connection');

    } catch (err: any) {
        console.error('❌ Fatal error:', err.message);
    }
}

checkAppointmentsTable();
