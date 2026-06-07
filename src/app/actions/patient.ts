'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getAdminClient = () => {
    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export async function registerPatient(callerUserId: string, data: {
    full_name: string;
    email?: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
    blood_group?: string;
    // Emergency contact
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    // Medical history
    allergies?: string;         // comma-separated list, e.g. "Penicillin, Pollen"
    chronic_conditions?: string; // comma-separated list, e.g. "Hypertension, Asthma"
    current_medications?: string; // free text
}) {
    try {
        const supabaseAdmin = getAdminClient();

        // 1. Verify caller is active staff of a facility
        const { data: staffData, error: staffError } = await supabaseAdmin
            .from('facility_staff')
            .select('id, facility_id')
            .eq('profile_id', callerUserId)
            .eq('status', 'active')
            .maybeSingle();

        if (staffError) throw staffError;
        if (!staffData) {
            return { success: false, error: 'Unauthorized: Caller is not active staff of any facility.' };
        }

        // 2. Determine email to use
        // If email is not provided, generate a dummy one
        let emailToUse = data.email?.trim();
        if (!emailToUse) {
            const cleanName = data.full_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const randSuffix = Math.floor(100000 + Math.random() * 900000);
            emailToUse = `patient_${cleanName || 'unnamed'}_${randSuffix}@medlud.local`;
        }

        // 3. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: emailToUse,
            password: 'MedLudPatient123!',
            email_confirm: true,
            user_metadata: {
                full_name: data.full_name,
                phone: data.phone || ''
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create patient auth user.');

        const userId = authData.user.id;

        // Generate a unique 7-digit med_id
        let medId = '';
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
            attempts++;
            const candidate = Math.floor(1000000 + Math.random() * 9000000).toString();
            const { data: existing } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('med_id', candidate)
                .maybeSingle();
            
            if (!existing) {
                medId = candidate;
                isUnique = true;
            }
        }
        
        if (!medId) {
            throw new Error('Failed to generate a unique Medical ID.');
        }

        // 4. Update Profile record with patient details
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email: emailToUse,
                full_name: data.full_name,
                role: 'patient',
                phone: data.phone || null,
                gender: data.gender || null,
                date_of_birth: data.date_of_birth || null,
                blood_group: data.blood_group || null,
                med_id: medId,
                facility_id: staffData.facility_id,
                onboarding_completed: true,
                onboarding_step: 'completed',
                // Emergency contact
                emergency_contact_name: data.emergency_contact_name || null,
                emergency_contact_phone: data.emergency_contact_phone || null,
                emergency_contact_relationship: data.emergency_contact_relationship || null,
                updated_at: new Date().toISOString()
            })
            .select('*')
            .single();

        if (profileError) throw profileError;

        // 5. Create patient_records row (for current_medications)
        if (data.current_medications) {
            await supabaseAdmin
                .from('patient_records')
                .upsert({
                    patient_id: userId,
                    current_medications: data.current_medications,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'patient_id' });
        }

        // 6. Insert allergy rows
        if (data.allergies) {
            const allergyList = data.allergies
                .split(',')
                .map(a => a.trim())
                .filter(Boolean);

            if (allergyList.length > 0) {
                await supabaseAdmin
                    .from('allergy_records')
                    .insert(
                        allergyList.map(allergen => ({
                            patient_id: userId,
                            allergen,
                            severity: 'UNKNOWN',
                            reaction: 'Reported at registration'
                        }))
                    );
            }
        }

        // 7. Insert chronic condition rows
        if (data.chronic_conditions) {
            const conditionList = data.chronic_conditions
                .split(',')
                .map(c => c.trim())
                .filter(Boolean);

            if (conditionList.length > 0) {
                await supabaseAdmin
                    .from('chronic_conditions')
                    .insert(
                        conditionList.map(condition_name => ({
                            patient_id: userId,
                            condition_name,
                            status: 'active',
                            diagnosed_date: new Date().toISOString().split('T')[0]
                        }))
                    );
            }
        }

        return { success: true, patient: profileData };


    } catch (error: any) {
        console.error('Register Patient Error:', error);
        return { success: false, error: error.message };
    }
}

export async function ensurePatientAuth(patientId: string) {
    try {
        const supabaseAdmin = getAdminClient();

        // 1. Fetch profile
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', patientId)
            .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profile) {
            return { success: false, error: 'Patient profile not found.' };
        }

        let medId = profile.med_id;
        if (!medId) {
            // Generate med_id if missing
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
                attempts++;
                const candidate = Math.floor(1000000 + Math.random() * 9000000).toString();
                const { data: existing } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('med_id', candidate)
                    .maybeSingle();
                if (!existing) {
                    medId = candidate;
                    isUnique = true;
                }
            }
            await supabaseAdmin.from('profiles').update({ med_id: medId }).eq('id', patientId);
        }

        // 2. Check if auth user exists
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(patientId);

        if (userData?.user) {
            // Reset password to default MedLudPatient123! to make sure they can login
            await supabaseAdmin.auth.admin.updateUserById(patientId, {
                password: 'MedLudPatient123!'
            });

            return { 
                success: true, 
                message: 'Patient account is active.', 
                med_id: medId, 
                email: userData.user.email,
                password: 'MedLudPatient123!' 
            };
        }

        // 3. If auth user doesn't exist, create it
        const emailToUse = profile.email || `patient_${patientId.substring(0, 8)}@medlud.local`;
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            id: patientId,
            email: emailToUse,
            password: 'MedLudPatient123!',
            email_confirm: true,
            user_metadata: {
                full_name: profile.full_name,
                phone: profile.phone || ''
            }
        });

        if (authError) throw authError;

        return { 
            success: true, 
            message: 'Patient account created successfully.', 
            med_id: medId, 
            email: emailToUse,
            password: 'MedLudPatient123!' 
        };

    } catch (error: any) {
        console.error('Ensure Patient Auth Error:', error);
        return { success: false, error: error.message };
    }
}
