// Mental Health Risk Assessment Utility
// Evaluates user input for emotional distress and crisis signals

export type RiskLevel = 'low' | 'moderate' | 'crisis';
export type RecommendedAction = 'continue_support' | 'suggest_professional' | 'immediate_escalation';

export interface MentalHealthAssessment {
    riskLevel: RiskLevel;
    recommendedAction: RecommendedAction;
    detectedSignals: string[];
    suggestedResponse: string;
    copingTechniques?: string[];
}

// Crisis keywords (self-harm, suicide ideation)
const CRISIS_SIGNALS = [
    'kill myself',
    'end it all',
    'don\'t want to live',
    'better off dead',
    'no reason to live',
    'harm myself',
    'end my life',
    'not worth living',
    'want to die',
    'suicide'
];

// Moderate distress keywords
const MODERATE_SIGNALS = [
    'can\'t sleep',
    'insomnia',
    'panic attack',
    'anxiety every day',
    'depressed for weeks',
    'no energy',
    'hopeless',
    'worthless',
    'can\'t cope',
    'overwhelmed',
    'constant worry',
    'crying all the time'
];

// Low distress keywords
const LOW_SIGNALS = [
    'stressed',
    'worried',
    'anxious',
    'sad',
    'tired',
    'frustrated',
    'nervous',
    'upset',
    'down'
];

export const assessMentalHealth = (userMessage: string): MentalHealthAssessment => {
    const lowerMessage = userMessage.toLowerCase();
    const detectedSignals: string[] = [];

    // Check for CRISIS signals (highest priority)
    const hasCrisisSignal = CRISIS_SIGNALS.some(signal => {
        if (lowerMessage.includes(signal)) {
            detectedSignals.push(signal);
            return true;
        }
        return false;
    });

    if (hasCrisisSignal) {
        return {
            riskLevel: 'crisis',
            recommendedAction: 'immediate_escalation',
            detectedSignals,
            suggestedResponse: 'I\'m really glad you reached out. You don\'t have to go through this alone. What you\'re feeling is serious, and I want to make sure you get the help you need right away.',
            copingTechniques: [] // No coping techniques in crisis - only escalation
        };
    }

    // Check for MODERATE signals
    const hasModerateSignal = MODERATE_SIGNALS.some(signal => {
        if (lowerMessage.includes(signal)) {
            detectedSignals.push(signal);
            return true;
        }
        return false;
    });

    if (hasModerateSignal) {
        return {
            riskLevel: 'moderate',
            recommendedAction: 'suggest_professional',
            detectedSignals,
            suggestedResponse: 'What you\'re describing sounds emotionally heavy. It takes strength to reach out. While I can offer some support, talking to a mental health professional could really help.',
            copingTechniques: ['breathing', 'grounding', 'sleep_hygiene']
        };
    }

    // Check for LOW signals or default
    const hasLowSignal = LOW_SIGNALS.some(signal => {
        if (lowerMessage.includes(signal)) {
            detectedSignals.push(signal);
            return true;
        }
        return false;
    });

    return {
        riskLevel: 'low',
        recommendedAction: 'continue_support',
        detectedSignals: hasLowSignal ? detectedSignals : ['general conversation'],
        suggestedResponse: 'Thank you for sharing that with me. It\'s completely valid to feel this way. Let\'s explore what might help.',
        copingTechniques: ['breathing', 'journaling', 'physical_activity']
    };
};
