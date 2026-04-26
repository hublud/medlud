import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only allow in development
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceKey || serviceKey.includes('service_role')) {
        // Service key is placeholder — use signUp + auto-confirm workaround
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, anonKey);

        const TEST_EMAIL = 'test_onboarding@medlud.test';
        const TEST_PASSWORD = 'TestMedlud@2026';

        // Signup (will need manual confirmation if no service role key)
        const { data, error } = await supabase.auth.signUp({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            options: { data: { full_name: 'Test Patient', phone: '+2348000000099' } }
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            message: 'Test user created but needs email confirmation',
            notice: 'SUPABASE_SERVICE_ROLE_KEY is a placeholder. Go to your Supabase dashboard → Authentication → Users and confirm the email manually.',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            userId: data.user?.id,
        });
    }

    // Full admin flow with real service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const TEST_EMAIL = 'test_onboarding@medlud.test';
    const TEST_PASSWORD = 'TestMedlud@2026';

    // Delete existing test user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users?.find((u: any) => u.email === TEST_EMAIL);
    if (existing) {
        await supabaseAdmin.auth.admin.deleteUser(existing.id);
    }

    // Create pre-verified user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Test Patient', phone: '+2348000000099' }
    });

    if (createError || !newUser?.user) {
        return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
    }

    const userId = newUser.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            email: TEST_EMAIL,
            full_name: 'Test Patient',
            role: 'patient',
            onboarding_completed: false,
            onboarding_step: 'health-profile',
            updated_at: new Date().toISOString(),
        });

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: '✅ Test account ready! No email confirmation needed.',
        login_url: 'http://localhost:3000/login',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        userId,
        expected_flow: [
            '1. Login → /health-profile (Step 2/4)',
            '2. Fill health profile → /emergency-contact (Step 3/4)',
            '3. Fill emergency contact → /permissions (Step 4/4)',
            '4. Accept terms → /completion',
            '5. Go to Dashboard → /dashboard ✓'
        ]
    });
}
