import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
    try {
        // ── 1. Authenticate the caller ──────────────────────────────────────
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized: No session token provided.' },
                { status: 401 }
            );
        }

        // Verify the caller's identity using their JWT
        const callerClient = createClient(supabaseUrl, anonKey, {
            auth: { persistSession: false },
        });
        const { data: { user: callerUser }, error: authErr } =
            await callerClient.auth.getUser(token);

        if (authErr || !callerUser) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid session.' },
                { status: 401 }
            );
        }

        // ── 2. Confirm caller is an admin ───────────────────────────────────
        if (!serviceKey) {
            return NextResponse.json(
                { error: 'Server configuration error: Service key is missing.' },
                { status: 500 }
            );
        }

        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: callerProfile, error: profileErr } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single();

        if (profileErr || callerProfile?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden: Only platform admins can create staff accounts.' },
                { status: 403 }
            );
        }

        // ── 3. Parse and validate the request body ──────────────────────────
        const body = await req.json();
        const { full_name, email, role, phone } = body as {
            full_name: string;
            email: string;
            role: string;
            phone?: string;
        };

        if (!full_name || !email || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: full_name, email, role.' },
                { status: 400 }
            );
        }

        const validRoles = ['doctor', 'nurse', 'nurse-assistant', 'mental-health'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
                { status: 400 }
            );
        }

        const defaultPassword = 'MedLudStaff123!';

        // ── 4. Create the auth user via Admin API ───────────────────────────
        const { data: newAuthUser, error: createAuthErr } =
            await adminClient.auth.admin.createUser({
                email,
                password: defaultPassword,
                email_confirm: true, // Skip email confirmation — admin-created accounts are trusted
                user_metadata: { full_name },
            });

        if (createAuthErr || !newAuthUser?.user) {
            // Handle duplicate email gracefully
            if (createAuthErr?.message?.includes('already been registered') ||
                createAuthErr?.message?.includes('already exists')) {
                return NextResponse.json(
                    { error: `An account with email "${email}" already exists.` },
                    { status: 409 }
                );
            }
            throw createAuthErr || new Error('Failed to create auth user.');
        }

        const userId = newAuthUser.user.id;

        // ── 5. Upsert the profile row ───────────────────────────────────────
        // We upsert in case the trigger already created a basic profile row
        const { error: profileUpsertErr } = await adminClient
            .from('profiles')
            .upsert({
                id: userId,
                email,
                full_name,
                role,
                phone: phone || null,
                is_staff_verified: true,       // Admin-created staff are pre-verified
                onboarding_completed: true,    // Skip patient onboarding for staff
                updated_at: new Date().toISOString(),
            });

        if (profileUpsertErr) {
            // Attempt cleanup — delete the auth user we just created
            await adminClient.auth.admin.deleteUser(userId).catch(() => {});
            throw new Error(`Profile creation failed: ${profileUpsertErr.message}`);
        }

        // ── 6. Create doctors row if role is doctor ─────────────────────────
        if (role === 'doctor') {
            const { error: doctorErr } = await adminClient
                .from('doctors')
                .upsert({
                    id: userId,
                    is_specialist: false,
                    specialty_type: null,
                    specialist_price_chat: null,
                    specialist_price_video: null,
                });

            if (doctorErr) {
                // Non-fatal: profile was created, but log the issue
                console.error('[create-staff] Failed to create doctors row:', doctorErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            user_id: userId,
            default_password: defaultPassword,
            message: `Staff account created successfully for ${full_name}.`,
        });

    } catch (err: any) {
        console.error('[create-staff] Unhandled error:', err);
        return NextResponse.json(
            { error: err.message || 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
