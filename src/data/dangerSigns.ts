// Nigerian ANC Danger Signs Reference
// Based on WHO and Nigerian Federal Ministry of Health guidelines

export interface DangerSign {
    symptom: string;
    keywords: string[];
    category: 'bleeding' | 'hypertension' | 'fetal' | 'infection' | 'pain';
    severity: 'emergency' | 'urgent';
    action: string;
}

export const MATERNAL_DANGER_SIGNS: DangerSign[] = [
    {
        symptom: 'Vaginal bleeding',
        keywords: ['bleeding', 'blood', 'spotting', 'discharge with blood'],
        category: 'bleeding',
        severity: 'emergency',
        action: 'Go to the nearest hospital immediately'
    },
    {
        symptom: 'Severe headache with blurred vision',
        keywords: ['severe headache', 'blurred vision', 'seeing spots', 'visual disturbance'],
        category: 'hypertension',
        severity: 'emergency',
        action: 'Possible pre-eclampsia - seek immediate medical attention'
    },
    {
        symptom: 'Swelling of face and hands',
        keywords: ['facial swelling', 'hand swelling', 'puffy face', 'swollen hands'],
        category: 'hypertension',
        severity: 'urgent',
        action: 'Could indicate pre-eclampsia - see healthcare provider today'
    },
    {
        symptom: 'Reduced or no fetal movement',
        keywords: ['baby not moving', 'reduced movement', 'no kicks', 'fetal movement'],
        category: 'fetal',
        severity: 'emergency',
        action: 'Go to hospital immediately for fetal assessment'
    },
    {
        symptom: 'Severe abdominal pain',
        keywords: ['severe pain', 'stomach pain', 'abdominal cramping', 'sharp pain'],
        category: 'pain',
        severity: 'emergency',
        action: 'Seek immediate medical evaluation'
    },
    {
        symptom: 'Fever with chills',
        keywords: ['fever', 'high temperature', 'chills', 'shivering'],
        category: 'infection',
        severity: 'urgent',
        action: 'Possible infection - see healthcare provider today'
    },
    {
        symptom: 'Severe vomiting (unable to keep fluids down)',
        keywords: ['severe vomiting', 'cannot drink', 'dehydration', 'persistent vomiting'],
        category: 'infection',
        severity: 'urgent',
        action: 'Risk of dehydration - seek medical care'
    },
    {
        symptom: 'Water breaking before 37 weeks',
        keywords: ['water broke', 'leaking fluid', 'gush of water', 'amniotic fluid'],
        category: 'bleeding',
        severity: 'emergency',
        action: 'Preterm labor - go to hospital immediately'
    }
];

export const NORMAL_PREGNANCY_SYMPTOMS = [
    'mild nausea',
    'morning sickness',
    'fatigue',
    'breast tenderness',
    'frequent urination',
    'mild back pain',
    'constipation',
    'heartburn',
    'mild swelling of feet',
    'stretch marks',
    'shortness of breath'
];
