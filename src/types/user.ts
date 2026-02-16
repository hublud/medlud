// User and Pregnancy Profile Types

export interface PregnancyProfile {
    isPregnant: boolean;
    gestationalAge: number; // weeks
    lastMenstrualPeriod: Date;
    estimatedDueDate: Date;
    isFirstPregnancy: boolean;
    hasPreviousComplications: boolean;
    existingConditions: ConditionType[];
    createdAt: Date;
    updatedAt: Date;
}

export type ConditionType =
    | 'hypertension'
    | 'diabetes'
    | 'sickle_cell'
    | 'none';

export interface MaternalSymptomResult {
    riskLevel: 'normal' | 'needs_review' | 'danger';
    symptoms: string[];
    assessment: string;
    recommendations: string[];
    action: 'reassure' | 'book_consult' | 'emergency_referral';
    dangerSigns?: string[];
}

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    pregnancyProfile?: PregnancyProfile;
}
