import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    const results: any = {
        timestamp: new Date().toISOString(),
        tables: {},
        roles: {}
    };

    // 1. Check user_notifications
    const { error: t1 } = await supabase.from('user_notifications').select('count', { count: 'exact', head: true });
    results.tables.user_notifications = t1 ? { exists: false, error: t1.message } : { exists: true };

    // 2. Check admin_notifications
    const { error: t2 } = await supabase.from('admin_notifications').select('count', { count: 'exact', head: true });
    results.tables.admin_notifications = t2 ? { exists: false, error: t2.message } : { exists: true };

    // 3. Check roles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('role');
    if (profiles) {
        results.roles = profiles.reduce((acc: any, p: any) => {
            acc[p.role] = (acc[p.role] || 0) + 1;
            return acc;
        }, {});
    } else {
        results.roles_error = pErr?.message;
    }

    fs.writeFileSync('db_diagnostics.json', JSON.stringify(results, null, 2));
}

diagnose();
