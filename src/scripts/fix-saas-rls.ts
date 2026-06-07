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
    console.error('❌ Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixRls() {
    console.log('Fixing RLS policies for wards, beds, and departments to allow facility staff to manage them...');

    const sqlQueries = `
        -- Drop old policies
        DROP POLICY IF EXISTS "Staff can manage wards/beds" ON wards;
        DROP POLICY IF EXISTS "Staff can manage beds directly" ON beds;
        DROP POLICY IF EXISTS "Admins can manage facility departments" ON departments;

        -- Create new management policies for wards
        CREATE POLICY "Staff can manage wards" ON wards
            FOR ALL USING (
                (is_facility_staff(auth.uid(), facility_id) AND is_saas_active(facility_id)) 
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        -- Create new management policies for beds
        CREATE POLICY "Staff can manage beds" ON beds
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM wards 
                    WHERE wards.id = ward_id 
                      AND is_facility_staff(auth.uid(), wards.facility_id)
                      AND is_saas_active(wards.facility_id)
                )
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        -- Create new management policies for departments
        CREATE POLICY "Staff can manage departments" ON departments
            FOR ALL USING (
                (is_facility_staff(auth.uid(), facility_id) AND is_saas_active(facility_id))
                OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
    `;

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sqlQueries });

    if (error) {
        console.error('❌ Error running RLS fix via RPC:', error);
    } else {
        console.log('✅ RLS policies updated successfully!');
    }
}

fixRls();
