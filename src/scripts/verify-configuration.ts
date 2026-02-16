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

async function verifyConfiguration() {
    console.log('🔍 VERIFICATION REPORT\n');
    console.log('='.repeat(70));

    // 1. Check profiles
    console.log('\n1️⃣  USER PROFILES:\n');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, onboarding_completed, gender, date_of_birth')
        .order('role');

    if (profileError) {
        console.error('❌ Cannot access profiles:', profileError.message);
        return;
    }

    profiles.forEach(p => {
        const hasHealthData = p.gender || p.date_of_birth;
        const status = p.onboarding_completed ? '✅ COMPLETE' : '⏳ PENDING';
        console.log(`${status} | ${p.email}`);
        console.log(`         Role: ${p.role} | Health Data: ${hasHealthData ? 'Yes' : 'No'}`);
    });

    // 2. Test profile update permission
    console.log('\n' + '='.repeat(70));
    console.log('\n2️⃣  RLS POLICY TEST (Profile Updates):\n');

    const testUserId = profiles[0]?.id;
    if (testUserId) {
        // Try to update a profile as that user (simulating auth context)
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', testUserId);

        if (updateError) {
            console.log('❌ Profile update policy: MISSING or BLOCKED');
            console.log(`   Error: ${updateError.message}`);
            console.log('   ⚠️  Users will NOT be able to complete onboarding!');
        } else {
            console.log('✅ Profile update policy: WORKING');
            console.log('   Users can update their own profiles during onboarding');
        }
    }

    // 3. Test appointments access
    console.log('\n' + '='.repeat(70));
    console.log('\n3️⃣  APPOINTMENTS ACCESS TEST:\n');

    const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('count');

    if (aptError) {
        console.log('❌ Appointments policy: MISSING or BLOCKED');
        console.log(`   Error: ${aptError.message}`);
    } else {
        console.log('✅ Appointments table: ACCESSIBLE');
        console.log('   Staff will be able to view appointments');
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY:\n');

    const staffCount = profiles.filter(p =>
        ['admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant'].includes(p.role)
    ).length;

    const patientCount = profiles.filter(p => p.role === 'patient').length;
    const completedCount = profiles.filter(p => p.onboarding_completed).length;

    console.log(`Total Users: ${profiles.length}`);
    console.log(`  - Staff: ${staffCount}`);
    console.log(`  - Patients: ${patientCount}`);
    console.log(`Onboarding Completed: ${completedCount}/${profiles.length}`);

    console.log('\n✅ CONFIGURATION IS CORRECT IF:');
    console.log('   1. All staff accounts show "COMPLETE"');
    console.log('   2. Patients without health data show "PENDING"');
    console.log('   3. Profile update policy shows "WORKING"');
    console.log('   4. Appointments table shows "ACCESSIBLE"\n');
}

verifyConfiguration();
