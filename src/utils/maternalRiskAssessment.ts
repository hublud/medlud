// Maternal Risk Assessment Utility
import { MATERNAL_DANGER_SIGNS, NORMAL_PREGNANCY_SYMPTOMS } from '@/data/dangerSigns';
import { MaternalSymptomResult } from '@/types/user';

export const assessMaternalSymptoms = (
    symptoms: string[],
    gestationalAge: number
): MaternalSymptomResult => {
    const lowerSymptoms = symptoms.map(s => s.toLowerCase());
    const detectedDangerSigns: string[] = [];

    // Check for danger signs
    MATERNAL_DANGER_SIGNS.forEach(dangerSign => {
        const hasMatch = dangerSign.keywords.some(keyword =>
            lowerSymptoms.some(symptom => symptom.includes(keyword.toLowerCase()))
        );

        if (hasMatch) {
            detectedDangerSigns.push(dangerSign.symptom);
        }
    });

    // DANGER SIGNS - Immediate escalation
    if (detectedDangerSigns.length > 0) {
        return {
            riskLevel: 'danger',
            symptoms: lowerSymptoms,
            assessment: 'You are experiencing danger signs that require immediate medical attention.',
            recommendations: [
                '🚨 Go to the nearest hospital immediately',
                'Do not wait or try home remedies',
                'Call emergency services if needed',
                'Bring someone with you if possible'
            ],
            action: 'emergency_referral',
            dangerSigns: detectedDangerSigns
        };
    }

    // Check for symptoms that need clinical review
    const needsReview = [
        'swelling',
        'headache',
        'dizziness',
        'pain',
        'discharge',
        'itching',
        'frequent urination with pain'
    ];

    const hasReviewSymptom = lowerSymptoms.some(symptom =>
        needsReview.some(review => symptom.includes(review))
    );

    if (hasReviewSymptom) {
        return {
            riskLevel: 'needs_review',
            symptoms: lowerSymptoms,
            assessment: 'Your symptoms should be evaluated by a healthcare provider.',
            recommendations: [
                'Book a consultation with a nurse or midwife',
                'Attend your next ANC appointment',
                'Monitor symptoms - if they worsen, seek immediate care',
                'Keep track of when symptoms occur'
            ],
            action: 'book_consult'
        };
    }

    // NORMAL pregnancy symptoms - Reassurance
    return {
        riskLevel: 'normal',
        symptoms: lowerSymptoms,
        assessment: 'Your symptoms appear to be normal pregnancy changes.',
        recommendations: [
            'These are common pregnancy symptoms',
            'Continue with your regular ANC visits',
            'Maintain a healthy diet and stay hydrated',
            'Rest when you feel tired',
            'Contact your healthcare provider if symptoms worsen'
        ],
        action: 'reassure'
    };
};
