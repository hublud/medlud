
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

async function setAdminRole() {
    const email = 'xvaluemedia@gmail.com';

    console.log(`Checking profile for ${email}...`);

    // 1. Get User ID from Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`User ${email} NOT FOUND in auth.users!`);
        return;
    }

    console.log(`Found user ${user.id}. Setting role to 'admin'...`);

    // 2. Update Profile using Service Role (Bypasses RLS)
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: user.id,
            email: email,
            role: 'admin', // Enforce admin role
            full_name: user.user_metadata?.full_name || 'Admin User',
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to update profile:', error);
    } else {
        console.log('✅ Success! User profile updated:', data);
        console.log('Please refresh the Admin Dashboard.');
    }
}

setAdminRole();
