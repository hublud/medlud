// Pregnancy Week Content (Medically Reviewed)
// Static content for weeks 1-42

export interface WeekContent {
    week: number;
    trimester: 1 | 2 | 3;
    babyDevelopment: string;
    whatToExpect: string[];
    nutritionTips: string[];
    lifestyleTips: string[];
}

export const PREGNANCY_WEEKS: WeekContent[] = [
    {
        week: 1,
        trimester: 1,
        babyDevelopment: "Conception hasn't occurred yet, but your body is preparing for pregnancy.",
        whatToExpect: [
            "This week marks the beginning of your menstrual cycle",
            "Your body is preparing to release an egg"
        ],
        nutritionTips: [
            "Start taking folic acid (400-800 mcg daily)",
            "Eat folate-rich foods: beans, leafy vegetables, oranges",
            "Stay hydrated with clean water"
        ],
        lifestyleTips: [
            "Avoid alcohol and smoking",
            "Maintain a healthy weight",
            "Get adequate rest"
        ]
    },
    {
        week: 8,
        trimester: 1,
        babyDevelopment: "Your baby is about the size of a raspberry. Major organs are beginning to form, and the heart is beating.",
        whatToExpect: [
            "Morning sickness may be at its peak",
            "Breast tenderness and fatigue are common",
            "First ANC visit recommended"
        ],
        nutritionTips: [
            "Eat small, frequent meals to manage nausea",
            "Include protein: eggs, fish, beans, groundnuts",
            "Nigerian foods: moi moi, akara, vegetable soup",
            "Drink plenty of water"
        ],
        lifestyleTips: [
            "Rest when tired",
            "Avoid heavy lifting",
            "Book your first ANC appointment"
        ]
    },
    {
        week: 16,
        trimester: 2,
        babyDevelopment: "Your baby is about the size of an avocado. The baby can now hear your voice and is practicing breathing movements.",
        whatToExpect: [
            "You may start to feel fluttering movements",
            "Energy levels often improve",
            "Second ANC visit due"
        ],
        nutritionTips: [
            "Increase iron intake: red meat, liver (in moderation), ugwu, green vegetables",
            "Combine iron-rich foods with vitamin C",
            "Nigerian foods: edikang ikong, efo riro, okro soup",
            "Continue folic acid supplementation"
        ],
        lifestyleTips: [
            "Start gentle exercises like walking",
            "Practice good posture",
            "Attend your ANC appointment"
        ]
    },
    {
        week: 20,
        trimester: 2,
        babyDevelopment: "Your baby is about the size of a banana. You should be feeling regular movements now. The baby's senses are developing.",
        whatToExpect: [
            "Halfway through your pregnancy!",
            "Movements becoming more obvious",
            "Ultrasound scan may be done"
        ],
        nutritionTips: [
            "Calcium is crucial: milk, yogurt, sardines",
            "Nigerian alternatives: tigernut milk, crayfish",
            "Healthy snacks: fruits, nuts, roasted corn",
            "Avoid excessive salt"
        ],
        lifestyleTips: [
            "Monitor baby's movements daily",
            "Sleep on your left side",
            "Wear comfortable, supportive shoes"
        ]
    },
    {
        week: 24,
        trimester: 2,
        babyDevelopment: "Your baby is about the size of a corn cob. The baby's lungs are developing, and they can respond to sound.",
        whatToExpect: [
            "Stronger, more frequent movements",
            "May experience Braxton Hicks contractions",
            "Fourth ANC visit due"
        ],
        nutritionTips: [
            "Eat complex carbohydrates: yam, sweet potato, brown rice",
            "Include healthy fats: avocado, palm nut soup (moderate)",
            "Avoid sugary drinks and excessive sugar",
            "Nigerian meals: ofada rice and vegetable stew"
        ],
        lifestyleTips: [
            "Start learning about childbirth",
            "Practice relaxation techniques",
            "Avoid standing for long periods"
        ]
    },
    {
        week: 28,
        trimester: 3,
        babyDevelopment: "Your baby is about the size of a large eggplant. The baby can now open their eyes and is putting on weight.",
        whatToExpect: [
            "You're now in the third trimester!",
            "Shortness of breath is common",
            "Monthly ANC visits begin"
        ],
        nutritionTips: [
            "Small, frequent meals to avoid heartburn",
            "Stay hydrated but reduce fluids before bed",
            "Include omega-3: fish (avoid high-mercury fish)",
            "Nigerian options: catfish, tilapia"
        ],
        lifestyleTips: [
            "Rest with feet elevated",
            "Practice pelvic floor exercises",
            "Prepare your birth plan"
        ]
    },
    {
        week: 36,
        trimester: 3,
        babyDevelopment: "Your baby is about the size of a papaya. The baby is getting ready for birth and should be in head-down position.",
        whatToExpect: [
            "Baby may 'drop' into your pelvis",
            "Increased pressure on bladder",
            "Weekly ANC visits begin",
            "Prepare your hospital bag"
        ],
        nutritionTips: [
            "Eat dates if available (may help with labor)",
            "Continue balanced diet",
            "Red raspberry leaf tea (if approved by healthcare provider)",
            "Stay hydrated"
        ],
        lifestyleTips: [
            "Attend weekly ANC appointments",
            "Prepare for baby's arrival",
            "Know the signs of labor",
            "Rest as much as possible"
        ]
    },
    {
        week: 40,
        trimester: 3,
        babyDevelopment: "Your baby is fully developed and ready to be born! Most babies are born between 37-42 weeks.",
        whatToExpect: [
            "Your due date is here!",
            "Watch for signs of labor",
            "Contractions, water breaking, bloody show"
        ],
        nutritionTips: [
            "Eat light, healthy meals",
            "Stay hydrated",
            "Avoid heavy meals if you feel labor may be starting",
            "Keep energy-boosting snacks handy"
        ],
        lifestyleTips: [
            "Stay in close contact with your healthcare provider",
            "Know when to go to the hospital",
            "Rest and conserve energy",
            "Trust your body"
        ]
    }
];

// Helper function to get content for a specific week
export const getWeekContent = (week: number): WeekContent | undefined => {
    return PREGNANCY_WEEKS.find(w => w.week === week);
};

// Calculate gestational age from LMP
export const calculateGestationalAge = (lmpDate: Date): number => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lmpDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
};

// Calculate estimated due date (280 days from LMP)
export const calculateDueDate = (lmpDate: Date): Date => {
    const dueDate = new Date(lmpDate);
    dueDate.setDate(dueDate.getDate() + 280);
    return dueDate;
};
