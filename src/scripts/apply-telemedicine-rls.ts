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

async function applyRLS() {
    console.log('Applying RLS policies for telemedicine escalation...');

    const sql = `
        -- Drop temporary inspect view if exists
        DROP VIEW IF EXISTS public.inspect_rls_policies_view;

        -- 1. Enable RLS on appointments
        ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

        -- Drop existing appointments policies to prevent duplicates
        DROP POLICY IF EXISTS "Staff can view all appointments" ON appointments;
        DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
        DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
        DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
        DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
        DROP POLICY IF EXISTS "Staff can update appointments" ON appointments;
        DROP POLICY IF EXISTS "Staff and users can create appointments" ON appointments;

        -- Create updated appointments policies
        CREATE POLICY "Staff can view all appointments" ON appointments
            FOR SELECT TO authenticated
            USING (
                user_id = auth.uid()
                OR doctor_id = auth.uid()
                OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner')
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner'))
                OR EXISTS (SELECT 1 FROM facility_staff WHERE profile_id = auth.uid())
            );

        CREATE POLICY "Staff and users can create appointments" ON appointments
            FOR INSERT TO authenticated
            WITH CHECK (
                user_id = auth.uid()
                OR doctor_id = auth.uid()
                OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner')
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner'))
                OR EXISTS (SELECT 1 FROM facility_staff WHERE profile_id = auth.uid())
            );

        CREATE POLICY "Staff can update appointments" ON appointments
            FOR UPDATE TO authenticated
            USING (
                user_id = auth.uid()
                OR doctor_id = auth.uid()
                OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner')
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner'))
                OR EXISTS (SELECT 1 FROM facility_staff WHERE profile_id = auth.uid())
            );


        -- 2. Enable RLS on consultations
        ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

        -- Drop existing consultations policies
        DROP POLICY IF EXISTS "Doctors can view their own consultations" ON consultations;
        DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
        DROP POLICY IF EXISTS "Staff and users can view consultations" ON consultations;
        DROP POLICY IF EXISTS "Staff and users can create consultations" ON consultations;
        DROP POLICY IF EXISTS "Staff and users can update consultations" ON consultations;

        -- Create consultations policies
        CREATE POLICY "Staff and users can view consultations" ON consultations
            FOR SELECT TO authenticated
            USING (
                user_id = auth.uid()
                OR doctor_id = auth.uid()
                OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner')
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner'))
                OR EXISTS (SELECT 1 FROM facility_staff WHERE profile_id = auth.uid())
            );

        CREATE POLICY "Staff and users can create consultations" ON consultations
            FOR INSERT TO authenticated
            WITH CHECK (
                user_id = auth.uid()
                OR doctor_id = auth.uid()
                OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner')
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner'))
                OR EXISTS (SELECT 1 FROM facility_staff WHERE profile_id = auth.uid())
            );

        CREATE POLICY "Staff and users can update consultations" ON consultations
            FOR UPDATE TO authenticated
            USING (
                user_id = auth.uid()
                OR doctor_id = auth.uid()
                OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner')
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner'))
                OR EXISTS (SELECT 1 FROM facility_staff WHERE profile_id = auth.uid())
            );


        -- 3. Enable RLS on session_messages
        ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

        -- Drop existing session_messages policies
        DROP POLICY IF EXISTS "Users can insert their own messages" ON session_messages;
        DROP POLICY IF EXISTS "Users can view their consultation messages" ON session_messages;
        DROP POLICY IF EXISTS "Users can insert session messages" ON session_messages;

        -- Create session_messages policies
        CREATE POLICY "Users can view their consultation messages" ON session_messages
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM consultations c 
                    WHERE c.id = consultation_id 
                      AND (c.user_id = auth.uid() OR c.doctor_id = auth.uid())
                )
                OR ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner')
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'nurse', 'mental-health', 'nurse-assistant', 'partner'))
                OR EXISTS (SELECT 1 FROM facility_staff WHERE profile_id = auth.uid())
            );

        CREATE POLICY "Users can insert session messages" ON session_messages
            FOR INSERT TO authenticated
            WITH CHECK (
                sender_id = auth.uid()
            );

        -- Notify schema reload
        NOTIFY pgrst, 'reload schema';
    `;

    try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Error executing SQL:', error.message);
        } else {
            console.log('✅ RLS policies for telemedicine escalation applied successfully!');
        }
    } catch (err: any) {
        console.error('❌ Exception occurred:', err.message);
    }
}

applyRLS();
