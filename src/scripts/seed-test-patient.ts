
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

async function createTestPatient() {
    const email = 'patient@medlud.com';
    const password = 'MedLudPatient123!';
    const fullName = 'Test Patient';

    console.log(`Creating/Resetting test patient: ${email}...`);

    // 1. Check if user exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);
    let userId = existingUser?.id;

    if (existingUser) {
        console.log('User exists. Updating password...');
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });
        userId = existingUser.id;
    } else {
        console.log('Creating new user...');
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });
        if (createError) {
            console.error('Error creating user:', createError);
            return;
        }
        userId = newUser.user?.id;
    }

    if (!userId) {
        console.error('Failed to get User ID');
        return;
    }

    // 2. Ensure Profile exists with 'patient' role
    console.log('Updating profile...');
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            full_name: fullName,
            role: 'patient',
            is_staff_verified: false, // Patients don't need this, but good to be explicit
            updated_at: new Date().toISOString()
        });

    if (profileError) {
        console.error('Error updating profile:', profileError);
    } else {
        console.log('✅ Test Patient ready!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

createTestPatient();
