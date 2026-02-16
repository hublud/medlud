import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to check if user is admin
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

// GET - Fetch all coping techniques (including inactive if admin)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const admin = await isAdmin();

        let query = supabase
            .from('coping_techniques')
            .select('*')
            .order('display_order');

        if (!includeInactive || !admin) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching coping techniques:', error);
        return NextResponse.json(
            { error: 'Failed to fetch coping techniques', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new coping technique (admin only)
export async function POST(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('coping_techniques')
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
        console.error('Error creating coping technique:', error);
        return NextResponse.json(
            { error: 'Failed to create coping technique', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update coping technique (admin only)
export async function PUT(request: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updates } = body;
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('coping_techniques')
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
        console.error('Error updating coping technique:', error);
        return NextResponse.json(
            { error: 'Failed to update coping technique', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete coping technique (admin only, soft delete)
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

        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('coping_techniques')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting coping technique:', error);
        return NextResponse.json(
            { error: 'Failed to delete coping technique', details: error.message },
            { status: 500 }
        );
    }
}
