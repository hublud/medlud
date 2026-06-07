export function getRedirectPath(profile: any): string {
    if (!profile) return '/login';

    const role = profile.role || 'patient';

    if (role === 'admin') {
        return '/admin';
    }

    // Check if they are active facility staff in the SaaS portal
    if (profile.facility_staff) {
        return '/saas/dashboard';
    }

    if (['doctor', 'nurse', 'nurse-assistant', 'mental-health'].includes(role)) {
        return '/dashboard/staff';
    }

    if (role === 'partner') {
        return '/dashboard/partner';
    }

    // If onboarding is not completed, redirect to the correct step
    if (profile.onboarding_completed !== true) {
        let currentStep = profile.onboarding_step || 'health-profile';
        if (currentStep === 'basic-info') currentStep = 'health-profile';
        
        const stepPaths: Record<string, string> = {
            'verify-email': '/verify-email',
            'health-profile': '/health-profile',
            'emergency-contact': '/emergency-contact',
            'permissions': '/permissions',
            'completed': '/completion'
        };
        return stepPaths[currentStep] || '/health-profile';
    }

    return '/dashboard';
}
