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
    console.error('❌ Missing Supabase URL or Service Key in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setPartnerRole() {
    const email = 'partner@medlud.com';
    const facilityName = 'Kaduna Diagnostic & Lab Partners';

    console.log(`Setting up partner account for email: ${email} and facility: ${facilityName}...\n`);

    try {
        // 1. Find the facility
        const { data: facility, error: facErr } = await supabaseAdmin
            .from('facilities')
            .select('id, name')
            .eq('name', facilityName)
            .maybeSingle();

        if (facErr) throw facErr;
        if (!facility) {
            throw new Error(`Facility "${facilityName}" not found. Please run the facilities migration first.`);
        }

        console.log(`✅ Found facility: ${facility.name} (ID: ${facility.id})`);

        // 2. Find the user profile by email
        const { data: profiles, error: profErr } = await supabaseAdmin
            .from('profiles')
            .select('id, email, full_name')
            .eq('email', email);

        if (profErr) throw profErr;

        let profile = profiles?.[0];
        let userId = profile?.id;

        if (!userId) {
            console.log(`User profile for "${email}" not found in profiles table. Checking auth users...`);
            
            // Search in Auth users list
            const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
            if (authErr) throw authErr;

            const authUser = users.find(u => u.email === email);
            if (!authUser) {
                console.log(`User "${email}" not found in Auth system. Creating user...`);
                // Create user
                const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: 'Password123!',
                    email_confirm: true
                });
                if (createErr) throw createErr;
                userId = createdUser.user.id;
                console.log(`✅ Created fresh auth user: ${email} (ID: ${userId})`);
            } else {
                userId = authUser.id;
                console.log(`✅ Found auth user: ${email} (ID: ${userId})`);
            }

            // Create profile
            const { data: newProfile, error: profileCreateErr } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    full_name: 'Test Lab Partner',
                    role: 'partner',
                    facility_id: facility.id,
                    onboarding_completed: true
                })
                .select()
                .single();

            if (profileCreateErr) throw profileCreateErr;
            profile = newProfile;
            console.log(`✅ Created profile linked to facility.`);
        } else {
            console.log(`✅ Found existing profile for: ${profile.full_name} (ID: ${profile.id})`);

            // Update existing profile
            const { error: updateErr } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: 'partner',
                    facility_id: facility.id,
                    onboarding_completed: true
                })
                .eq('id', userId);

            if (updateErr) throw updateErr;
            console.log(`✅ Updated user role to "partner" and linked to facility.`);
        }

        console.log('\n🎉 Setup complete! You can log in using:');
        console.log(`📧 Email: ${email}`);
        console.log('🔑 Password: Password123! (if created fresh, or use existing password)');

    } catch (err: any) {
        console.error('❌ Error setting partner role:', err.message);
    }
}

setPartnerRole();
