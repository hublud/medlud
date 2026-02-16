// Evidence-based coping techniques and mental health resources
// Nigeria-context appropriate

export interface CopingTechnique {
    id: string;
    name: string;
    description: string;
    steps: string[];
    duration: string;
}

export const COPING_TECHNIQUES: Record<string, CopingTechnique> = {
    breathing: {
        id: 'breathing',
        name: '4-7-8 Breathing Exercise',
        description: 'A simple breathing technique to calm your nervous system',
        steps: [
            'Sit comfortably with your back straight',
            'Breathe in quietly through your nose for 4 counts',
            'Hold your breath for 7 counts',
            'Exhale completely through your mouth for 8 counts',
            'Repeat this cycle 3-4 times'
        ],
        duration: '2-3 minutes'
    },
    grounding: {
        id: 'grounding',
        name: '5-4-3-2-1 Grounding Technique',
        description: 'Connect with the present moment using your senses',
        steps: [
            'Name 5 things you can see around you',
            'Name 4 things you can touch',
            'Name 3 things you can hear',
            'Name 2 things you can smell',
            'Name 1 thing you can taste'
        ],
        duration: '3-5 minutes'
    },
    sleep_hygiene: {
        id: 'sleep_hygiene',
        name: 'Better Sleep Habits',
        description: 'Improve your sleep quality with these simple steps',
        steps: [
            'Go to bed and wake up at the same time every day',
            'Avoid screens 30 minutes before bed',
            'Keep your bedroom cool and dark',
            'Avoid caffeine after 2pm',
            'Try reading or light stretching before bed'
        ],
        duration: 'Daily practice'
    },
    journaling: {
        id: 'journaling',
        name: 'Reflective Journaling',
        description: 'Write down your thoughts to process emotions',
        steps: [
            'Find a quiet space with a notebook or phone',
            'Write freely for 5-10 minutes without judging',
            'Focus on what you\'re feeling and why',
            'No need for perfect grammar or structure',
            'You can keep it private - it\'s just for you'
        ],
        duration: '5-10 minutes'
    },
    physical_activity: {
        id: 'physical_activity',
        name: 'Gentle Movement',
        description: 'Light physical activity to boost mood',
        steps: [
            'Take a 10-minute walk around your neighborhood',
            'Do simple stretches or yoga',
            'Dance to your favorite music',
            'Even standing and moving helps',
            'Start small - any movement counts'
        ],
        duration: '10-15 minutes'
    }
};

export const MENTAL_HEALTH_RESOURCES = {
    nigeria: [
        {
            name: 'Mentally Aware Nigeria Initiative (MANI)',
            description: 'Mental health advocacy and support',
            contact: 'Available online'
        },
        {
            name: 'She Writes Woman',
            description: 'Support for women\'s mental health',
            contact: 'Available online and via social media'
        },
        {
            name: 'Emergency Mental Health Crisis',
            description: 'If you\'re in immediate danger',
            contact: 'Contact a trusted person or go to nearest hospital'
        }
    ],
    selfCare: [
        'Talk to someone you trust',
        'Maintain a routine',
        'Get adequate sleep (7-9 hours)',
        'Eat regular, healthy meals',
        'Limit alcohol and avoid drugs',
        'Stay connected with friends and family',
        'Do activities you enjoy'
    ]
};

export const getCopingTechnique = (id: string): CopingTechnique | undefined => {
    return COPING_TECHNIQUES[id];
};
