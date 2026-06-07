import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function applyDoctorSyncTrigger() {
    console.log('Applying doctor profile sync trigger and populating missing doctor rows...');

    const sql = `
        -- 1. Insert missing doctor rows for existing profiles with role = 'doctor'
        INSERT INTO public.doctors (id, pending_balance, withdrawable_balance, is_specialist)
        SELECT id, 0, 0, false
        FROM public.profiles
        WHERE role = 'doctor'
        ON CONFLICT (id) DO NOTHING;

        -- 2. Create trigger function to ensure doctor row is created automatically
        CREATE OR REPLACE FUNCTION public.handle_doctor_profile_sync()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.role = 'doctor' THEN
                INSERT INTO public.doctors (id, pending_balance, withdrawable_balance, is_specialist)
                VALUES (NEW.id, 0, 0, false)
                ON CONFLICT (id) DO NOTHING;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- 3. Create trigger on profiles table
        DROP TRIGGER IF EXISTS ensure_doctor_row_on_profile_sync ON public.profiles;
        CREATE TRIGGER ensure_doctor_row_on_profile_sync
        AFTER INSERT OR UPDATE OF role ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_doctor_profile_sync();

        -- Notify schema reload
        NOTIFY pgrst, 'reload schema';
    `;

    try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Error executing SQL:', error.message);
        } else {
            console.log('✅ Doctor sync trigger and missing doctor rows populated successfully!');
        }
    } catch (err: any) {
        console.error('❌ Exception occurred:', err.message);
    }
}

applyDoctorSyncTrigger();
