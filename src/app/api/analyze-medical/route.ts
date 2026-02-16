import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        const { consultationText } = await req.json();

        if (!consultationText) {
            return NextResponse.json({ error: 'Consultation text is required' }, { status: 400 });
        }

        const systemPrompt = `
You are an expert medical AI assistant helping a doctor analyze a patient consultation or notes.
Your task is to extract the Chief Complaint, detect Clinical Symptoms, assess the Risk Level, and suggest immediate Medical Advice.
You must output ONLY valid JSON in the following format:
{
  "chiefComplaint": "Short description of the main issue",
  "detectedSymptoms": ["Symptom 1", "Symptom 2"],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "suggestedActions": ["Action 1", "Action 2", "Action 3"]
}
Limit "suggestedActions" to 3 items.
        `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analyze the following consultation text:\n\n${consultationText}` }
            ],
            response_format: { type: "json_object" }
        });

        const reply = completion.choices[0].message.content;
        const analysis = JSON.parse(reply || '{}');

        return NextResponse.json(analysis);
    } catch (error: any) {
        console.error('OpenAI Analysis Error:', error);
        return NextResponse.json({ error: 'Failed to analyze text', details: error.message }, { status: 500 });
    }
}
