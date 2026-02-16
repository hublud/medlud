'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper to get admin client
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

export async function adminCreateUser(data: {
    email: string;
    password?: string;
    full_name: string;
    role: string;
    phone?: string;
}) {
    try {
        const supabaseAdmin = getAdminClient();

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password || 'MedLud123!',
            email_confirm: true,
            user_metadata: {
                full_name: data.full_name,
                phone: data.phone
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const userId = authData.user.id;

        // 2. Create/Update Profile with Role
        // We use upsert to handle cases where a trigger might have already created the profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email: data.email,
                full_name: data.full_name,
                role: data.role,
                phone: data.phone,
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            // If profile creation fails, we should probably delete the auth user to keep state consistent
            // await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        revalidatePath('/admin/users');
        return { success: true };

    } catch (error: any) {
        console.error('Admin Create User Error:', error);
        return { success: false, error: error.message };
    }
}

export async function adminUpdateUser(data: {
    userId: string;
    role?: string;
    password?: string;
}) {
    try {
        const supabaseAdmin = getAdminClient();

        // 1. Update Auth (Password)
        if (data.password) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                data.userId,
                { password: data.password }
            );
            if (authError) throw authError;
        }

        // 2. Update Profile (Role)
        if (data.role) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ role: data.role })
                .eq('id', data.userId);

            if (profileError) throw profileError;
        }

        revalidatePath('/admin/users');
        return { success: true };

    } catch (error: any) {
        console.error('Admin Update User Error:', error);
        return { success: false, error: error.message };
    }
}
