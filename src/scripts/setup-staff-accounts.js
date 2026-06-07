// Script to create or link lab/pharmacy staff accounts for FRAN CLII
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createOrLinkStaff(facilityId, facilityName, staffDef) {
    const { role, name } = staffDef;
    // Use a unique per-facility email
    const shortName = facilityName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${role.replace('_', '')}@${shortName}.medlud.local`;

    console.log(`\n--- Processing: ${role} ---`);
    console.log(`  Email: ${email}`);

    let userId = null;

    // 1. Try to find existing profile by email
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('email', email)
        .maybeSingle();

    if (existingProfile) {
        console.log(`  Found existing profile: ${existingProfile.full_name} (${existingProfile.id})`);
        userId = existingProfile.id;

        // Ensure role is set correctly
        if (existingProfile.role !== role) {
            await supabase.from('profiles').update({ role }).eq('id', userId);
            console.log(`  Updated profile role to: ${role}`);
        }
    } else {
        // 2. Try to find in auth users list
        const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existingAuthUser = authList?.users?.find(u => u.email === email);

        if (existingAuthUser) {
            userId = existingAuthUser.id;
            console.log(`  Found existing auth user: ${userId}`);

            // Upsert their profile
            await supabase.from('profiles').upsert({
                id: userId,
                email,
                full_name: name,
                role,
                onboarding_completed: true,
                onboarding_step: 'completed',
                updated_at: new Date().toISOString()
            });
            console.log(`  Profile upserted`);
        } else {
            // 3. Create fresh auth user
            const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                email,
                password: 'MedLudStaff123!',
                email_confirm: true,
                user_metadata: { full_name: name }
            });

            if (authErr) {
                console.error(`  ❌ Auth creation failed: ${authErr.message}`);
                return;
            }

            userId = authData.user.id;
            console.log(`  Created new auth user: ${userId}`);

            // Create profile
            await supabase.from('profiles').upsert({
                id: userId,
                email,
                full_name: name,
                role,
                onboarding_completed: true,
                onboarding_step: 'completed',
                updated_at: new Date().toISOString()
            });
            console.log(`  Profile created`);
        }
    }

    // 4. Check if already in facility_staff
    const { data: existingStaffRow } = await supabase
        .from('facility_staff')
        .select('id, status')
        .eq('facility_id', facilityId)
        .eq('profile_id', userId)
        .maybeSingle();

    if (existingStaffRow) {
        if (existingStaffRow.status !== 'active') {
            await supabase
                .from('facility_staff')
                .update({ role, status: 'active' })
                .eq('id', existingStaffRow.id);
            console.log(`  Updated existing staff row to active`);
        } else {
            console.log(`  Already linked to facility as ${role} ✅`);
        }
    } else {
        // Insert into facility_staff
        const { error: insertErr } = await supabase
            .from('facility_staff')
            .insert({
                facility_id: facilityId,
                profile_id: userId,
                role,
                status: 'active'
            });

        if (insertErr) {
            console.error(`  ❌ facility_staff insert failed: ${insertErr.message}`);
            return;
        }
        console.log(`  Linked to facility_staff ✅`);
    }

    console.log(`\n  ✅ ${name} ready!`);
    console.log(`     Email: ${email}`);
    console.log(`     Password: MedLudStaff123!`);
}

async function main() {
    // Find FRAN CLII
    const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name')
        .ilike('name', '%fran%');

    if (!facilities || facilities.length === 0) {
        console.log('No facility found matching "FRAN". Listing all:');
        const { data: all } = await supabase.from('facilities').select('id, name').limit(20);
        console.table(all);
        return;
    }

    const facility = facilities[0];
    console.log(`\n🏥 Using facility: ${facility.name} (${facility.id})`);

    await createOrLinkStaff(facility.id, facility.name, { role: 'lab_tech', name: 'Lab Technician (FRAN CLII)' });
    await createOrLinkStaff(facility.id, facility.name, { role: 'pharmacist', name: 'Pharmacist (FRAN CLII)' });

    console.log('\n\n🎉 All done!');
    console.log('Login at: http://localhost:3000/login');
    console.log('After login go to: http://localhost:3000/saas/dashboard/requests');
}

main().catch(console.error);
