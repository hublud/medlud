'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: any;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ data: any, profile: any, error: any }>;
    signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any, profile: any, error: any }>;
    verifyEmailOtp: (email: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: any) => Promise<{ error: any }>;
    resendVerificationEmail: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchingProfile = useRef<string | null>(null);
    const profileFetchedFor = useRef<string | null>(null);

    const fetchProfile = async (userId: string, attempts = 2): Promise<any> => {
        for (let i = 1; i <= attempts; i++) {
            try {
                console.log(`[Auth] Fetching profile (attempt ${i}/${attempts})`);

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setProfile(data);
                    profileFetchedFor.current = userId;
                    return data;
                }

                // If no profile found, create one
                if (i === 1) { // Only attempt create on first try
                    console.warn('[Auth] Profile not found — creating default');
                    const { data: userData } = await supabase.auth.getUser();
                    const { data: created, error: createErr } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            email: userData.user?.email,
                            role: 'patient',
                            onboarding_completed: false,
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .maybeSingle();

                    if (!createErr && created) {
                        setProfile(created);
                        profileFetchedFor.current = userId;
                        return created;
                    }
                }

                // Fallback for last attempt
                if (i === attempts) {
                    const fallback = { id: userId, role: 'patient', onboarding_completed: false, _fallback: true };
                    setProfile(fallback);
                    return fallback;
                }

            } catch (err: any) {
                console.warn(`[Auth] Profile fetch attempt ${i} failed: ${err.message}`);
                if (i === attempts) {
                    const fallback = { id: userId, role: 'patient', onboarding_completed: false, _fallback: true };
                    setProfile(fallback);
                    return fallback;
                }
                await new Promise(r => setTimeout(r, 500 * i)); // Faster backoff
            }
        }
    };


    useEffect(() => {
        let authInitialized = false;
        let safetyTimer: NodeJS.Timeout | null = null;

        const startSafetyTimer = () => {
            if (safetyTimer) clearTimeout(safetyTimer);
            safetyTimer = setTimeout(() => {
                if (!authInitialized) {
                    console.warn('⚠️ [Auth] Safety timeout reached - forcing auth initialization');
                    setLoading(false);
                }
            }, 10000); // 10 second safety cap
        };

        const initAuth = async () => {
            console.log('🔄 [Auth] Initializing authentication...');
            startSafetyTimer();
            try {
                // Get initial session directly
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ [Auth] Error in initial session load:', error);
                    if (error.message.includes('Refresh Token Not Found') ||
                        error.message.includes('invalid_refresh_token') ||
                        error.message.includes('refresh_token_not_found')) {
                        console.warn('🔄 [Auth] Stale session detected, clearing...');
                        await signOut();
                    }
                } else {
                    console.log('✅ [Auth] Initial session check complete:', initialSession ? 'Session found' : 'No session');
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        if (fetchingProfile.current !== initialSession.user.id && profileFetchedFor.current !== initialSession.user.id) {
                            fetchingProfile.current = initialSession.user.id;
                            await fetchProfile(initialSession.user.id).catch(err => {
                                console.warn('⚠️ [Auth] Initial profile fetch failed:', err);
                            }).finally(() => {
                                fetchingProfile.current = null;
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('💥 [Auth] Fatal error in initAuth:', err);
            } finally {
                // We don't necessarily set loading to false here, 
                // we let onAuthStateChange handle the definitive signal if possible,
                // but if we have a session or definitely don't, we can proceed.
                authInitialized = true;
                setLoading(false);
                if (safetyTimer) clearTimeout(safetyTimer);
                console.log('✨ [Auth] Initialization phase finished');
            }
        };

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`📡 [Auth] Event: ${event}`);

            // Only update if initialization has happened or if it's a critical event
            const isInitialEvent = event === 'INITIAL_SESSION';
            const isSignEvent = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED';

            if (isSignEvent || isInitialEvent) {
                console.log(`👤 [Auth] Updating session and checking profile for: ${session?.user?.email || 'Guest'}`);
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Prevent duplicate fetches for the same session update
                    if (fetchingProfile.current !== session.user.id && profileFetchedFor.current !== session.user.id) {
                        fetchingProfile.current = session.user.id;
                        await fetchProfile(session.user.id).finally(() => {
                            fetchingProfile.current = null;
                        });
                    }
                } else {
                    setProfile(null);
                    profileFetchedFor.current = null;
                    fetchingProfile.current = null;
                }

                // If this happens after we thought we were initialized, or as the initial event
                if (!authInitialized || isInitialEvent) {
                    authInitialized = true;
                    setLoading(false);
                    if (safetyTimer) clearTimeout(safetyTimer);
                }
            }
        });

        initAuth();

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
            // We NO LONGER manually set session/user/profile here.
            // supabase.auth.signInWithPassword triggers onAuthStateChange automatically.
            return { data, profile: null, error };
        }

        return { data, profile: null, error };
    };

    const signUp = async (email: string, password: string, metadata?: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (data.session && data.user) {
            // We NO LONGER manually set session/user/profile here.
            // supabase.auth.signUp triggers onAuthStateChange automatically.
            return { data, profile: null, error };
        }

        return { data, profile: null, error };
    };

    const verifyEmailOtp = async (email: string, token: string) => {
        console.log(`[Auth] Verifying OTP for ${email} with token: ${token}`);
        const response = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: token.trim(),
            type: 'email'
        });
        
        console.log('[Auth] verifyOtp response:', response);

        // onAuthStateChange handles the session and profile update
        return { error: response.error };
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
                // 1. Get Session/User (Use React State first to bypass storage sync race conditions!)
                let currentUserId = user?.id;
                let currentUserEmail = user?.email;

                if (!currentUserId) {
                    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) throw sessionError;
                    currentUserId = currentSession?.user?.id;
                    currentUserEmail = currentSession?.user?.email;
                }

                if (!currentUserId) throw new Error('No active session. Please log in again.');

                if (attempt === 1) {
                    console.log('✅ [updateProfile] User verified:', currentUserId);
                }

                // 2. Ensure profile row exists (Crucial fallback if trigger failed)
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', currentUserId)
                    .single();

                if (!existingProfile) {
                    console.warn('⚠️ [updateProfile] Profile missing - creating fresh row');
                    await supabase.from('profiles').insert({
                        id: currentUserId,
                        email: currentUserEmail || '',
                        role: 'patient'
                    });
                }

                // 3. Direct update (simpler, faster, no RPC dependency)
                console.log(`💾 [updateProfile] Performing direct update (Attempt ${attempt}/${MAX_RETRIES})...`);
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', currentUserId);

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

                // 4. Optimistic UI Update & Background Sync
                setProfile((prev: any) => ({ ...prev, ...updates }));
                fetchProfile(currentUserId).catch(err => console.error('⚠️ [updateProfile] Background sync failed:', err));

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

    const resendVerificationEmail = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        return { error };
    };

    const value = {
        user,
        profile,
        session,
        loading,
        signInWithGoogle,
        signIn,
        signUp,
        verifyEmailOtp,
        signOut,
        updateProfile,
        resendVerificationEmail
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
