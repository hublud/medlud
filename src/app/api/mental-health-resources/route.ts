import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {

        // Fetch all active resources
        const [copingTechniques, organizations, selfCareTips] = await Promise.all([
            supabase
                .from('coping_techniques')
                .select('*')
                .eq('is_active', true)
                .order('display_order'),
            supabase
                .from('mental_health_organizations')
                .select('*')
                .eq('is_active', true)
                .order('display_order'),
            supabase
                .from('self_care_tips')
                .select('*')
                .eq('is_active', true)
                .order('display_order')
        ]);

        if (copingTechniques.error) throw copingTechniques.error;
        if (organizations.error) throw organizations.error;
        if (selfCareTips.error) throw selfCareTips.error;

        return NextResponse.json({
            copingTechniques: copingTechniques.data,
            organizations: organizations.data,
            selfCareTips: selfCareTips.data
        });
    } catch (error: any) {
        console.error('Error fetching mental health resources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resources', details: error.message },
            { status: 500 }
        );
    }
}
