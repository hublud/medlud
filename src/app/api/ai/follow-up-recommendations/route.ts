import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { diagnosisNotes, treatmentInstructions, symptoms, isPregnant, knownConditions } = await req.json();

        const prompt = `You are a clinical AI assistant. Given the patient's medical details, recommend a structured, personalized follow-up care schedule.
        
        Patient Context:
        - Symptoms: "${symptoms || 'None reported'}"
        - Diagnoses: "${diagnosisNotes || 'None established'}"
        - Treatment & Medications: "${treatmentInstructions || 'None prescribed'}"
        - Is Pregnant: ${isPregnant ? 'Yes' : 'No'}
        - Chronic Conditions: "${knownConditions || 'None'}"
        
        Based on this context:
        1. Classify the follow-up type into ONE of these: "medication", "lab", "referral", "symptom", "pregnancy", "chronic_disease".
        2. Recommend the best interval in days before scheduling this follow-up (e.g., 2, 3, 5, 7, 14, 30).
        3. Formulate 2-3 specific, supportive questions to ask the patient (e.g., "Are you experiencing any fever?", "Did you complete the Malaria lab test?").
        4. Create a 1-3 item action checklist for the patient (e.g., "Take antibiotics daily", "Avoid heavy meals").
        5. Specify 2-3 warning symptoms that should trigger immediate escalation (e.g., "Difficulty breathing", "Bleeding").

        Strictly format your response as a JSON object with these fields:
        {
            "followUpType": "medication" | "lab" | "referral" | "symptom" | "pregnancy" | "chronic_disease",
            "intervalDays": number,
            "questions": ["question 1", "question 2"],
            "checklist": ["item 1", "item 2"],
            "escalationTriggers": ["trigger 1", "trigger 2"]
        }
        `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const resultText = completion.choices[0]?.message?.content || '{}';
        const parsedResult = JSON.parse(resultText);

        return NextResponse.json({ success: true, data: parsedResult });

    } catch (error: any) {
        console.error('Error generating follow-up recommendations:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate recommendations' }, { status: 500 });
    }
}
