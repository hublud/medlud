'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugEnvPage() {
    const [envStatus, setEnvStatus] = useState<any>({});
    const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');

    useEffect(() => {
        // Check if env vars are loaded
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        setEnvStatus({
            url: url ? `Loaded (${url.substring(0, 8)}...)` : 'Missing',
            key: key ? `Loaded (${key.substring(0, 8)}...)` : 'Missing',
            fullUrl: url // Be careful showing this, but helpful for debugging
        });

        // Test Connection
        async function testConnection() {
            try {
                const { data, error } = await supabase.from('appointments').select('count').limit(1);
                if (error) throw error;
                setConnectionStatus('Connected Successfully!');
            } catch (err: any) {
                setConnectionStatus(`Connection Failed: ${err.message}`);
                console.error("Supabase Connection Error:", err);
            }
        }

        testConnection();
    }, []);

    return (
        <div className="p-10 space-y-4">
            <h1 className="text-2xl font-bold">Environment Debugger</h1>

            <div className="p-4 border rounded bg-gray-50">
                <h2 className="font-bold">Environment Variables</h2>
                <pre>{JSON.stringify(envStatus, null, 2)}</pre>
            </div>

            <div className="p-4 border rounded bg-gray-50">
                <h2 className="font-bold">Supabase Connection</h2>
                <p className={connectionStatus.includes('Success') ? 'text-green-600' : 'text-red-600'}>
                    {connectionStatus}
                </p>
            </div>
        </div>
    );
}
