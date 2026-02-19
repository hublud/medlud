'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: any;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ data: any, error: any }>;
    signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any, error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            console.log(`[Auth] Fetching profile for: ${userId}`);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // PGRST116 is the code for "JSON object requested, but no rows returned"
                if (error.code === 'PGRST116') {
                    console.warn('[Auth] Profile missing - creating default profile');
                    const { data: userData } = await supabase.auth.getUser();
                    const newProfile = {
                        id: userId,
                        email: userData.user?.email,
                        role: 'patient',
                        onboarding_completed: false,
                        updated_at: new Date().toISOString()
                    };

                    const { data: createdData, error: createError } = await supabase
                        .from('profiles')
                        .insert(newProfile)
                        .select()
                        .single();

                    if (createError) {
                        console.error('[Auth] Failed to create default profile:', createError);
                        throw createError;
                    }

                    console.log('[Auth] Default profile created successfully');
                    setProfile(createdData);
                } else {
                    console.error('[Auth] Profile fetch error:', error);
                    throw error;
                }
            } else if (data) {
                setProfile(data);
            }
        } catch (err) {
            console.error('[Auth] Fatal error in fetchProfile:', err);
        }
    };

    useEffect(() => {
        let safetyTimer: NodeJS.Timeout | null = null;

        const startSafetyTimer = () => {
            if (safetyTimer) clearTimeout(safetyTimer);
            safetyTimer = setTimeout(() => {
                setLoading(currentLoading => {
                    if (currentLoading) {
                        console.warn('[Auth] Safety timeout reached - forcing loading to false');
                        return false;
                    }
                    return false;
                });
            }, 10000); // 10 second safety cap
        };

        const initAuth = async () => {
            startSafetyTimer();
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id).catch(err => {
                        console.warn('[Auth] Profile fetch failed during init:', err);
                    });
                }
            } catch (err) {
                console.error('[Auth] Error in initial session load:', err);
            } finally {
                setLoading(false);
                if (safetyTimer) clearTimeout(safetyTimer);
            }
        };

        initAuth();

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Event: ${event}`);

            // Only trigger full-screen loading for major transitions
            const shouldShowLoading = event === 'INITIAL_SESSION' || event === 'SIGNED_IN';

            if (shouldShowLoading) {
                setLoading(true);
                startSafetyTimer();
            }

            try {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id).catch(err => {
                        console.warn('[Auth] Profile fetch failed during auth change:', err);
                    });
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                }
            } catch (err) {
                console.error('[Auth] Error in auth state change:', err);
            } finally {
                if (shouldShowLoading) {
                    setLoading(false);
                    if (safetyTimer) clearTimeout(safetyTimer);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
            if (safetyTimer) clearTimeout(safetyTimer);
        };
    }, []);

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (data.session && data.user) {
            setSession(data.session);
            setUser(data.user);
            await fetchProfile(data.user.id);
        }

        return { data, error };
    };

    const signUp = async (email: string, password: string, metadata?: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        if (data.session && data.user) {
            setSession(data.session);
            setUser(data.user);
            await supabase.from('profiles').insert({
                id: data.user.id,
                email: data.user.email,
                role: 'patient',
                ...metadata
            });
            await fetchProfile(data.user.id);
        }

        return { data, error };
    };

    const signOut = async () => {
        try {
            console.log('🚪 Sign out initiated...');
            // Try to sign out with a short timeout for the server request
            // If it takes > 3s, prioritize clearing local state
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Signout timeout')), 3000))
            ]).catch(err => console.warn('⚠️ Signout network request slow/failed, proceeding locally:', err));

            // Explicitly clear local state
            setProfile(null);
            setUser(null);
            setSession(null);
            console.log('✅ Local auth state cleared');
        } catch (err) {
            console.error('❌ Signout error:', err);
            // Fallback clear
            setProfile(null);
            setUser(null);
            setSession(null);
        }
    };

    const updateProfile = async (updates: any) => {
        const startTime = Date.now();
        console.log('🚀 [updateProfile] START (using direct update)', updates);

        let lastError: any = null;
        const MAX_RETRIES = 3;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // 1. Get Session
                const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                const currentUser = currentSession?.user;
                if (!currentUser) throw new Error('No active session. Please log in again.');

                if (attempt === 1) {
                    console.log('✅ [updateProfile] User verified:', currentUser.id);
                }

                // 2. Ensure profile row exists (Crucial fallback if trigger failed)
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', currentUser.id)
                    .single();

                if (!existingProfile) {
                    console.warn('⚠️ [updateProfile] Profile missing - creating fresh row');
                    await supabase.from('profiles').insert({
                        id: currentUser.id,
                        email: currentUser.email,
                        role: 'patient'
                    });
                }

                // 3. Direct update (simpler, faster, no RPC dependency)
                console.log(`💾 [updateProfile] Performing direct update (Attempt ${attempt}/${MAX_RETRIES})...`);
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', currentUser.id);

                if (updateError) {
                    // Normalize error message for checking
                    const errMsg = updateError.message || JSON.stringify(updateError);

                    // Specific check for abort/timeout errors
                    if (errMsg.includes('signal is aborted') || errMsg.includes('timeout')) {
                        console.warn(`⚠️ [updateProfile] Abort/Timeout error encountered on attempt ${attempt}:`, errMsg);
                        throw updateError; // Throw to trigger retry logic in catch block
                    }

                    console.error('❌ [updateProfile] Update failed:', updateError);
                    throw updateError;
                }

                console.log('✨ [updateProfile] SUCCESS in', Date.now() - startTime, 'ms');

                // 4. Background Sync
                fetchProfile(currentUser.id).catch(err => console.error('⚠️ [updateProfile] Background sync failed:', err));

                return { error: null };
            } catch (err: any) {
                lastError = err;
                const errorMessage = err.message || JSON.stringify(err);

                const isRetryable = errorMessage.includes('signal is aborted') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('fetch failed'); // Sometimes fetch failures are transient

                if (isRetryable && attempt < MAX_RETRIES) {
                    const delay = attempt * 800; // 800ms, 1600ms
                    console.log(`⏳ [updateProfile] Retryable error: ${errorMessage}. Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                // If we are here, it's either not retryable or we ran out of retries
                console.error(`💥 [updateProfile] FATAL (Attempt ${attempt}):`, err);
                return { error: err };
            }
        }

        return { error: lastError };
    };

    const value = {
        user,
        profile,
        session,
        loading,
        signInWithGoogle,
        signIn,
        signUp,
        signOut,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
