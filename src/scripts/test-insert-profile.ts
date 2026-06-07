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

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testInsert() {
    const testId = '431ecdd2-56c9-4e20-9da9-0c0c958c65a3';
    console.log(`Inserting test profile with ID: ${testId}...`);

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: testId,
            email: `informhublud@gmail.com`,
            full_name: 'Inform Hublud Test',
            role: 'user' // Test 'user' role trigger
        })
        .select();

    if (error) {
        console.error('❌ Insert Error:', error);
    } else {
        console.log('✅ Insert Succeeded:', data);
        
        // Clean up
        await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', testId);
    }
}

testInsert();
