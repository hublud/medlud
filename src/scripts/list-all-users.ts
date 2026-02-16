
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

async function listAllUsers() {
    console.log('Fetching all users from Auth and Profiles...');

    // 1. Get Auth Users
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
        console.error('Error fetching Auth Users:', authError);
        return;
    }

    // 2. Get Profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*');

    if (profileError) {
        console.error('Error fetching Profiles:', profileError);
        return;
    }

    let output = `Found ${users.length} Auth Users and ${profiles?.length || 0} Profiles.\n\n--- SYSTEM USERS ---\n`;

    users.forEach(u => {
        const profile = profiles?.find(p => p.id === u.id);
        const metadataRole = u.app_metadata?.role || 'N/A';
        const profileRole = profile?.role || 'MISSING';

        output += `Email: ${u.email}\n`;
        output += `   ID: ${u.id}\n`;
        output += `   Auth Metadata Role: ${metadataRole}\n`;
        output += `   DB Profile Role:    ${profileRole}\n`;
        output += '-----------------------------------\n';
    });

    console.log(output);
    const outputPath = path.resolve(process.cwd(), 'src/scripts/users-output.txt');
    fs.writeFileSync(outputPath, output);
    console.log(`Output written to ${outputPath}`);
}

listAllUsers();
