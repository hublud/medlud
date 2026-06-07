import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    try {
        const body = await req.json();
        const { facilityId, email, fullName, role, phone, departmentId } = body;

        if (!facilityId || !email || !fullName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const getAdminClient = () => {
            if (!serviceKey || serviceKey.includes('service_role')) {
                return createClient(supabaseUrl, anonKey);
            }
            return createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });
        };

        const supabaseAdmin = getAdminClient();
        const isPlaceholder = !serviceKey || serviceKey.includes('service_role');

        // Validate caller is verified staff of the same facility
        // For security, checking caller auth token
        const authHeader = req.headers.get('Authorization');
        const callerClient = createClient(supabaseUrl, anonKey, {
            auth: { persistSession: false }
        });
        
        let token = authHeader?.split(' ')[1];
        if (!token) {
            // Check cookie
            const cookieToken = req.cookies.get('sb-access-token')?.value;
            if (cookieToken) token = cookieToken;
        }

        if (token) {
            const { data: { user } } = await callerClient.auth.getUser(token);
            if (user) {
                // Verify they belong to facility as active staff (using admin client to bypass RLS cache limitations)
                const { data: staffCheck } = await supabaseAdmin
                    .from('facility_staff')
                    .select('*')
                    .eq('profile_id', user.id)
                    .eq('facility_id', facilityId)
                    .eq('status', 'active')
                    .maybeSingle();

                if (!staffCheck) {
                    return NextResponse.json({ error: 'Unauthorized: You are not active staff of this facility.' }, { status: 403 });
                }
            }
        }

        let targetUid: string;
        let authCreated = false;

        if (isPlaceholder) {
            // In placeholder dev mode, search if profile already exists.
            const { data: existingProf } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existingProf) {
                targetUid = existingProf.id;
            } else {
                // Generate a dummy uuid for simulation
                targetUid = crypto.randomUUID();
                // Create dummy profile in database directly
                // Map facility role → profile role
                const profileRole = role === 'doctor' ? 'doctor' : 
                    role === 'nurse' || role === 'ward_manager' ? 'nurse' :
                    role === 'pharmacist' ? 'pharmacist' :
                    role === 'lab_tech' ? 'lab_tech' : 'nurse';
                const { error: profErr } = await supabaseAdmin
                    .from('profiles')
                    .insert({
                        id: targetUid,
                        email,
                        full_name: fullName,
                        role: profileRole,
                        is_staff_verified: true,
                        onboarding_completed: true
                    });
                if (profErr) throw profErr;
            }
        } else {
            // Real admin flow
            // Check if auth user exists
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (existingUser) {
                targetUid = existingUser.id;
            } else {
                // Create user
                const defaultPassword = 'MedLudStaff123!';
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: defaultPassword,
                    email_confirm: true,
                    user_metadata: { full_name: fullName, phone }
                });

                if (createError || !newUser?.user) {
                    throw createError || new Error('Auth user creation failed');
                }
                targetUid = newUser.user.id;
                authCreated = true;
            }

            // Map facility role → profile role
            const profileRole = role === 'doctor' ? 'doctor' : 
                role === 'nurse' || role === 'ward_manager' ? 'nurse' :
                role === 'pharmacist' ? 'pharmacist' :
                role === 'lab_tech' ? 'lab_tech' : 'nurse';

            // Ensure profile exists/updated
            await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: targetUid,
                    email,
                    full_name: fullName,
                    role: profileRole,
                    is_staff_verified: true,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                });

            if (role === 'doctor') {
                await supabaseAdmin
                    .from('doctors')
                    .upsert({
                        id: targetUid,
                        is_specialist: false
                    });
            }
        }

        // Map to facility staff
        const { error: staffErr } = await supabaseAdmin
            .from('facility_staff')
            .insert({
                facility_id: facilityId,
                profile_id: targetUid,
                role,
                status: 'active',
                department_id: departmentId || null
            });

        if (staffErr) {
            // If already maps, return a message
            if (staffErr.message?.includes('unique') || staffErr.code === '23505') {
                return NextResponse.json({ success: true, message: 'User is already registered as staff at this facility.' });
            }
            throw staffErr;
        }

        return NextResponse.json({
            success: true,
            message: authCreated 
                ? '✅ User account created in Auth and mapped to your facility!'
                : '✅ Existing user account mapped to your facility staff directory!',
            credentials: authCreated ? { email, password: 'MedLudStaff123!' } : null
        });

    } catch (err: any) {
        console.error('Add staff error:', err);
        return NextResponse.json({ error: err.message || 'An error occurred adding staff.' }, { status: 500 });
    }
}
