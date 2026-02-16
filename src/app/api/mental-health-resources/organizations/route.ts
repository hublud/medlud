import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function isAdmin() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'admin' || profile?.role === 'staff';
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const admin = await isAdmin();

        let query = supabase
            .from('mental_health_organizations')
            .select('*')
            .order('display_order');

        if (!includeInactive || !admin) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch organizations', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('mental_health_organizations')
            .insert({
                ...body,
                created_by: user?.id,
                updated_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to create organization', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updates } = body;
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('mental_health_organizations')
            .update({
                ...updates,
                updated_by: user?.id
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to update organization', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('mental_health_organizations')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to delete organization', details: error.message },
            { status: 500 }
        );
    }
}
