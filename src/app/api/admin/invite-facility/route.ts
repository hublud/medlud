import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPartnerOnboardingEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    try {
        const db = supabaseAdmin as any;
        const body = await req.json();
        const { facilityId } = body;

        if (!facilityId) {
            return NextResponse.json({ error: 'Missing facilityId' }, { status: 400 });
        }

        // Validate caller is an Admin
        const authHeader = req.headers.get('Authorization');
        const callerClient = createClient(supabaseUrl, anonKey, {
            auth: { persistSession: false }
        });
        
        let token = authHeader?.split(' ')[1];
        if (!token) {
            const cookieToken = req.cookies.get('sb-access-token')?.value;
            if (cookieToken) token = cookieToken;
        }

        if (token) {
            const { data: { user }, error: authCheckErr } = await callerClient.auth.getUser(token);
            if (authCheckErr || !user) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token.' }, { status: 401 });
            }
            
            // Check if user is admin
            const { data: profileCheck, error: profileErr } = await db
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileErr || profileCheck?.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized: Only platform admins can perform this action.' }, { status: 403 });
            }
        } else {
            return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
        }

        // Fetch Facility Details
        const { data: facility, error: facErr } = await db
            .from('facilities')
            .select('*')
            .eq('id', facilityId)
            .single();

        if (facErr || !facility) {
            return NextResponse.json({ error: 'Facility not found.' }, { status: 404 });
        }

        if (!facility.email) {
            return NextResponse.json({ error: 'Facility email is required for setup instructions.' }, { status: 400 });
        }

        const isPlaceholder = !serviceKey || serviceKey.includes('service_role');
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const setupUrl = `${appUrl}/login`;

        let targetUid: string;
        let authCreated = false;
        const tempPassword = `MedLud@${facility.license_number?.replace(/[^a-zA-Z0-9]/g, '') || 'Partner'}2026`;

        if (isPlaceholder) {
            // In placeholder dev mode
            const { data: existingProf } = await db
                .from('profiles')
                .select('id')
                .eq('email', facility.email)
                .maybeSingle();

            if (existingProf) {
                targetUid = existingProf.id;
            } else {
                targetUid = crypto.randomUUID();
                // Create mock profile
                const { error: profErr } = await db
                    .from('profiles')
                    .insert({
                        id: targetUid,
                        email: facility.email,
                        full_name: `${facility.name} Admin`,
                        role: 'partner',
                        facility_id: facility.id,
                        onboarding_completed: true
                    });
                if (profErr) throw profErr;
                authCreated = true;
            }

            if (facility.saas_enabled) {
                // Map to facility staff as well
                const { error: staffErr } = await db
                    .from('facility_staff')
                    .insert({
                        facility_id: facility.id,
                        profile_id: targetUid,
                        role: 'doctor',
                        status: 'active'
                    });
                if (staffErr && !staffErr.message?.includes('unique') && staffErr.code !== '23505') {
                    console.warn('SaaS staff mapping warning:', staffErr);
                }
            }
        } else {
            // Real Supabase admin client
            const adminClient = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            // Check if auth user exists
            const { data: { users } } = await adminClient.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email?.toLowerCase() === facility.email.toLowerCase());

            if (existingUser) {
                targetUid = existingUser.id;
            } else {
                // Create user
                const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                    email: facility.email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: { full_name: `${facility.name} Admin` }
                });

                if (createError || !newUser?.user) {
                    throw createError || new Error('Auth user creation failed');
                }
                targetUid = newUser.user.id;
                authCreated = true;
            }

            // Ensure profile exists/updated
            await db
                .from('profiles')
                .upsert({
                    id: targetUid,
                    email: facility.email,
                    full_name: `${facility.name} Admin`,
                    role: 'partner',
                    facility_id: facility.id,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                });

            if (facility.saas_enabled) {
                // Map to facility staff
                const { error: staffErr } = await db
                    .from('facility_staff')
                    .insert({
                        facility_id: facility.id,
                        profile_id: targetUid,
                        role: 'doctor',
                        status: 'active'
                    });
                if (staffErr && !staffErr.message?.includes('unique') && staffErr.code !== '23505') {
                    console.warn('SaaS staff mapping warning:', staffErr);
                }
            }
        }

        // Send Email
        try {
            await sendPartnerOnboardingEmail({
                to: facility.email,
                facilityName: facility.name,
                loginEmail: facility.email,
                tempPassword: authCreated ? tempPassword : undefined,
                setupUrl
            });
        } catch (emailErr) {
            console.error('Failed to send onboarding email:', emailErr);
            return NextResponse.json({
                success: true,
                warning: 'User account prepared, but sending email failed. Check mailer configuration.',
                credentials: authCreated ? { email: facility.email, password: tempPassword } : null
            });
        }

        return NextResponse.json({
            success: true,
            message: authCreated
                ? '✅ User account created in Auth and onboarding email dispatched!'
                : '✅ Existing user linked to facility and setup instructions email resent!',
            credentials: authCreated ? { email: facility.email, password: tempPassword } : null
        });

    } catch (err: any) {
        console.error('Invite facility error:', err);
        return NextResponse.json({ error: err.message || 'An error occurred inviting facility admin.' }, { status: 500 });
    }
}
